
import React, { useState, useMemo } from 'react';
import { Invoice, Purchase, InvoiceStatus, InvoiceType } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { 
  X, Printer, ArrowLeft, Calendar, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle, PieChart, BarChart2, DollarSign, 
  Activity, Lightbulb 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell 
} from 'recharts';

interface BusinessOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  invoices: Invoice[];
  purchases: Purchase[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const BusinessOverviewModal: React.FC<BusinessOverviewModalProps> = ({ 
  isOpen, onClose, onBack, invoices, purchases 
}) => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [year, setYear] = useState(new Date().getFullYear());

  // --- CALCULATIONS ---
  const data = useMemo(() => {
    // Filter by Date Range
    const filteredInvoices = invoices.filter(i => {
      const d = new Date(i.date);
      return d >= new Date(startDate) && d <= new Date(endDate) && i.isCertified && i.status !== InvoiceStatus.CANCELLED;
    });

    // REMOVED PENDING FILTER - Show all expenses regardless of payment status
    const filteredPurchases = purchases.filter(p => {
      const d = new Date(p.date);
      return d >= new Date(startDate) && d <= new Date(endDate);
    });

    // 1. Sales Metrics
    const totalSales = filteredInvoices.reduce((acc, i) => acc + (i.currency === 'AOA' ? i.total : i.contraValue || i.total), 0);
    const countSales = filteredInvoices.length;
    const uniqueClients = new Set(filteredInvoices.map(i => i.clientId)).size;
    const avgTicket = countSales > 0 ? totalSales / countSales : 0;

    // 2. Purchase Metrics
    const totalPurchases = filteredPurchases.reduce((acc, p) => acc + p.total, 0);
    const countPurchases = filteredPurchases.length;

    // 3. Taxes
    const ivaLiquidado = filteredInvoices.reduce((acc, i) => acc + i.taxAmount, 0); // To Pay
    const ivaDedutivel = filteredPurchases.reduce((acc, p) => acc + p.taxAmount, 0); // To Recover
    const ivaDiferencial = ivaLiquidado - ivaDedutivel;

    // 4. Charts Data (Daily Evolution)
    const dailyMap = new Map<string, { date: string, sales: number, purchases: number }>();
    
    // Populate Sales
    filteredInvoices.forEach(i => {
       const dateKey = formatDate(i.date);
       const curr = dailyMap.get(dateKey) || { date: dateKey, sales: 0, purchases: 0 };
       curr.sales += (i.currency === 'AOA' ? i.total : i.contraValue || i.total);
       dailyMap.set(dateKey, curr);
    });

    // Populate Purchases
    filteredPurchases.forEach(p => {
       const dateKey = formatDate(p.date);
       const curr = dailyMap.get(dateKey) || { date: dateKey, sales: 0, purchases: 0 };
       curr.purchases += p.total;
       dailyMap.set(dateKey, curr);
    });

    const chartData = Array.from(dailyMap.values()).sort((a,b) => {
        // Simple sort by date string (PT format dd/mm/yyyy needs manual sort logic or ISO comparison, simplified here)
        return 0; 
    });

    // Pie Chart Data (Sales by Type)
    const salesByType = [
        { name: 'Produtos', value: filteredInvoices.flatMap(i => i.items).filter(item => item.type === 'PRODUCT').reduce((acc, item) => acc + item.total, 0) },
        { name: 'Serviços', value: filteredInvoices.flatMap(i => i.items).filter(item => item.type === 'SERVICE').reduce((acc, item) => acc + item.total, 0) },
    ].filter(i => i.value > 0);

    // 5. Suggestions
    const suggestions = [];
    const balance = totalSales - totalPurchases;

    if (totalSales === 0) {
        suggestions.push({ type: 'CRITICAL', msg: 'Sem vendas no período selecionado. Verifique a estratégia comercial.' });
    } else if (totalSales < totalPurchases) {
        suggestions.push({ type: 'CRITICAL', msg: 'Despesas superiores às receitas. Corte de custos recomendado.' });
    } else if (balance > 0 && balance < totalSales * 0.1) {
        suggestions.push({ type: 'WARNING', msg: 'Margem de lucro muito baixa (<10%). Revise a precificação.' });
    } else {
        suggestions.push({ type: 'SUCCESS', msg: 'Balanço positivo. Ótimo momento para reinvestir.' });
    }

    if (ivaDiferencial > 0) {
        suggestions.push({ type: 'INFO', msg: `Previsão de IVA a pagar: ${formatCurrency(ivaDiferencial)}` });
    } else {
        suggestions.push({ type: 'SUCCESS', msg: `Crédito de IVA a recuperar: ${formatCurrency(Math.abs(ivaDiferencial))}` });
    }

    return {
        totalSales, countSales, uniqueClients, avgTicket,
        totalPurchases, countPurchases,
        ivaLiquidado, ivaDedutivel, ivaDiferencial,
        chartData, salesByType, suggestions, balance
    };

  }, [invoices, purchases, startDate, endDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in fade-in duration-300 font-sans">
        {/* HEADER */}
        <div className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                    <Activity size={24} className="text-blue-400"/>
                </div>
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-tight">Visão Geral do Negócio</h1>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-bold text-white">IMATEC SOFTWARE</span>
                        <span>•</span>
                        <span>Business Intelligence</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={onBack} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-sm transition flex items-center gap-2">
                    <ArrowLeft size={16}/> Voltar
                </button>
                <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-sm transition flex items-center gap-2 shadow-lg shadow-blue-900/50">
                    <Printer size={16}/> Imprimir
                </button>
                <button onClick={onClose} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-sm transition flex items-center gap-2 shadow-lg shadow-red-900/50">
                    <X size={16}/> Fechar Página
                </button>
            </div>
        </div>

        {/* CONTROLS */}
        <div className="bg-white border-b border-slate-200 p-4 sticky top-[80px] z-40 shadow-sm">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <div className="px-3 py-1 font-bold text-slate-500 text-xs uppercase">Período</div>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white border rounded px-2 py-1 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"/>
                    <span className="text-slate-400">a</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white border rounded px-2 py-1 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <div className="px-3 py-1 font-bold text-slate-500 text-xs uppercase">Ano</div>
                    <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-white border rounded px-2 py-1 text-sm font-bold text-slate-700 outline-none">
                        <option value={2023}>2023</option>
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                    </select>
                </div>
                <button className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-black transition flex items-center gap-2 ml-auto">
                    <TrendingUp size={16}/> Atualizar Dados
                </button>
            </div>
        </div>

        {/* DASHBOARD CONTENT */}
        <div className="max-w-7xl mx-auto p-6 space-y-8 pb-20">
            
            {/* 1. KEY METRICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Sales Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={64} className="text-blue-600"/>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total Vendas</p>
                    <h3 className="text-3xl font-black text-slate-800 mb-2">{formatCurrency(data.totalSales)}</h3>
                    <div className="flex gap-2 text-xs">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{data.countSales} Docs</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{data.uniqueClients} Clientes</span>
                    </div>
                </div>

                {/* Purchases Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown size={64} className="text-orange-600"/>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total Compras</p>
                    <h3 className="text-3xl font-black text-slate-800 mb-2">{formatCurrency(data.totalPurchases)}</h3>
                    <div className="flex gap-2 text-xs">
                        <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-bold">{data.countPurchases} Docs</span>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={64} className={data.balance >= 0 ? "text-green-600" : "text-red-600"}/>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase mb-1">Resultado (Vendas - Compras)</p>
                    <h3 className={`text-3xl font-black mb-2 ${data.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(data.balance)}
                    </h3>
                    <div className="flex gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded font-bold ${data.balance >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {data.balance >= 0 ? "Lucro Operacional" : "Prejuízo Operacional"}
                        </span>
                    </div>
                </div>

                {/* Tax Card */}
                <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                        <PieChart size={64} className="text-white"/>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Previsão de IVA</p>
                    <h3 className="text-3xl font-black mb-2">{formatCurrency(Math.abs(data.ivaDiferencial))}</h3>
                    <div className="flex gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded font-bold ${data.ivaDiferencial > 0 ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
                            {data.ivaDiferencial > 0 ? "A PAGAR" : "A RECUPERAR"}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. CHARTS & DETAILED ANALYSIS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BarChart2 className="text-blue-600"/> Evolução Diária (Vendas vs Compras)
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}}/>
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => `${val/1000}k`}/>
                                <Tooltip 
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                    formatter={(value: any) => formatCurrency(value)}
                                />
                                <Legend />
                                <Bar dataKey="sales" name="Vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20}/>
                                <Bar dataKey="purchases" name="Compras" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Circular Metrics */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <PieChart className="text-purple-600"/> Composição de Vendas
                        </h3>
                        <div className="flex-1 min-h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={data.salesByType}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.salesByType.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => formatCurrency(value)}/>
                                    <Legend verticalAlign="bottom" height={36}/>
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. AI SUGGESTIONS */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                    <Lightbulb className="text-yellow-500" fill="currentColor"/> Sugestões e Alertas do Sistema
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.suggestions.map((s, idx) => (
                        <div 
                            key={idx} 
                            className={`p-4 rounded-xl border-l-4 shadow-sm flex items-start gap-3 ${
                                s.type === 'CRITICAL' ? 'bg-red-50 border-red-500 text-red-900' :
                                s.type === 'WARNING' ? 'bg-yellow-50 border-yellow-500 text-yellow-900' :
                                s.type === 'INFO' ? 'bg-blue-50 border-blue-500 text-blue-900' :
                                'bg-green-50 border-green-500 text-green-900'
                            }`}
                        >
                            <div className="mt-1">
                                {s.type === 'CRITICAL' ? <AlertTriangle size={20}/> :
                                 s.type === 'WARNING' ? <AlertTriangle size={20}/> :
                                 s.type === 'INFO' ? <Activity size={20}/> :
                                 <CheckCircle size={20}/>}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm uppercase mb-1">{s.type === 'CRITICAL' ? 'Alerta Crítico' : s.type === 'WARNING' ? 'Atenção' : s.type === 'INFO' ? 'Informação' : 'Bom Trabalho'}</h4>
                                <p className="text-sm font-medium opacity-90">{s.msg}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. DETAILED SUMMARY TABLE */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 p-4 border-b border-slate-200 font-bold text-slate-700 text-sm uppercase">
                    Resumo Fiscal Detalhado
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase">
                        <tr>
                            <th className="p-4">Indicador</th>
                            <th className="p-4 text-right">Base Tributável</th>
                            <th className="p-4 text-right">Imposto (IVA)</th>
                            <th className="p-4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr>
                            <td className="p-4 font-bold text-blue-700">Entradas (Vendas)</td>
                            <td className="p-4 text-right">{formatCurrency(data.totalSales - data.ivaLiquidado)}</td>
                            <td className="p-4 text-right">{formatCurrency(data.ivaLiquidado)}</td>
                            <td className="p-4 text-right font-bold">{formatCurrency(data.totalSales)}</td>
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-orange-700">Saídas (Compras)</td>
                            <td className="p-4 text-right">{formatCurrency(data.totalPurchases - data.ivaDedutivel)}</td>
                            <td className="p-4 text-right">{formatCurrency(data.ivaDedutivel)}</td>
                            <td className="p-4 text-right font-bold">{formatCurrency(data.totalPurchases)}</td>
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                            <td className="p-4 uppercase">Diferencial (Apuramento)</td>
                            <td className="p-4 text-right">-</td>
                            <td className={`p-4 text-right ${data.ivaDiferencial > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(data.ivaDiferencial)}
                            </td>
                            <td className="p-4 text-right">{formatCurrency(data.balance)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    </div>
  );
};

export default BusinessOverviewModal;
