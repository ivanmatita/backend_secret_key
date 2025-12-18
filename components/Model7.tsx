
import React, { useState, useMemo } from 'react';
import { Invoice, Purchase, Company, InvoiceType, PurchaseType, InvoiceStatus } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Printer, FileText, ArrowRight, ArrowLeft, Table, Calculator, Download, Filter, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface Model7Props {
  invoices: Invoice[];
  purchases: Purchase[];
  company: Company;
}

type ModelView = 'GENERAL' | 'SIMPLIFIED' | 'ANNEX_SUPPLIERS' | 'ANNEX_REGULARIZATIONS';

const Model7: React.FC<Model7Props> = ({ invoices, purchases, company }) => {
  const [currentView, setCurrentView] = useState<ModelView>('GENERAL');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // --- DATA FILTERING ---
  
  // Sales in the selected period (Valid)
  const validInvoices = useMemo(() => invoices.filter(i => {
      const d = new Date(i.date);
      return d.getFullYear() === year && (d.getMonth() + 1) === month && i.status !== InvoiceStatus.CANCELLED;
  }), [invoices, year, month]);

  // Sales in the selected period (Cancelled/Credit Notes) for Regularization
  const cancelledInvoices = useMemo(() => invoices.filter(i => {
      const d = new Date(i.date);
      // Include Cancelled status OR Credit Notes issued in this period
      return d.getFullYear() === year && (d.getMonth() + 1) === month && (i.status === InvoiceStatus.CANCELLED || i.type === InvoiceType.NC);
  }), [invoices, year, month]);

  // Purchases in the selected period
  const validPurchases = useMemo(() => purchases.filter(p => {
      const d = new Date(p.date);
      return d.getFullYear() === year && (d.getMonth() + 1) === month && p.status !== 'PENDING';
  }), [purchases, year, month]);

  // --- CALCULATIONS FOR GENERAL REGIME ---

  const calcGeneral = useMemo(() => {
      // 1. Sales by Tax Rate
      const getBaseAndTax = (rate: number) => {
          const items = validInvoices.flatMap(i => i.items.filter(item => item.taxRate === rate));
          return {
              base: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (1 - item.discount/100)), 0),
              tax: items.reduce((sum, item) => sum + (item.total * (item.taxRate/100)), 0) // Approximation
          };
      };

      const sales14 = getBaseAndTax(14);
      const sales7 = getBaseAndTax(7);
      const sales5 = getBaseAndTax(5);
      const salesExempt = getBaseAndTax(0);

      // 2. Deductible (Purchases)
      // Assuming all purchases in period are deductible for simplicity, or filter by 'deductible' flag if existed
      const deductibleTax = validPurchases.reduce((acc, p) => acc + p.taxAmount, 0);

      // 3. Regularizations (Favor Subject) - Credit Notes issued reduce tax liability
      const regularizationsSubject = cancelledInvoices.reduce((acc, i) => {
          // If it's a Credit Note (NC), the tax amount is in favor of subject (reducing liability)
          if (i.type === InvoiceType.NC) return acc + i.taxAmount;
          // If it's a Cancelled Invoice, the tax amount originally declared is now in favor of subject to reverse
          if (i.status === InvoiceStatus.CANCELLED) return acc + i.taxAmount;
          return acc;
      }, 0);

      // 4. Totals
      const totalFavorEstado = sales14.tax + sales7.tax + sales5.tax;
      const totalFavorSujeito = deductibleTax + regularizationsSubject;
      
      const toPay = Math.max(0, totalFavorEstado - totalFavorSujeito);
      const toRecover = Math.max(0, totalFavorSujeito - totalFavorEstado);

      return { sales14, sales7, sales5, salesExempt, deductibleTax, regularizationsSubject, totalFavorEstado, totalFavorSujeito, toPay, toRecover };
  }, [validInvoices, validPurchases, cancelledInvoices]);


  // --- CALCULATIONS FOR SIMPLIFIED REGIME ---
  
  const calcSimplified = useMemo(() => {
      // Cash Basis: Receipts (RG) + Cash Sales (VD, FR)
      const cashDocs = validInvoices.filter(i => 
          i.type === InvoiceType.RG || i.type === InvoiceType.VD || i.type === InvoiceType.FR
      );

      const turnover = cashDocs.reduce((acc, i) => acc + i.total, 0);
      const taxDue = turnover * 0.07;

      // Exempt in Cash Basis
      const exemptDocs = cashDocs.filter(i => i.items.some(t => t.taxRate === 0));
      const exemptBase = exemptDocs.reduce((acc, i) => acc + i.items.filter(t => t.taxRate === 0).reduce((s, x) => s + x.total, 0), 0);
      const exemptTax = exemptBase * 0.07; // Assuming 7% on exempt for simplified regime logic provided

      return { turnover, taxDue, exemptBase, exemptTax, totalPayable: taxDue };
  }, [validInvoices]);


  // --- SHARED COMPONENTS ---

  const HeaderControls = () => (
      <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden shadow-sm sticky top-0 z-10">
           <div className="flex gap-4 items-center">
               <div className="bg-slate-100 p-2 rounded border border-slate-200">
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ano Fiscal</label>
                   <select className="p-1 bg-transparent font-bold text-slate-800 outline-none cursor-pointer" value={year} onChange={e => setYear(Number(e.target.value))}>
                       <option value={2023}>2023</option>
                       <option value={2024}>2024</option>
                       <option value={2025}>2025</option>
                   </select>
               </div>
               <div className="bg-slate-100 p-2 rounded border border-slate-200">
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mês de Apuramento</label>
                   <select className="p-1 bg-transparent font-bold text-slate-800 outline-none w-32 cursor-pointer" value={month} onChange={e => setMonth(Number(e.target.value))}>
                       {Array.from({length:12},(_,i)=>i+1).map(m => (
                           <option key={m} value={m}>{new Date(2024, m-1).toLocaleString('pt-PT', {month:'long'}).toUpperCase()}</option>
                       ))}
                   </select>
               </div>
           </div>
           
           <div className="flex flex-wrap gap-2 justify-center">
               <button onClick={() => setCurrentView('ANNEX_SUPPLIERS')} className={`px-4 py-2 rounded text-xs font-bold border transition-all ${currentView === 'ANNEX_SUPPLIERS' ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                   Anexo Fornecedores
               </button>
               <button onClick={() => setCurrentView('ANNEX_REGULARIZATIONS')} className={`px-4 py-2 rounded text-xs font-bold border transition-all ${currentView === 'ANNEX_REGULARIZATIONS' ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                   Regularização Clientes
               </button>
               <div className="w-px bg-slate-300 mx-2 h-8 self-center"></div>
               <button onClick={() => setCurrentView('GENERAL')} className={`px-4 py-2 rounded text-xs font-bold border transition-all ${currentView === 'GENERAL' ? 'bg-blue-900 text-white border-blue-900 shadow-md transform scale-105' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                   Modelo 7 (Geral)
               </button>
               <button onClick={() => setCurrentView('SIMPLIFIED')} className={`px-4 py-2 rounded text-xs font-bold border transition-all ${currentView === 'SIMPLIFIED' ? 'bg-blue-900 text-white border-blue-900 shadow-md transform scale-105' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                   Modelo 7 (Simplificado)
               </button>
           </div>

           <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-2 text-xs hover:bg-emerald-700 transition-colors shadow-md">
               <Printer size={16}/> Imprimir
           </button>
      </div>
  );

  const FormHeader = ({ title, subtitle, color = "blue" }: { title: string, subtitle?: string, color?: string }) => {
      const borderClass = color === 'blue' ? 'border-blue-900' : 'border-slate-800';
      const textClass = color === 'blue' ? 'text-blue-900' : 'text-slate-800';
      const bgClass = color === 'blue' ? 'bg-blue-900' : 'bg-slate-800';

      return (
        <div className={`border-2 ${borderClass} mb-4 bg-white print:break-inside-avoid`}>
            <div className="flex border-b-2 border-slate-400">
                <div className={`w-32 p-2 flex flex-col items-center justify-center border-r-2 border-slate-400 bg-slate-50`}>
                    <div className="mb-1"><Calculator className="text-slate-400" size={24}/></div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase">Powered By</div>
                    <div className="text-xs font-black text-slate-700">IMATEC SOFT</div>
                </div>
                <div className="flex-1 p-2 text-center flex flex-col justify-center">
                    <h1 className={`text-xl font-black ${textClass} uppercase tracking-tight`}>{title}</h1>
                    {subtitle && <p className={`text-sm font-bold ${textClass} opacity-80`}>{subtitle}</p>}
                </div>
                <div className="w-32 p-2 border-l-2 border-slate-400 flex items-center justify-center">
                     <div className="border-4 border-double border-slate-300 rounded-full w-16 h-16 flex items-center justify-center font-serif font-bold text-slate-300 italic">IVA</div>
                </div>
            </div>
            
            <div className="flex text-xs">
                {/* 01 Periodo */}
                <div className="w-5/12 border-r-2 border-slate-400">
                    <div className={`${bgClass} text-white px-2 py-0.5 font-bold text-[10px]`}>01 - PERIODO DE TRIBUTAÇÃO E NUMEROS DE IDENTIFICAÇÃO FISCAL</div>
                    <div className="p-3 flex gap-6 items-center justify-start bg-white">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-500 mb-0.5">Ano:</span>
                            <div className="border-2 border-slate-800 px-3 py-1 font-mono font-bold text-sm tracking-widest">{year}</div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-500 mb-0.5">Mês:</span>
                            <div className="border-2 border-slate-800 px-3 py-1 font-mono font-bold text-sm tracking-widest">{String(month).padStart(2, '0')}</div>
                        </div>
                        <div className="flex flex-col flex-1 border-b border-black pb-1">
                             <span className="text-[10px] font-bold uppercase text-slate-700 mt-4">{new Date(year, month-1).toLocaleString('pt-PT', {month:'long'})}</span>
                             <span className="text-[8px] text-slate-400">(Mês por extenso)</span>
                        </div>
                    </div>
                </div>
                
                {/* NIF */}
                <div className="w-7/12">
                     <div className={`${bgClass} text-white px-2 py-0.5 font-bold text-[10px] text-right`}>03 - NÚMERO DE IDENTIFICAÇÃO FISCAL</div>
                     <div className="flex h-full items-center justify-end pr-6 gap-3 pb-4">
                         <span className="font-bold text-slate-600">NIF</span>
                         <div className="flex gap-1">
                             {company.nif.split('').map((char, i) => (
                                 <div key={i} className="border border-slate-800 w-7 h-8 flex items-center justify-center font-bold bg-white shadow-sm text-sm">{char}</div>
                             ))}
                         </div>
                     </div>
                </div>
            </div>

            {/* 02 Name */}
            <div className="border-t-2 border-slate-400">
                <div className={`${bgClass} text-white px-2 py-0.5 font-bold text-[10px]`}>02 - NOME, DESIGN/SOCIAL DO SUJEITO PASSIVO DO REPRESENTANTE LEGAL</div>
                <div className="p-2 flex gap-4 items-center bg-white px-4">
                    <span className={`text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap`}>NOME/DESIGNAÇÃO SOCIAL:</span>
                    <div className="flex-1 font-bold text-slate-900 uppercase tracking-wide text-sm border-b border-slate-200">{company.name}</div>
                </div>
            </div>
        </div>
      );
  };

  // --- VIEW 1: ANEXO FORNECEDORES (Image 164727) ---
  const RenderSupplierAnnex = () => {
      const supplierData = validPurchases.map((p, idx) => {
          const base = p.subtotal; 
          const iva = p.taxAmount;
          
          return {
              order: idx + 1,
              nif: p.nif,
              name: p.supplier,
              type: p.type === PurchaseType.FT ? 'FR' : p.type === PurchaseType.FR ? 'FR' : 'OT', // Simplify to FR for now
              date: p.date,
              docNum: p.documentNumber,
              total: p.total,
              base: base,
              ivaSupported: iva,
              ivaDeductibleVal: iva, 
              ivaDeductiblePerc: 100,
              typology: 'OBC' // Operation Goods/Consumer
          };
      });

      const totalBase = supplierData.reduce((acc, i) => acc + i.base, 0);
      const totalIva = supplierData.reduce((acc, i) => acc + i.ivaSupported, 0);
      const totalDeductible = supplierData.reduce((acc, i) => acc + i.ivaDeductibleVal, 0);
      const totalDoc = supplierData.reduce((acc, i) => acc + i.total, 0);

      return (
          <div className="max-w-[1200px] mx-auto bg-white p-6 shadow-xl min-h-[1123px] border-t-8 border-slate-700 animate-in fade-in">
              <FormHeader title="ANEXO DE FORNECEDORES" subtitle="Aquisição de Bens e Serviços" color="slate" />
              
              <div className="border-2 border-slate-800 mt-6">
                  <div className="bg-slate-100 text-slate-800 text-xs font-bold px-2 py-1 border-b-2 border-slate-800">
                      03- OPERAÇÕES EFECTUADAS COM FORNECEDORES SUJEITAS A IVA
                  </div>
                  <table className="w-full text-[10px] border-collapse">
                      <thead>
                          <tr className="border-b border-slate-800 font-bold text-center bg-slate-50">
                              <th className="border-r border-slate-300 p-1 w-8">No ORDEM</th>
                              <th className="border-r border-slate-300 p-1 w-24">NUMERO DE IDENTIFICAÇÃO FISCAL</th>
                              <th className="border-r border-slate-300 p-1">NOME/FIRMA</th>
                              <th className="border-r border-slate-300 p-1 w-12">TIPO DE DOC</th>
                              <th className="border-r border-slate-300 p-1 w-20">DATA DO DOC</th>
                              <th className="border-r border-slate-300 p-1 w-24">NUMERO DO DOC</th>
                              <th className="border-r border-slate-300 p-1 w-24">VALOR DA FACTURA</th>
                              <th className="border-r border-slate-300 p-1 w-24">VALOR TRIBUTAVEL</th>
                              <th className="border-r border-slate-300 p-1 w-20">IVA SUPORTADO</th>
                              <th className="border-r border-slate-300 p-1 w-12">%</th>
                              <th className="border-r border-slate-300 p-1 w-20">IVA DEDUTIVEL (VALOR)</th>
                              <th className="p-1 w-12">TIPOLOGIA</th>
                          </tr>
                      </thead>
                      <tbody>
                          {supplierData.map((row) => (
                              <tr key={row.order} className="border-b border-slate-200 hover:bg-yellow-50 text-center">
                                  <td className="border-r border-slate-300 p-1 font-bold">{row.order}</td>
                                  <td className="border-r border-slate-300 p-1 font-mono">{row.nif}</td>
                                  <td className="border-r border-slate-300 p-1 text-left truncate max-w-[200px] font-medium">{row.name}</td>
                                  <td className="border-r border-slate-300 p-1">{row.type}</td>
                                  <td className="border-r border-slate-300 p-1">{formatDate(row.date)}</td>
                                  <td className="border-r border-slate-300 p-1">{row.docNum}</td>
                                  <td className="border-r border-slate-300 p-1 text-right">{formatCurrency(row.total).replace('Kz','')}</td>
                                  <td className="border-r border-slate-300 p-1 text-right">{formatCurrency(row.base).replace('Kz','')}</td>
                                  <td className="border-r border-slate-300 p-1 text-right">{formatCurrency(row.ivaSupported).replace('Kz','')}</td>
                                  <td className="border-r border-slate-300 p-1">100,00</td>
                                  <td className="border-r border-slate-300 p-1 text-right font-bold">{formatCurrency(row.ivaDeductibleVal).replace('Kz','')}</td>
                                  <td className="p-1">{row.typology}</td>
                              </tr>
                          ))}
                          {supplierData.length === 0 && (
                              <tr><td colSpan={12} className="p-12 text-center text-slate-400 bg-slate-50 italic">Sem registos de compras neste período.</td></tr>
                          )}
                          {/* Fill empty rows for layout fidelity */}
                          {Array.from({length: Math.max(0, 10 - supplierData.length)}).map((_, i) => (
                              <tr key={`empty-${i}`} className="border-b border-slate-200 h-6">
                                  <td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td>
                                  <td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td>
                                  <td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td>
                                  <td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td><td></td>
                              </tr>
                          ))}
                      </tbody>
                      <tfoot>
                          <tr className="border-t-2 border-black font-bold text-[10px] bg-slate-100">
                              <td colSpan={6} className="text-right p-1 uppercase pr-3 border-r border-slate-300">TOTAL</td>
                              <td className="border-r border-slate-300 p-1 text-right">{formatCurrency(totalDoc).replace('Kz','')}</td>
                              <td className="border-r border-slate-300 p-1 text-right">{formatCurrency(totalBase).replace('Kz','')}</td>
                              <td className="border-r border-slate-300 p-1 text-right">{formatCurrency(totalIva).replace('Kz','')}</td>
                              <td className="border-r border-slate-300 p-1"></td>
                              <td className="border-r border-slate-300 p-1 text-right">{formatCurrency(totalDeductible).replace('Kz','')}</td>
                              <td></td>
                          </tr>
                      </tfoot>
                  </table>
              </div>
          </div>
      );
  };

  // --- VIEW 2: REGULARIZAÇÃO CLIENTES (Image 053701) ---
  const RenderRegularizationAnnex = () => {
      const regDocs = cancelledInvoices.map((doc, idx) => ({
          order: idx + 1,
          operation: 'Anulação',
          docId: doc.id.substring(0,8),
          nif: doc.clientNif || '999999999',
          name: doc.clientName,
          type: doc.type,
          date: doc.date,
          number: doc.number,
          total: doc.total,
          base: doc.subtotal,
          iva: doc.taxAmount,
          refPeriod: `${year}-${String(month).padStart(2,'0')}`,
          destination: '26'
      }));

      const totalIva = regDocs.reduce((acc, r) => acc + r.iva, 0);

      return (
          <div className="max-w-[1200px] mx-auto bg-white p-6 shadow-xl min-h-[1123px] border-t-8 border-blue-800 animate-in fade-in">
              <FormHeader title="ANEXO CLIENTES - MODELO 7" subtitle="Regularizações" color="blue" />

              <div className="border-2 border-blue-900 mt-6">
                  <div className="bg-blue-900 text-white text-xs font-bold px-2 py-1">
                      03- REGULARIZAÇÕES DE IVA LIQUIDADO
                  </div>
                  <table className="w-full text-[9px] border-collapse">
                      <thead>
                          <tr className="border-b border-black font-bold text-center bg-slate-100">
                              <th className="border-r border-slate-400 p-1 w-8">No ORDEM</th>
                              <th className="border-r border-slate-400 p-1 w-20">OPERAÇÕES</th>
                              <th className="border-r border-slate-400 p-1 w-20">NIF</th>
                              <th className="border-r border-slate-400 p-1">NOME/FIRMA</th>
                              <th className="border-r border-slate-400 p-1 w-12">TIPO</th>
                              <th className="border-r border-slate-400 p-1 w-20">DATA</th>
                              <th className="border-r border-slate-400 p-1 w-24">NUMERO DOC</th>
                              <th className="border-r border-slate-400 p-1 w-24">VALOR DOC</th>
                              <th className="border-r border-slate-400 p-1 w-24">VALOR TRIBUTAVEL</th>
                              <th className="border-r border-slate-400 p-1 w-24">IVA LIQUIDADO</th>
                              <th className="border-r border-slate-400 p-1 w-24">PERIODO REF</th>
                              <th className="border-r border-slate-400 p-1 w-16">DESTINO</th>
                              <th className="p-1 w-10">Movid</th>
                          </tr>
                      </thead>
                      <tbody>
                          {regDocs.map((row) => (
                              <tr key={row.order} className="border-b border-slate-300 hover:bg-slate-50 text-center">
                                  <td className="border-r border-slate-300 p-1">{row.order}</td>
                                  <td className="border-r border-slate-300 p-1">{row.operation}</td>
                                  <td className="border-r border-slate-300 p-1 font-mono">{row.nif}</td>
                                  <td className="border-r border-slate-300 p-1 text-left truncate max-w-[150px]">{row.name}</td>
                                  <td className="border-r border-slate-300 p-1">{row.type}</td>
                                  <td className="border-r border-slate-300 p-1">{formatDate(row.date)}</td>
                                  <td className="border-r border-slate-300 p-1">{row.number}</td>
                                  <td className="border-r border-slate-300 p-1 text-right">{formatCurrency(row.total).replace('Kz','')}</td>
                                  <td className="border-r border-slate-300 p-1 text-right">{formatCurrency(row.base).replace('Kz','')}</td>
                                  <td className="border-r border-slate-300 p-1 text-right">{formatCurrency(row.iva).replace('Kz','')}</td>
                                  <td className="border-r border-slate-300 p-1">{row.refPeriod}</td>
                                  <td className="border-r border-slate-300 p-1">{row.destination}</td>
                                  <td className="p-1">{row.order}</td>
                              </tr>
                          ))}
                          {regDocs.length === 0 && (
                              <tr><td colSpan={13} className="p-12 text-center text-slate-400 bg-slate-50 italic">Sem regularizações neste período.</td></tr>
                          )}
                          {/* Fill Empty */}
                          {Array.from({length: Math.max(0, 10 - regDocs.length)}).map((_, i) => (
                              <tr key={`empty-${i}`} className="border-b border-slate-200 h-6">
                                  <td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td>
                                  <td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td>
                                  <td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td>
                                  <td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td>
                                  <td></td>
                              </tr>
                          ))}
                      </tbody>
                      <tfoot>
                          <tr className="border-t-2 border-black font-bold text-[10px] bg-slate-100">
                              <td colSpan={9} className="text-right p-1 uppercase pr-3 border-r border-slate-400">Total IVA Regularizado</td>
                              <td className="border-r border-slate-400 p-1 text-right bg-white">{formatCurrency(totalIva).replace('Kz','')}</td>
                              <td colSpan={3}></td>
                          </tr>
                      </tfoot>
                  </table>
              </div>
          </div>
      );
  };

  // --- VIEW 3: MODELO 7 REGIME GERAL (Image 030702) ---
  const RenderGeneralRegime = () => {
      const { sales14, sales7, sales5, salesExempt, deductibleTax, regularizationsSubject, totalFavorEstado, totalFavorSujeito, toPay, toRecover } = calcGeneral;

      const LineRow = ({ label, codeBase, codeSubject, codeState, valBase, valSubject, valState, isMain = false }: any) => (
          <tr className="border-b border-slate-200 text-xs hover:bg-slate-50 h-8">
              <td className={`border-r border-slate-300 p-1 pl-2 text-slate-700 ${isMain ? 'font-bold' : ''}`}>{label}</td>
              <td className="border-r border-slate-300 p-0 relative w-24">
                  {codeBase && (
                      <div className="flex justify-between items-center h-full">
                          <span className="bg-blue-900 text-white text-[10px] px-1 h-full flex items-center font-bold min-w-[20px] justify-center">{codeBase}</span>
                          <span className="px-2 text-right flex-1">{typeof valBase === 'number' ? formatCurrency(valBase).replace('Kz', '') : valBase}</span>
                      </div>
                  )}
              </td>
              <td className="border-r border-slate-300 p-0 relative w-32">
                  {codeSubject && (
                      <div className="flex justify-between items-center h-full">
                          <span className="bg-blue-900 text-white text-[10px] px-1 h-full flex items-center font-bold min-w-[20px] justify-center">{codeSubject}</span>
                          <span className="px-2 text-right flex-1">{typeof valSubject === 'number' ? formatCurrency(valSubject).replace('Kz', '') : valSubject}</span>
                      </div>
                  )}
              </td>
              <td className="p-0 relative w-32">
                  {codeState && (
                      <div className="flex justify-between items-center h-full">
                          <span className="bg-blue-900 text-white text-[10px] px-1 h-full flex items-center font-bold min-w-[20px] justify-center">{codeState}</span>
                          <span className="px-2 text-right flex-1 font-bold text-slate-900">{typeof valState === 'number' ? formatCurrency(valState).replace('Kz', '') : valState}</span>
                      </div>
                  )}
              </td>
          </tr>
      );

      return (
          <div className="max-w-[1000px] mx-auto bg-white p-6 shadow-xl border-t-8 border-blue-900 animate-in fade-in">
              <div className="flex justify-between mb-4 items-start">
                  <FormHeader title="DECLARAÇÃO PERIÓDICA" subtitle="MODELO 7 - Regime Geral" color="blue" />
              </div>

              <div className="border-2 border-black mb-6">
                  <div className="bg-slate-200 border-b-2 border-black p-1 text-xs font-bold uppercase text-center">
                      09 - APURAMENTO DE IMPOSTO REFERENTE AO PERIODO A QUE RESPEITA A DECLARAÇÃO
                  </div>
                  
                  <table className="w-full border-collapse">
                      <thead className="text-[9px] font-bold text-center bg-slate-50 text-slate-600">
                          <tr>
                              <th className="border-r border-slate-300 p-2">DESCRIÇÃO DAS OPERAÇÕES</th>
                              <th className="border-r border-slate-300 p-2 w-24">BASE TRIBUTAVEL</th>
                              <th className="border-r border-slate-300 p-2 w-32">IMPOSTO A FAVOR DO SUJEITO PASSIVO</th>
                              <th className="p-2 w-32">IMPOSTO A FAVOR DO ESTADO</th>
                          </tr>
                      </thead>
                      <tbody>
                          {/* Section 1 */}
                          <LineRow label="1 - Transmissão de bens e de prestação de serviços em que liquidou imposto" codeBase="1" valBase={sales14.base} codeSubject="28" valSubject={deductibleTax} codeState="2" valState={sales14.tax} isMain />
                          <LineRow label="1.1 - Transmissão de bens efectuadas na Provincia de Cabinda em que liquidou o imposto à taxa reduzida" codeBase="1.1" valBase={0} codeState="2.1" valState={0} />
                          <LineRow label="1.2 - Transmissão de bens e prestações de serviços em que liquidou imposto a taxa reduzida 5%" codeBase="1.2" valBase={sales5.base} codeState="2.2" valState={sales5.tax} />
                          <LineRow label="1.2 - Transmissão de bens e prestações de serviços em que liquidou imposto a taxa reduzida 7%" codeBase="1.2" valBase={sales7.base} codeState="2.3" valState={sales7.tax} />
                          
                          {/* Section 2 */}
                          <LineRow label="2 - Transmissão de bens e serviços abrangidos pelo regime de caixa (artº 66º do CIVA)" codeBase="3" valBase="NA" codeState="4" valState="NA" />
                          <LineRow label="2.1 - Transmissão de bens e serviços abrangidos pelo regime de caixa (artº 66º do CIVA efectuadas na Provincia de Cabinda" codeBase="3.1" valBase="NA" codeState="4.1" valState="NA" />
                          <LineRow label="2.2 - Transmissão de bens e prestações de serviços em que liquidou imposto a taxa reduzida abrangidos pelo regime de caixa" codeBase="3.2" valBase="NA" codeState="4.2" valState="NA" />
                          
                          {/* Section 3 & 4 */}
                          <LineRow label="3 - Operações em que o IVA foi cativo pelo declarante (artº 21 do CIVA)" codeBase="5" valBase="NA" codeSubject="6" valSubject="NA" codeState="7" valState="NA" />
                          <LineRow label="4 - Operações em que o IVA foi cativo pelo cliente (artº 31 do CIVA)" codeBase="8" valBase={0} codeSubject="9" valSubject={0} />
                          
                          {/* Section 5 */}
                          <tr className="bg-slate-50"><td colSpan={4} className="text-[10px] font-bold p-1 text-slate-500">5 - Transmissões de bens e prestação de serviços em que não liquidou imposto</td></tr>
                          <LineRow label="-Isentas com direito à dedução" codeBase="10" valBase={salesExempt.base} />
                          <LineRow label="-Isentas sem direito a dedução (art12º excluindo alinea a) do CIVA" codeBase="11" valBase={0} />
                          <LineRow label="-Não Tributadas (artº 10º do CIVA)" codeBase="12" valBase="NA" />
                          
                          {/* Section 9 */}
                          <LineRow label="9 - Reguralizações de Imposto Cativo (Anulações)" codeSubject="26" valSubject={regularizationsSubject} codeState="27" valState={0} />
                          
                          {/* Totals - Dynamic */}
                          <tr className="bg-slate-800 text-white font-bold text-xs">
                              <td colSpan={3} className="p-2 text-right uppercase tracking-wider">Total Imposto a Favor do Estado</td>
                              <td className="p-2 text-right font-mono text-sm bg-slate-900">{formatCurrency(totalFavorEstado).replace('Kz','')}</td>
                          </tr>
                          <tr className="bg-slate-700 text-white font-bold text-xs border-t border-slate-600">
                              <td colSpan={3} className="p-2 text-right uppercase tracking-wider">Total Imposto a Favor do Sujeito Passivo (Dedutível + Reg.)</td>
                              <td className="p-2 text-right font-mono text-sm bg-slate-600">{formatCurrency(totalFavorSujeito).replace('Kz','')}</td>
                          </tr>
                      </tbody>
                  </table>
                  
                  {/* Final Calculation Box */}
                  <div className="bg-blue-50 p-4 border-t-2 border-black">
                      <div className="flex justify-between items-center">
                          <div className="font-bold text-sm text-blue-900 uppercase flex items-center gap-2">
                              <Calculator/> Apuramento Final
                          </div>
                          <div className="flex gap-6 items-center">
                              <div className="text-right">
                                  <div className="text-[10px] font-bold text-slate-500 uppercase">Imposto a Pagar</div>
                                  <div className="text-2xl font-black text-slate-900">{toPay > 0 ? formatCurrency(toPay) : '0,00 Kz'}</div>
                              </div>
                              {toRecover > 0 && (
                                  <div className="text-right border-l pl-6 border-slate-300">
                                      <div className="text-[10px] font-bold text-green-600 uppercase">Crédito a Recuperar</div>
                                      <div className="text-xl font-bold text-green-700">{formatCurrency(toRecover)}</div>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Section 12 - Development */}
              <div className="border-2 border-slate-400 mt-4">
                  <div className="bg-blue-900 text-white text-xs font-bold px-2 py-1">
                      12 - DESENVOLVIMENTO DO QUADRO 9
                  </div>
                  <table className="w-full text-[10px]">
                      <tbody>
                          <tr className="border-b border-slate-200"><td className="p-1 pl-2">Adiantamento transmissão de bens e prestação de serviços tributadas</td><td className="w-24 bg-slate-100 text-center font-bold border-l p-1">41</td><td className="w-32 border-l p-1 text-right">NA</td></tr>
                          <tr className="border-b border-slate-200"><td className="p-1 pl-2">Amostras e ofertas para além do limite legal</td><td className="w-24 bg-slate-100 text-center font-bold border-l p-1">42</td><td className="w-32 border-l p-1 text-right">NA</td></tr>
                          <tr className="border-b border-slate-200"><td className="p-1 pl-2">Operações sujeitas a tributação da margem</td><td className="w-24 bg-slate-100 text-center font-bold border-l p-1">43</td><td className="w-32 border-l p-1 text-right">NA</td></tr>
                          <tr className="border-b border-slate-200"><td className="p-1 pl-2">Operações efectuadas ao abrigo e) e f) do art. 5º e do nº 2 do art. 6º do CIVA</td><td className="w-24 bg-slate-100 text-center font-bold border-l p-1">44</td><td className="w-32 border-l p-1 text-right">NA</td></tr>
                          <tr className="border-b border-slate-200 font-bold bg-slate-50"><td colSpan={3} className="p-1 pl-2">B - Valores de base tributável inscritos no campo 04</td></tr>
                          <tr className="border-b border-slate-200"><td className="p-1 pl-2">Operações destinadas à exportação</td><td className="w-24 bg-slate-100 text-center font-bold border-l p-1">45</td><td className="w-32 border-l p-1 text-right">NA</td></tr>
                          <tr className="border-b border-slate-200"><td className="p-1 pl-2">Bens da lista anexa (cesta básica)</td><td className="w-24 bg-slate-100 text-center font-bold border-l p-1">46</td><td className="w-32 border-l p-1 text-right">NA</td></tr>
                          <tr className="border-b border-slate-200 font-bold bg-slate-50"><td colSpan={3} className="p-1 pl-2">C - Operações abrangidas pelo regime de IVA de caixa</td></tr>
                          <tr className="border-b border-slate-200"><td className="p-1 pl-2">Facturas de transmissão de bens e prestação de serviços (valor Facturado)</td><td className="w-24 bg-slate-100 text-center font-bold border-l p-1">47</td><td className="w-32 border-l p-1 text-right">NA</td></tr>
                          <tr><td className="p-1 pl-2">Recibos de transmissão de bens e prestação de serviços (valor Recebido)</td><td className="w-24 bg-slate-100 text-center font-bold border-l p-1">48</td><td className="w-32 border-l p-1 text-right">NA</td></tr>
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  // --- VIEW 4: MODELO 7 REGIME SIMPLIFICADO (Image 042523) ---
  const RenderSimplifiedRegime = () => {
      const { turnover, taxDue, exemptBase, exemptTax } = calcSimplified;

      const SimplifiedRow = ({ desc, tax = "7%", code, value = 0 }: any) => (
          <tr className="border-b border-slate-300 text-xs hover:bg-slate-50">
              <td className="p-2 border-r border-slate-300 font-medium">{desc}</td>
              <td className="p-2 border-r border-slate-300 text-right w-40">{formatCurrency(value).replace('Kz','')}</td>
              <td className="p-2 border-r border-slate-300 text-center font-bold">{code}</td>
              <td className="p-2 border-r border-slate-300 text-center">{tax}</td>
              <td className="p-2 text-right font-bold text-slate-800">{formatCurrency(value * 0.07).replace('Kz','')}</td>
          </tr>
      );

      return (
          <div className="max-w-[1000px] mx-auto bg-white p-6 shadow-xl min-h-[1123px] border-t-8 border-slate-800 animate-in fade-in">
              <FormHeader title="DECLARAÇÃO PERIÓDICA" subtitle="MODELO 7 - Regime Simplificado" color="slate" />

              <div className="border-2 border-slate-800 mt-6">
                  <div className="bg-slate-800 text-white p-1 text-xs font-bold px-2">
                      06 - SECTOR DE ACTIVIDADE E APURAMENTO DO IMPOSTO DEVIDO
                  </div>
                  <table className="w-full text-xs border-collapse">
                      <thead className="bg-slate-100 font-bold text-slate-700">
                          <tr>
                              <th className="border-b border-slate-400 p-2 text-left">Operações Sujeitas</th>
                              <th className="border-b border-slate-400 p-2 text-right">Volume Negócios</th>
                              <th className="border-b border-slate-400 p-2 w-24">Código</th>
                              <th className="border-b border-slate-400 p-2 w-16">Taxa</th>
                              <th className="border-b border-slate-400 p-2 text-right w-32">Imposto Devido</th>
                          </tr>
                      </thead>
                      <tbody>
                          <SimplifiedRow desc="1º INDÚSTRIA" code="INDUSTRIA" />
                          <SimplifiedRow desc="2º COMÉRCIO" code="COMERCIO" />
                          <SimplifiedRow desc="3º PRESTAÇÃO DE SERVIÇOS" code="SERVICOS" />
                          <SimplifiedRow desc="4º OUTROS (Diversos)" code="OUTROS" value={turnover}/>
                      </tbody>
                  </table>
                  
                  {/* Summary Bar */}
                  <div className="bg-slate-50 p-3 flex justify-between items-center border-t border-slate-300">
                      <span className="font-bold text-slate-600 text-xs uppercase">Total Volume de Negócios (Base)</span>
                      <div className="font-mono font-bold text-lg text-slate-900">{formatCurrency(turnover)}</div>
                  </div>
              </div>

              <div className="border-2 border-slate-800 mt-6">
                  <div className="bg-slate-800 text-white p-1 text-xs font-bold px-2">
                      07 - IMPOSTO DEVIDO DAS OPERAÇÕES ISENTAS DE IVA
                  </div>
                  <table className="w-full text-xs border-collapse">
                      <thead className="bg-slate-100 font-bold text-slate-700">
                          <tr>
                              <th className="border-b border-slate-400 p-2 text-left">Descrição</th>
                              <th className="border-b border-slate-400 p-2 text-right w-40">Valor Tributável</th>
                              <th className="border-b border-slate-400 p-2 w-16 text-center">Taxa</th>
                              <th className="border-b border-slate-400 p-2 text-right w-32">Imposto Devido</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr>
                              <td className="p-2 border-r border-slate-300">Total de Recebimentos de Operações Isentas de IVA</td>
                              <td className="p-2 border-r border-slate-300 text-right">{formatCurrency(exemptBase).replace('Kz','')}</td>
                              <td className="p-2 border-r border-slate-300 text-center">7%</td>
                              <td className="p-2 text-right font-bold">{formatCurrency(exemptTax).replace('Kz','')}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
              
              <div className="mt-8 flex justify-end">
                  <div className="bg-slate-800 text-white p-6 rounded-lg shadow-lg min-w-[300px]">
                      <div className="text-xs uppercase mb-2 text-slate-400 font-bold tracking-wider">Total Geral a Pagar ao Estado</div>
                      <div className="text-4xl font-black">{formatCurrency(taxDue + exemptTax)}</div>
                      <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-600">Regime Simplificado (7%)</div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen pb-20 animate-in fade-in">
        <HeaderControls />
        {currentView === 'GENERAL' && <RenderGeneralRegime />}
        {currentView === 'SIMPLIFIED' && <RenderSimplifiedRegime />}
        {currentView === 'ANNEX_SUPPLIERS' && <RenderSupplierAnnex />}
        {currentView === 'ANNEX_REGULARIZATIONS' && <RenderRegularizationAnnex />}
    </div>
  );
};

export default Model7;
