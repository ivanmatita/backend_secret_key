
import React, { useState, useEffect } from 'react';
import { Client, ClientTransaction } from '../types';
import { generateId, formatCurrency, formatDate } from '../utils';
import { Plus, Search, MapPin, Phone, Mail, FileText, ArrowLeft, Save, X, History, Printer, Download, Filter, UserPlus, CreditCard, Calendar } from 'lucide-react';

interface ClientListProps {
  clients: Client[];
  onSaveClient: (client: Client) => void;
  initialSelectedClientId?: string | null;
  onClearSelection?: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onSaveClient, initialSelectedClientId, onClearSelection }) => {
  const [view, setView] = useState<'LIST' | 'FORM' | 'DETAILS'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({});
  
  // Details Filter State
  const [detailsDateStart, setDetailsDateStart] = useState('');
  const [detailsDateEnd, setDetailsDateEnd] = useState('');

  // Handle Initial Selection Logic (Navigation from Actions)
  useEffect(() => {
      if (initialSelectedClientId) {
          const client = clients.find(c => c.id === initialSelectedClientId);
          if (client) {
              setSelectedClient(client);
              setView('DETAILS');
          }
      }
  }, [initialSelectedClientId, clients]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.vatNumber.includes(searchTerm)
  );

  const handleCreate = () => {
    setFormData({});
    setView('FORM');
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setDetailsDateStart('');
    setDetailsDateEnd('');
    setView('DETAILS');
  };

  const handleBackToList = () => {
      setView('LIST');
      if (onClearSelection) onClearSelection(); // Clear App state selection
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.vatNumber) return alert('Nome e NIF obrigatórios');

    const newClient: Client = {
      id: formData.id || generateId(),
      name: formData.name!,
      vatNumber: formData.vatNumber!,
      email: formData.email || '',
      phone: formData.phone || '',
      address: formData.address || '',
      city: formData.city || 'Luanda',
      country: formData.country || 'Angola',
      accountBalance: 0,
      transactions: [],
      postalCode: formData.postalCode,
      province: formData.province,
      municipality: formData.municipality,
      webPage: formData.webPage,
      clientType: formData.clientType
    };

    onSaveClient(newClient);
    setView('LIST');
  };

  // Standardized Form Style (Matching InvoiceForm "Novo Cliente" Modal Style)
  const renderForm = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
             <div className="bg-slate-900 text-white p-5 flex justify-between items-center sticky top-0 z-10">
                <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus size={20}/> Novo Cliente</h3>
                <button onClick={() => setView('LIST')} className="hover:bg-slate-800 p-1 rounded-full"><X size={20}/></button>
             </div>
             <form onSubmit={handleSubmit}>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2 md:col-span-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Nome / Empresa <span className="text-red-500">*</span></label>
                          <input required className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Ex: Cliente Exemplo Lda" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">NIF <span className="text-red-500">*</span></label>
                          <input required className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="000000000" value={formData.vatNumber || ''} onChange={e => setFormData({...formData, vatNumber: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Endereço Completo</label>
                          <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Rua, Nº, Bairro" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Cidade</label>
                           <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Luanda" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Província</label>
                           <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="Luanda" value={formData.province || ''} onChange={e => setFormData({...formData, province: e.target.value})} />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                           <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="+244..." value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                      <div>
                           <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                           <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" placeholder="cliente@email.com" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Cliente</label>
                          <select className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={formData.clientType} onChange={e => setFormData({...formData, clientType: e.target.value})}>
                              <option value="">Selecione...</option>
                              <option value="Consumidor Final">Consumidor Final</option>
                              <option value="Empresa Nacional">Empresa Nacional</option>
                              <option value="Cliente Não Grupo Nacionais">Cliente Não Grupo Nacionais</option>
                          </select>
                      </div>
                 </div>
                 <div className="p-5 border-t bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
                      <button type="button" onClick={() => setView('LIST')} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-white transition-colors">Cancelar</button>
                      <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">Criar Cliente</button>
                 </div>
             </form>
        </div>
    </div>
  );

  const renderDetails = () => {
    if (!selectedClient) return null;
    
    const transactions = selectedClient.transactions || [];
    const filteredTransactions = transactions.filter(t => {
        if (detailsDateStart && new Date(t.date) < new Date(detailsDateStart)) return false;
        if (detailsDateEnd && new Date(t.date) > new Date(detailsDateEnd)) return false;
        return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Update Logic: Separate Credits (Receipts) from Credit Notes
    // Assume DEBIT = Sales (Client Owes)
    // Assume CREDIT = Payments (Receipts) OR Credit Notes
    
    const totalDebit = filteredTransactions.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0); // Total Vendas
    const totalReceipts = filteredTransactions.filter(t => t.type === 'CREDIT' && !t.documentNumber.includes('NC')).reduce((acc, t) => acc + t.amount, 0); // Pagamentos Reais
    const totalCreditNotes = filteredTransactions.filter(t => t.type === 'CREDIT' && t.documentNumber.includes('NC')).reduce((acc, t) => acc + t.amount, 0); // Notas Crédito
    
    // Balance Logic per requirements: 
    // Gross Balance (Pending) = Sales - Receipts (Ignore NC unless applied)
    // We assume here NCs in transaction list are applied if they exist there (from App.tsx logic), 
    // BUT the requirement wants visualization separation.
    
    const operationalBalance = totalDebit - totalReceipts; // Without NC
    const accountingBalance = totalDebit - (totalReceipts + totalCreditNotes); // With NC

    return (
        <div className="space-y-6 animate-in slide-in-from-right h-full flex flex-col pb-20">
            {/* Header */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={handleBackToList} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{selectedClient.name}</h1>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                            <span className="font-mono bg-slate-100 px-1 rounded">{selectedClient.vatNumber}</span>
                            <span>•</span>
                            <MapPin size={12}/> {selectedClient.city}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Total Vendas (Débito)</div>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalDebit)}</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Total Recebido</div>
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReceipts)}</div>
                </div>
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Notas de Crédito</div>
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalCreditNotes)}</div>
                    <div className="text-xs text-slate-400 mt-1 italic">Pendentes de regularização</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-slate-800">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Saldo Líquido (Contabilístico)</div>
                    <div className={`text-2xl font-bold ${accountingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(accountingBalance)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Saldo Pendente: {formatCurrency(operationalBalance)}</div>
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
                                <th className="px-4 py-3 w-32 text-right">Débito</th>
                                <th className="px-4 py-3 w-32 text-right">Crédito</th>
                                <th className="px-4 py-3 w-32 text-right">NC</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                            {filteredTransactions.map((t, idx) => {
                                const isNC = t.documentNumber.includes('NC');
                                return (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 text-slate-500">{formatDate(t.date)}</td>
                                        <td className="px-4 py-2">
                                            <div className="font-bold text-slate-700">{t.documentNumber}</div>
                                            <div className="text-slate-500 text-[10px]">{t.description}</div>
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-blue-600">
                                            {t.type === 'DEBIT' ? formatCurrency(t.amount) : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-emerald-600">
                                            {t.type === 'CREDIT' && !isNC ? formatCurrency(t.amount) : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-purple-600">
                                            {isNC ? formatCurrency(t.amount) : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {isNC && <button className="text-xs bg-slate-100 border px-2 py-0.5 rounded hover:bg-slate-200">Aplicar</button>}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">Sem movimentos no período selecionado.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                            <tr>
                                <td colSpan={2} className="px-4 py-2 text-right uppercase text-slate-600">Totais do Período</td>
                                <td className="px-4 py-2 text-right text-blue-700">{formatCurrency(totalDebit)}</td>
                                <td className="px-4 py-2 text-right text-emerald-700">{formatCurrency(totalReceipts)}</td>
                                <td className="px-4 py-2 text-right text-purple-700">{formatCurrency(totalCreditNotes)}</td>
                                <td></td>
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
                {/* Standardized Header (Matching PurchaseList) */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Gestão de Clientes</h1>
                        <p className="text-xs text-slate-500">Base de dados de entidades e clientes</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCreate} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition font-medium">
                            <Plus size={16} /> Novo Cliente
                        </button>
                    </div>
                </div>

                {/* Standardized Filters (Matching PurchaseList) */}
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 flex flex-wrap items-end gap-3 text-sm">
                     <div className="flex-1 min-w-[200px]">
                         <label className="block text-xs font-bold text-slate-500 mb-1">Pesquisa Geral</label>
                         <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Nome, NIF, Email..." 
                                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                         </div>
                     </div>
                     <button className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 flex items-center gap-1 font-bold" onClick={() => setSearchTerm('')}>
                         <Filter size={14}/> Limpar
                     </button>
                </div>

                {/* Standardized Table (Matching PurchaseList style, replacing Grid) */}
                <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-700 text-white font-semibold">
                          <tr>
                            <th className="px-4 py-2 w-10">#</th>
                            <th className="px-4 py-2">Nome / Entidade</th>
                            <th className="px-4 py-2 w-32">NIF</th>
                            <th className="px-4 py-2">Localidade</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2 text-right">Saldo Conta</th>
                            <th className="px-4 py-2 w-20 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                          {filteredClients.map((client, idx) => (
                              <tr key={client.id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => handleViewDetails(client)}>
                                <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                                <td className="px-4 py-2 font-bold text-slate-800">{client.name}</td>
                                <td className="px-4 py-2 font-mono text-slate-600">{client.vatNumber}</td>
                                <td className="px-4 py-2">{client.city}</td>
                                <td className="px-4 py-2 text-slate-500">{client.email}</td>
                                <td className={`px-4 py-2 text-right font-bold ${client.accountBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(client.accountBalance)}
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button className="text-blue-600 hover:underline">Ver</button>
                                </td>
                              </tr>
                          ))}
                          {filteredClients.length === 0 && (
                             <tr><td colSpan={7} className="text-center py-8 text-slate-400">Nenhum cliente encontrado.</td></tr>
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

export default ClientList;
