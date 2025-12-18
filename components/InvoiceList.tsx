
import React, { useState } from 'react';
import { Invoice, InvoiceStatus, InvoiceType, Company, WorkLocation, DocumentSeries, PaymentMethod, CashRegister, InvoiceItem, Warehouse, Purchase } from '../types';
import { formatCurrency, formatDate, generateInvoiceHash, exportToExcel, generateQrCodeUrl, numberToExtenso, getDocumentPrefix } from '../utils';
import { printDocument, downloadPDF, downloadExcel } from "../utils/exportUtils";
import { Search, Filter, MoreHorizontal, Download, Eye, Trash2, Printer, Share2, ShieldCheck, Mail, MessageCircle, X, FileText, FileJson, CheckCircle, AlertTriangle, Copy, Lock, FilePlus, Receipt, FileOutput, PlusCircle, Truck, Send, FileCheck, Upload, ExternalLink, RefreshCw, ArrowRight, PieChart, ChevronDown, ChevronRight, Edit3, Save, Link2, Box, ArrowRightLeft, MapPin, CreditCard, Link, Copy as CopyIcon, FileType, DollarSign, FileSpreadsheet, User, BarChart, Hash } from 'lucide-react';
import BusinessOverviewModal from './BusinessOverviewModal';

interface InvoiceListProps {
  invoices: Invoice[];
  onDelete: (id: string) => void;
  onUpdate: (invoice: Invoice) => void;
  onLiquidate: (invoice: Invoice, amount: number, method: PaymentMethod, registerId: string) => void; 
  onCancelInvoice: (id: string, reason: string) => void;
  onCertify: (invoice: Invoice) => void;
  onCreateNew: () => void;
  onCreateDerived: (sourceInvoice: Invoice, type: InvoiceType) => void;
  onUpload: (id: string, file: File) => void;
  onViewReports: () => void;
  onQuickUpdate: (id: string, updates: Partial<Invoice>) => void;
  onViewClientAccount: (clientId: string) => void;
  currentCompany: Company;
  workLocations: WorkLocation[];
  cashRegisters: CashRegister[];
  series: DocumentSeries[];
  warehouses?: Warehouse[];
  purchases?: Purchase[];
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onDelete, onUpdate, onLiquidate, onCancelInvoice, onCertify, onCreateNew, onCreateDerived, onUpload, onViewReports, onQuickUpdate, onViewClientAccount, currentCompany, workLocations, cashRegisters, series, warehouses = [], purchases = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [seriesFilter, setSeriesFilter] = useState<string>('ALL'); // NEW SERIES FILTER
  
  // Printing State
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [printFormat, setPrintFormat] = useState<'A4' | '80mm' | '24pin'>('A4');
  const [isForeignDraft, setIsForeignDraft] = useState(false);
  const [printCopyLabel, setPrintCopyLabel] = useState<string>('Original');

  // Modal States
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [certifyModalOpen, setCertifyModalOpen] = useState(false);
  const [invoiceToCertify, setInvoiceToCertify] = useState<Invoice | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Actions Central Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedActionInvoice, setSelectedActionInvoice] = useState<Invoice | null>(null);
  
  // Liquidate (Receipt) Modal
  const [liquidateModalOpen, setLiquidateModalOpen] = useState(false);
  const [liquidateData, setLiquidateData] = useState<{amount: number, method: PaymentMethod | '', registerId: string}>({ amount: 0, method: '', registerId: '' });

  // Convert/Faturar Modal
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [targetConvertType, setTargetConvertType] = useState<InvoiceType>(InvoiceType.FT);

  // Clone Modal
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [targetCloneType, setTargetCloneType] = useState<InvoiceType>(InvoiceType.FT);

  // Business Overview Modal State
  const [showBusinessOverview, setShowBusinessOverview] = useState(false);

  // Upload Logic
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadInvoiceId, setUploadInvoiceId] = useState<string | null>(null);
  const [viewingUpload, setViewingUpload] = useState<string | null>(null); // To view/close upload

  const getRelatedDocuments = (invoiceId: string, currentInvoice: Invoice) => {
      const children = invoices.filter(i => i.sourceInvoiceId === invoiceId);
      let parent: Invoice | undefined;
      if (currentInvoice.sourceInvoiceId) {
          parent = invoices.find(i => i.id === currentInvoice.sourceInvoiceId);
      }
      return { children, parent };
  };

  // Helper Functions
  const getStatusColor = (invoice: Invoice) => {
    if (invoice.status === InvoiceStatus.CANCELLED) return 'bg-red-50 text-red-600 border-red-200';
    if (invoice.type === InvoiceType.NC) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (invoice.type === InvoiceType.RG || invoice.type === InvoiceType.FR) {
        if (invoice.isCertified) {
            return invoice.status === InvoiceStatus.PARTIAL ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
        } else {
            return 'bg-yellow-100 text-yellow-700 border-yellow-200'; 
        }
    }
    switch (invoice.status) {
      case InvoiceStatus.PAID: return 'bg-blue-100 text-blue-700 border-blue-200';
      case InvoiceStatus.PARTIAL: return 'bg-orange-100 text-orange-700 border-orange-200';
      case InvoiceStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case InvoiceStatus.OVERDUE: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusText = (invoice: Invoice) => {
      if (invoice.status === InvoiceStatus.CANCELLED) return 'ANULADO';
      if (invoice.type === InvoiceType.NC) return 'REGULARIZADO'; 
      if (invoice.type === InvoiceType.RG || invoice.type === InvoiceType.FR) {
          if (invoice.status === InvoiceStatus.PARTIAL) return 'PARCIAL';
          if (invoice.isCertified) return 'PAGO';
          return 'PENDENTE';
      }
      if (invoice.status === InvoiceStatus.PARTIAL) return 'PARCELAR';
      return invoice.status;
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || invoice.type === typeFilter;
    const matchesSeries = seriesFilter === 'ALL' || invoice.seriesId === seriesFilter; // SERIES FILTER LOGIC

    return matchesSearch && matchesStatus && matchesType && matchesSeries;
  });

  const handleUploadClick = (invoice: Invoice, forceNewUpload = false) => {
      if (invoice.attachment && !forceNewUpload) {
          setViewingUpload(invoice.attachment);
      } else {
          setUploadInvoiceId(invoice.id);
          if (fileInputRef.current) {
              fileInputRef.current.click();
          }
      }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && uploadInvoiceId) {
          onUpload(uploadInvoiceId, e.target.files[0]);
          setUploadInvoiceId(null);
      }
  }

  const openActions = (invoice: Invoice) => {
      setSelectedActionInvoice(invoice);
      setActionModalOpen(true);
  }

  const closeActions = () => {
      setActionModalOpen(false);
      setSelectedActionInvoice(null);
  }

  const handleEdit = (invoice: Invoice) => {
      onUpdate(invoice); 
      closeActions();
  }

  const initiateLiquidate = (invoice: Invoice) => {
      const alreadyPaid = invoice.paidAmount || 0;
      const remaining = invoice.total - alreadyPaid;
      
      setLiquidateData({
          amount: remaining > 0 ? remaining : 0, 
          method: '',
          registerId: ''
      });
      setLiquidateModalOpen(true);
      closeActions(); 
  }

  const handleConfirmLiquidate = () => {
      if (selectedActionInvoice && liquidateData.method && liquidateData.registerId && liquidateData.amount > 0) {
          onLiquidate(selectedActionInvoice, liquidateData.amount, liquidateData.method as PaymentMethod, liquidateData.registerId);
          setLiquidateModalOpen(false);
          setSelectedActionInvoice(null);
          setLiquidateData({ amount: 0, method: '', registerId: '' });
      } else {
          alert("Preencha todos os campos e certifique-se que o valor é superior a 0.");
      }
  }

  const initiateCertify = (invoice: Invoice) => {
    if (invoice.isCertified) return;
    setInvoiceToCertify(invoice);
    setCertifyModalOpen(true);
    closeActions();
  };

  const confirmCertify = () => {
    if (invoiceToCertify) {
        onCertify(invoiceToCertify);
        setCertifyModalOpen(false);
        setInvoiceToCertify(null);
    }
  };

  const initiateCancel = (invoice: Invoice) => {
      if (invoice.status === InvoiceStatus.CANCELLED) return;
      setInvoiceToCancel(invoice);
      setCancelReason('');
      setCancelModalOpen(true);
      closeActions();
  }

  const confirmCancel = () => {
      if (invoiceToCancel && cancelReason) {
          onCancelInvoice(invoiceToCancel.id, cancelReason);
          setCancelModalOpen(false);
          setInvoiceToCancel(null);
      } else {
          alert("Indique o motivo da anulação.");
      }
  }

  const initiateDelete = (invoice: Invoice) => {
      if (invoice.isCertified) {
          alert("Documentos certificados não podem ser apagados do sistema. Devem ser anulados.");
          return;
      }
      setInvoiceToDelete(invoice);
      setDeleteModalOpen(true);
      closeActions();
  };

  const confirmDelete = () => {
      if (invoiceToDelete) {
          onDelete(invoiceToDelete.id);
          setDeleteModalOpen(false);
          setInvoiceToDelete(null);
      }
  };

  const initiateConvert = (invoice: Invoice) => {
      setSelectedActionInvoice(invoice);
      setConvertModalOpen(true);
      closeActions();
  }

  const confirmConvert = () => {
      if(selectedActionInvoice) {
          onCreateDerived(selectedActionInvoice, targetConvertType);
          setConvertModalOpen(false);
          setSelectedActionInvoice(null);
      }
  }

  const initiateClone = (invoice: Invoice) => {
      setSelectedActionInvoice(invoice);
      setTargetCloneType(invoice.type); // Default to same type
      setCloneModalOpen(true);
      closeActions();
  }

  const confirmClone = () => {
      if(selectedActionInvoice) {
          onCreateDerived(selectedActionInvoice, targetCloneType);
          setCloneModalOpen(false);
          setSelectedActionInvoice(null);
      }
  }

  // DEFAULT PRINT IS ORIGINAL
  const handlePrint = (invoice: Invoice, format: 'A4' | '80mm' | '24pin', asDraft = false, copyLabel = 'Original') => {
    setPrintingInvoice(invoice);
    setPrintFormat(format);
    setIsForeignDraft(asDraft);
    setPrintCopyLabel(copyLabel);
    closeActions();
  };

  const handleExcelExport = (invoice?: Invoice) => {
      if (invoice) {
        const data = invoice.items.map(i => ({
            Documento: invoice.number,
            Data: formatDate(invoice.date),
            Cliente: invoice.clientName,
            Item: i.description,
            Ref: i.reference,
            Unidade: i.unit,
            Qtd: i.quantity,
            Preco: i.unitPrice,
            Total: i.total
        }));
        exportToExcel(data, `Documento_${invoice.number}`);
      } else {
        downloadExcel("invoiceTable", "Lista_de_Faturas.xlsx");
      }
  }

  const handleWhatsApp = (invoice: Invoice) => {
      const text = `Olá ${invoice.clientName}, segue o documento ${invoice.type} ${invoice.number} no valor de ${formatCurrency(invoice.total)}.`;
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
      closeActions();
  }

  const handleEmail = (invoice: Invoice) => {
      const subject = `Documento ${invoice.number} - ${currentCompany.name}`;
      const body = `Estimado cliente, segue em anexo o documento ${invoice.number}. Valor: ${formatCurrency(invoice.total)}.`;
      const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(url, '_self');
      closeActions();
  }

  const handleViewAccount = (invoice: Invoice) => {
      onViewClientAccount(invoice.clientId);
      closeActions();
  }

  const renderPrintPreview = () => {
    if (!printingInvoice) return null;
    const isA4 = printFormat === 'A4';
    const is80mm = printFormat === '80mm';
    const seriesData = series.find(s => s.id === printingInvoice.seriesId);
    const isDraftView = isForeignDraft;
    const isMainDocForeign = printingInvoice.currency && printingInvoice.currency !== 'AOA';
    const isNoFiscalValidity = printingInvoice.type === InvoiceType.PP || printingInvoice.type === InvoiceType.OR;
    const isGuide = printingInvoice.type === InvoiceType.GR || printingInvoice.type === InvoiceType.GT;
    
    let displayCurrency = 'AOA';
    let exchangeRate = 1;
    if (isMainDocForeign) {
        if (isDraftView) { displayCurrency = printingInvoice.currency; exchangeRate = printingInvoice.exchangeRate; } 
        else { displayCurrency = 'AOA'; exchangeRate = printingInvoice.exchangeRate; }
    } else { displayCurrency = 'AOA'; }
    
    const formatVal = (val: number) => {
        let finalVal = val;
        if (isMainDocForeign && !isDraftView) finalVal = val * printingInvoice.exchangeRate;
        return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: displayCurrency, minimumFractionDigits: 2 }).format(finalVal);
    };
    const taxSummary: Record<string, {rate: number, base: number, amount: number, retention: number}> = {};
    printingInvoice.items.forEach(item => {
        const rate = item.taxRate;
        const key = rate.toString();
        if(!taxSummary[key]) taxSummary[key] = { rate, base: 0, amount: 0, retention: 0 };
        let lineTotal = item.quantity * item.unitPrice;
        let lineDiscount = lineTotal * (item.discount / 100);
        let lineNet = lineTotal - lineDiscount;
        let lineTax = lineNet * (rate / 100);
        let lineRetention = 0;
        if (printingInvoice.retentionType === 'CAT_50') lineRetention = lineTax * 0.5;
        if (printingInvoice.retentionType === 'CAT_100') lineRetention = lineTax * 1.0;
        taxSummary[key].base += lineNet;
        taxSummary[key].amount += lineTax;
        taxSummary[key].retention += lineRetention;
    });
    
    const totalIlíquido = printingInvoice.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
    const totalDescontoGlobal = printingInvoice.subtotal * (printingInvoice.globalDiscount/100);
    const totalDescontosLinha = printingInvoice.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice * (i.discount/100)), 0);
    const totalDescontos = totalDescontosLinha + totalDescontoGlobal;
    const totalImposto = Object.values(taxSummary).reduce((acc, t) => acc + t.amount, 0);
    
    const totalFinal = printingInvoice.total;
    const withholding = printingInvoice.withholdingAmount || 0;
    const retention = printingInvoice.retentionAmount || 0;

    const sourceWarehouseName = warehouses.find(w => w.id === printingInvoice.sourceWarehouseId)?.name || '-';
    const targetWarehouseName = warehouses.find(w => w.id === printingInvoice.targetWarehouseId)?.name || '-';

    return (
        <div className="fixed inset-0 bg-slate-800 z-[100] overflow-y-auto print-container flex flex-col items-center">
            <div className="w-full bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg print:hidden">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold">Pré-visualização ({printFormat}) - {printCopyLabel.toUpperCase()}</h2>
                    {isDraftView ? <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded flex items-center gap-2"><FileText size={14}/> DRAFT ({displayCurrency})</span> : <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded flex items-center gap-2"><ShieldCheck size={14}/> ORIGINAL (AOA)</span>}
                </div>
                <div className="flex gap-3">
                    <button onClick={() => printDocument('print-area')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 font-bold"><Printer size={18}/> Imprimir</button>
                    <button onClick={() => downloadPDF('print-area', `${printingInvoice.number}.pdf`)} className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded hover:bg-green-700 font-bold"><Download size={18}/> Baixar PDF</button>
                    <button onClick={() => setPrintingInvoice(null)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded hover:bg-slate-600"><X size={18}/> Fechar</button>
                </div>
            </div>
            <div id="print-area" className={`bg-white shadow-2xl my-8 p-12 relative flex flex-col justify-between ${isA4 ? 'w-[210mm] min-h-[297mm]' : is80mm ? 'w-[80mm] min-h-screen px-2' : 'w-full'}`}>
                
                {/* Print Copy Label Overlay */}
                {!is80mm && (
                    <div className="absolute top-20 right-12 z-10 pointer-events-none border border-slate-300 px-4 py-1 font-bold uppercase text-slate-400 text-xs tracking-widest bg-white/90 rounded-full shadow-sm">
                        {printCopyLabel}
                    </div>
                )}

                {/* ANULADO Watermark */}
                {printingInvoice.status === InvoiceStatus.CANCELLED && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-20 transform -rotate-45">
                        <div className="border-8 border-red-600 text-red-600 font-black text-[120px] p-10 rounded-xl">ANULADO</div>
                    </div>
                )}

                <div className="relative z-10">
                    <div className={`flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8 ${is80mm ? 'flex-col text-center' : ''}`}>
                        <div className="w-1/2 flex flex-col items-start pr-6">
                            <h1 className={`${is80mm ? 'text-lg' : 'text-2xl'} font-extrabold uppercase text-slate-900 leading-none mb-2`}>{currentCompany.name}</h1>
                            <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                                <p><span className="font-bold text-slate-800">Endereço:</span> {currentCompany.address}</p>
                                <p><span className="font-bold text-slate-800">NIF:</span> {currentCompany.nif}</p>
                                <p><span className="font-bold text-slate-800">Contacto:</span> {currentCompany.phone} | {currentCompany.email}</p>
                                <p><span className="font-bold text-slate-800">Regime:</span> {currentCompany.regime}</p>
                            </div>
                        </div>
                        <div className="w-1/2 flex flex-col items-end pl-6">
                             {seriesData?.logo || currentCompany.logo ? <img src={seriesData?.logo || currentCompany.logo} alt="Logo" className="h-24 object-contain mb-2" /> : <div className="h-24 w-24 bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold mb-2 border rounded">LOGO</div>}
                        </div>
                    </div>
                    
                    <div className={`flex ${is80mm ? 'flex-col gap-4' : 'justify-between gap-8'} mb-8`}>
                        <div className="w-full md:w-1/2">
                             <div className="border-l-4 border-slate-900 pl-4 py-1">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Exmo.(s) Sr.(s)</h2>
                                <h3 className="text-lg font-bold text-slate-900">{printingInvoice.clientName}</h3>
                                <div className="text-xs text-slate-600 mt-2 space-y-1">
                                     <p>NIF: <span className="font-bold">{printingInvoice.clientNif || 'Consumidor Final'}</span></p>
                                     <p>Endereço: {printingInvoice.clientId ? (workLocations[0]?.address || 'Luanda, Angola') : '-'}</p>
                                </div>
                             </div>
                        </div>
                        <div className="w-full md:w-1/2 flex flex-col items-end justify-center text-right">
                             <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                                {isDraftView ? 'DRAFT DOCUMENT' : printingInvoice.type === InvoiceType.FT ? 'Fatura' : printingInvoice.type === InvoiceType.FR ? 'Fatura/Recibo' : printingInvoice.type === InvoiceType.PP ? 'Pró-forma' : printingInvoice.type === InvoiceType.NC ? 'Nota de Crédito' : printingInvoice.type === InvoiceType.ND ? 'Nota de Débito' : printingInvoice.type}
                             </h1>
                             <p className="text-lg font-mono text-slate-500 font-bold mt-1">{(isDraftView || !printingInvoice.isCertified) ? '---------' : printingInvoice.number}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-5 border-y border-slate-200 py-3 mb-8 text-xs">
                        <div className="px-2 border-r border-slate-100"><span className="block text-slate-400 font-bold uppercase text-[10px]">Data Emissão</span><span className="font-bold text-slate-800">{formatDate(printingInvoice.date)}</span></div>
                        <div className="px-2 border-r border-slate-100"><span className="block text-slate-400 font-bold uppercase text-[10px]">Vencimento</span><span className="font-bold text-slate-800">{formatDate(printingInvoice.dueDate)}</span></div>
                        <div className="px-2 border-r border-slate-100 text-center"><span className="block text-slate-400 font-bold uppercase text-[10px]">Moeda</span><span className="font-bold text-slate-800">{displayCurrency}</span></div>
                        <div className="px-2 border-r border-slate-100 text-center"><span className="block text-slate-400 font-bold uppercase text-[10px]">Câmbio</span><span className="font-bold text-slate-800">{isMainDocForeign ? printingInvoice.exchangeRate : '1.00'}</span></div>
                        <div className="px-2 text-right"><span className="block text-slate-400 font-bold uppercase text-[10px]">Operador</span><span className="font-bold text-slate-800">{printingInvoice.operatorName || 'Admin'}</span></div>
                    </div>
                    
                    {isGuide && (
                        <div className="mb-8 border border-slate-200 rounded p-4 bg-slate-50 text-xs">
                            <h4 className="font-bold uppercase text-slate-700 mb-2 border-b border-slate-200 pb-1">Dados de Transporte</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div><span className="block text-slate-400 font-bold uppercase text-[10px]">Motorista</span><span className="font-bold text-slate-800">{printingInvoice.driverName || 'N/A'}</span></div>
                                <div><span className="block text-slate-400 font-bold uppercase text-[10px]">Matrícula</span><span className="font-bold text-slate-800">{printingInvoice.vehiclePlate || 'N/A'}</span></div>
                                <div><span className="block text-slate-400 font-bold uppercase text-[10px]">Armazém de Origem</span><span className="font-bold text-slate-800">{sourceWarehouseName}</span></div>
                                <div><span className="block text-slate-400 font-bold uppercase text-[10px]">Armazém de Destino</span><span className="font-bold text-slate-800">{targetWarehouseName}</span></div>
                                <div className="col-span-2"><span className="block text-slate-400 font-bold uppercase text-[10px]">Local de Entrega (Destino)</span><span className="font-bold text-slate-800">{printingInvoice.deliveryAddress || 'Endereço do Cliente'}</span></div>
                            </div>
                        </div>
                    )}
                    
                    <div className="mb-8">
                        <table className={`w-full ${is80mm ? 'text-[10px]' : 'text-xs'} border-collapse`}>
                            <thead className="border-b-2 border-slate-900 text-slate-900 uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="text-left py-3 w-16">Ref</th>
                                    <th className="text-left py-3">Descrição</th>
                                    <th className="text-center py-3 w-12">Qtd</th>
                                    <th className="text-center py-3 w-10">Un</th>
                                    {!is80mm && <th className="text-right py-3 w-24">Preço Unit.</th>}
                                    {!is80mm && <th className="text-center py-3 w-16">Desc%</th>}
                                    {!is80mm && <th className="text-center py-3 w-16">Taxa</th>}
                                    <th className="text-right py-3 w-28">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-700">
                                {printingInvoice.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                        <td className="py-3 font-mono text-slate-400">{item.reference || '-'}</td>
                                        <td className="py-3 font-medium">{item.description}</td>
                                        <td className="text-center py-3 font-bold">{item.quantity}</td>
                                        <td className="text-center py-3 text-slate-500">{item.unit || 'un'}</td>
                                        {!is80mm && <td className="text-right py-3">{formatVal(item.unitPrice)}</td>}
                                        {!is80mm && <td className="text-center py-3 text-slate-400">{item.discount > 0 ? `${item.discount}%` : '-'}</td>}
                                        {!is80mm && <td className="text-center py-3 text-slate-400">{item.taxRate > 0 ? `${item.taxRate}%` : 'ISE'}</td>}
                                        <td className="text-right py-3 font-bold text-slate-900">{formatVal(item.quantity * item.unitPrice * (1 - item.discount/100))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="mt-auto relative z-10">
                    {/* Validity Text for PP/OR */}
                    {isNoFiscalValidity && <div className="mb-6 p-2 border-2 border-dashed border-slate-400 text-center font-bold text-slate-500 uppercase text-xs">ESTE DOCUMENTO NÃO SERVE DE FATURA</div>}
                    
                    <div className="flex flex-col md:flex-row gap-8 border-t-2 border-slate-900 pt-6">
                        {!is80mm && (
                            <div className="w-7/12 space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-900 uppercase mb-2">Quadro Resumo de Impostos</h4>
                                    <table className="w-full text-[9px] text-left border border-slate-200">
                                        <thead className="bg-slate-100 font-bold text-slate-700">
                                            <tr>
                                                <th className="p-1.5 border-r border-slate-200">Taxa/Incidência</th>
                                                <th className="p-1.5 border-r border-slate-200 text-right">Base</th>
                                                <th className="p-1.5 border-r border-slate-200 text-right">Total IVA</th>
                                                <th className="p-1.5 text-right">Motivo Isenção / Obs</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(taxSummary).map(([rate, vals]) => (
                                                <tr key={rate} className="border-t border-slate-100">
                                                    <td className="p-1.5 border-r border-slate-200 font-bold">{Number(rate) === 0 ? 'Isento (0%)' : `IVA (${rate}%)`}</td>
                                                    <td className="p-1.5 border-r border-slate-200 text-right">{formatVal(vals.base)}</td>
                                                    <td className="p-1.5 border-r border-slate-200 text-right">{formatVal(vals.amount)}</td>
                                                    <td className="p-1.5 text-right italic text-slate-500">{Number(rate) === 0 ? 'Isento art. 12.º CST' : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="text-[10px] text-slate-600 space-y-1 bg-slate-50 p-3 rounded border border-slate-100">
                                    <p className="font-bold text-slate-800 border-b pb-1 mb-1">Regime de Retenção</p>
                                    {withholding > 0 ? (
                                        <div className="space-y-1">
                                            <div className="flex justify-between"><span>Valor Sujeito a Retenção:</span><span className="font-mono">{formatVal(printingInvoice.items.filter(i=>i.type==='SERVICE').reduce((a,b)=>a+b.total,0))}</span></div>
                                            <div className="flex justify-between font-bold text-blue-800"><span>Valor Retido (6.5%):</span><span className="font-mono">{formatVal(withholding)}</span></div>
                                            <div className="flex justify-between"><span>Valor Líquido:</span><span className="font-mono">{formatVal(totalFinal)}</span></div>
                                            <p className="text-[8px] italic mt-1">Nos termos do Dec. Presidencial nº 4/19</p>
                                        </div>
                                    ) : (
                                        <p>Isento de retenção — Lei 4/19, Art. 71, n.º 3, alínea c)</p>
                                    )}
                                </div>
                                {seriesData?.bankDetails && <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200"><span className="font-bold text-slate-800 uppercase block mb-1">Coordenadas Bancárias</span><pre className="font-sans whitespace-pre-line leading-relaxed">{seriesData.bankDetails}</pre></div>}
                            </div>
                        )}
                        <div className={`${is80mm ? 'w-full' : 'w-5/12'} space-y-3`}>
                            <div className="flex justify-between text-xs text-slate-600 border-b border-slate-100 pb-2"><span className="font-medium">Total Iliquido</span><span className="font-bold">{formatVal(totalIlíquido)}</span></div>
                            <div className="flex justify-between text-xs text-slate-600 border-b border-slate-100 pb-2"><span className="font-medium">Total Descontos</span><span className="font-bold text-red-500">{totalDescontos > 0 ? `- ${formatVal(totalDescontos)}` : '0.00'}</span></div>
                            <div className="flex justify-between text-xs text-slate-600 border-b border-slate-100 pb-2"><span className="font-medium">Total Imposto (IVA)</span><span className="font-bold">{formatVal(totalImposto)}</span></div>
                            
                            {/* WITHHOLDING TAX & RETENTION DISPLAY */}
                            {withholding > 0 && (
                                <div className="flex justify-between text-xs text-slate-600 border-b border-slate-100 pb-2">
                                    <span className="font-bold text-slate-700">Retenção na Fonte (6.5%)</span>
                                    <span className="font-bold text-red-600">- {formatVal(withholding)}</span>
                                </div>
                            )}
                            {retention > 0 && (
                                <div className="flex justify-between text-xs text-slate-600 border-b border-slate-100 pb-2">
                                    <span className="font-bold text-slate-700">Cativação IVA</span>
                                    <span className="font-bold text-red-600">- {formatVal(retention)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-4 border-t-2 border-slate-900 mt-2"><span className="font-black text-lg text-slate-900 uppercase">Total a Pagar</span><span className="font-black text-2xl text-slate-900 bg-slate-100 px-3 py-1 rounded">{formatVal(totalFinal)}</span></div>
                            <div className="text-right text-[10px] text-slate-400 italic mt-2 leading-tight">
                                {isMainDocForeign && !isDraftView ? numberToExtenso(totalFinal * exchangeRate, 'Kwanzas', 'Kwanza') : numberToExtenso(totalFinal, displayCurrency === 'USD' ? 'Dólares' : displayCurrency === 'EUR' ? 'Euros' : 'Kwanzas', displayCurrency === 'USD' ? 'Dólar' : displayCurrency === 'EUR' ? 'Euro' : 'Kwanza')}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
                        {!is80mm && (
                            <div className="flex gap-4 items-center">
                                <div className="border p-1 bg-white"><img src={generateQrCodeUrl(printingInvoice.hash || 'DRAFT')} alt="QR" className="w-16 h-16"/></div>
                                <div className="text-[8px] text-slate-400 space-y-0.5">
                                    <p className="font-mono font-bold text-slate-500 text-[10px]">{printingInvoice.hash ? `${printingInvoice.hash.substring(0,4)}-${printingInvoice.hash.substring(4,8)}-${printingInvoice.hash.substring(8,12)}-${printingInvoice.hash.substring(12,16)}` : 'PREVIEW / DRAFT MODE'}</p>
                                    <p>Processado por programa certificado nº 25/AGT/2019</p>
                                    <p>imatec soft V.2.0 | Software Certificado</p>
                                </div>
                            </div>
                        )}
                        <div className="text-right text-[9px] text-slate-400 flex flex-col items-end">
                             {seriesData?.footerLogo && <img src={seriesData.footerLogo} className="h-8 mb-1 object-contain" alt="Footer Logo"/>}
                             <p>{seriesData?.footerText || 'Documento processado por computador'}</p>
                             {seriesData?.footerAddress && <p>{seriesData.footerAddress}</p>}
                             {(seriesData?.footerEmail || seriesData?.footerPhone) && <p>{seriesData.footerEmail} | {seriesData.footerPhone}</p>}
                        </div>
                    </div>
                </div>
            </div>
             <style>{`@media print { body * { visibility: hidden; } .print-container, .print-container * { visibility: visible; } .print-container { position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: white; display: block; } @page { size: ${isA4 ? 'auto' : is80mm ? '80mm auto' : 'auto'}; margin: 5mm; } }`}</style>
        </div>
    );
  };

  const renderActionButtons = () => {
      if (!selectedActionInvoice) return null;

      const isCertified = selectedActionInvoice.isCertified;
      const isCancelled = selectedActionInvoice.status === InvoiceStatus.CANCELLED;
      const isForeignCurrency = selectedActionInvoice.currency && selectedActionInvoice.currency !== 'AOA';
      const isConvertible = (selectedActionInvoice.type === InvoiceType.PP || selectedActionInvoice.type === InvoiceType.OR) && isCertified;
      const canPerformOfficialAction = isCertified; 

      return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2 border-b pb-1">Gestão Documental</div>
                  <button onClick={() => handleEdit(selectedActionInvoice)} disabled={isCancelled} className="w-full p-2.5 bg-slate-50 text-slate-700 rounded-lg flex items-center gap-3 font-medium hover:bg-slate-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <Edit3 size={16}/> {isCertified ? 'Editar (Restrito)' : 'Editar Rascunho'}
                  </button>
                  <button onClick={() => handleViewAccount(selectedActionInvoice)} disabled={!canPerformOfficialAction} className="w-full p-2.5 bg-slate-50 text-slate-700 rounded-lg flex items-center gap-3 font-medium hover:bg-slate-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <User size={16}/> Ver Conta Corrente
                  </button>
                  <button onClick={() => initiateClone(selectedActionInvoice)} disabled={!canPerformOfficialAction} className="w-full p-2.5 bg-slate-50 text-slate-700 rounded-lg flex items-center gap-3 font-medium hover:bg-slate-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <Copy size={16}/> Clonar Documento
                  </button>
                  <button onClick={() => initiateCancel(selectedActionInvoice)} disabled={!canPerformOfficialAction || isCancelled} className="w-full p-2.5 bg-red-50 text-red-600 rounded-lg flex items-center gap-3 font-medium hover:bg-red-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <AlertTriangle size={16}/> Anular Documento
                  </button>
                  <button onClick={() => initiateDelete(selectedActionInvoice)} disabled={isCertified} className="w-full p-2.5 border border-red-100 text-red-500 rounded-lg flex items-center gap-3 font-medium hover:bg-red-50 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <Trash2 size={16}/> Apagar Rascunho
                  </button>
              </div>

              <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2 border-b pb-1">Impressão / Saída</div>
                  <div className="relative group">
                      <button onClick={() => handlePrint(selectedActionInvoice, 'A4', false, 'Original')} className="w-full p-2.5 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-between font-medium hover:bg-blue-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canPerformOfficialAction}>
                          <span className="flex items-center gap-3"><Printer size={16}/> Imprimir (Original)</span>
                          <ChevronDown size={16}/>
                      </button>
                      <div className="hidden group-hover:block absolute top-full left-0 w-full bg-white border border-slate-200 shadow-xl rounded-lg z-50 overflow-hidden mt-1">
                          <button onClick={() => handlePrint(selectedActionInvoice, 'A4', false, 'Original')} className="block w-full text-left p-2 hover:bg-slate-50 text-xs font-medium">Imprimir Original</button>
                          <button onClick={() => handlePrint(selectedActionInvoice, 'A4', false, 'Duplicado')} className="block w-full text-left p-2 hover:bg-slate-50 text-xs font-medium">Imprimir Duplicado</button>
                          <button onClick={() => handlePrint(selectedActionInvoice, 'A4', false, 'Triplicado')} className="block w-full text-left p-2 hover:bg-slate-50 text-xs font-medium">Imprimir Triplicado</button>
                          <button onClick={() => handlePrint(selectedActionInvoice, 'A4', false, '2ª Via')} className="block w-full text-left p-2 hover:bg-slate-50 text-xs font-medium text-blue-600 font-bold">Imprimir 2ª Via</button>
                      </div>
                  </div>
                  {isForeignCurrency && (
                    <button onClick={() => handlePrint(selectedActionInvoice, 'A4', true)} disabled={!canPerformOfficialAction} className="w-full p-2.5 bg-yellow-50 text-yellow-700 rounded-lg flex items-center gap-3 font-medium hover:bg-yellow-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            <FileText size={16}/> Visualizar Draft ({selectedActionInvoice.currency})
                    </button>
                  )}
                  <button onClick={() => { downloadPDF("invoiceTable", `${selectedActionInvoice.number}.pdf`) }} disabled={!canPerformOfficialAction} className="w-full p-2.5 bg-slate-50 text-slate-700 rounded-lg flex items-center gap-3 font-medium hover:bg-slate-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <Download size={16}/> Baixar PDF
                  </button>
                  <button onClick={() => handleExcelExport(selectedActionInvoice)} disabled={!canPerformOfficialAction} className="w-full p-2.5 bg-slate-50 text-slate-700 rounded-lg flex items-center gap-3 font-medium hover:bg-slate-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <FileSpreadsheet size={16}/> Exportar para Excel
                  </button>
                  {/* Re-upload Option */}
                  <button onClick={() => handleUploadClick(selectedActionInvoice, true)} className="w-full p-2.5 bg-slate-50 text-slate-700 rounded-lg flex items-center gap-3 font-medium hover:bg-slate-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <Upload size={16}/> Atualizar Anexo
                  </button>
              </div>

              <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2 border-b pb-1">Financeiro / Emissão</div>
                  {!isCertified && !isCancelled && (
                       <button onClick={() => initiateCertify(selectedActionInvoice)} className="w-full p-2.5 bg-orange-500 text-white rounded-lg flex items-center gap-3 font-bold hover:bg-orange-600 transition text-sm animate-pulse shadow-lg shadow-orange-500/30">
                            <ShieldCheck size={16}/> Certificar Documento
                      </button>
                  )}
                  {isConvertible && !isCancelled && (
                      <button onClick={() => initiateConvert(selectedActionInvoice)} className="w-full p-2.5 bg-green-600 text-white rounded-lg flex items-center gap-3 font-bold hover:bg-green-700 transition text-sm shadow-md">
                          <RefreshCw size={16}/> Converter em Fatura
                      </button>
                  )}
                  <button onClick={() => initiateLiquidate(selectedActionInvoice)} disabled={!canPerformOfficialAction} className="w-full p-2.5 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-3 font-medium hover:bg-emerald-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <DollarSign size={16}/> Emitir Recibo
                  </button>
                  <button onClick={() => onCreateDerived(selectedActionInvoice, InvoiceType.NC)} disabled={isCancelled || !canPerformOfficialAction} className="w-full p-2.5 bg-purple-50 text-purple-700 rounded-lg flex items-center gap-3 font-medium hover:bg-purple-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <ArrowRightLeft size={16}/> Emitir Nota de Credito
                  </button>
                  <button onClick={() => onCreateDerived(selectedActionInvoice, InvoiceType.ND)} disabled={!isCertified || isCancelled} className="w-full p-2.5 bg-indigo-50 text-indigo-700 rounded-lg flex items-center gap-3 font-medium hover:bg-indigo-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <FilePlus size={16}/> Emitir Nota de Débito
                  </button>
                  <div className="pt-2 mt-2 border-t border-slate-100">
                      <button onClick={() => handleEmail(selectedActionInvoice)} disabled={!canPerformOfficialAction} className="w-full p-2.5 hover:bg-slate-50 text-slate-600 rounded-lg flex items-center gap-3 font-medium transition text-sm mb-1 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Mail size={16}/> Enviar Documento por Email
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // Upload Viewer Modal
  const renderUploadViewer = () => {
      if(!viewingUpload) return null;
      return (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-100 rounded-t-lg">
                      <h3 className="font-bold">Visualizar Anexo</h3>
                      <button onClick={() => setViewingUpload(null)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 bg-slate-50 flex justify-center items-center">
                      <img src={viewingUpload} alt="Anexo" className="max-w-full max-h-full object-contain shadow-lg"/>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {printingInvoice && renderPrintPreview()}
      {viewingUpload && renderUploadViewer()}
      
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      {convertModalOpen && selectedActionInvoice && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><RefreshCw size={20}/> Faturar Documento</h3>
                  <div className="space-y-2 mb-4">
                      <button onClick={() => setTargetConvertType(InvoiceType.FT)} className={`w-full p-3 rounded-lg border text-left font-bold ${targetConvertType === InvoiceType.FT ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-slate-50'}`}>Fatura (FT)</button>
                      <button onClick={() => setTargetConvertType(InvoiceType.FR)} className={`w-full p-3 rounded-lg border text-left font-bold ${targetConvertType === InvoiceType.FR ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-slate-50'}`}>Fatura / Recibo (FR)</button>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => setConvertModalOpen(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
                      <button onClick={confirmConvert} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Confirmar</button>
                  </div>
              </div>
          </div>
      )}

      {cloneModalOpen && selectedActionInvoice && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Copy size={20}/> Clonar Documento</h3>
                  <p className="text-sm text-slate-500 mb-4">Selecione o tipo de documento de destino:</p>
                  <div className="space-y-2 mb-4">
                      <button onClick={() => setTargetCloneType(InvoiceType.FT)} className={`w-full p-3 rounded-lg border text-left font-bold ${targetCloneType === InvoiceType.FT ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-slate-50'}`}>Fatura (FT)</button>
                      <button onClick={() => setTargetCloneType(InvoiceType.FR)} className={`w-full p-3 rounded-lg border text-left font-bold ${targetCloneType === InvoiceType.FR ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-slate-50'}`}>Fatura / Recibo (FR)</button>
                      <button onClick={() => setTargetCloneType(InvoiceType.PP)} className={`w-full p-3 rounded-lg border text-left font-bold ${targetCloneType === InvoiceType.PP ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-slate-50'}`}>Fatura Pró-Forma (PP)</button>
                      <button onClick={() => setTargetCloneType(InvoiceType.OR)} className={`w-full p-3 rounded-lg border text-left font-bold ${targetCloneType === InvoiceType.OR ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-slate-50'}`}>Orçamento (OR)</button>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => setCloneModalOpen(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
                      <button onClick={confirmClone} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Clonar</button>
                  </div>
              </div>
          </div>
      )}

      {/* ... Liquidate, Certify, Cancel, Delete, Actions Modals ... */}
      {liquidateModalOpen && selectedActionInvoice && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
               <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                    <div className="bg-emerald-600 text-white p-4">
                        <h3 className="font-bold flex items-center gap-2"><Receipt size={20}/> Emitir Recibo / Pagamento</h3>
                        <p className="text-emerald-100 text-xs">Doc: {selectedActionInvoice.number}</p>
                    </div>
                    <div className="p-6 space-y-4">
                         <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-center">
                             <div className="text-xs text-emerald-600 uppercase font-bold">Valor por Liquidar</div>
                             <div className="text-2xl font-bold text-emerald-700">{formatCurrency(selectedActionInvoice.total - (selectedActionInvoice.paidAmount || 0))}</div>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Valor a Pagar Agora</label>
                             <input type="number" className="w-full p-3 border border-slate-300 rounded-lg font-bold text-lg" value={liquidateData.amount} onChange={e => setLiquidateData({...liquidateData, amount: Number(e.target.value)})} />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Forma de Pagamento</label>
                             <select className="w-full p-3 border border-slate-300 rounded-lg" value={liquidateData.method} onChange={e => setLiquidateData({...liquidateData, method: e.target.value as PaymentMethod})}>
                                 <option value="">Selecione...</option>
                                 <option value="CASH">Numerário</option>
                                 <option value="MULTICAIXA">Multicaixa</option>
                                 <option value="TRANSFER">Transferência</option>
                             </select>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Caixa de Destino</label>
                             <select className="w-full p-3 border border-slate-300 rounded-lg" value={liquidateData.registerId} onChange={e => setLiquidateData({...liquidateData, registerId: e.target.value})}>
                                 <option value="">Selecione Caixa...</option>
                                 {cashRegisters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                             </select>
                         </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                        <button onClick={() => setLiquidateModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-white border rounded-lg">Cancelar</button>
                        <button onClick={handleConfirmLiquidate} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">Confirmar Pagamento</button>
                    </div>
               </div>
          </div>
      )}

      {certifyModalOpen && invoiceToCertify && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
               <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                    <h3 className="text-xl font-bold text-indigo-600 mb-2 flex items-center gap-2"><ShieldCheck/> Certificar Documento</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        Atenção: Ao certificar, o documento será trancado, assinado digitalmente e não poderá ser apagado (apenas anulado).
                    </p>
                    <div className="flex gap-2">
                         <button onClick={() => setCertifyModalOpen(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
                         <button onClick={confirmCertify} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Confirmar</button>
                    </div>
               </div>
          </div>
      )}

      {cancelModalOpen && invoiceToCancel && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2"><AlertTriangle/> Anular Documento</h3>
                  <p className="text-sm text-slate-600 mb-4">Tem a certeza? Será gerada uma Nota de Crédito/Débito para anular o efeito financeiro.</p>
                  <textarea 
                      className="w-full p-3 border rounded-lg mb-4 h-24 text-sm"
                      placeholder="Motivo da anulação (Obrigatório)..."
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                      <button onClick={() => setCancelModalOpen(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
                      <button onClick={confirmCancel} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold">Confirmar Anulação</button>
                  </div>
              </div>
          </div>
      )}

       {deleteModalOpen && invoiceToDelete && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 text-center">
                  <h3 className="text-xl font-bold text-red-600 mb-2">Apagar Rascunho?</h3>
                  <p className="text-sm text-slate-600 mb-4">Esta ação é irreversível.</p>
                  <div className="flex gap-2 justify-center">
                      <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                      <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold">Apagar</button>
                  </div>
              </div>
          </div>
      )}

      {actionModalOpen && selectedActionInvoice && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                    <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2"><FileText size={24}/> {selectedActionInvoice.type} {selectedActionInvoice.number}</h2>
                            <p className="text-slate-400 text-xs mt-1">
                                {selectedActionInvoice.clientName} • {formatCurrency(selectedActionInvoice.total)} • 
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold text-slate-900 ${getStatusColor(selectedActionInvoice).split(' ')[0]}`}>
                                    {getStatusText(selectedActionInvoice)}
                                </span>
                            </p>
                        </div>
                        <button onClick={closeActions} className="hover:bg-slate-800 p-2 rounded-full transition"><X/></button>
                    </div>
                    <div className="p-6">
                         {renderActionButtons()}
                    </div>
               </div>
          </div>
      )}

      {showBusinessOverview && (
          <BusinessOverviewModal 
              isOpen={showBusinessOverview}
              onClose={() => setShowBusinessOverview(false)}
              onBack={() => setShowBusinessOverview(false)}
              invoices={invoices}
              purchases={purchases}
          />
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Faturas e Vendas</h1>
          <p className="text-xs text-slate-500">Gestão de documentos de clientes</p>
        </div>
        <div className="flex gap-2">
             <button onClick={onCreateNew} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition font-medium">
                 <PlusCircle size={16} /> Nova Fatura
             </button>
             <button onClick={onViewReports} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded text-sm hover:bg-slate-200 transition font-medium">
                 <PieChart size={16} /> Relatórios
             </button>
             <button onClick={() => setShowBusinessOverview(true)} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition font-medium shadow-md">
                 <BarChart size={16} /> Visão Geral do Negócio
             </button>
             <button onClick={() => handleExcelExport()} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition font-medium">
                 <Download size={16} /> Excel
             </button>
        </div>
      </div>

      <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 flex flex-wrap items-end gap-3 text-sm">
         <div className="flex-1 min-w-[200px]">
             <label className="block text-xs font-bold text-slate-500 mb-1">Pesquisa Geral</label>
             <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Cliente, Nº Doc..." 
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
         </div>
         <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">Série</label>
             <select className="py-1.5 px-2 border border-slate-300 rounded w-32 outline-none" value={seriesFilter} onChange={e => setSeriesFilter(e.target.value)}>
                 <option value="ALL">Todas</option>
                 {series.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
             </select>
         </div>
         <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">Estado</label>
             <select className="py-1.5 px-2 border border-slate-300 rounded w-32 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                 <option value="ALL">Todos</option>
                 <option value={InvoiceStatus.PAID}>Pago</option>
                 <option value={InvoiceStatus.PENDING}>Pendente</option>
                 <option value={InvoiceStatus.DRAFT}>Rascunho</option>
             </select>
         </div>
         <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
             <select className="py-1.5 px-2 border border-slate-300 rounded w-32 outline-none" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                 <option value="ALL">Todos</option>
                 {Object.values(InvoiceType).map(t => <option key={t} value={t}>{t}</option>)}
             </select>
         </div>
         <button className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 flex items-center gap-1 font-bold" onClick={() => {setSearchTerm(''); setStatusFilter('ALL'); setTypeFilter('ALL'); setSeriesFilter('ALL');}}>
             <Filter size={14}/> Limpar
         </button>
      </div>

      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden" id="invoiceTable">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-700 text-white font-semibold">
              <tr>
                <th className="px-4 py-2 w-24">Data</th>
                <th className="px-4 py-2 w-20">Tipo</th>
                <th className="px-4 py-2 w-32">Número</th>
                <th className="px-4 py-2">Cliente / Ref</th>
                <th className="px-4 py-2 w-24">Loja/Local</th>
                <th className="px-4 py-2 w-24">Caixa</th>
                <th className="px-4 py-2 w-28 text-right">Total</th>
                <th className="px-4 py-2 w-24 text-center">Estado</th>
                <th className="px-4 py-2 w-28 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredInvoices.map((invoice) => {
                  const { children, parent } = getRelatedDocuments(invoice.id, invoice);
                  const isCancelled = invoice.status === InvoiceStatus.CANCELLED;
                  
                  return (
                  <tr key={invoice.id} className="hover:bg-blue-50 transition-colors">
                    <td className={`px-4 py-2 ${isCancelled ? 'text-red-600' : ''}`}>{formatDate(invoice.date)}</td>
                    <td className="px-4 py-2 font-bold text-slate-600">{invoice.type}</td>
                    <td className={`px-4 py-2 font-medium ${isCancelled ? 'text-red-600 line-through' : 'text-blue-600'}`}>
                        <div className="flex items-center gap-1">
                            {invoice.isCertified && <Lock size={10} className="text-slate-400"/>}
                            {invoice.number}
                        </div>
                    </td>
                    <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                            {invoice.clientName}
                            {isCancelled && <span className="text-[10px] font-bold text-red-600 uppercase border border-red-200 bg-red-50 px-1 rounded">ANULADO</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 flex flex-wrap gap-2">
                            <span>{invoice.clientNif || '-'}</span>
                            {parent && (
                                <span className="bg-slate-100 px-1 rounded text-slate-500 flex items-center gap-1">
                                    <Link size={10}/> Ref: {parent.number}
                                </span>
                            )}
                            {children.length > 0 && children.map(child => (
                                <span key={child.id} className="bg-green-50 text-green-700 px-1 rounded flex items-center gap-1">
                                    <Link size={10}/> {child.type === InvoiceType.RG ? 'Liq:' : child.type === InvoiceType.GE ? 'Guia:' : 'Ref:'} {child.number}
                                </span>
                            ))}
                        </div>
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                        {workLocations.find(w => w.id === invoice.workLocationId)?.name || '-'}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                        {cashRegisters.find(c => c.id === invoice.cashRegisterId)?.name || '-'}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-slate-900">
                        {invoice.currency && invoice.currency !== 'AOA' ? (
                            <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: invoice.currency }).format(invoice.total)}</span>
                        ) : (
                            formatCurrency(invoice.total)
                        )}
                    </td>
                    <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(invoice)}`}>
                            {getStatusText(invoice)}
                        </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center gap-1">
                          {invoice.isCertified && (
                            <button onClick={() => handlePrint(invoice, 'A4', false, '2ª Via')} className="p-1 text-blue-500 hover:text-blue-700 bg-blue-50 rounded" title="Imprimir 2ª Via">
                                <Printer size={14} />
                            </button>
                          )}
                          <button onClick={() => handleUploadClick(invoice)} className={`p-1 rounded ${invoice.attachment ? 'text-green-600' : 'text-slate-400 hover:text-blue-600'}`} title="Anexo / Upload">
                              {invoice.attachment ? <FileCheck size={14} /> : <Upload size={14} />}
                          </button>
                          <button onClick={() => openActions(invoice)} className="p-1 text-slate-400 hover:text-blue-600" title="Mais Ações">
                            <MoreHorizontal size={14} />
                          </button>
                      </div>
                    </td>
                  </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;
