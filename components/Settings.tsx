
import React, { useState } from 'react';
import { DocumentSeries, User, ViewState, WorkLocation, CashRegister } from '../types';
import { generateId, formatDate, formatCurrency } from '../utils';
import { Users, FileText, Plus, Trash2, CheckSquare, Square, Save, Pencil, Upload, MapPin, CreditCard, X, UserPlus, Building, DollarSign, LayoutDashboard, Image as ImageIcon } from 'lucide-react';

interface SettingsProps {
  series: DocumentSeries[];
  onSaveSeries: (series: DocumentSeries) => void;
  onDeleteSeries?: (id: string) => void; 
  onEditSeries?: (series: DocumentSeries) => void;
  users: User[];
  onSaveUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  workLocations: WorkLocation[];
  onSaveWorkLocation: (wl: WorkLocation) => void;
  onDeleteWorkLocation: (id: string) => void;
  cashRegisters: CashRegister[];
  onSaveCashRegister: (cr: CashRegister) => void;
  onDeleteCashRegister: (id: string) => void;
  onViewLocationDashboard?: (locationId: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  series, onSaveSeries, onEditSeries,
  users, onSaveUser, onDeleteUser,
  workLocations, onSaveWorkLocation, onDeleteWorkLocation,
  cashRegisters, onSaveCashRegister, onDeleteCashRegister,
  onViewLocationDashboard
}) => {
  const [activeTab, setActiveTab] = useState<'SERIES' | 'USERS' | 'LOCATIONS' | 'CASH_REGISTERS'>('SERIES');
  
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [newSeries, setNewSeries] = useState<Partial<DocumentSeries>>({
      type: 'NORMAL',
      year: new Date().getFullYear(),
      currentSequence: 0,
      sequences: {}, // Initialized
      isActive: true,
      allowedUserIds: []
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
      role: 'OPERATOR',
      permissions: ['DASHBOARD', 'INVOICES_GROUP', 'CREATE_INVOICE']
  });
  
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [newLocation, setNewLocation] = useState<Partial<WorkLocation>>({});

  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [newCashRegister, setNewCashRegister] = useState<Partial<CashRegister>>({ status: 'CLOSED', balance: 0 });

  const availablePermissions: {id: ViewState, label: string}[] = [
      { id: 'DASHBOARD', label: 'Dashboard' },
      { id: 'INVOICES_GROUP', label: 'Vendas' },
      { id: 'PURCHASES_GROUP', label: 'Compras' },
      { id: 'STOCK_GROUP', label: 'Stocks' },
      { id: 'POS', label: 'Ponto de Venda' },
      { id: 'CLIENTS', label: 'Clientes' },
      { id: 'HR', label: 'Recursos Humanos' },
      { id: 'FINANCE_GROUP', label: 'Finanças' },
      { id: 'ACCOUNTING_GROUP', label: 'Contabilidade' },
      { id: 'SETTINGS', label: 'Definições (Admin)' },
      { id: 'RESTAURANT', label: 'Restaurante' },
      { id: 'HOTEL', label: 'Hotelaria' }
  ];

  // Logic for File Uploads (Updated for generic field name)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'footerLogo') => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewSeries(prev => ({ ...prev, [field]: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleOpenEditSeries = (s: DocumentSeries) => {
      setNewSeries({ ...s });
      setEditingSeriesId(s.id);
      setIsSeriesModalOpen(true);
  };

  const handleOpenNewSeries = () => {
      setNewSeries({
        type: 'NORMAL',
        year: new Date().getFullYear(),
        currentSequence: 0,
        sequences: {},
        isActive: true,
        allowedUserIds: []
      });
      setEditingSeriesId(null);
      setIsSeriesModalOpen(true);
  };

  const handleSaveSeries = () => {
      if (!newSeries.name || !newSeries.code) return alert("Preencha Nome e Código");
      
      const seriesData: DocumentSeries = {
          id: editingSeriesId || generateId(),
          name: newSeries.name!,
          code: newSeries.code!,
          type: newSeries.type || 'NORMAL',
          year: newSeries.year || new Date().getFullYear(),
          currentSequence: newSeries.currentSequence || 0,
          sequences: newSeries.sequences || {}, // Ensure sequences map is passed
          isActive: newSeries.isActive ?? true,
          allowedUserIds: newSeries.allowedUserIds || [],
          bankDetails: newSeries.bankDetails || '',
          logo: newSeries.logo || '',
          watermark: newSeries.watermark || '', 
          footerText: newSeries.footerText || '',
          footerEmail: newSeries.footerEmail,
          footerPhone: newSeries.footerPhone,
          footerAddress: newSeries.footerAddress,
          footerLogo: newSeries.footerLogo
      };

      if (editingSeriesId && onEditSeries) {
          onEditSeries(seriesData);
      } else {
          onSaveSeries(seriesData);
      }

      setIsSeriesModalOpen(false);
      setNewSeries({ type: 'NORMAL', year: new Date().getFullYear(), currentSequence: 0, sequences: {} });
      setEditingSeriesId(null);
  };

  const handleSaveUser = () => {
      if (!newUser.name || !newUser.email) return alert("Preencha Nome e Email");
      onSaveUser({
          id: generateId(),
          name: newUser.name!,
          email: newUser.email!,
          role: newUser.role || 'OPERATOR',
          companyId: 'comp1', 
          permissions: newUser.permissions || [],
          obs: newUser.obs || '',
          createdAt: new Date().toISOString()
      });
      setIsUserModalOpen(false);
      setNewUser({ role: 'OPERATOR', permissions: ['DASHBOARD', 'INVOICES_GROUP'] });
  };
  
  const handleSaveLocation = () => {
      if (!newLocation.name) return alert("Preencha o nome do local");
      onSaveWorkLocation({
          id: generateId(),
          name: newLocation.name!,
          address: newLocation.address || '',
          managerName: newLocation.managerName || '',
          phone: newLocation.phone || ''
      });
      setIsLocationModalOpen(false);
      setNewLocation({});
  };

  const handleSaveCashRegister = () => {
      if (!newCashRegister.name) return alert("Preencha o nome da Caixa");
      onSaveCashRegister({
          id: generateId(),
          name: newCashRegister.name!,
          status: newCashRegister.status || 'CLOSED',
          operatorId: newCashRegister.operatorId,
          balance: newCashRegister.balance || 0
      });
      setIsCashModalOpen(false);
      setNewCashRegister({ status: 'CLOSED', balance: 0 });
  }

  const togglePermission = (perm: ViewState) => {
      const currentPerms = newUser.permissions || [];
      if (currentPerms.includes(perm)) {
          setNewUser({ ...newUser, permissions: currentPerms.filter(p => p !== perm) });
      } else {
          setNewUser({ ...newUser, permissions: [...currentPerms, perm] });
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
        {/* Standardized Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div>
                 <h1 className="text-xl font-bold text-slate-800">Definições Gerais</h1>
                 <p className="text-xs text-slate-500">Configuração do sistema e parâmetros</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                {['SERIES', 'USERS', 'LOCATIONS', 'CASH_REGISTERS'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)} 
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap text-sm border ${activeTab === tab ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        {tab === 'SERIES' ? 'Séries' : tab === 'USERS' ? 'Utilizadores' : tab === 'LOCATIONS' ? 'Locais' : 'Caixas'}
                    </button>
                ))}
            </div>
        </div>

        {activeTab === 'SERIES' && (
            <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
                <div className="flex justify-between items-center p-4 bg-slate-100 border-b border-slate-200">
                    <div>
                        <h3 className="font-bold text-sm text-slate-700">Séries de Faturação</h3>
                    </div>
                    <button onClick={handleOpenNewSeries} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 text-sm">
                        <Plus size={16}/> Nova Série
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-700 text-white uppercase text-xs">
                            <tr>
                                <th className="p-3">Código</th>
                                <th className="p-3">Nome / Ano</th>
                                <th className="p-3">Tipo</th>
                                <th className="p-3">Sequência Atual</th>
                                <th className="p-3">Logotipo</th>
                                <th className="p-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                            {series.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold">{s.code}</td>
                                    <td className="p-3">{s.name} ({s.year})</td>
                                    <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{s.type}</span></td>
                                    <td className="p-3 font-bold text-blue-600">{s.currentSequence}</td>
                                    <td className="p-3 text-xs text-slate-500">{s.logo ? <span className="text-green-600 flex items-center gap-1"><CheckSquare size={12}/> Sim</span> : 'Não'}</td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => handleOpenEditSeries(s)} className="text-white bg-blue-500 hover:bg-blue-600 p-2 rounded flex items-center gap-1 ml-auto text-xs font-bold">
                                            <Pencil size={12}/> Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Series Modal - Standardized Style */}
                {isSeriesModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 shadow-2xl">
                            <div className="bg-slate-900 text-white p-5 flex justify-between items-center sticky top-0 z-10">
                                <h3 className="font-bold text-lg">{editingSeriesId ? 'Editar Série' : 'Nova Série'}</h3>
                                <button onClick={() => setIsSeriesModalOpen(false)} className="hover:bg-slate-800 p-1 rounded-full"><X size={20}/></button>
                            </div>
                            <div className="p-8 grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nome da Série</label>
                                    <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={newSeries.name || ''} onChange={e => setNewSeries({...newSeries, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Código (Prefixo)</label>
                                    <input className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={newSeries.code || ''} onChange={e => setNewSeries({...newSeries, code: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Ano Fiscal</label>
                                    <input type="number" className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={newSeries.year} onChange={e => setNewSeries({...newSeries, year: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                                    <select className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" value={newSeries.type} onChange={e => setNewSeries({...newSeries, type: e.target.value as any})}>
                                        <option value="NORMAL">Normal (Automática)</option>
                                        <option value="MANUAL">Manual (Recuperação)</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Dados Bancários (Texto)</label>
                                    <textarea className="w-full border-b-2 border-slate-200 bg-slate-50 p-2 focus:outline-none focus:border-blue-600 transition-colors" rows={3} value={newSeries.bankDetails || ''} onChange={e => setNewSeries({...newSeries, bankDetails: e.target.value})}></textarea>
                                </div>
                                
                                {/* FOOTER CONFIGURATION */}
                                <div className="col-span-2 border-t pt-4">
                                     <h4 className="font-bold text-sm mb-2 text-slate-700">Personalização do Rodapé</h4>
                                     <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Email Rodapé</label>
                                              <input className="w-full border p-2 rounded text-sm" value={newSeries.footerEmail || ''} onChange={e => setNewSeries({...newSeries, footerEmail: e.target.value})} placeholder="email@empresa.com"/>
                                          </div>
                                          <div>
                                              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Telefone Rodapé</label>
                                              <input className="w-full border p-2 rounded text-sm" value={newSeries.footerPhone || ''} onChange={e => setNewSeries({...newSeries, footerPhone: e.target.value})} placeholder="+244..."/>
                                          </div>
                                          <div className="col-span-2">
                                              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Endereço Rodapé</label>
                                              <input className="w-full border p-2 rounded text-sm" value={newSeries.footerAddress || ''} onChange={e => setNewSeries({...newSeries, footerAddress: e.target.value})} placeholder="Morada completa"/>
                                          </div>
                                          <div className="col-span-2">
                                              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Logotipo Rodapé</label>
                                              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'footerLogo')} className="text-xs"/>
                                              {newSeries.footerLogo && <img src={newSeries.footerLogo} alt="Footer Preview" className="h-8 mt-2 object-contain"/>}
                                          </div>
                                     </div>
                                </div>

                                <div className="col-span-2 pt-4 border-t flex justify-end gap-2">
                                    <button onClick={() => setIsSeriesModalOpen(false)} className="px-4 py-2 border rounded hover:bg-slate-50 text-sm">Cancelar</button>
                                    <button onClick={handleSaveSeries} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 text-sm flex items-center gap-2"><Save size={16}/> Salvar Série</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'USERS' && (
            <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
                <div className="p-4 flex justify-between items-center bg-slate-100 border-b border-slate-200">
                    <h3 className="font-bold text-sm text-slate-700">Utilizadores do Sistema</h3>
                    <button onClick={() => { setNewUser({role: 'OPERATOR', permissions: ['DASHBOARD']}); setIsUserModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 text-sm">
                        <UserPlus size={16}/> Novo Utilizador
                    </button>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-700 text-white uppercase text-xs">
                        <tr>
                            <th className="p-3">Nome</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Função</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50">
                                <td className="p-3 font-bold">{u.name}</td>
                                <td className="p-3">{u.email}</td>
                                <td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{u.role}</span></td>
                                <td className="p-3 text-right">
                                    <button onClick={() => onDeleteUser(u.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* User Modal */}
        {isUserModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-lg overflow-y-auto animate-in zoom-in-95 shadow-2xl">
                    <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Novo Utilizador</h3>
                        <button onClick={() => setIsUserModalOpen(false)}><X size={20}/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
                            <input className="w-full border p-2 rounded" value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Email (Login)</label>
                            <input className="w-full border p-2 rounded" value={newUser.email || ''} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Função</label>
                            <select className="w-full border p-2 rounded" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                                <option value="OPERATOR">Operador</option>
                                <option value="MANAGER">Gerente</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Permissões de Acesso</label>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
                                {availablePermissions.map(p => (
                                    <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 p-1 rounded">
                                        <input 
                                            type="checkbox" 
                                            checked={(newUser.permissions || []).includes(p.id)}
                                            onChange={() => togglePermission(p.id)}
                                        />
                                        {p.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t flex justify-end gap-2">
                        <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                        <button onClick={handleSaveUser} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Criar Utilizador</button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'LOCATIONS' && (
            <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
                <div className="p-4 flex justify-between items-center bg-slate-100 border-b border-slate-200">
                    <h3 className="font-bold text-sm text-slate-700">Locais de Trabalho / Lojas</h3>
                    <button onClick={() => setIsLocationModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 text-sm">
                        <Building size={16}/> Novo Local
                    </button>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-700 text-white uppercase text-xs">
                        <tr>
                            <th className="p-3">Nome</th>
                            <th className="p-3">Endereço</th>
                            <th className="p-3">Gerente</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                        {workLocations.map(w => (
                            <tr key={w.id} className="hover:bg-slate-50">
                                <td className="p-3 font-bold">{w.name}</td>
                                <td className="p-3">{w.address}</td>
                                <td className="p-3">{w.managerName}</td>
                                <td className="p-3 text-right flex justify-end gap-2">
                                    {onViewLocationDashboard && (
                                        <button onClick={() => onViewLocationDashboard(w.id)} className="text-blue-500 hover:text-blue-700 p-2" title="Dashboard Local"><LayoutDashboard size={16}/></button>
                                    )}
                                    <button onClick={() => onDeleteWorkLocation(w.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* Location Modal */}
        {isLocationModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
                    <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Novo Local</h3>
                        <button onClick={() => setIsLocationModalOpen(false)}><X size={20}/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <input className="w-full border p-2 rounded" placeholder="Nome do Local (Ex: Loja 1)" value={newLocation.name || ''} onChange={e => setNewLocation({...newLocation, name: e.target.value})} />
                        <input className="w-full border p-2 rounded" placeholder="Endereço" value={newLocation.address || ''} onChange={e => setNewLocation({...newLocation, address: e.target.value})} />
                        <input className="w-full border p-2 rounded" placeholder="Responsável" value={newLocation.managerName || ''} onChange={e => setNewLocation({...newLocation, managerName: e.target.value})} />
                    </div>
                    <div className="p-4 border-t flex justify-end gap-2">
                        <button onClick={() => setIsLocationModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                        <button onClick={handleSaveLocation} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Salvar</button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'CASH_REGISTERS' && (
            <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
                <div className="p-4 flex justify-between items-center bg-slate-100 border-b border-slate-200">
                    <h3 className="font-bold text-sm text-slate-700">Caixas / Terminais</h3>
                    <button onClick={() => setIsCashModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 text-sm">
                        <CreditCard size={16}/> Novo Caixa
                    </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {cashRegisters.map(cr => (
                        <div key={cr.id} className="border rounded-xl p-4 hover:shadow-md transition bg-slate-50">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-800">{cr.name}</h4>
                                <button onClick={() => onDeleteCashRegister(cr.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${cr.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {cr.status === 'OPEN' ? 'ABERTO' : 'FECHADO'}
                                </span>
                                <span className="font-mono font-bold">{formatCurrency(cr.balance)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Cash Register Modal */}
        {isCashModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
                    <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Novo Caixa</h3>
                        <button onClick={() => setIsCashModalOpen(false)}><X size={20}/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <input className="w-full border p-2 rounded" placeholder="Nome (Ex: Caixa 01)" value={newCashRegister.name || ''} onChange={e => setNewCashRegister({...newCashRegister, name: e.target.value})} />
                        <select className="w-full border p-2 rounded" value={newCashRegister.status} onChange={e => setNewCashRegister({...newCashRegister, status: e.target.value as any})}>
                            <option value="CLOSED">Fechado</option>
                            <option value="OPEN">Aberto</option>
                        </select>
                        <input className="w-full border p-2 rounded" type="number" placeholder="Saldo Inicial" value={newCashRegister.balance || ''} onChange={e => setNewCashRegister({...newCashRegister, balance: Number(e.target.value)})} />
                    </div>
                    <div className="p-4 border-t flex justify-end gap-2">
                        <button onClick={() => setIsCashModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                        <button onClick={handleSaveCashRegister} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Salvar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Settings;
