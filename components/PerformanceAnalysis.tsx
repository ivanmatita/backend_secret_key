
import React, { useState, useMemo } from 'react';
import { UserActivityLog, Employee, User, DisciplinaryAction } from '../types';
import { formatDate, generateId } from '../utils';
import { printDocument, downloadPDF } from "../utils/exportUtils";
import { 
  Search, Download, Printer, Filter, BarChart3, Clock, FileText, 
  AlertTriangle, Upload, X, Shield, Activity, Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceAnalysisProps {
  logs: UserActivityLog[];
  employees: Employee[];
  users: User[];
}

const PerformanceAnalysis: React.FC<PerformanceAnalysisProps> = ({ logs, employees, users }) => {
  const [activeTab, setActiveTab] = useState<'LOGS' | 'STATS' | 'DISCIPLINARY'>('LOGS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal for Disciplinary Action
  const [showDisciplinaryModal, setShowDisciplinaryModal] = useState(false);
  const [newAction, setNewAction] = useState<Partial<DisciplinaryAction>>({ type: 'VERBAL_WARNING', status: 'OPEN' });

  // Filtering Logs
  const filteredLogs = useMemo(() => {
      return logs.filter(log => {
          const matchUser = selectedUser === 'ALL' || log.userId === selectedUser;
          const matchSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              log.details?.toLowerCase().includes(searchTerm.toLowerCase());
          const logDate = new Date(log.timestamp).toISOString().split('T')[0];
          const matchDate = logDate === dateFilter;
          
          return matchUser && matchSearch && matchDate;
      }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, selectedUser, searchTerm, dateFilter]);

  // Statistics Calculation
  const stats = useMemo(() => {
      const userStats: Record<string, { docs: number, logins: number, lastActive: string }> = {};
      
      logs.forEach(log => {
          if (!userStats[log.userId]) {
              userStats[log.userId] = { docs: 0, logins: 0, lastActive: log.timestamp };
          }
          
          if (log.action === 'Create Document' || log.action.includes('Sale')) {
              userStats[log.userId].docs += 1;
          }
          if (log.action === 'Login') {
              userStats[log.userId].logins += 1;
          }
          if (new Date(log.timestamp) > new Date(userStats[log.userId].lastActive)) {
              userStats[log.userId].lastActive = log.timestamp;
          }
      });

      // Chart Data
      const chartData = Object.keys(userStats).map(uid => {
          const u = users.find(user => user.id === uid);
          return {
              name: u?.name || 'Unknown',
              docs: userStats[uid].docs,
              logins: userStats[uid].logins
          };
      });

      return { userStats, chartData };
  }, [logs, users]);

  const handleSaveDisciplinary = () => {
      alert("Processo Disciplinar registado com sucesso (Simulação).");
      setShowDisciplinaryModal(false);
      setNewAction({ type: 'VERBAL_WARNING', status: 'OPEN' });
  };

  const calculateTimeOnline = (userId: string) => {
      // Mock calculation based on logins count to simulate time
      const loginCount = stats.userStats[userId]?.logins || 0;
      return `${loginCount * 2}h 30m`; 
  };

  const getEfficiency = (userId: string) => {
      const docs = stats.userStats[userId]?.docs || 0;
      if (docs > 20) return { label: 'ALTO', color: 'text-green-600' };
      if (docs > 5) return { label: 'MÉDIO', color: 'text-yellow-600' };
      return { label: 'BAIXO', color: 'text-red-600' };
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in pb-20 font-sans" id="performanceContainer">
        
        {/* Header */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="text-blue-600"/> Análise de Desempenho
                </h1>
                <p className="text-xs text-slate-500">Monitorização de atividade e produtividade</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('LOGS')} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${activeTab === 'LOGS' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}>Registos</button>
                <button onClick={() => setActiveTab('STATS')} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${activeTab === 'STATS' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}>Estatísticas</button>
                <button onClick={() => setActiveTab('DISCIPLINARY')} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${activeTab === 'DISCIPLINARY' ? 'bg-red-600 text-white' : 'bg-white border text-slate-600'}`}>Disciplinar</button>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Utilizador</label>
                <select className="w-full p-2 border rounded-lg bg-white" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                    <option value="ALL">Todos os Utilizadores</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                <input type="date" className="w-full p-2 border rounded-lg" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            </div>
            <div className="md:col-span-2 relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pesquisar Ação</label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                    <input 
                        className="w-full pl-10 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Login, Fatura, Cadastro..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {/* Content based on Tab */}
        {activeTab === 'LOGS' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm uppercase">Registo Diário de Atividade</h3>
                    <div className="flex gap-2">
                        <button onClick={() => printDocument("performanceContainer")} className="text-xs font-bold text-slate-600 flex items-center gap-1 hover:text-blue-600"><Printer size={14}/> Imprimir</button>
                        <button onClick={() => downloadPDF("performanceContainer", "Performance.pdf")} className="text-xs font-bold text-slate-600 flex items-center gap-1 hover:text-green-600"><Download size={14}/> PDF</button>
                    </div>
                </div>
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                        <tr>
                            <th className="p-4">Hora</th>
                            <th className="p-4">Utilizador</th>
                            <th className="p-4">Módulo</th>
                            <th className="p-4">Ação</th>
                            <th className="p-4">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-blue-50 transition-colors">
                                <td className="p-4 font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                <td className="p-4 font-bold text-slate-800">{log.userName}</td>
                                <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold border border-slate-200">{log.module}</span></td>
                                <td className="p-4 font-medium text-blue-700">{log.action}</td>
                                <td className="p-4 text-slate-600">{log.details}</td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">Sem atividade registada para os filtros selecionados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'STATS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3/> Produtividade (Documentos vs Logins)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="docs" name="Documentos Gerados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="logins" name="Acessos" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User Cards */}
                <div className="space-y-4">
                    {users.map(u => {
                        const efficiency = getEfficiency(u.id);
                        return (
                            <div key={u.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-800">{u.name}</h4>
                                        <p className="text-xs text-slate-500">{u.role}</p>
                                    </div>
                                    <div className={`text-xs font-black px-2 py-1 rounded border ${efficiency.color === 'text-green-600' ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'} ${efficiency.color}`}>
                                        {efficiency.label}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                    <div className="bg-slate-50 p-2 rounded">
                                        <span className="block text-slate-400">Tempo Online</span>
                                        <span className="font-bold text-slate-700">{calculateTimeOnline(u.id)}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded">
                                        <span className="block text-slate-400">Docs Hoje</span>
                                        <span className="font-bold text-blue-600">{stats.userStats[u.id]?.docs || 0}</span>
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-400 text-right mt-1">
                                    Último Acesso: {stats.userStats[u.id]?.lastActive ? new Date(stats.userStats[u.id].lastActive).toLocaleString() : 'N/A'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {activeTab === 'DISCIPLINARY' && (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <button onClick={() => setShowDisciplinaryModal(true)} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 shadow-lg">
                        <AlertTriangle size={18}/> Novo Processo / Ocorrência
                    </button>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                    <Shield size={48} className="mx-auto mb-4 opacity-20"/>
                    <p>Sem processos disciplinares registados recentemente.</p>
                </div>
            </div>
        )}

        {/* DISCIPLINARY MODAL */}
        {showDisciplinaryModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl animate-in zoom-in-95">
                    <div className="bg-red-700 text-white p-6 flex justify-between items-center rounded-t-xl">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Shield/> Registo Disciplinar</h3>
                        <button onClick={() => setShowDisciplinaryModal(false)}><X/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Funcionário</label>
                            <select className="w-full p-2 border rounded-lg bg-white" value={newAction.employeeId || ''} onChange={e => setNewAction({...newAction, employeeId: e.target.value})}>
                                <option value="">Selecione...</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tipo de Ação</label>
                            <select className="w-full p-2 border rounded-lg bg-white" value={newAction.type} onChange={e => setNewAction({...newAction, type: e.target.value as any})}>
                                <option value="VERBAL_WARNING">Aviso Verbal</option>
                                <option value="WRITTEN_WARNING">Aviso Escrito (Ocorrência)</option>
                                <option value="SUSPENSION">Suspensão</option>
                                <option value="DISMISSAL">Processo Disciplinar (Demissão)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Data</label>
                            <input type="date" className="w-full p-2 border rounded-lg" onChange={e => setNewAction({...newAction, date: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Descrição Detalhada</label>
                            <textarea className="w-full p-2 border rounded-lg h-32 resize-none" placeholder="Descreva o motivo..." onChange={e => setNewAction({...newAction, description: e.target.value})}></textarea>
                        </div>
                        <div className="flex items-center gap-4 border-t pt-4">
                            <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-4 py-2 rounded-lg hover:bg-slate-200 transition text-xs font-bold text-slate-600">
                                <Upload size={16}/> Anexar Provas (PDF/IMG)
                                <input type="file" className="hidden"/>
                            </label>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-b-xl flex justify-end gap-2">
                        <button onClick={() => setShowDisciplinaryModal(false)} className="px-4 py-2 border rounded hover:bg-white">Cancelar</button>
                        <button onClick={handleSaveDisciplinary} className="px-6 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 shadow-md">Registar Ocorrência</button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default PerformanceAnalysis;
