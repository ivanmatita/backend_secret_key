import React, { useState, useMemo } from 'react';
import { Invoice, Purchase, InvoiceType, PurchaseType } from '../types';
import { FileJson, Download, Calendar, CheckCircle, AlertCircle, PieChart, FileText, List } from 'lucide-react';
import { formatCurrency } from '../utils';

interface SaftExportProps {
  invoices: Invoice[];
  purchases: Purchase[];
}

const SaftExport: React.FC<SaftExportProps> = ({ invoices, purchases }) => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [saftType, setSaftType] = useState<'SALES' | 'PURCHASE'>('SALES');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter Logic
  const filteredInvoices = invoices.filter(i => {
      const d = new Date(i.date);
      // ONLY CERTIFIED DOCS FOR SAFT
      return d >= new Date(startDate) && d <= new Date(endDate) && i.isCertified;
  });

  const filteredPurchases = purchases.filter(p => {
      const d = new Date(p.date);
      return d >= new Date(startDate) && d <= new Date(endDate);
  });

  // Calculate Totals by Document Type (Sales)
  const salesDocTypeSummary = useMemo(() => {
      const summary: Record<string, { count: number, total: number }> = {};
      
      Object.values(InvoiceType).forEach(type => {
          summary[type] = { count: 0, total: 0 };
      });

      filteredInvoices.forEach(inv => {
          if (!summary[inv.type]) summary[inv.type] = { count: 0, total: 0 };
          summary[inv.type].count += 1;
          summary[inv.type].total += (inv.currency === 'AOA' ? inv.total : inv.contraValue || inv.total);
      });

      return Object.entries(summary).filter(([_, data]) => data.count > 0).map(([type, data]) => ({
          type,
          count: data.count,
          total: data.total
      }));
  }, [filteredInvoices]);

  // Calculate Totals by Document Type (Purchases)
  const purchaseDocTypeSummary = useMemo(() => {
      const summary: Record<string, { count: number, total: number }> = {};
      
      Object.values(PurchaseType).forEach(type => {
          summary[type] = { count: 0, total: 0 };
      });

      filteredPurchases.forEach(pur => {
          if (!summary[pur.type]) summary[pur.type] = { count: 0, total: 0 };
          summary[pur.type].count += 1;
          summary[pur.type].total += pur.total;
      });

      return Object.entries(summary).filter(([_, data]) => data.count > 0).map(([type, data]) => ({
          type,
          count: data.count,
          total: data.total
      }));
  }, [filteredPurchases]);

  const activeSummary = saftType === 'SALES' ? salesDocTypeSummary : purchaseDocTypeSummary;
  const recordCount = saftType === 'SALES' ? filteredInvoices.length : filteredPurchases.length;
  const totalValue = saftType === 'SALES' 
      ? filteredInvoices.reduce((acc, i) => acc + (i.currency === 'AOA' ? i.total : i.contraValue || i.total), 0)
      : filteredPurchases.reduce((acc, p) => acc + p.total, 0);

  const handleDownload = () => {
      setIsGenerating(true);
      
      setTimeout(() => {
          const fileName = `SAFT_${saftType}_${startDate}_${endDate}.xml`;
          const dummyContent = `
<?xml version="1.0" encoding="Windows-1252"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01">
    <Header>
        <AuditFileVersion>1.01_01</AuditFileVersion>
        <CompanyID>5000780316</CompanyID>
        <TaxRegistrationNumber>5000780316</TaxRegistrationNumber>
        <TaxAccountingBasis>F</TaxAccountingBasis>
        <CompanyName>C & V - COMERCIO GERAL</CompanyName>
        <StartDate>${startDate}</StartDate>
        <EndDate>${endDate}</EndDate>
        <DateCreated>${new Date().toISOString().split('T')[0]}</DateCreated>
    </Header>
    <MasterFiles>
        <!-- ${recordCount} Registos -->
    </MasterFiles>
    <SourceDocuments>
        <!-- Dados Exportados -->
    </SourceDocuments>
</AuditFile>`.trim();

          const blob = new Blob([dummyContent], { type: 'text/xml' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          window.URL.revokeObjectURL(url);
          setIsGenerating(false);
      }, 1500);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in">
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3"><FileJson size={32}/> Ficheiro SAFT-AO</h1>
                        <p className="text-slate-400 mt-1">Standard Audit File for Tax Purposes (Angola)</p>
                    </div>
                    <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                        <span className="text-xs font-bold uppercase text-slate-400 block">Versão Validador</span>
                        <span className="font-mono font-bold text-green-400">1.01_01</span>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Ficheiro</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setSaftType('SALES')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${saftType === 'SALES' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <span className="font-bold">Faturação</span>
                                    <span className="text-xs">Documentos de Venda</span>
                                </button>
                                <button 
                                    onClick={() => setSaftType('PURCHASE')}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${saftType === 'PURCHASE' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <span className="font-bold">Aquisição</span>
                                    <span className="text-xs">Compras e Despesas</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Data Inicial</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                                    <input type="date" className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Data Final</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                                    <input type="date" className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Resumo da Exportação</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Período:</span>
                                    <span className="font-bold text-slate-700">{startDate} a {endDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Tipo:</span>
                                    <span className="font-bold text-slate-700">{saftType === 'SALES' ? 'Faturação (C)' : 'Compras (A)'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Total Documentos:</span>
                                    <span className="font-bold text-blue-600 text-lg">{recordCount}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 mt-2">
                                    <span className="text-slate-500 font-bold uppercase">Volume Total:</span>
                                    <span className="font-bold text-slate-900 text-lg">
                                        {formatCurrency(totalValue)}
                                    </span>
                                </div>
                            </div>
                            
                            {saftType === 'SALES' && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2 text-xs text-yellow-800">
                                    <AlertCircle size={16} className="shrink-0"/>
                                    <p>Atenção: Apenas documentos <strong>CERTIFICADOS</strong> serão incluídos no ficheiro SAFT de faturação.</p>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleDownload}
                            disabled={isGenerating || recordCount === 0}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-6"
                        >
                            {isGenerating ? 'A Processar...' : <><Download size={20}/> Gerar Ficheiro XML</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Document Type Summary List */}
            {activeSummary.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><List size={20}/> Lista de Tipos de Documentos Emitidos ({saftType === 'SALES' ? 'Vendas' : 'Compras'})</h3>
                        <span className="text-xs text-slate-500 italic">Documentos incluídos no SAFT</span>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4 text-left border-b border-slate-200">Tipo de Documento</th>
                                    <th className="p-4 text-center border-b border-slate-200 w-32">Quantidade</th>
                                    <th className="p-4 text-right border-b border-slate-200 w-48">Total Emitido</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeSummary.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-700">{item.type}</td>
                                        <td className="p-4 text-center font-medium">{item.count}</td>
                                        <td className="p-4 text-right font-mono font-bold text-slate-900">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                                <tr>
                                    <td className="p-4 uppercase text-slate-500">Total Geral</td>
                                    <td className="p-4 text-center">{recordCount}</td>
                                    <td className="p-4 text-right text-lg text-blue-600">{formatCurrency(totalValue)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default SaftExport;