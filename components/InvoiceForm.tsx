
import React, { useState, useEffect } from 'react';
import { Client, Invoice, InvoiceItem, InvoiceStatus, InvoiceType, Product, WorkLocation, PaymentMethod, CashRegister, DocumentSeries, Warehouse, Company } from '../types';
import { generateId, formatCurrency, formatDate, generateQrCodeUrl, numberToExtenso } from '../utils';
import { generateInvoiceDataFromText } from '../services/geminiService';
import { Plus, Trash, Wand2, Loader2, Save, ArrowLeft, Lock, RefreshCw, FileText, Printer, ShieldCheck, Eraser, List, Building, UserPlus, X, Calendar, MapPin, CreditCard, ChevronDown, Percent, User, Briefcase, Truck, Eye } from 'lucide-react';

interface InvoiceFormProps {
  onSave: (invoice: Invoice, seriesId: string, action?: 'PRINT' | 'CERTIFY') => void;
  onCancel: () => void;
  onViewList: () => void;
  onAddWorkLocation: () => void; 
  onSaveClient: (client: Client) => void;
  onSaveWorkLocation: (wl: WorkLocation) => void;
  clients: Client[];
  products: Product[];
  workLocations: WorkLocation[];
  cashRegisters: CashRegister[];
  series: DocumentSeries[];
  warehouses?: Warehouse[];
  initialType?: InvoiceType;
  initialData?: Partial<Invoice>;
  currentUser?: string;
  currentUserId?: string;
  currentCompany?: Company;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
  onSave, onCancel, onViewList, onSaveClient, onSaveWorkLocation, clients, products, workLocations, cashRegisters, series, warehouses = [],
  initialType, initialData, currentUser, currentUserId, currentCompany
}) => {
  // Restricted Mode for Certified Documents
  const isRestricted = initialData?.isCertified || false;

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);

  // Header State
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(initialType || initialData?.type || InvoiceType.FT);
  const [workLocationId, setWorkLocationId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [cashRegisterId, setCashRegisterId] = useState('');
  const [typology, setTypology] = useState('Geral');
  
  // Transport Fields
  const [driverName, setDriverName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  
  // Dates
  const today = new Date();
  const maxDateStr = today.toISOString().split('T')[0];
  const [date, setDate] = useState(maxDateStr);
  const [dueDate, setDueDate] = useState('');

  // Currency
  const [currency, setCurrency] = useState<'AOA' | 'USD' | 'EUR' | 'BRL'>('AOA');
  const [exchangeRate, setExchangeRate] = useState(1);

  // Items & Financials
  const [items, setItems] = useState<InvoiceItem[]>(() => {
      const rawItems = initialData?.items || [];
      return rawItems.map((i: any) => ({
          id: i.id || generateId(),
          productId: i.productId,
          description: i.description || '',
          reference: i.reference || '', // Added Ref
          quantity: i.quantity || 1,
          unit: i.unit || 'un', // Added Unit
          unitPrice: i.unitPrice || 0,
          discount: i.discount || 0,
          taxRate: i.taxRate !== undefined ? i.taxRate : 14,
          total: i.total !== undefined ? i.total : ((i.quantity || 1) * (i.unitPrice || 0) * (1 - (i.discount || 0)/100)),
          type: i.type || 'PRODUCT'
      }));
  });

  const [globalDiscount, setGlobalDiscount] = useState(0); 
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isReceiptMode, setIsReceiptMode] = useState(false);
  const [retentionType, setRetentionType] = useState<'NONE' | 'CAT_50' | 'CAT_100'>('NONE');

  // Full Client Creation Modal State
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({ city: 'Luanda', country: 'Angola' });
  
  const [showQuickWorkLocation, setShowQuickWorkLocation] = useState(false);
  const [newWLName, setNewWLName] = useState('');
  const [newWLAddress, setNewWLAddress] = useState('');

  // Preview State
  const [showPreview, setShowPreview] = useState(false);

  // Initialize
  useEffect(() => {
    if (series.length > 0 && !selectedSeriesId) {
        if (initialData?.seriesId) {
            setSelectedSeriesId(initialData.seriesId);
        } else {
            const defaultSeries = series.find(s => s.isActive);
            if(defaultSeries) setSelectedSeriesId(defaultSeries.id);
        }
    }
    if (initialType) setInvoiceType(initialType);
    if (initialData) {
        if (initialData.type === InvoiceType.RG) setIsReceiptMode(true);
        if (initialData.workLocationId) setWorkLocationId(initialData.workLocationId);
        if (initialData.paymentMethod) setPaymentMethod(initialData.paymentMethod);
        if (initialData.cashRegisterId) setCashRegisterId(initialData.cashRegisterId);
        if (initialData.date) setDate(initialData.date);
        if (initialData.dueDate) setDueDate(initialData.dueDate);
        if (initialData.currency) setCurrency(initialData.currency);
        if (initialData.exchangeRate) setExchangeRate(initialData.exchangeRate);
        if (initialData.globalDiscount) setGlobalDiscount(initialData.globalDiscount);
        if (initialData.retentionType) setRetentionType(initialData.retentionType);
        
        if (initialData.driverName) setDriverName(initialData.driverName);
        if (initialData.vehiclePlate) setVehiclePlate(initialData.vehiclePlate);
        if (initialData.deliveryAddress) setDeliveryAddress(initialData.deliveryAddress);
        if (initialData.sourceWarehouseId) setSourceWarehouseId(initialData.sourceWarehouseId);
        if (initialData.targetWarehouseId) setTargetWarehouseId(initialData.targetWarehouseId);
    }
  }, [initialType, initialData, series]);

  useEffect(() => {
      if (isReceiptMode) return; 
      if (currency === 'AOA') setExchangeRate(1);
      if (currency === 'USD') setExchangeRate(850);
      if (currency === 'EUR') setExchangeRate(920);
      if (currency === 'BRL') setExchangeRate(170);
  }, [currency, isReceiptMode]);

  const calculateLineTotal = (qty: number, price: number, discount: number) => {
      const base = qty * price;
      const discAmount = base * (discount / 100);
      return base - discAmount;
  };

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  
  const taxAmount = items.reduce((acc, item) => {
      const itemTax = item.total * (item.taxRate / 100);
      return acc + itemTax;
  }, 0);

  const globalDiscountAmount = subtotal * (globalDiscount / 100);
  const taxableAmount = subtotal; 

  const serviceTotal = items.filter(i => i.type === 'SERVICE').reduce((acc, i) => acc + i.total, 0);
  const serviceTotalInAoa = serviceTotal * exchangeRate;
  
  let withholdingAmount = 0;
  if (serviceTotalInAoa >= 20000) {
      withholdingAmount = serviceTotal * 0.065;
  }

  let retentionAmount = 0;
  if (retentionType === 'CAT_50') retentionAmount = taxAmount * 0.5;
  if (retentionType === 'CAT_100') retentionAmount = taxAmount;

  const total = (taxableAmount + taxAmount) - globalDiscountAmount - withholdingAmount - retentionAmount;
  const contraValue = currency === 'AOA' ? total : total * exchangeRate;

  // Handlers
  const handleAddItem = () => {
    if (isRestricted) return;
    setItems([...items, { id: generateId(), description: '', reference: '', quantity: 1, unit: 'un', unitPrice: 0, discount: 0, taxRate: 14, total: 0, type: 'PRODUCT' }]);
  };

  const handleProductSelect = (index: number, productId: string) => {
    if (isRestricted) return;
    const product = products.find(p => p.id === productId);
    if (product) {
      const newItems = [...items];
      const unitPrice = product.price; 
      newItems[index] = {
        ...newItems[index],
        productId: product.id,
        description: product.name,
        reference: product.id.substring(0,6).toUpperCase(), // Mock ref
        unit: product.unit || 'un',
        unitPrice: unitPrice,
        type: 'PRODUCT',
        taxRate: 14, 
        total: calculateLineTotal(newItems[index].quantity, unitPrice, newItems[index].discount)
      };
      setItems(newItems);
    }
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    if (isRestricted) return;
    const newItems = [...items];
    const item = newItems[index];
    (item as any)[field] = value;
    
    // Recalculate total if needed
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
        item.total = calculateLineTotal(item.quantity, item.unitPrice, item.discount);
    }
    
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (isRestricted) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt || isRestricted) return;
    setIsAiLoading(true);
    try {
      const data = await generateInvoiceDataFromText(aiPrompt, clients);
      if (data.clientId) setClientId(data.clientId);
      if (data.items) {
        const newItems = data.items.map(i => ({
          ...i,
          id: generateId(),
          reference: '',
          unit: 'un',
          discount: 0,
          taxRate: 14,
          total: i.quantity * i.unitPrice,
          type: 'PRODUCT' as const
        }));
        setItems(newItems);
      }
      if (data.notes) setNotes(data.notes);
    } catch (error) {
      alert("Erro ao gerar fatura com IA.");
    } finally {
      setIsAiLoading(false);
      setShowAiInput(false);
    }
  };

  const handleSave = (action?: 'PRINT' | 'CERTIFY') => {
      if (isRestricted) {
           const updatedInvoice: Invoice = {
               ...(initialData as Invoice), 
               date,
               dueDate: dueDate || date,
               workLocationId,
               paymentMethod: paymentMethod || undefined,
               cashRegisterId: cashRegisterId || undefined,
           };
           onSave(updatedInvoice, selectedSeriesId, action);
           return;
      }

      if (!clientId || items.length === 0 || !selectedSeriesId) {
          alert("Preencha o cliente, a série e adicione itens.");
          return;
      }
      if ((invoiceType === InvoiceType.FR || invoiceType === InvoiceType.RG) && (!paymentMethod || !cashRegisterId)) {
          alert("Para Fatura/Recibo ou Recibo, selecione a Forma de Pagamento e o Caixa.");
          return;
      }

      const newInvoice: Invoice = {
          id: initialData?.id || generateId(),
          type: invoiceType,
          seriesId: selectedSeriesId,
          number: initialData?.number || 'DRAFT', 
          date,
          time: new Date().toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'}),
          dueDate: dueDate || date,
          clientId,
          clientName: clients.find(c => c.id === clientId)?.name || 'Cliente Final',
          clientNif: clients.find(c => c.id === clientId)?.vatNumber,
          items,
          subtotal,
          globalDiscount,
          taxRate: 0, 
          taxAmount,
          withholdingAmount,
          retentionType: retentionType,
          retentionAmount: retentionAmount,
          total,
          currency,
          exchangeRate,
          contraValue,
          status: (invoiceType === InvoiceType.FR || invoiceType === InvoiceType.RG) ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
          notes,
          isCertified: false,
          companyId: '', 
          workLocationId,
          paymentMethod: paymentMethod || undefined,
          cashRegisterId,
          operatorName: currentUser,
          typology,
          sourceInvoiceId: initialData?.sourceInvoiceId || (isReceiptMode ? initialData?.id : undefined),
          driverName,
          vehiclePlate,
          deliveryAddress,
          sourceWarehouseId,
          targetWarehouseId
      };
      
      onSave(newInvoice, selectedSeriesId, action);
  };

  const handleClientSave = () => {
      if (!newClient.name || !newClient.vatNumber) return alert("Preencha nome e NIF");
      const id = generateId();
      onSaveClient({
          ...newClient,
          id,
          name: newClient.name!,
          vatNumber: newClient.vatNumber!,
          email: newClient.email || '',
          phone: newClient.phone || '',
          address: newClient.address || '',
          city: newClient.city || 'Luanda',
          country: newClient.country || 'Angola',
          accountBalance: 0,
          transactions: []
      } as Client);
      setClientId(id);
      setShowClientModal(false);
      setNewClient({ city: 'Luanda', country: 'Angola' });
  };

  const handleQuickWLSave = () => {
      if (!newWLName) return alert("Preencha o nome do local");
      const newId = generateId();
      onSaveWorkLocation({
          id: newId,
          name: newWLName,
          address: newWLAddress || 'Luanda'
      });
      setWorkLocationId(newId);
      setShowQuickWorkLocation(false);
  };

  const availableTypes = Object.values(InvoiceType).filter(t => {
      if (t === InvoiceType.RG || t === InvoiceType.GE) return false; 
      return true;
  });

  const showTransportFields = invoiceType === InvoiceType.GR || invoiceType === InvoiceType.GT;

  // Render Preview
  const renderPreviewModal = () => {
      if (!showPreview || !currentCompany) return null;

      // Construct temporary invoice object for preview
      const tempInvoice: Invoice = {
          id: 'preview',
          type: invoiceType,
          seriesId: selectedSeriesId,
          number: initialData?.number || 'PREVIEW',
          date,
          dueDate: dueDate || date,
          clientId,
          clientName: clients.find(c => c.id === clientId)?.name || 'Cliente Final',
          clientNif: clients.find(c => c.id === clientId)?.vatNumber,
          items,
          subtotal,
          globalDiscount,
          taxRate: 0,
          taxAmount,
          withholdingAmount,
          retentionType,
          retentionAmount,
          total,
          currency,
          exchangeRate,
          status: isRestricted ? (initialData?.status || InvoiceStatus.PAID) : InvoiceStatus.DRAFT,
          isCertified: isRestricted,
          hash: initialData?.hash || '',
          companyId: currentCompany.id,
          workLocationId,
          paymentMethod: paymentMethod || undefined,
          operatorName: currentUser,
          driverName,
          vehiclePlate,
          deliveryAddress,
          sourceWarehouseId,
          targetWarehouseId
      } as Invoice;

      const seriesData = series.find(s => s.id === selectedSeriesId);

      const formatVal = (val: number) => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(val);
      };

      const sourceWarehouseName = warehouses.find(w => w.id === sourceWarehouseId)?.name || '-';
      const targetWarehouseName = warehouses.find(w => w.id === targetWarehouseId)?.name || '-';

      // --- NEW: TAX SUMMARY CALCULATION FOR PREVIEW ---
      const taxSummary: Record<string, {rate: number, base: number, amount: number}> = {};
      items.forEach(item => {
          const rate = item.taxRate;
          const key = rate.toString();
          if(!taxSummary[key]) taxSummary[key] = { rate, base: 0, amount: 0 };
          taxSummary[key].base += (item.quantity * item.unitPrice * (1 - item.discount/100));
          taxSummary[key].amount += (item.total * (rate/100));
      });

      return (
          <div className="fixed inset-0 bg-black/75 z-[100] flex items-center justify-center p-4">
              <div className="bg-slate-900 rounded-xl w-full h-full max-w-5xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800 text-white">
                      <h3 className="font-bold text-lg flex items-center gap-2"><Eye className="text-blue-400"/> Visualizar Documento (A4)</h3>
                      <div className="flex gap-2">
                          <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-2 text-sm font-bold"><Printer size={16}/> Imprimir</button>
                          <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-700 rounded-full"><X/></button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-slate-500 p-8 flex justify-center">
                        {/* Print Layout */}
                        <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl p-12 text-slate-900 relative">
                            {/* Header */}
                            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                                <div className="w-1/2">
                                    <h1 className="text-2xl font-extrabold uppercase">{currentCompany.name}</h1>
                                    <p className="text-xs text-slate-600">NIF: {currentCompany.nif}</p>
                                    <p className="text-xs text-slate-600">{currentCompany.address}</p>
                                    <p className="text-xs text-slate-600">{currentCompany.email} | {currentCompany.phone}</p>
                                </div>
                                <div className="text-right w-1/2">
                                    {/* Logo Placeholder */}
                                    {seriesData?.logo ? <img src={seriesData.logo} alt="Logo" className="h-16 object-contain mb-2 ml-auto" /> : <div className="h-16 w-32 bg-slate-100 mb-2 ml-auto flex items-center justify-center text-xs text-slate-400 border">LOGO</div>}
                                </div>
                            </div>

                            <div className="flex justify-between items-start mb-8">
                                <div className="w-1/2 border-l-4 border-slate-900 pl-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Exmo.(s) Sr.(s)</p>
                                    <h3 className="font-bold text-lg">{tempInvoice.clientName}</h3>
                                    <p className="text-sm">NIF: {tempInvoice.clientNif || 'Consumidor Final'}</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-xl font-black uppercase">{tempInvoice.type}</h2>
                                    <p className="font-mono text-lg text-slate-500 font-bold">{tempInvoice.number}</p>
                                </div>
                            </div>

                            {/* Meta Grid */}
                            <div className="grid grid-cols-4 border-y border-slate-200 py-2 mb-6 text-xs">
                                <div><span className="block font-bold text-slate-400">Data</span>{formatDate(tempInvoice.date)}</div>
                                <div><span className="block font-bold text-slate-400">Vencimento</span>{formatDate(tempInvoice.dueDate)}</div>
                                <div><span className="block font-bold text-slate-400">Moeda</span>{currency}</div>
                                <div className="text-right"><span className="block font-bold text-slate-400">Operador</span>{tempInvoice.operatorName || 'Admin'}</div>
                            </div>

                            {/* Transport Section */}
                            {(invoiceType === InvoiceType.GR || invoiceType === InvoiceType.GT) && (
                                <div className="mb-6 border border-slate-200 rounded p-4 bg-slate-50 text-xs">
                                    <h4 className="font-bold uppercase text-slate-700 mb-2 border-b border-slate-200 pb-1">Dados de Transporte</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><span className="block text-slate-400 font-bold uppercase text-[10px]">Motorista</span><span className="font-bold text-slate-800">{driverName || 'N/A'}</span></div>
                                        <div><span className="block text-slate-400 font-bold uppercase text-[10px]">Matrícula</span><span className="font-bold text-slate-800">{vehiclePlate || 'N/A'}</span></div>
                                        <div><span className="block text-slate-400 font-bold uppercase text-[10px]">Origem</span><span className="font-bold text-slate-800">{sourceWarehouseName}</span></div>
                                        <div><span className="block text-slate-400 font-bold uppercase text-[10px]">Destino</span><span className="font-bold text-slate-800">{targetWarehouseName}</span></div>
                                        <div className="col-span-2"><span className="block text-slate-400 font-bold uppercase text-[10px]">Local de Entrega</span><span className="font-bold text-slate-800">{deliveryAddress || 'Endereço do Cliente'}</span></div>
                                    </div>
                                </div>
                            )}

                            {/* Items Table - Added Ref and Unit */}
                            <table className="w-full text-xs mb-8">
                                <thead className="border-b-2 border-slate-900 font-bold uppercase">
                                    <tr>
                                        <th className="py-2 text-left w-20">Ref</th>
                                        <th className="py-2 text-left">Descrição</th>
                                        <th className="py-2 text-center w-12">Qtd</th>
                                        <th className="py-2 text-center w-10">Un</th>
                                        <th className="py-2 text-right w-24">Preço Un.</th>
                                        <th className="py-2 text-center w-12">Desc%</th>
                                        <th className="py-2 text-center w-12">Taxa</th>
                                        <th className="py-2 text-right w-24">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-100">
                                            <td className="py-2 font-mono text-slate-500">{item.reference || '-'}</td>
                                            <td className="py-2">{item.description}</td>
                                            <td className="py-2 text-center">{item.quantity}</td>
                                            <td className="py-2 text-center text-slate-500">{item.unit}</td>
                                            <td className="py-2 text-right">{formatVal(item.unitPrice)}</td>
                                            <td className="py-2 text-center">{item.discount}%</td>
                                            <td className="py-2 text-center">{item.taxRate}%</td>
                                            <td className="py-2 text-right font-bold">{formatVal(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals & Taxes */}
                            <div className="flex flex-col md:flex-row gap-8 border-t-2 border-slate-900 pt-6">
                                <div className="w-7/12 space-y-4">
                                    <div>
                                        <h4 className="text-[10px] font-bold text-slate-900 uppercase mb-2">Quadro Resumo de Impostos</h4>
                                        <table className="w-full text-[9px] text-left border border-slate-200">
                                            <thead className="bg-slate-100 font-bold text-slate-700">
                                                <tr><th className="p-1 border-r">Taxa</th><th className="p-1 border-r text-right">Base</th><th className="p-1 border-r text-right">IVA</th><th className="p-1 text-right">Obs</th></tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(taxSummary).map(([rate, vals]) => (
                                                    <tr key={rate} className="border-t border-slate-100">
                                                        <td className="p-1 border-r font-bold">{rate}%</td>
                                                        <td className="p-1 border-r text-right">{formatVal(vals.base)}</td>
                                                        <td className="p-1 border-r text-right">{formatVal(vals.amount)}</td>
                                                        <td className="p-1 text-right italic text-slate-500">{Number(rate) === 0 ? 'Isento art. 12.º CST' : '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Retention Text */}
                                    <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                        <p className="font-bold">{retentionAmount > 0 ? "Sujeito a retenção na fonte (6.5%) nos termos da lei." : "Isento de retenção — Lei 4/19, Art. 71, n.º 3, alínea c)"}</p>
                                    </div>
                                    
                                    {seriesData?.bankDetails && <div className="text-[9px] text-slate-500 pt-2"><span className="font-bold text-slate-800 uppercase block">Coordenadas Bancárias</span><pre className="font-sans whitespace-pre-line">{seriesData.bankDetails}</pre></div>}
                                </div>

                                <div className="w-5/12 text-right space-y-2">
                                    <div className="flex justify-between text-xs"><span>Subtotal:</span><span className="font-bold">{formatVal(subtotal)}</span></div>
                                    <div className="flex justify-between text-xs"><span>Descontos:</span><span className="font-bold">{formatVal(globalDiscountAmount)}</span></div>
                                    <div className="flex justify-between text-xs"><span>Imposto (IVA):</span><span className="font-bold">{formatVal(taxAmount)}</span></div>
                                    
                                    {withholdingAmount > 0 && (
                                        <div className="flex justify-between text-xs text-red-600 font-bold border-t border-slate-100 pt-1 mt-1">
                                            <span>Retenção Fonte (6.5%):</span><span>- {formatVal(withholdingAmount)}</span>
                                        </div>
                                    )}
                                    {retentionAmount > 0 && (
                                        <div className="flex justify-between text-xs text-red-600 font-bold">
                                            <span>Cativação IVA:</span><span>- {formatVal(retentionAmount)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-xl font-black border-t-2 border-slate-900 pt-2 mt-2">
                                        <span>TOTAL:</span><span>{formatVal(total)}</span>
                                    </div>
                                    <div className="text-[10px] italic text-slate-400">{numberToExtenso(total, currency === 'AOA' ? 'Kwanzas' : currency)}</div>
                                </div>
                            </div>
                            
                            {/* Watermark for Preview */}
                            {!tempInvoice.isCertified && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                                    <h1 className="text-[100px] font-black -rotate-45">RASCUNHO</h1>
                                </div>
                            )}

                            {/* Valid For Text */}
                            {(invoiceType === InvoiceType.PP || invoiceType === InvoiceType.OR) && (
                                <div className="mt-8 text-center text-xs font-bold text-slate-500 uppercase border p-2">Este documento não serve de fatura.</div>
                            )}

                            {/* Footer from Series Config */}
                            <div className="absolute bottom-12 left-12 right-12 border-t border-slate-200 pt-4 flex justify-between items-center">
                                 <div className="flex gap-2 items-center">
                                     <img src={generateQrCodeUrl(tempInvoice.hash || 'PREVIEW')} className="w-12 h-12" alt="QR"/>
                                     <div className="text-[8px] text-slate-400">
                                         <p className="font-mono font-bold">{tempInvoice.hash || 'HASH-PREVIEW-MODE'}</p>
                                         <p>Processado por programa certificado nº 25/AGT/2019</p>
                                     </div>
                                 </div>
                                 <div className="text-right text-[9px] text-slate-400 flex flex-col items-end">
                                     {seriesData?.footerLogo && <img src={seriesData.footerLogo} className="h-8 mb-1" alt="Footer Logo"/>}
                                     <p>{seriesData?.footerText || 'Documento processado por computador'}</p>
                                     {seriesData?.footerAddress && <p>{seriesData.footerAddress}</p>}
                                     {(seriesData?.footerEmail || seriesData?.footerPhone) && <p>{seriesData.footerEmail} | {seriesData.footerPhone}</p>}
                                 </div>
                            </div>
                        </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-500 pb-20 relative px-4 sm:px-6">
      
      {renderPreviewModal()}

      {/* Client Modal */}
      {showClientModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                  <div className="bg-slate-900 text-white p-5 flex justify-between items-center sticky top-0 z-10">
                      <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus size={20}/> Novo Cliente</h3>
                      <button onClick={() => setShowClientModal(false)} className="hover:bg-slate-800 p-1 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2 md:col-span-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Nome / Empresa <span className="text-red-500">*</span></label>
                          <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Ex: Cliente Exemplo Lda" value={newClient.name || ''} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">NIF <span className="text-red-500">*</span></label>
                          <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="000000000" value={newClient.vatNumber || ''} onChange={e => setNewClient({...newClient, vatNumber: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Endereço Completo</label>
                          <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Rua, Nº, Bairro" value={newClient.address || ''} onChange={e => setNewClient({...newClient, address: e.target.value})} />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Cidade</label>
                           <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Luanda" value={newClient.city || ''} onChange={e => setNewClient({...newClient, city: e.target.value})} />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Província</label>
                           <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Luanda" value={newClient.province || ''} onChange={e => setNewClient({...newClient, province: e.target.value})} />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                           <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="+244..." value={newClient.phone || ''} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                           <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="cliente@email.com" value={newClient.email || ''} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Cliente</label>
                          <select className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={newClient.clientType} onChange={e => setNewClient({...newClient, clientType: e.target.value})}>
                              <option value="">Selecione...</option>
                              <option value="Consumidor Final">Consumidor Final</option>
                              <option value="Empresa Nacional">Empresa Nacional</option>
                              <option value="Cliente Não Grupo Nacionais">Cliente Não Grupo Nacionais</option>
                          </select>
                      </div>
                  </div>
                  <div className="p-5 border-t bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
                      <button onClick={() => setShowClientModal(false)} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-white transition-colors">Cancelar</button>
                      <button onClick={handleClientSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">Criar Cliente</button>
                  </div>
              </div>
          </div>
      )}

      {showQuickWorkLocation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><MapPin size={20} className="text-blue-500"/> Novo Local</h3>
                  <input className="w-full border p-3 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nome (Ex: Loja 2)" value={newWLName} onChange={e => setNewWLName(e.target.value)} />
                  <input className="w-full border p-3 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Endereço" value={newWLAddress} onChange={e => setNewWLAddress(e.target.value)} />
                  <div className="flex gap-2">
                      <button onClick={() => setShowQuickWorkLocation(false)} className="flex-1 py-2 border rounded-lg hover:bg-slate-50">Cancelar</button>
                      <button onClick={handleQuickWLSave} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow">Salvar</button>
                  </div>
              </div>
          </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={onCancel} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2">
                <ArrowLeft size={20} /> <span className="font-medium hidden sm:inline">Voltar</span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div>
                 <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {isReceiptMode ? <Lock size={20} className="text-emerald-500"/> : <FileText size={20} className="text-blue-500"/>}
                    {isReceiptMode ? `Recibo: ${initialData?.number}` : isRestricted ? `Editar: ${initialData?.number}` : 'Nova Fatura'}
                 </h1>
                 <div className="flex items-center gap-2">
                     <p className="text-xs text-slate-500 hidden sm:block">Operador: {currentUser}</p>
                     {isRestricted && <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-200 flex items-center gap-1"><Lock size={8}/> EDIÇÃO RESTRITA</span>}
                 </div>
            </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto justify-end">
            {!isRestricted && (
                <>
                    <button 
                        onClick={() => setShowClientModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-bold shadow-green-200"
                        title="Criar novo cliente rapidamente"
                    >
                        <UserPlus size={18} />
                        <span className="hidden sm:inline">Novo Cliente</span>
                    </button>

                    <button 
                        onClick={() => setShowAiInput(!showAiInput)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 transition font-medium"
                    >
                        <Wand2 size={18} />
                        <span className="hidden sm:inline">AI Assist</span>
                    </button>
                </>
            )}

            <button 
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-black transition font-bold"
            >
                <Eye size={18} />
                <span className="hidden sm:inline">Visualizar Documento</span>
            </button>

            <button 
                onClick={onViewList}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 border border-slate-300 transition"
            >
                <List size={18} />
            </button>
        </div>
      </div>

      {showAiInput && (
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 flex gap-2 animate-in slide-in-from-top-2 shadow-sm">
          <input 
            type="text"
            className="flex-1 p-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
            placeholder="Descreva a fatura..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <button 
            onClick={handleAiGenerate}
            disabled={isAiLoading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 font-bold shadow-sm"
          >
            {isAiLoading ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
            Gerar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        <div className="xl:col-span-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded shadow-sm text-blue-600"><FileText size={14}/></div>
                        <h3 className="font-bold text-slate-700 text-sm uppercase">Dados do Documento</h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo</label>
                                {!isReceiptMode ? (
                                    <div className="relative">
                                        <select 
                                            className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-bold text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:opacity-50"
                                            value={invoiceType}
                                            onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}
                                            disabled={isRestricted}
                                        >
                                            {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14}/>
                                    </div>
                                ) : (
                                    <div className="w-full p-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-sm text-center">
                                        RECIBO (RG)
                                    </div>
                                )}
                             </div>
                             <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Série</label>
                                 <div className="relative">
                                    <select 
                                        className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:opacity-50"
                                        value={selectedSeriesId}
                                        onChange={(e) => setSelectedSeriesId(e.target.value)}
                                        disabled={isRestricted}
                                    >
                                        <option value="">Selecione...</option>
                                        {series.filter(s => s.isActive && (s.allowedUserIds.length === 0 || (currentUserId && s.allowedUserIds.includes(currentUserId)))).map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14}/>
                                 </div>
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Calendar size={10}/> Data Emissão</label>
                                <input 
                                    type="date" 
                                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={date} 
                                    onChange={e => setDate(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vencimento</label>
                                <input type="date" className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                            </div>
                        </div>
                        
                        <div className="pt-2 border-t border-slate-100 mt-2">
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Local de Trabalho</label>
                                <div className="flex gap-2">
                                    <select className="flex-1 p-2 border border-slate-200 rounded-lg bg-slate-50 text-sm outline-none" value={workLocationId} onChange={e => setWorkLocationId(e.target.value)}>
                                        <option value="">Selecione Local...</option>
                                        {workLocations.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                    <button onClick={() => setShowQuickWorkLocation(true)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200" title="Criar Local">
                                        <Plus size={16} />
                                    </button>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                     <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white rounded shadow-sm text-green-600"><Briefcase size={14}/></div>
                            <h3 className="font-bold text-slate-700 text-sm uppercase">Entidade / Cliente</h3>
                        </div>
                     </div>
                     <div className="p-5 flex-1 flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Selecionar Cliente</label>
                        <div className="relative mb-4">
                            <select 
                                className="w-full p-3 pl-4 pr-10 border border-slate-200 rounded-xl text-base font-medium bg-white focus:ring-2 focus:ring-green-500 outline-none appearance-none shadow-sm disabled:opacity-50"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                disabled={isReceiptMode || isRestricted} 
                            >
                                <option value="">Selecione o Cliente na lista...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
                        </div>

                        {clientId ? (
                            <div className="mt-auto animate-in fade-in slide-in-from-top-2 bg-slate-50 rounded-lg border border-slate-100 p-4 space-y-3">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-xs text-slate-500 font-bold uppercase">NIF</span>
                                    <span className="font-mono font-medium text-slate-700">{clients.find(c => c.id === clientId)?.vatNumber}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-xs text-slate-500 font-bold uppercase">Localidade</span>
                                    <span className="text-sm text-slate-700">{clients.find(c => c.id === clientId)?.city}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-xs text-slate-500 font-bold uppercase flex items-center gap-1"><CreditCard size={12}/> Conta Corrente</span>
                                    <span className={`font-bold text-lg ${((clients.find(c => c.id === clientId)?.accountBalance || 0) > 0) ? 'text-red-500' : 'text-green-600'}`}>
                                        {formatCurrency(clients.find(c => c.id === clientId)?.accountBalance || 0)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-auto flex flex-col items-center justify-center h-32 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                                <User size={32} className="mb-2 opacity-20"/>
                                <span className="text-xs">Selecione um cliente para ver detalhes</span>
                            </div>
                        )}
                     </div>
                </div>
            </div>

            {/* Transport Section (Visible for Guides) */}
            {showTransportFields && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                    <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex justify-between items-center">
                        <h3 className="font-bold text-indigo-700 text-sm uppercase flex items-center gap-2"><Truck size={16}/> Dados de Transporte</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome do Motorista</label>
                            <input className="w-full p-2 border border-slate-200 rounded-lg text-sm" placeholder="Nome do Condutor" value={driverName} onChange={e => setDriverName(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Matrícula da Viatura</label>
                            <input className="w-full p-2 border border-slate-200 rounded-lg text-sm" placeholder="AA-00-00-AA" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Armazém de Saída</label>
                            <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white" value={sourceWarehouseId} onChange={e => setSourceWarehouseId(e.target.value)}>
                                <option value="">Selecione...</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Armazém de Destino (Opcional)</label>
                            <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white" value={targetWarehouseId} onChange={e => setTargetWarehouseId(e.target.value)}>
                                <option value="">Selecione...</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div className="lg:col-span-4">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Endereço de Entrega (Local de Destino)</label>
                            <input className="w-full p-2 border border-slate-200 rounded-lg text-sm" placeholder="Morada completa de destino" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm uppercase flex items-center gap-2"><List size={16}/> Itens do Documento</h3>
                    {!isReceiptMode && !isRestricted && (
                        <button onClick={handleAddItem} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-2">
                            <Plus size={14} /> Adicionar Linha
                        </button>
                    )}
                </div>
                
                <div className="flex-1 p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold">
                            <tr>
                                <th className="p-3 w-20">Tipo</th>
                                <th className="p-3">Ref</th>
                                <th className="p-3">Descrição / Produto</th>
                                <th className="p-3 w-16 text-center">Unid</th>
                                <th className="p-3 w-20 text-center">Qtd</th>
                                <th className="p-3 w-28 text-right">Preço Un.</th>
                                <th className="p-3 w-16 text-center">Desc%</th>
                                <th className="p-3 w-20 text-center">Taxa</th>
                                <th className="p-3 w-28 text-right">Total</th>
                                {!isReceiptMode && !isRestricted && <th className="p-3 w-10"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, index) => (
                                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-2 pl-3">
                                        <select 
                                            className="w-full bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer disabled:opacity-50"
                                            value={item.type}
                                            onChange={(e) => handleUpdateItem(index, 'type', e.target.value)}
                                            disabled={isReceiptMode || isRestricted || invoiceType === InvoiceType.PP} // PP Restricted
                                        >
                                            <option value="PRODUCT">PROD</option>
                                            {invoiceType !== InvoiceType.PP && <option value="SERVICE">SERV</option>}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <input 
                                            className="w-full p-1 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none text-xs disabled:opacity-50"
                                            placeholder="SKU/Ref"
                                            value={item.reference || ''}
                                            onChange={(e) => handleUpdateItem(index, 'reference', e.target.value)}
                                            disabled={isRestricted}
                                        />
                                    </td>
                                    <td className="p-2">
                                        {!isReceiptMode ? (
                                            <div className="flex flex-col gap-1">
                                                {item.type === 'PRODUCT' && (
                                                    <select 
                                                        className="w-full p-1.5 border border-slate-200 rounded text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50"
                                                        onChange={(e) => handleProductSelect(index, e.target.value)}
                                                        value={item.productId || ''}
                                                        disabled={isRestricted}
                                                    >
                                                        <option value="">-- Selecionar Produto --</option>
                                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                )}
                                                <input 
                                                    className="w-full p-1 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none text-sm placeholder:text-slate-400 disabled:opacity-50"
                                                    placeholder={item.type === 'PRODUCT' ? "Descrição adicional..." : "Descrição do serviço..."}
                                                    value={item.description}
                                                    onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                                                    disabled={isRestricted}
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-sm font-medium text-slate-700 truncate" title={item.description}>{item.description}</div>
                                        )}
                                    </td>
                                    <td className="p-2 text-center">
                                        <select
                                            className="w-full p-1 text-center text-xs bg-transparent focus:outline-none cursor-pointer disabled:opacity-50"
                                            value={item.unit}
                                            onChange={(e) => handleUpdateItem(index, 'unit', e.target.value)}
                                            disabled={isRestricted}
                                        >
                                            <option value="un">un</option>
                                            <option value="kg">kg</option>
                                            <option value="LT">LT</option>
                                            <option value="mês">mês</option>
                                        </select>
                                    </td>
                                    <td className="p-2 text-center">
                                        <input 
                                            type="number" min="1" 
                                            className="w-full p-1.5 text-center border border-slate-200 rounded bg-white text-sm focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50"
                                            value={item.quantity}
                                            onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                                            disabled={isReceiptMode || isRestricted}
                                        />
                                    </td>
                                    <td className="p-2 text-right">
                                        <input 
                                            type="number" min="0" 
                                            className="w-full p-1.5 text-right border border-slate-200 rounded bg-white text-sm focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50"
                                            value={item.unitPrice}
                                            onChange={(e) => handleUpdateItem(index, 'unitPrice', Number(e.target.value))}
                                            disabled={isReceiptMode || isRestricted}
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <input 
                                            type="number" min="0" max="100"
                                            className="w-full p-1.5 text-center border border-slate-200 rounded bg-white text-sm focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50"
                                            value={item.discount}
                                            onChange={(e) => handleUpdateItem(index, 'discount', Number(e.target.value))}
                                            disabled={isReceiptMode || isRestricted}
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <select
                                            className="w-full p-1 text-center text-xs bg-transparent focus:outline-none cursor-pointer disabled:opacity-50"
                                            value={item.taxRate}
                                            onChange={(e) => handleUpdateItem(index, 'taxRate', Number(e.target.value))}
                                            disabled={isReceiptMode || isRestricted}
                                        >
                                            <option value="14">14%</option>
                                            <option value="7">7%</option>
                                            <option value="5">5%</option>
                                            <option value="0">0%</option>
                                        </select>
                                    </td>
                                    <td className="p-2 text-right font-bold text-slate-700 text-sm pr-3">
                                        {(item.total || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    {!isReceiptMode && !isRestricted && (
                                        <td className="p-2 text-center">
                                            <button onClick={() => handleRemoveItem(index)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {items.length === 0 && (
                        <div className="text-center py-16 flex flex-col items-center justify-center text-slate-400">
                            <List size={48} className="mb-3 opacity-20"/>
                            <p className="font-medium">Nenhum item adicionado.</p>
                            <p className="text-xs">Utilize o botão acima para adicionar produtos ou serviços.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Observações Internas / Públicas</label>
                <textarea 
                    className="w-full p-3 border border-slate-200 rounded-lg h-20 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Escreva aqui detalhes adicionais..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                ></textarea>
            </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
            
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden sticky top-24">
                <div className="bg-slate-800 text-white px-6 py-4 flex items-center gap-2">
                    <CreditCard size={18}/>
                    <h3 className="font-bold">Resumo Financeiro</h3>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                        {['AOA', 'USD', 'EUR', 'BRL'].map(c => (
                            <button 
                                key={c} 
                                onClick={() => !isReceiptMode && setCurrency(c as any)}
                                disabled={isReceiptMode || isRestricted}
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${currency === c ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    {currency !== 'AOA' && (
                        <div className="relative">
                             <label className="text-[10px] font-bold text-slate-400 uppercase absolute -top-2 left-2 bg-white px-1">Taxa de Câmbio</label>
                             <input 
                                type="number" 
                                className="w-full p-3 border border-slate-200 rounded-lg text-right font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={exchangeRate} 
                                onChange={e => setExchangeRate(Number(e.target.value))}
                                disabled={isReceiptMode || isRestricted}
                             />
                        </div>
                    )}

                    <div className="space-y-4 pt-2">
                        <div className="flex justify-between text-slate-600 text-sm">
                            <span>Subtotal</span>
                            <span className="font-bold text-slate-800">{subtotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-slate-600 text-sm bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="flex items-center gap-1 font-medium"><Percent size={14}/> Desconto Global</span>
                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1">
                                <input 
                                    type="number" min="0" max="100"
                                    className="w-12 p-1 text-right text-sm outline-none disabled:opacity-50"
                                    value={globalDiscount}
                                    onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                                    disabled={isReceiptMode || isRestricted}
                                />
                                <span className="text-xs text-slate-400 mr-1">%</span>
                            </div>
                        </div>

                        {globalDiscount > 0 && (
                            <div className="flex justify-between text-red-500 text-sm font-medium">
                                 <span>Valor Desconto</span>
                                 <span>- {globalDiscountAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between text-slate-600 text-sm pt-2 border-t border-dashed border-slate-200">
                            <span>Imposto (IVA)</span>
                            <span className="font-bold text-slate-800">{taxAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                        </div>

                        {withholdingAmount > 0 && (
                             <div className="flex justify-between text-red-600 text-xs font-bold bg-red-50 p-2 rounded border border-red-100">
                                 <span>Retenção 6.5%</span>
                                 <span>- {withholdingAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                             </div>
                        )}

                        <div className="pt-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cativação IVA</label>
                            <select 
                                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                                value={retentionType}
                                onChange={(e) => setRetentionType(e.target.value as any)}
                                disabled={isReceiptMode || taxAmount === 0 || isRestricted}
                            >
                                <option value="NONE">Sem Cativação</option>
                                <option value="CAT_50">Cativação 50%</option>
                                <option value="CAT_100">Cativação 100%</option>
                            </select>
                            {retentionAmount > 0 && (
                                 <div className="flex justify-between text-red-600 text-xs font-bold mt-2 bg-red-50 p-2 rounded border border-red-100">
                                     <span>Valor Cativado</span>
                                     <span>- {retentionAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                                 </div>
                            )}
                        </div>

                        <div className="pt-4 mt-4 border-t-2 border-slate-800">
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-base text-slate-500">A PAGAR</span>
                                <span className="font-black text-3xl text-blue-600 tracking-tight">
                                    {total.toLocaleString('pt-AO', { style: 'currency', currency: currency })}
                                </span>
                            </div>
                            {currency !== 'AOA' && (
                                <div className="text-right text-xs text-slate-400 mt-1 italic font-medium">
                                    Contravalor: {formatCurrency(contraValue)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {(invoiceType === InvoiceType.FR || invoiceType === InvoiceType.RG || isRestricted) && (
                    <div className="bg-emerald-50 p-6 border-t border-emerald-100 animate-in slide-in-from-bottom-2">
                         <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2 text-sm"><Lock size={14}/> Dados de Pagamento</h3>
                         <div className="space-y-3">
                             <div>
                                 <select className="w-full p-2.5 border border-emerald-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>
                                     <option value="">Forma de Pagamento...</option>
                                     <option value="CASH">Numerário</option>
                                     <option value="MULTICAIXA">Multicaixa</option>
                                     <option value="TRANSFER">Transferência</option>
                                 </select>
                             </div>
                             <div>
                                 <select className="w-full p-2.5 border border-emerald-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none" value={cashRegisterId} onChange={e => setCashRegisterId(e.target.value)}>
                                     <option value="">Caixa de Destino...</option>
                                     {cashRegisters.filter(c => c.status === 'OPEN').map(c => (
                                         <option key={c.id} value={c.id}>{c.name}</option>
                                     ))}
                                 </select>
                                 {isRestricted && <p className="text-[10px] text-emerald-600 mt-1 italic">* Pode alterar o caixa para corrigir lançamentos.</p>}
                             </div>
                         </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowPreview(true)} className="col-span-2 py-3 px-4 border-2 border-slate-800 text-slate-800 rounded-xl font-bold hover:bg-slate-100 flex items-center justify-center gap-2 transition-colors">
                    <Eye size={20} /> Visualizar Modelo
                </button>
                <button onClick={onCancel} className="py-4 px-4 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
                    <Eraser size={20} /> Cancelar
                </button>
                <button onClick={() => handleSave()} className="py-4 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5">
                    <Save size={20} /> {isRestricted ? 'Atualizar Dados' : 'Emitir Documento'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
