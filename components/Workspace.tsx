
import React, { useState } from 'react';
import { Invoice, Purchase, InvoiceStatus, PurchaseType, InvoiceType } from '../types';
import { formatCurrency, formatDate, exportToExcel } from '../utils';
import { Search, Download, Printer, Filter, BriefcaseBusiness, ArrowUpRight, ArrowDownLeft, FileText, Eye, Building2 } from 'lucide-react';

interface WorkspaceProps {
  invoices: Invoice[];
  purchases: Purchase[];
  onViewInvoice: (invoice: Invoice) => void;
}

const Workspace: React.FC<WorkspaceProps> = ({ invoices, purchases, onViewInvoice }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState(new Date().toISOString().split('T')[0]);
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('ALL');

  // Unified Transaction Record
  interface Transaction {
    id: string;
    date: string;
    number: string;
    entityName: string;
    type: string;
    amount: number;
    direction: 'ENTRY' | 'EXIT'; // Entry = Sale, Exit = Purchase
    status: string;
    original: Invoice | Purchase;
  }

  const salesTransactions: Transaction[] = invoices.map(inv => ({
    id: inv.id,
    date: inv.date,
    number: inv.number,
    entityName: inv.clientName,
    type: inv.type,
    amount: inv.total,
    direction: 'ENTRY',
    status: inv.status,
    original: inv
  }));

  const purchaseTransactions: Transaction[] = purchases.map(pur => ({
    id: pur.id,
    date: pur.date,
    number: pur.documentNumber,
    entityName: pur.supplier,
    type: pur.type,
    amount: pur.total,
    direction: 'EXIT',
    status: pur.status,
    original: pur
  }));

  const allTransactions = [...salesTransactions, ...purchaseTransactions].filter(t => {
      const d = new Date(t.date);
      const start = new Date(dateStart);
      const end = new Date(dateEnd);
      const matchDate = d >= start && d <= end;
      const matchSearch = t.entityName.toLowerCase().includes(searchTerm.toLowerCase()) || t.number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'ALL' || t.direction === filterType;
      
      return matchDate && matchSearch && matchType;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Metrics Calculation
  const totalEntry = allTransactions.filter(t => t.direction === 'ENTRY' && t.status !== InvoiceStatus.CANCELLED).reduce((sum, t) => sum + t.amount, 0);
  const totalExit = allTransactions.filter(t => t.direction === 'EXIT').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalEntry - totalExit;

  const handleExport = () => {
      const data = allTransactions.map(t => ({
          Data: formatDate(t.date),
          Numero: t.number,
          Entidade: t.entityName,
          Tipo: t.type,
          Movimento: t.direction === 'ENTRY' ? 'Entrada' : 'Saída',
          Valor: t.amount,
          Estado: t.status
      }));
      exportToExcel(data, "Mapa_Local_Trabalho");
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div>
                 <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><BriefcaseBusiness/> Local de Trabalho</h1>
                 <p className="text-xs text-slate-500">Visão unificada de Vendas e Compras</p>
            </div>
            <div className="flex gap-2">
                 <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-bold"><Download size={16}/> Exportar</button>
                 <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded text-sm hover:bg-black font-bold"><Printer size={16}/> Imprimir</button>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
             <div>
                 <label className="block text-xs font-bold mb-1">Data Início</label>
                 <input type="date" className="w-full p-2 border rounded" value={dateStart} onChange={e => setDateStart(e.target.value)}/>
             </div>
             <div>
                 <label className="block text-xs font-bold mb-1">Data Fim</label>
                 <input type="date" className="w-full p-2 border rounded" value={dateEnd} onChange={e => setDateEnd(e.target.value)}/>
             </div>
             <div>
                 <label className="block text-xs font-bold mb-1">Pesquisa</label>
                 <div className="relative">
                    <Search className="absolute left-2 top-2 text-slate-400" size={16}/>
                    <input type="text" className="w-full pl-8 p-2 border rounded" placeholder="Entidade, Nº Doc" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                 </div>
             </div>
             <div>
                 <label className="block text-xs font-bold mb-1">Movimento</label>
                 <select className="w-full p-2 border rounded" value={filterType} onChange={e => setFilterType(e.target.value)}>
                     <option value="ALL">Todos</option>
                     <option value="ENTRY">Entradas (Vendas)</option>
                     <option value="EXIT">Saídas (Compras)</option>
                 </select>
             </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border-l-4 border-green-500 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Entradas (Receitas)</p>
                        <h3 className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalEntry)}</h3>
                    </div>
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><ArrowUpRight size={24}/></div>
                </div>
            </div>
            <div className="bg-white p-5 rounded-xl border-l-4 border-red-500 shadow-sm">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Saídas (Despesas)</p>
                        <h3 className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExit)}</h3>
                    </div>
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg"><ArrowDownLeft size={24}/></div>
                </div>
            </div>
            <div className="bg-white p-5 rounded-xl border-l-4 border-blue-500 shadow-sm">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Saldo do Período</p>
                        <h3 className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(balance)}</h3>
                    </div>
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Building2 size={24}/></div>
                </div>
            </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b">
                    <tr>
                        <th className="p-3">Data</th>
                        <th className="p-3">Movimento</th>
                        <th className="p-3">Nº Documento</th>
                        <th className="p-3">Entidade</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3 text-right">Valor</th>
                        <th className="p-3 text-center">Estado</th>
                        <th className="p-3 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {allTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                            <td className="p-3">{formatDate(t.date)}</td>
                            <td className="p-3">
                                {t.direction === 'ENTRY' ? (
                                    <span className="flex items-center gap-1 text-green-600 font-bold"><ArrowUpRight size={12}/> Entrada</span>
                                ) : (
                                    <span className="flex items-center gap-1 text-red-600 font-bold"><ArrowDownLeft size={12}/> Saída</span>
                                )}
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-700">{t.number}</td>
                            <td className="p-3">{t.entityName}</td>
                            <td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold border">{t.type}</span></td>
                            <td className={`p-3 text-right font-bold ${t.direction === 'ENTRY' ? 'text-green-700' : 'text-red-700'}`}>
                                {formatCurrency(t.amount)}
                            </td>
                            <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${t.status === 'CANCELLED' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                    {t.status}
                                </span>
                            </td>
                            <td className="p-3 text-center">
                                {t.direction === 'ENTRY' && (
                                    <button 
                                        onClick={() => onViewInvoice(t.original as Invoice)}
                                        className="text-blue-600 hover:bg-blue-50 p-1.5 rounded flex items-center justify-center mx-auto"
                                        title="Ver Documento"
                                    >
                                        <Eye size={16}/>
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {allTransactions.length === 0 && (
                        <tr><td colSpan={8} className="p-8 text-center text-slate-400">Sem movimentos no período.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default Workspace;
