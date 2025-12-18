
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { Invoice, InvoiceStatus } from '../types';
import { formatCurrency } from '../utils';
import { TrendingUp, AlertCircle, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { analyzeFinancialHealth } from '../services/geminiService';

interface DashboardProps {
  invoices: Invoice[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ invoices }) => {
  const [aiInsights, setAiInsights] = useState<string>("A analisar dados...");

  // Helper to get total in AOA (Use Contravalor if exists, else Total)
  const getAmountInAoa = (inv: Invoice) => {
      // If currency is AOA, use total. If not, use contraValue (which is calculated in AOA). 
      // Fallback to total if contraValue missing (shouldn't happen in updated app).
      return inv.currency === 'AOA' ? inv.total : (inv.contraValue || inv.total);
  };

  // Stats Calculation
  const totalRevenue = invoices
    .filter(i => i.status === InvoiceStatus.PAID)
    .reduce((acc, curr) => acc + getAmountInAoa(curr), 0);

  const pendingAmount = invoices
    .filter(i => i.status === InvoiceStatus.PENDING)
    .reduce((acc, curr) => acc + getAmountInAoa(curr), 0);

  const overdueAmount = invoices
    .filter(i => i.status === InvoiceStatus.OVERDUE)
    .reduce((acc, curr) => acc + getAmountInAoa(curr), 0);

  // Chart Data Preparation
  const dataByStatus = [
    { name: 'Pago', value: invoices.filter(i => i.status === InvoiceStatus.PAID).length },
    { name: 'Pendente', value: invoices.filter(i => i.status === InvoiceStatus.PENDING).length },
    { name: 'Vencido', value: invoices.filter(i => i.status === InvoiceStatus.OVERDUE).length },
    { name: 'Rascunho', value: invoices.filter(i => i.status === InvoiceStatus.DRAFT).length },
  ];

  // Mock monthly data (in a real app, calculate from dates)
  const monthlyData = [
    { name: 'Jan', amount: 4000 },
    { name: 'Fev', amount: 3000 },
    { name: 'Mar', amount: 2000 },
    { name: 'Abr', amount: 2780 },
    { name: 'Mai', amount: 1890 },
    { name: 'Jun', amount: 2390 },
    { name: 'Jul', amount: 3490 },
  ];

  useEffect(() => {
    const fetchInsights = async () => {
        const summary = `Total Pago: ${formatCurrency(totalRevenue)}, Pendente: ${formatCurrency(pendingAmount)}, Vencido: ${formatCurrency(overdueAmount)}. Número total de faturas: ${invoices.length}`;
        const insights = await analyzeFinancialHealth(summary);
        if (insights) setAiInsights(insights);
    };
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {subtext && <p className={`text-xs mt-2 ${color.text}`}>{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color.bg}`}>
        <Icon className={color.icon} size={24} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
          <p className="text-slate-500">Bem-vindo de volta, aqui está o resumo do seu negócio.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start gap-3 max-w-xl">
            <Sparkles className="text-indigo-600 mt-1 flex-shrink-0" size={18} />
            <div>
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">AI Insights</h4>
                <p className="text-sm text-indigo-800 leading-relaxed">{aiInsights}</p>
            </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Receita Total (Kz)" 
          value={formatCurrency(totalRevenue)} 
          icon={CheckCircle}
          color={{ bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-600' }}
          subtext="+12% que mês passado"
        />
        <StatCard 
          title="Pendente (Kz)" 
          value={formatCurrency(pendingAmount)} 
          icon={Clock}
          color={{ bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-600' }}
          subtext="Faturas a aguardar pagamento"
        />
        <StatCard 
          title="Em Atraso (Kz)" 
          value={formatCurrency(overdueAmount)} 
          icon={AlertCircle}
          color={{ bg: 'bg-red-50', icon: 'text-red-600', text: 'text-red-600' }}
          subtext="Ação necessária imediata"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Tendência de Faturação</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `€${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`€${value}`, 'Valor']}
                />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Estado das Faturas</h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-sm text-slate-600">
            {dataByStatus.map((entry, index) => (
               <div key={index} className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                 <span>{entry.name}</span>
               </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
