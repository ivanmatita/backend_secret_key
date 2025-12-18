
import React, { useState } from 'react';
import { Supplier } from '../types';
import { generateId, formatCurrency, formatDate } from '../utils';
import { Plus, Search, MapPin, Phone, Mail, ArrowLeft, Save, X, Printer, Download, Filter, UserPlus, History, Calendar } from 'lucide-react';

interface SupplierListProps {
  suppliers: Supplier[];
  onSaveSupplier: (supplier: Supplier) => void;
}

const SupplierList: React.FC<SupplierListProps> = ({ suppliers, onSaveSupplier }) => {
  const [view, setView] = useState<'LIST' | 'FORM' | 'DETAILS'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({});

  // Details Filter
  const [detailsDateStart, setDetailsDateStart] = useState('');
  const [detailsDateEnd, setDetailsDateEnd] = useState('');

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.vatNumber.includes(searchTerm)
  );

  const handleCreate = () => {
    setFormData({});
    setView('FORM');
  };

  const handleViewDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetailsDateStart('');
    setDetailsDateEnd('');
    setView('DETAILS');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.vatNumber) return alert('Nome e NIF obrigatórios');

    const newSupplier: Supplier = {
      id: formData.id || generateId(),
      name: formData.name!,
      vatNumber: formData.vatNumber!,
      email: formData.email || '',
      phone: formData.phone || '',
      address: formData.address || '',
      city: formData.city || 'Luanda',
      province: formData.province || 'Luanda',
      accountBalance: 0,
      transactions: [],
    };

    onSaveSupplier(newSupplier);
    setView('LIST');
  };

  // Standardized Form Style (Matching InvoiceForm "Novo Cliente" Modal Style)
  const renderForm = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
             <div className="bg-slate-900 text-white p-5 flex justify-between items-center sticky top-0 z-10">
                <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus size={20}/> Novo Fornecedor</h3>
                <button onClick={() => setView('LIST')} className="hover:bg-slate-800 p-1 rounded-full"><X size={20}/></button>
             </div>
             <form onSubmit={handleSubmit}>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2 md:col-span-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Nome da Empresa <span className="text-red-500">*</span></label>
                          <input required className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">NIF <span className="text-red-500">*</span></label>
                          <input required className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={formData.vatNumber || ''} onChange={e => setFormData({...formData, vatNumber: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Morada Completa</label>
                          <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Cidade</label>
                           <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Província</label>
                           <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={formData.province || ''} onChange={e => setFormData({...formData, province: e.target.value})} />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                           <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                           <input type="email" className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="col-span-2 pt-4 border-t border-slate-100">
                           <h4 className="font-bold text-slate-800 text-sm mb-2">Dados Financeiros</h4>
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">IBAN</label>
                           <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="AO06..." />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Banco</label>
                           <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Ex: BAI" />
                      </div>
                 </div>
                 <div className="p-5 border-t bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
                      <button type="button" onClick={() => setView('LIST')} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-white transition-colors">Cancelar</button>
                      <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">Criar Fornecedor</button>
                 </div>
             </form>
        </div>
    </div>
  );

  const renderDetails = () => {
    if (!selectedSupplier) return null;
    
    const transactions = selectedSupplier.transactions || [];
    const filteredTransactions = transactions.filter(t => {
        if (detailsDateStart && new Date(t.date) < new Date(detailsDateStart)) return false;
        if (detailsDateEnd && new Date(t.date) > new Date(detailsDateEnd)) return false;
        return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalCredit = filteredTransactions.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0); // Compras (Nós devemos)
    const totalDebit = filteredTransactions.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0); // Pagamentos (Nós pagamos)
    const periodBalance = totalCredit - totalDebit;

    return (
        <div className="space-y-6 animate-in slide-in-from-right h-full flex flex-col pb-20">
             {/* Header */}
             <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('LIST')} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{selectedSupplier.name}</h1>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                            <span className="font-mono bg-slate-100 px-1 rounded">{selectedSupplier.vatNumber}</span>
                            <span>•</span>
                            <MapPin size={12}/> {selectedSupplier.city}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-black transition font-bold text-sm">
                        <Printer size={16}/> Imprimir Extrato
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Total Compras (Crédito)</div>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalCredit)}</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Total Pagamentos (Débito)</div>
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalDebit)}</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Saldo Corrente</div>
                    <div className={`text-3xl font-bold ${selectedSupplier.accountBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(selectedSupplier.accountBalance)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        {selectedSupplier.accountBalance > 0 ? 'Dívida a Pagar' : 'Sem Dívida'}
                    </div>
                </div>
            </div>

             {/* Filters & Transaction Table */}
             <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center gap-3">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><History size={18}/> Histórico de Conta</h3>
                    <div className="h-6 w-px bg-slate-300 mx-2 hidden md:block"></div>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-slate-500"/>
                        <input type="date" className="p-1 border rounded text-xs" value={detailsDateStart} onChange={e => setDetailsDateStart(e.target.value)} />
                        <span className="text-slate-400">-</span>
                        <input type="date" className="p-1 border rounded text-xs" value={detailsDateEnd} onChange={e => setDetailsDateEnd(e.target.value)} />
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-700 text-white font-semibold">
                            <tr>
                                <th className="px-4 py-3 w-24">Data</th>
                                <th className="px-4 py-3">Descrição / Documento</th>
                                <th className="px-4 py-3 w-32 text-right">Compra (Crédito)</th>
                                <th className="px-4 py-3 w-32 text-right">Pagamento (Débito)</th>
                                <th className="px-4 py-3 w-32 text-right">Saldo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                            {filteredTransactions.map((t, idx) => (
                                <tr key={t.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 text-slate-500">{formatDate(t.date)}</td>
                                    <td className="px-4 py-2">
                                        <div className="font-bold text-slate-700">{t.documentNumber}</div>
                                        <div className="text-slate-500 text-[10px]">{t.description}</div>
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-blue-600">
                                        {t.type === 'CREDIT' ? formatCurrency(t.amount) : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-emerald-600">
                                        {t.type === 'DEBIT' ? formatCurrency(t.amount) : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right text-slate-400 italic">...</td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">Sem movimentos no período.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                            <tr>
                                <td colSpan={2} className="px-4 py-2 text-right uppercase text-slate-600">Totais do Período</td>
                                <td className="px-4 py-2 text-right text-blue-700">{formatCurrency(totalCredit)}</td>
                                <td className="px-4 py-2 text-right text-emerald-700">{formatCurrency(totalDebit)}</td>
                                <td className="px-4 py-2 text-right bg-slate-200">{formatCurrency(periodBalance)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
             </div>
        </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
        {view === 'LIST' && (
            <>
                {/* Standardized Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Gestão de Fornecedores</h1>
                        <p className="text-xs text-slate-500">Base de dados de compras e contas a pagar</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCreate} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition font-medium">
                            <Plus size={16} /> Novo Fornecedor
                        </button>
                    </div>
                </div>

                {/* Standardized Filters */}
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 flex flex-wrap items-end gap-3 text-sm">
                     <div className="flex-1 min-w-[200px]">
                         <label className="block text-xs font-bold text-slate-500 mb-1">Pesquisa Geral</label>
                         <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Nome, NIF..." 
                                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                         </div>
                     </div>
                     <button className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 flex items-center gap-1 font-bold" onClick={() => setSearchTerm('')}>
                         <Filter size={14}/> Limpar
                     </button>
                </div>

                {/* Standardized Table (PurchaseList Style) */}
                <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-700 text-white font-semibold">
                          <tr>
                            <th className="px-4 py-2 w-10">#</th>
                            <th className="px-4 py-2">Fornecedor / Empresa</th>
                            <th className="px-4 py-2 w-32">NIF</th>
                            <th className="px-4 py-2">Localidade</th>
                            <th className="px-4 py-2">Telefone</th>
                            <th className="px-4 py-2 text-right">Saldo Dívida</th>
                            <th className="px-4 py-2 w-20 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                          {filteredSuppliers.map((sup, idx) => (
                              <tr key={sup.id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => handleViewDetails(sup)}>
                                <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                                <td className="px-4 py-2 font-bold text-slate-800">{sup.name}</td>
                                <td className="px-4 py-2 font-mono text-slate-600">{sup.vatNumber}</td>
                                <td className="px-4 py-2">{sup.city}</td>
                                <td className="px-4 py-2 text-slate-500">{sup.phone}</td>
                                <td className={`px-4 py-2 text-right font-bold ${sup.accountBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(sup.accountBalance)}
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button className="text-purple-600 hover:underline">Ver</button>
                                </td>
                              </tr>
                          ))}
                          {filteredSuppliers.length === 0 && (
                             <tr><td colSpan={7} className="text-center py-8 text-slate-400">Nenhum fornecedor encontrado.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                </div>
            </>
        )}
        {view === 'FORM' && renderForm()}
        {view === 'DETAILS' && renderDetails()}
    </div>
  );
};

export default SupplierList;
