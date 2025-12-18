
import React, { useState, useRef } from 'react';
import { Product, Warehouse, StockMovement, PriceTable, ServicePrice, InvoiceType } from '../types';
import { formatCurrency, formatDate, generateId, exportToExcel } from '../utils';
import { Package, TrendingUp, AlertTriangle, Plus, Trash2, ArrowRightLeft, History, Box, Tag, DollarSign, Archive, Search, Truck, FileText, Printer, Download, Upload, Image as ImageIcon, Percent, MoreHorizontal, Edit2, X, MapPin, BarChart3, Layers, Database } from 'lucide-react';

interface StockManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  warehouses: Warehouse[];
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  priceTables: PriceTable[];
  setPriceTables: React.Dispatch<React.SetStateAction<PriceTable[]>>;
  movements: StockMovement[];
  onStockMovement: (movement: StockMovement) => void;
  onCreateDocument: (type: InvoiceType, items: any[], notes: string) => void;
  onOpenReportOverlay: () => void;
}

const StockManager: React.FC<StockManagerProps> = ({ 
  products, setProducts, warehouses, setWarehouses, 
  priceTables, setPriceTables, movements, onStockMovement, onCreateDocument, onOpenReportOverlay
}) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PRODUCTS' | 'SERVICES' | 'WAREHOUSES' | 'MOVEMENTS'>('DASHBOARD');
  
  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showPriceTableModal, setShowPriceTableModal] = useState(false);

  // Forms
  const [newPriceTable, setNewPriceTable] = useState<Partial<PriceTable>>({});
  const [editingPriceTableId, setEditingPriceTableId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({});
  const [newWarehouse, setNewWarehouse] = useState<Partial<Warehouse>>({});
  const [newMovement, setNewMovement] = useState<Partial<StockMovement>>({ type: 'ADJUSTMENT' });
  const [guideData, setGuideData] = useState({ type: InvoiceType.GR, products: [] as string[] });
  
  // Bulk Insert Form
  const [bulkText, setBulkText] = useState('');

  // Stats
  const totalStockValue = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
  const lowStockItems = products.filter(p => p.stock <= p.minStock);
  const totalItems = products.length;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploadProductId, setImageUploadProductId] = useState<string | null>(null);

  // Handlers
  const handleSaveProduct = () => {
      if (!newProduct.name || !newProduct.price) return alert("Nome e Preço obrigatórios");
      const product: Product = {
          id: generateId(),
          name: newProduct.name!,
          costPrice: newProduct.costPrice || 0,
          price: newProduct.price!,
          unit: newProduct.unit || 'un',
          category: newProduct.category || 'Geral',
          stock: newProduct.stock || 0,
          warehouseId: newProduct.warehouseId || warehouses[0]?.id || '',
          priceTableId: newProduct.priceTableId || priceTables[0]?.id || '',
          minStock: newProduct.minStock || 5,
          imageUrl: newProduct.imageUrl
      };
      setProducts([...products, product]);
      setShowProductModal(false);
      setNewProduct({});
  };

  const handleBulkInsert = () => {
      // Format: Name, Price, Cost, Stock
      const lines = bulkText.trim().split('\n');
      const addedProducts: Product[] = [];
      
      lines.forEach(line => {
          const parts = line.split(',');
          if (parts.length >= 2) {
              addedProducts.push({
                  id: generateId(),
                  name: parts[0].trim(),
                  price: Number(parts[1].trim()) || 0,
                  costPrice: Number(parts[2]?.trim()) || 0,
                  stock: Number(parts[3]?.trim()) || 0,
                  unit: 'un',
                  category: 'Geral',
                  warehouseId: warehouses[0]?.id || '',
                  priceTableId: priceTables[0]?.id || '',
                  minStock: 5
              });
          }
      });

      if(addedProducts.length > 0) {
          setProducts([...products, ...addedProducts]);
          setShowBulkModal(false);
          setBulkText('');
          alert(`${addedProducts.length} produtos adicionados!`);
      } else {
          alert("Formato inválido. Use: Nome, Preço, Custo, Stock");
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && imageUploadProductId) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              setProducts(products.map(p => p.id === imageUploadProductId ? { ...p, imageUrl: reader.result as string } : p));
              setImageUploadProductId(null);
          };
          reader.readAsDataURL(file);
      }
  };

  const triggerImageUpload = (id: string) => {
      setImageUploadProductId(id);
      fileInputRef.current?.click();
  };

  const handleSaveWarehouse = () => {
      if (!newWarehouse.name) return alert("Nome obrigatório");
      setWarehouses([...warehouses, { id: generateId(), name: newWarehouse.name!, location: newWarehouse.location || '' }]);
      setShowWarehouseModal(false);
      setNewWarehouse({});
  };

  const handleSaveMovement = () => {
      if (!newMovement.productId || !newMovement.quantity || !newMovement.warehouseId) return alert("Preencha produto, qtd e armazém");
      
      const movement: StockMovement = {
          id: generateId(),
          date: new Date().toISOString(),
          type: newMovement.type || 'ADJUSTMENT',
          productId: newMovement.productId!,
          productName: products.find(p => p.id === newMovement.productId)?.name || '',
          quantity: newMovement.quantity!,
          warehouseId: newMovement.warehouseId!,
          targetWarehouseId: newMovement.targetWarehouseId,
          notes: newMovement.notes
      };

      onStockMovement(movement);
      
      const productIndex = products.findIndex(p => p.id === movement.productId);
      if (productIndex >= 0) {
          const updatedProducts = [...products];
          const product = updatedProducts[productIndex];
          if (movement.type === 'ENTRY') product.stock += movement.quantity;
          else if (movement.type === 'EXIT') product.stock -= movement.quantity;
          else if (movement.type === 'TRANSFER') product.stock -= movement.quantity; 
          else if (movement.type === 'ADJUSTMENT') product.stock = movement.quantity; 
          setProducts(updatedProducts);
      }
      setShowMovementModal(false);
      setNewMovement({ type: 'ADJUSTMENT' });
  };

  const handleIssueGuide = () => {
      if (guideData.products.length === 0) return alert("Selecione produtos para a guia");
      const itemsToGuide = guideData.products.map(pId => {
          const prod = products.find(p => p.id === pId);
          return { description: prod?.name || 'Item', quantity: 1, unitPrice: prod?.price || 0 };
      });
      onCreateDocument(guideData.type, itemsToGuide, "Emitido a partir do Stock");
      setShowGuideModal(false);
      setGuideData({ type: InvoiceType.GR, products: [] });
  };

  const handleSavePriceTable = () => {
      if(!newPriceTable.name) return alert("Nome obrigatório");
      if (editingPriceTableId) {
          setPriceTables(priceTables.map(t => t.id === editingPriceTableId ? { ...t, name: newPriceTable.name!, percentage: newPriceTable.percentage || 0 } : t));
          setEditingPriceTableId(null);
      } else {
          setPriceTables([...priceTables, { id: generateId(), name: newPriceTable.name!, percentage: newPriceTable.percentage || 0 }]);
      }
      setShowPriceTableModal(false);
      setNewPriceTable({});
  };

  const handleEditPriceTable = (table: PriceTable) => {
      setNewPriceTable({ name: table.name, percentage: table.percentage });
      setEditingPriceTableId(table.id);
      setShowPriceTableModal(true);
  }

  const handleDeletePriceTable = (id: string) => {
      if(window.confirm("Apagar tabela?")) setPriceTables(priceTables.filter(t => t.id !== id));
  };

  const handleDownloadReport = () => {
      const data = products.map(p => ({
          Nome: p.name,
          Categoria: p.category,
          Stock: p.stock,
          Custo: p.costPrice,
          ValorTotal: p.stock * p.costPrice,
          Armazem: warehouses.find(w => w.id === p.warehouseId)?.name
      }));
      exportToExcel(data, "Relatorio_Stock_Geral");
  };

  const handlePrintPriceTable = () => {
      const printContent = document.getElementById('printable-price-table');
      if (printContent) {
          const originalContents = document.body.innerHTML;
          document.body.innerHTML = printContent.innerHTML;
          window.print();
          document.body.innerHTML = originalContents;
          window.location.reload(); // Simple reload to restore state
      }
  }

  return (
    <div className="space-y-6 animate-in fade-in relative">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

        {/* Header with Report Overlay Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div>
                 <h1 className="text-xl font-bold text-slate-800">Gestão de Stock</h1>
                 <p className="text-xs text-slate-500">Controlo de inventário e armazéns</p>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                {['DASHBOARD', 'PRODUCTS', 'SERVICES', 'WAREHOUSES', 'MOVEMENTS'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)} 
                        className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap text-sm border ${activeTab === tab ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        {tab === 'DASHBOARD' ? 'Dash' : tab === 'PRODUCTS' ? 'Produtos' : tab === 'SERVICES' ? 'Preços' : tab === 'WAREHOUSES' ? 'Armazéns' : 'Movs'}
                    </button>
                ))}
                
                <div className="h-6 w-px bg-slate-300 mx-1"></div>
                
                <button 
                    onClick={onOpenReportOverlay} 
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm whitespace-nowrap"
                    title="Abrir Relatórios (Overlay)"
                >
                    <BarChart3 size={16}/> <span className="hidden sm:inline">Relatórios</span>
                </button>
            </div>
        </div>

        {activeTab === 'DASHBOARD' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Valor Total Stock</p>
                            <h3 className="text-2xl font-black text-slate-800">{formatCurrency(totalStockValue)}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={24}/></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total de Artigos</p>
                            <h3 className="text-2xl font-black text-slate-800">{totalItems}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Package size={24}/></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Alertas Stock Baixo</p>
                            <h3 className="text-2xl font-black text-red-600">{lowStockItems.length}</h3>
                        </div>
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg animate-pulse"><AlertTriangle size={24}/></div>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <button onClick={() => window.print()} className="bg-white border p-4 rounded-xl flex items-center gap-2 hover:bg-slate-50 text-sm font-bold">
                        <Printer size={20}/> Imprimir Relatório
                    </button>
                    <button onClick={handleDownloadReport} className="bg-white border p-4 rounded-xl flex items-center gap-2 hover:bg-slate-50 text-sm font-bold">
                        <Download size={20}/> Baixar Excel
                    </button>
                    <button onClick={() => setShowGuideModal(true)} className="bg-white border p-4 rounded-xl flex items-center gap-2 hover:bg-slate-50 text-blue-600 font-bold text-sm">
                        <Truck size={20}/> Emitir Guia (Stock)
                    </button>
                </div>

                {lowStockItems.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h3 className="font-bold text-red-700 flex items-center gap-2 mb-2"><AlertTriangle size={18}/> Produtos com Stock Crítico</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {lowStockItems.map(p => (
                                <div key={p.id} className="bg-white p-2 rounded border border-red-100 flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-700">{p.name}</span>
                                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-xs">{p.stock} un</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Hidden Table for Printing */}
        <div id="printable-price-table" className="hidden">
             <div className="p-8">
                 <h1 className="text-2xl font-bold mb-4">Tabela de Preços Geral</h1>
                 <table className="w-full text-left border-collapse border">
                     <thead>
                         <tr>
                             <th className="border p-2">Produto</th>
                             <th className="border p-2">Categoria</th>
                             <th className="border p-2 text-right">Preço Unit.</th>
                         </tr>
                     </thead>
                     <tbody>
                         {products.map(p => (
                             <tr key={p.id}>
                                 <td className="border p-2">{p.name}</td>
                                 <td className="border p-2">{p.category}</td>
                                 <td className="border p-2 text-right">{formatCurrency(p.price)}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>

        {activeTab === 'PRODUCTS' && (
            <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
                <div className="p-4 flex justify-between items-center bg-slate-100 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-700">Lista Geral de Produtos</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrintPriceTable} className="bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-slate-50">
                            <Printer size={16}/> Tabela de Preços
                        </button>
                        <button onClick={() => setShowBulkModal(true)} className="bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-slate-50">
                            <Database size={16}/> Inserção a Grosso
                        </button>
                        <button onClick={() => setShowProductModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold">
                            <Plus size={16}/> Novo Produto
                        </button>
                    </div>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-700 text-white font-semibold">
                        <tr>
                            <th className="p-3">Imagem</th>
                            <th className="p-3">Nome</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3 text-right">Custo</th>
                            <th className="p-3 text-right">Preço Venda</th>
                            <th className="p-3 text-center">Stock</th>
                            <th className="p-3">Armazém</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                        {products.map(p => (
                            <tr key={p.id} className="hover:bg-blue-50 group">
                                <td className="p-3">
                                    <div 
                                        className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden cursor-pointer flex items-center justify-center hover:opacity-80"
                                        onClick={() => triggerImageUpload(p.id)}
                                        title="Alterar Imagem"
                                    >
                                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover"/> : <ImageIcon size={16} className="text-slate-400"/>}
                                    </div>
                                </td>
                                <td className="p-3 font-medium">{p.name}</td>
                                <td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{p.category}</span></td>
                                <td className="p-3 text-right">{formatCurrency(p.costPrice)}</td>
                                <td className="p-3 text-right font-bold text-green-600">{formatCurrency(p.price)}</td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 rounded font-bold ${p.stock <= p.minStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {p.stock} {p.unit}
                                    </span>
                                </td>
                                <td className="p-3">{warehouses.find(w => w.id === p.warehouseId)?.name || 'N/A'}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => { setNewMovement({productId: p.id, type: 'TRANSFER'}); setShowMovementModal(true); }} className="text-blue-500 hover:text-blue-700 text-xs font-bold border border-blue-200 px-2 py-1 rounded">
                                        Mover
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* ... Rest of existing tabs (SERVICES, WAREHOUSES, MOVEMENTS) remain the same ... */}
        {activeTab === 'SERVICES' && (
             <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
                <div className="p-4 flex justify-between items-center bg-slate-100 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-700">Tabelas de Preço</h2>
                    <button onClick={() => setShowPriceTableModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold"><Plus size={16}/> Nova Tabela</button>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {priceTables.map(t => (
                            <div key={t.id} className="bg-slate-50 border rounded-xl p-4 hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-800">{t.name}</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditPriceTable(t)} className="text-slate-400 hover:text-blue-600"><Edit2 size={16}/></button>
                                        <button onClick={() => handleDeletePriceTable(t.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-blue-600 mb-2">{t.percentage}% <span className="text-xs text-slate-400 font-normal">Margem Lucro</span></div>
                                <p className="text-xs text-slate-500">Aplicada a {products.filter(p => p.priceTableId === t.id).length} produtos</p>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        )}

        {activeTab === 'WAREHOUSES' && (
             <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
                <div className="p-4 flex justify-between items-center bg-slate-100 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-700">Armazéns</h2>
                    <button onClick={() => setShowWarehouseModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold"><Plus size={16}/> Novo Armazém</button>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-700 text-white font-semibold">
                        <tr>
                            <th className="p-3">Nome</th>
                            <th className="p-3">Localização</th>
                            <th className="p-3 text-right">Total Artigos</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                        {warehouses.map(w => (
                            <tr key={w.id} className="hover:bg-slate-50">
                                <td className="p-3 font-bold">{w.name}</td>
                                <td className="p-3">{w.location}</td>
                                <td className="p-3 text-right">{products.filter(p => p.warehouseId === w.id).length}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        )}

        {activeTab === 'MOVEMENTS' && (
            <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-100 border-b border-slate-200"><h2 className="text-sm font-bold text-slate-700">Histórico Completo</h2></div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-700 text-white font-semibold">
                        <tr>
                            <th className="p-3">Data</th>
                            <th className="p-3">Tipo</th>
                            <th className="p-3">Produto</th>
                            <th className="p-3 text-right">Qtd</th>
                            <th className="p-3">Origem</th>
                            <th className="p-3">Destino</th>
                            <th className="p-3">Ref Doc</th>
                            <th className="p-3">Obs</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                        {movements.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50">
                                <td className="p-3">{formatDate(m.date)}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${m.type === 'ENTRY' ? 'bg-green-100 text-green-700' : m.type === 'EXIT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {m.type}
                                    </span>
                                </td>
                                <td className="p-3">{m.productName}</td>
                                <td className="p-3 text-right font-bold">{m.quantity}</td>
                                <td className="p-3">{warehouses.find(w => w.id === m.warehouseId)?.name}</td>
                                <td className="p-3">{m.targetWarehouseId ? warehouses.find(w => w.id === m.targetWarehouseId)?.name : '-'}</td>
                                <td className="p-3 font-mono text-xs text-blue-600">{m.documentRef || '-'}</td>
                                <td className="p-3 text-slate-500 text-xs">{m.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
        
        {/* Bulk Insert Modal */}
        {showBulkModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                    <div className="bg-slate-900 text-white p-5 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Database size={20}/> Inserção de Produtos a Grosso</h3>
                        <button onClick={() => setShowBulkModal(false)} className="hover:bg-slate-800 p-1 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-slate-600 mb-2">Cole os dados no formato: <b>Nome, Preço Venda, Preço Custo, Stock</b> (uma linha por produto)</p>
                        <textarea 
                            className="w-full h-64 border rounded-lg p-4 font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder={"Produto A, 2000, 1500, 50\nProduto B, 5000, 3000, 10"}
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 p-5 bg-slate-50 border-t">
                        <button onClick={() => setShowBulkModal(false)} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-white transition-colors">Cancelar</button>
                        <button onClick={handleBulkInsert} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg">Processar Inserção</button>
                    </div>
                </div>
            </div>
        )}

        {/* Product Modal */}
        {showProductModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                    <div className="bg-slate-900 text-white p-5 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Package size={20}/> Novo Produto</h3>
                        <button onClick={() => setShowProductModal(false)} className="hover:bg-slate-800 p-1 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="p-8 grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                             <label className="text-xs font-bold text-slate-500 uppercase">Nome do Produto</label>
                             <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Nome" onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Preço Custo</label>
                             <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" type="number" placeholder="0.00" onChange={e => setNewProduct({...newProduct, costPrice: Number(e.target.value)})} />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Preço Venda</label>
                             <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" type="number" placeholder="0.00" onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Stock Inicial</label>
                             <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" type="number" placeholder="0" onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Armazém</label>
                             <select className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" onChange={e => setNewProduct({...newProduct, warehouseId: e.target.value})}>
                                <option value="">Selecione...</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                             <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Geral" onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Classe</label>
                             <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Ex: A" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 p-5 bg-slate-50 border-t sticky bottom-0 z-10">
                        <button onClick={() => setShowProductModal(false)} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-white transition-colors">Cancelar</button>
                        <button onClick={handleSaveProduct} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">Salvar</button>
                    </div>
                </div>
            </div>
        )}

        {/* ... Other modals (Warehouse, PriceTable, Movement) remain same ... */}
        {showWarehouseModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
                    <div className="bg-slate-900 text-white p-5 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Box size={20}/> Novo Armazém</h3>
                        <button onClick={() => setShowWarehouseModal(false)} className="hover:bg-slate-800 p-1 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="p-8 space-y-4">
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Nome do Armazém</label>
                             <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Ex: Armazém Central" value={newWarehouse.name || ''} onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})} />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Localização</label>
                             <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Localização" value={newWarehouse.location || ''} onChange={e => setNewWarehouse({...newWarehouse, location: e.target.value})} />
                         </div>
                    </div>
                    <div className="flex justify-end gap-3 p-5 bg-slate-50 border-t sticky bottom-0 z-10">
                        <button onClick={() => setShowWarehouseModal(false)} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-white transition-colors">Cancelar</button>
                        <button onClick={handleSaveWarehouse} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">Salvar</button>
                    </div>
                </div>
            </div>
        )}

        {showPriceTableModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
                    <div className="bg-slate-900 text-white p-5 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Tag size={20}/> {editingPriceTableId ? 'Editar Tabela' : 'Nova Tabela de Preço'}</h3>
                        <button onClick={() => setShowPriceTableModal(false)} className="hover:bg-slate-800 p-1 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="p-8 space-y-4">
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Nome da Tabela</label>
                             <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Ex: Revenda" value={newPriceTable.name || ''} onChange={e => setNewPriceTable({...newPriceTable, name: e.target.value})} />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Margem / Percentagem</label>
                             <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" type="number" placeholder="0" value={newPriceTable.percentage || ''} onChange={e => setNewPriceTable({...newPriceTable, percentage: Number(e.target.value)})} />
                         </div>
                    </div>
                    <div className="flex justify-end gap-3 p-5 bg-slate-50 border-t sticky bottom-0 z-10">
                        <button onClick={() => setShowPriceTableModal(false)} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-white transition-colors">Cancelar</button>
                        <button onClick={handleSavePriceTable} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">Salvar</button>
                    </div>
                </div>
            </div>
        )}

        {showMovementModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                     <div className="bg-slate-900 text-white p-5 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-bold text-lg flex items-center gap-2"><ArrowRightLeft size={20}/> Movimento de Stock</h3>
                        <button onClick={() => setShowMovementModal(false)} className="hover:bg-slate-800 p-1 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="p-8 grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                             <label className="text-xs font-bold text-slate-500 uppercase">Produto</label>
                             <select className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={newMovement.productId || ''} onChange={e => setNewMovement({...newMovement, productId: e.target.value})}>
                                <option value="">Selecione Produto...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                             <select className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={newMovement.type} onChange={e => setNewMovement({...newMovement, type: e.target.value as any})}>
                                <option value="ENTRY">Entrada</option>
                                <option value="EXIT">Saída</option>
                                <option value="TRANSFER">Transferência</option>
                                <option value="ADJUSTMENT">Ajuste (Contagem)</option>
                            </select>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Quantidade</label>
                             <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" type="number" value={newMovement.quantity || ''} onChange={e => setNewMovement({...newMovement, quantity: Number(e.target.value)})} />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Armazém Origem</label>
                             <select className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={newMovement.warehouseId || ''} onChange={e => setNewMovement({...newMovement, warehouseId: e.target.value})}>
                                <option value="">Selecione...</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        {newMovement.type === 'TRANSFER' && (
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase">Armazém Destino</label>
                                 <select className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={newMovement.targetWarehouseId || ''} onChange={e => setNewMovement({...newMovement, targetWarehouseId: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="col-span-2">
                             <label className="text-xs font-bold text-slate-500 uppercase">Notas</label>
                             <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Justificação" value={newMovement.notes || ''} onChange={e => setNewMovement({...newMovement, notes: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 p-5 bg-slate-50 border-t sticky bottom-0 z-10">
                        <button onClick={() => setShowMovementModal(false)} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-white transition-colors">Cancelar</button>
                        <button onClick={handleSaveMovement} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">Registar</button>
                    </div>
                </div>
            </div>
        )}

        {/* Guide Modal (Updated) */}
        {showGuideModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                 <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                     <div className="bg-slate-900 text-white p-5 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Truck size={20}/> Emitir Guia de Transporte</h3>
                        <button onClick={() => setShowGuideModal(false)} className="hover:bg-slate-800 p-1 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="p-8 space-y-4">
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Guia</label>
                             <select className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={guideData.type} onChange={e => setGuideData({...guideData, type: e.target.value as InvoiceType})}>
                                <option value={InvoiceType.GR}>Guia de Remessa (GR)</option>
                                <option value={InvoiceType.GT}>Guia de Transporte (GT)</option>
                            </select>
                        </div>
                        <p className="text-sm text-slate-600">Selecione os produtos do stock:</p>
                        <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
                            {products.map(p => (
                                <div key={p.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 border-b last:border-0">
                                    <input 
                                        type="checkbox" 
                                        checked={guideData.products.includes(p.id)}
                                        onChange={(e) => {
                                            if(e.target.checked) setGuideData({...guideData, products: [...guideData.products, p.id]});
                                            else setGuideData({...guideData, products: guideData.products.filter(id => id !== p.id)});
                                        }}
                                    />
                                    <span className="text-sm font-medium">{p.name} ({p.stock})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 p-5 bg-slate-50 border-t sticky bottom-0 z-10">
                        <button onClick={() => setShowGuideModal(false)} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-white transition-colors">Cancelar</button>
                        <button onClick={handleIssueGuide} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">Emitir Guia</button>
                    </div>
                 </div>
            </div>
        )}
    </div>
  );
};

export default StockManager;
