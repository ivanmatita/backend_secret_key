
import React, { useState } from 'react';
import { CashRegister, CashMovement, Invoice, Purchase, InvoiceStatus } from '../types';
import { formatCurrency, formatDate, generateId } from '../utils';
import { CreditCard, Plus, ArrowRightLeft, TrendingUp, TrendingDown, DollarSign, Wallet, Calendar, Search, Filter, Edit2 } from 'lucide-react';

interface CashManagerProps {
  cashRegisters: CashRegister[];
  onUpdateCashRegister: (cr: CashRegister) => void;
  movements: CashMovement[];
  onAddMovement: (m: CashMovement) => void;
  invoices: Invoice[];
  purchases: Purchase[];
}

const CashManager: React.FC<CashManagerProps> = ({ cashRegisters, onUpdateCashRegister, movements, onAddMovement, invoices, purchases }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'REGISTERS' | 'OPERATIONS' | 'HISTORY'>('DASHBOARD');
  
  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingRegister, setEditingRegister] = useState<Partial<CashRegister>>({});
  
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [operationType, setOperationType] = useState<'ENTRY' | 'EXIT' | 'TRANSFER'>('ENTRY');
  const [opAmount, setOpAmount] = useState<number>(0);
  const [opDesc, setOpDesc] = useState('');
  const [opSourceId, setOpSourceId] = useState('');
  const [opTargetId, setOpTargetId] = useState('');

  // Automatic movements from Sales/Purchases
  const salesMovements: CashMovement[] = invoices
    .filter(i => i.status === InvoiceStatus.PAID && i.paymentMethod && i.cashRegisterId)
    .map(i => ({
        id: `sale-${i.id}`,
        date: i.date,
        type: 'ENTRY',
        amount: i.currency === 'AOA' ? i.total : i.contraValue || i.total,
        description: `Venda ${i.type} ${i.number}`,
        cashRegisterId: i.cashRegisterId!,
        documentRef: i.number,
        operatorName: i.operatorName || 'System',
        source: 'SALES'
    }));

  const purchaseMovements: CashMovement[] = purchases
    .filter(p => p.status === 'PAID' && p.paymentMethod && p.cashRegisterId)
    .map(p => ({
        id: `purch-${p.id}`,
        date: p.date,
        type: 'EXIT',
        amount: p.total, // Assuming Purchase currency handling similar to Invoice if needed
        description: `Pagamento Compra ${p.documentNumber}`,
        cashRegisterId: p.cashRegisterId!,
        documentRef: p.documentNumber,
        operatorName: 'System',
        source: 'PURCHASES'
    }));

  const allMovements = [...movements, ...salesMovements, ...purchaseMovements].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSaveRegister = () => {
      if (!editingRegister.name) return alert("Nome obrigatório");
      const updated: CashRegister = {
          id: editingRegister.id || generateId(),
          name: editingRegister.name!,
          status: editingRegister.status || 'CLOSED',
          balance: editingRegister.balance || 0,
          initialBalance: editingRegister.initialBalance || 0,
          operatorId: editingRegister.operatorId
      };
      onUpdateCashRegister(updated);
      setShowRegisterModal(false);
      setEditingRegister({});
  };

  const handleOperation = () => {
      if (opAmount <= 0) return alert("Valor inválido");
      if (!opSourceId) return alert("Selecione caixa de origem/destino");
      if (operationType === 'TRANSFER' && !opTargetId) return alert("Selecione caixa de destino");

      // 1. Log Movement
      const movement: CashMovement = {
          id: generateId(),
          date: new Date().toISOString(),
          type: operationType === 'TRANSFER' ? 'TRANSFER_OUT' : operationType,
          amount: opAmount,
          description: opDesc || (operationType === 'ENTRY' ? 'Reforço de Caixa' : operationType === 'EXIT' ? 'Saída de Caixa' : 'Transferência'),
          cashRegisterId: opSourceId,
          targetCashRegisterId: opTargetId,
          operatorName: 'Admin', // In real app, use context
          source: 'MANUAL'
      };
      onAddMovement(movement);

      // 2. Update Balances
      const sourceReg = cashRegisters.find(c => c.id === opSourceId);
      if (sourceReg) {
          const newBalance = operationType === 'ENTRY' ? sourceReg.balance + opAmount : sourceReg.balance - opAmount;
          onUpdateCashRegister({ ...sourceReg, balance: newBalance });
      }

      if (operationType === 'TRANSFER') {
          const targetReg = cashRegisters.find(c => c.id === opTargetId);
          if (targetReg) {
              onUpdateCashRegister({ ...targetReg, balance: targetReg.balance + opAmount });
              // Log Incoming Transfer
              onAddMovement({
                  id: generateId(),
                  date: new Date().toISOString(),
                  type: 'TRANSFER_IN',
                  amount: opAmount,
                  description: `Transf. de ${sourceReg?.name}`,
                  cashRegisterId: opTargetId,
                  operatorName: 'Admin',
                  source: 'MANUAL'
              });
          }
      }

      setShowOperationModal(false);
      setOpAmount(0);
      setOpDesc('');
  };

  const getTotalBalance = () => cashRegisters.reduce((acc, c) => acc + c.balance, 0);

  return (
    <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in pb-20">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Wallet/> Gestão de Caixa</h1>
                <p className="text-xs text-slate-500">Controlo de tesouraria e movimentos</p>
            </div>
            <div className="flex gap-2">
                {['DASHBOARD', 'REGISTERS', 'OPERATIONS', 'HISTORY'].map(t => (
                    <button 
                        key={t}
                        onClick={() => setActiveTab(t as any)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm border ${activeTab === t ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                        {t === 'DASHBOARD' ? 'Visão Geral' : t === 'REGISTERS' ? 'Caixas' : t === 'OPERATIONS' ? 'Operações' : 'Movimentos'}
                    </button>
                ))}
            </div>
        </div>

        {activeTab === 'DASHBOARD' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-xs uppercase font-bold">Saldo Total (Todas Caixas)</p>
                            <h2 className="text-3xl font-black text-blue-600">{formatCurrency(getTotalBalance())}</h2>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={32}/></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-xs uppercase font-bold">Entradas Hoje</p>
                            <h2 className="text-2xl font-bold text-emerald-600">
                                {formatCurrency(allMovements.filter(m => (m.type === 'ENTRY' || m.type === 'TRANSFER_IN') && new Date(m.date).toDateString() === new Date().toDateString()).reduce((a, b) => a + b.amount, 0))}
                            </h2>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={24}/></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-xs uppercase font-bold">Saídas Hoje</p>
                            <h2 className="text-2xl font-bold text-red-600">
                                {formatCurrency(allMovements.filter(m => (m.type === 'EXIT' || m.type === 'TRANSFER_OUT') && new Date(m.date).toDateString() === new Date().toDateString()).reduce((a, b) => a + b.amount, 0))}
                            </h2>
                        </div>
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={24}/></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Saldos por Caixa</h3>
                        <div className="space-y-3">
                            {cashRegisters.map(c => (
                                <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${c.status === 'OPEN' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-700">{c.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase">{c.status === 'OPEN' ? 'Aberto' : 'Fechado'}</p>
                                        </div>
                                    </div>
                                    <span className="font-mono font-bold text-slate-800">{formatCurrency(c.balance)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Últimos Movimentos</h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {allMovements.slice(0, 5).map(m => (
                                <div key={m.id} className="flex justify-between items-center text-xs p-2 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                    <div className="flex items-center gap-2">
                                        {m.type.includes('ENTRY') || m.type.includes('IN') ? <TrendingUp size={14} className="text-green-500"/> : <TrendingDown size={14} className="text-red-500"/>}
                                        <div>
                                            <p className="font-bold text-slate-700">{m.description}</p>
                                            <p className="text-slate-400">{formatDate(m.date)}</p>
                                        </div>
                                    </div>
                                    <span className={`font-bold ${m.type.includes('ENTRY') || m.type.includes('IN') ? 'text-green-600' : 'text-red-600'}`}>
                                        {m.type.includes('ENTRY') || m.type.includes('IN') ? '+' : '-'} {formatCurrency(m.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'REGISTERS' && (
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button onClick={() => { setEditingRegister({}); setShowRegisterModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700">
                        <Plus size={16}/> Criar Caixa
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {cashRegisters.map(c => (
                        <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg text-slate-800">{c.name}</h3>
                                <button onClick={() => { setEditingRegister(c); setShowRegisterModal(true); }} className="text-slate-400 hover:text-blue-600"><Edit2 size={16}/></button>
                            </div>
                            <div className="mb-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${c.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {c.status === 'OPEN' ? 'CAIXA ABERTO' : 'CAIXA FECHADO'}
                                </span>
                            </div>
                            <div className="flex justify-between items-end border-t pt-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Saldo Atual</p>
                                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(c.balance)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase text-right">Saldo Inicial</p>
                                    <p className="text-sm font-medium text-slate-600 text-right">{formatCurrency(c.initialBalance || 0)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'OPERATIONS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button onClick={() => { setOperationType('ENTRY'); setShowOperationModal(true); }} className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl flex flex-col items-center justify-center gap-4 hover:bg-emerald-100 transition group">
                    <div className="p-4 bg-white rounded-full text-emerald-600 shadow-sm group-hover:scale-110 transition"><Plus size={32}/></div>
                    <h3 className="font-bold text-emerald-800 text-lg">Entrada / Reforço</h3>
                    <p className="text-xs text-emerald-600 text-center">Inserir dinheiro manualmente no caixa</p>
                </button>
                <button onClick={() => { setOperationType('EXIT'); setShowOperationModal(true); }} className="bg-red-50 border border-red-200 p-8 rounded-xl flex flex-col items-center justify-center gap-4 hover:bg-red-100 transition group">
                    <div className="p-4 bg-white rounded-full text-red-600 shadow-sm group-hover:scale-110 transition"><TrendingDown size={32}/></div>
                    <h3 className="font-bold text-red-800 text-lg">Saída / Sangria</h3>
                    <p className="text-xs text-red-600 text-center">Retirar dinheiro manualmente</p>
                </button>
                <button onClick={() => { setOperationType('TRANSFER'); setShowOperationModal(true); }} className="bg-blue-50 border border-blue-200 p-8 rounded-xl flex flex-col items-center justify-center gap-4 hover:bg-blue-100 transition group">
                    <div className="p-4 bg-white rounded-full text-blue-600 shadow-sm group-hover:scale-110 transition"><ArrowRightLeft size={32}/></div>
                    <h3 className="font-bold text-blue-800 text-lg">Transferência Intercaixas</h3>
                    <p className="text-xs text-blue-600 text-center">Mover valores entre caixas</p>
                </button>
            </div>
        )}

        {activeTab === 'HISTORY' && (
            <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
                <div className="bg-slate-100 p-3 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm">Histórico Geral de Movimentos</h3>
                    <div className="flex gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded flex items-center gap-1"><TrendingUp size={12}/> Vendas</span>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded flex items-center gap-1"><TrendingDown size={12}/> Compras</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded flex items-center gap-1"><Edit2 size={12}/> Manual</span>
                    </div>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-700 text-white font-bold text-xs uppercase">
                        <tr>
                            <th className="p-3">Data</th>
                            <th className="p-3">Descrição</th>
                            <th className="p-3">Caixa</th>
                            <th className="p-3">Tipo</th>
                            <th className="p-3">Origem</th>
                            <th className="p-3 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {allMovements.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50 text-xs">
                                <td className="p-3">{formatDate(m.date)}</td>
                                <td className="p-3 font-medium">{m.description}</td>
                                <td className="p-3">{cashRegisters.find(c => c.id === m.cashRegisterId)?.name}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded font-bold ${m.type.includes('ENTRY') || m.type.includes('IN') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                        {m.type}
                                    </span>
                                </td>
                                <td className="p-3">{m.source}</td>
                                <td className="p-3 text-right font-bold font-mono">{formatCurrency(m.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* Create/Edit Register Modal */}
        {showRegisterModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-xl animate-in zoom-in-95">
                    <h3 className="font-bold text-lg mb-4">{editingRegister.id ? 'Editar Caixa' : 'Criar Caixa'}</h3>
                    <div className="space-y-4">
                        <input className="w-full border p-2 rounded" placeholder="Nome da Caixa" value={editingRegister.name || ''} onChange={e => setEditingRegister({...editingRegister, name: e.target.value})}/>
                        <select className="w-full border p-2 rounded" value={editingRegister.status} onChange={e => setEditingRegister({...editingRegister, status: e.target.value as any})}>
                            <option value="CLOSED">Fechado</option>
                            <option value="OPEN">Aberto</option>
                        </select>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Saldo Inicial</label>
                            <input type="number" className="w-full border p-2 rounded" placeholder="0.00" value={editingRegister.initialBalance || ''} onChange={e => setEditingRegister({...editingRegister, initialBalance: Number(e.target.value)})}/>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setShowRegisterModal(false)} className="px-4 py-2 border rounded">Cancelar</button>
                        <button onClick={handleSaveRegister} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Salvar</button>
                    </div>
                </div>
            </div>
        )}

        {/* Operation Modal */}
        {showOperationModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-xl animate-in zoom-in-95">
                    <h3 className="font-bold text-lg mb-4">
                        {operationType === 'ENTRY' ? 'Entrada de Valores' : operationType === 'EXIT' ? 'Saída de Valores' : 'Transferência'}
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Valor</label>
                            <input type="number" className="w-full border p-2 rounded text-lg font-bold" placeholder="0.00" value={opAmount} onChange={e => setOpAmount(Number(e.target.value))}/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">{operationType === 'ENTRY' ? 'Caixa Destino' : 'Caixa Origem'}</label>
                            <select className="w-full border p-2 rounded" value={opSourceId} onChange={e => setOpSourceId(e.target.value)}>
                                <option value="">Selecione...</option>
                                {cashRegisters.map(c => <option key={c.id} value={c.id}>{c.name} ({formatCurrency(c.balance)})</option>)}
                            </select>
                        </div>
                        {operationType === 'TRANSFER' && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Caixa Destino</label>
                                <select className="w-full border p-2 rounded" value={opTargetId} onChange={e => setOpTargetId(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {cashRegisters.filter(c => c.id !== opSourceId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Motivo / Descrição</label>
                            <input className="w-full border p-2 rounded" placeholder="Justificação" value={opDesc} onChange={e => setOpDesc(e.target.value)}/>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setShowOperationModal(false)} className="px-4 py-2 border rounded">Cancelar</button>
                        <button onClick={handleOperation} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Confirmar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CashManager;
