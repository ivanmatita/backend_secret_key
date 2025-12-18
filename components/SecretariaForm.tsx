import React, { useState, useEffect, useRef } from 'react';
import { SecretariaDocument, DocumentSeries } from '../types';
import { generateId, formatDate } from '../utils';
import { Save, ArrowLeft, Printer, Bold, Italic, AlignLeft, AlignCenter, AlignRight, List, Type, Eye, ChevronDown, ChevronUp, Underline, Strikethrough } from 'lucide-react';

interface SecretariaFormProps {
  document?: SecretariaDocument;
  onSave: (doc: SecretariaDocument) => void;
  onCancel: () => void;
  series: DocumentSeries[];
}

const SecretariaForm: React.FC<SecretariaFormProps> = ({ document, onSave, onCancel, series }) => {
  const [formData, setFormData] = useState<Partial<SecretariaDocument>>({
      type: 'Carta',
      date: new Date().toISOString().split('T')[0],
      destinatarioIntro: 'Exo(a) Sr(a)',
      confidencial: false,
      imprimirPagina: true,
      destinatarioLocalidade: 'Luanda',
      destinatarioPais: 'Angola',
      departamento: 'Geral',
      corpo: '<div>Escreva aqui o conteúdo da carta...</div>'
  });

  const [dateExtended, setDateExtended] = useState('');
  
  // Accordion States
  const [showTracking, setShowTracking] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  
  // Preview State
  const [showPreview, setShowPreview] = useState(false);

  // Editor Ref
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (document) {
          setFormData(document);
          setDateExtended(document.dateExtended || '');
          if (editorRef.current) {
              editorRef.current.innerHTML = document.corpo;
          }
      } else {
          // Initialize default series
          if (series.length > 0) {
              setFormData(prev => ({ ...prev, seriesId: series[0].id, seriesCode: series[0].code }));
          }
          updateDateExtended(new Date().toISOString().split('T')[0]);
      }
  }, [document, series]);

  const updateDateExtended = (dateVal: string) => {
      if(!dateVal) return;
      const d = new Date(dateVal);
      const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
      const formatted = d.toLocaleDateString('pt-PT', options);
      setDateExtended(`Luanda, ${formatted}`);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setFormData({...formData, date: val});
      updateDateExtended(val);
  };

  const handleSubmit = () => {
      if (!formData.destinatarioNome || !formData.assunto) return alert("Preencha o Destinatário e o Assunto");
      
      // Generate number if new based on selected series
      let docNumber = formData.number;
      if (!docNumber && formData.seriesId) {
          const s = series.find(ser => ser.id === formData.seriesId);
          if (s) {
              docNumber = `${formData.type?.substring(0,2).toUpperCase()}/${s.currentSequence + 1}/${s.year}`;
          } else {
              docNumber = 'DRAFT';
          }
      }

      const docToSave: SecretariaDocument = {
          id: formData.id || generateId(),
          type: formData.type || 'Carta',
          seriesId: formData.seriesId || '',
          seriesCode: formData.seriesCode || '',
          number: docNumber || 'DRAFT',
          date: formData.date!,
          dateExtended,
          destinatarioIntro: formData.destinatarioIntro || '',
          destinatarioNome: formData.destinatarioNome!,
          destinatarioMorada: formData.destinatarioMorada,
          destinatarioLocalidade: formData.destinatarioLocalidade,
          destinatarioProvincia: formData.destinatarioProvincia,
          destinatarioCodigoPostal: formData.destinatarioCodigoPostal,
          destinatarioPais: formData.destinatarioPais,
          assunto: formData.assunto!,
          corpo: editorRef.current?.innerHTML || '',
          observacoes: formData.observacoes,
          emailDestinatario: formData.emailDestinatario,
          trackingOrigem: formData.trackingOrigem,
          confidencial: formData.confidencial || false,
          imprimirPagina: formData.imprimirPagina ?? true,
          referencia: formData.referencia,
          departamento: formData.departamento,
          createdBy: formData.createdBy || 'Admin',
          createdAt: formData.createdAt || new Date().toISOString(),
          isLocked: false
      };

      onSave(docToSave);
  };

  // Editor Toolbar Logic
  const execCmd = (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
  };

  const Toolbar = () => (
      <div className="flex gap-2 p-2 border-b bg-slate-50 items-center flex-wrap sticky top-0 z-10">
          <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => execCmd('bold')} title="Negrito"><Bold size={16}/></button>
          <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => execCmd('italic')} title="Itálico"><Italic size={16}/></button>
          <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => execCmd('underline')} title="Sublinhado"><Underline size={16}/></button>
          <div className="w-px h-4 bg-slate-300 mx-1"></div>
          <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => execCmd('justifyLeft')} title="Esquerda"><AlignLeft size={16}/></button>
          <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => execCmd('justifyCenter')} title="Centro"><AlignCenter size={16}/></button>
          <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => execCmd('justifyRight')} title="Direita"><AlignRight size={16}/></button>
          <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600" onClick={() => execCmd('insertUnorderedList')} title="Lista"><List size={16}/></button>
          <div className="w-px h-4 bg-slate-300 mx-1"></div>
          <select className="bg-transparent text-xs border rounded p-1" onChange={(e) => execCmd('formatBlock', e.target.value)}>
              <option value="p">Parágrafo</option>
              <option value="h1">Título 1</option>
              <option value="h2">Título 2</option>
              <option value="h3">Título 3</option>
          </select>
          <select className="bg-transparent text-xs border rounded p-1" onChange={(e) => execCmd('fontSize', e.target.value)}>
              <option value="3">Normal</option>
              <option value="1">Pequeno</option>
              <option value="5">Grande</option>
              <option value="7">Enorme</option>
          </select>
      </div>
  );

  const renderPrintPreview = () => (
      <div className="fixed inset-0 bg-slate-800 z-[100] overflow-y-auto flex flex-col items-center">
          <div className="w-full bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
              <h2 className="text-lg font-bold flex items-center gap-2"><Eye/> Visualização de Impressão (A4)</h2>
              <div className="flex gap-3">
                  <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 font-bold"><Printer size={18}/> Imprimir</button>
                  <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded hover:bg-slate-600"><ArrowLeft size={18}/> Voltar</button>
              </div>
          </div>
          
          <div className="bg-white shadow-2xl my-8 p-[25mm] w-[210mm] min-h-[297mm] text-black font-serif text-[11pt] leading-relaxed relative print-container">
              {/* Header / Logo Area */}
              <div className="flex justify-between items-start mb-12">
                  <div className="w-32 h-16 bg-gray-100 flex items-center justify-center text-xs text-gray-400 border">LOGO</div>
                  <div className="text-right text-xs">
                      <p className="font-bold uppercase">C & V - COMERCIO GERAL</p>
                      <p>Luanda, Angola</p>
                  </div>
              </div>

              {/* Recipient Block */}
              <div className="ml-[80mm] mb-12">
                  <p className="font-bold">{formData.destinatarioIntro}</p>
                  <p className="font-bold uppercase text-lg">{formData.destinatarioNome}</p>
                  <p>{formData.destinatarioMorada}</p>
                  <p>{formData.destinatarioLocalidade}</p>
                  <p className="uppercase mt-2 font-bold underline">{formData.destinatarioPais}</p>
              </div>

              {/* Date & Ref */}
              <div className="text-right mb-8">
                  <p>{dateExtended}</p>
                  <p className="mt-2 font-bold">Nossa Ref: {formData.number || '---'}</p>
                  <p className="text-xs">Vossa Ref: {formData.referencia || '---'}</p>
              </div>

              {/* Subject */}
              <div className="mb-8 font-bold uppercase">
                  ASSUNTO: {formData.assunto}
              </div>

              {/* Body Content */}
              <div className="text-justify min-h-[100mm]" dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || formData.corpo || '' }}></div>

              {/* Signature Area */}
              <div className="mt-12 text-center w-[80mm] mx-auto">
                  <p className="mb-8">Atenciosamente,</p>
                  <div className="border-t border-black pt-2">
                      <p className="font-bold">A Gerência</p>
                  </div>
              </div>

              {/* Footer */}
              {formData.imprimirPagina && (
                  <div className="absolute bottom-[10mm] left-0 w-full text-center text-xs text-gray-400">
                      Página 1/1
                  </div>
              )}
          </div>
          <style>{`@media print { body * { visibility: hidden; } .print-container, .print-container * { visibility: visible; } .print-container { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 25mm; } }`}</style>
      </div>
  );

  if (showPreview) return renderPrintPreview();

  return (
    <div className="bg-slate-100 min-h-screen p-4 animate-in fade-in pb-20">
        {/* Sticky Actions Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 p-4 shadow-sm flex justify-between items-center mb-6 rounded-lg">
            <div className="flex items-center gap-4">
                <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft size={24}/>
                </button>
                <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Criar / Editar Documento</h1>
            </div>
            <div className="flex gap-3">
                <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition">
                    <Printer size={18}/> Visualizar / Imprimir
                </button>
                <button onClick={handleSubmit} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition transform hover:-translate-y-0.5 primary-action">
                    <Save size={18}/> Salvar Documento
                </button>
            </div>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
            
            {/* DADOS DO DOCUMENTO */}
            <div className="bg-white rounded-none shadow-sm border border-slate-300 overflow-hidden">
                <div className="bg-slate-200 px-4 py-1 text-xs font-bold text-slate-700 uppercase border-b border-slate-300">
                    - Dados do Documento
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1">Destinatário</label>
                        <div className="border-b border-black pb-1">
                            <input 
                                className="text-lg font-medium text-slate-900 w-full outline-none placeholder:text-slate-300"
                                placeholder="Exo(a) Sr(a)"
                                value={formData.destinatarioIntro}
                                onChange={e => setFormData({...formData, destinatarioIntro: e.target.value})}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="col-span-2">
                        <div className="flex items-center gap-1 mb-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <label className="text-xs font-medium text-slate-600">Nome do Destinatário</label>
                        </div>
                        <input 
                            className="w-full text-xl font-bold text-slate-800 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Indicar o nome"
                            value={formData.destinatarioNome || ''}
                            onChange={e => setFormData({...formData, destinatarioNome: e.target.value})}
                        />
                    </div>
                    
                    <div className="col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1">Morada</label>
                        <input className="w-full border-b border-slate-300 p-1 text-sm outline-none focus:border-blue-500" value={formData.destinatarioMorada || ''} onChange={e => setFormData({...formData, destinatarioMorada: e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Localidade</label>
                        <input className="w-full border-b border-slate-300 p-1 text-sm outline-none focus:border-blue-500" value={formData.destinatarioLocalidade || ''} onChange={e => setFormData({...formData, destinatarioLocalidade: e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Província</label>
                        <input className="w-full border-b border-slate-300 p-1 text-sm outline-none focus:border-blue-500" value={formData.destinatarioProvincia || ''} onChange={e => setFormData({...formData, destinatarioProvincia: e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Código Postal</label>
                        <input className="w-full border-b border-slate-300 p-1 text-sm outline-none focus:border-blue-500" value={formData.destinatarioCodigoPostal || ''} onChange={e => setFormData({...formData, destinatarioCodigoPostal: e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">País</label>
                        <input className="w-full border-b border-slate-300 p-1 text-sm outline-none focus:border-blue-500" value={formData.destinatarioPais || ''} onChange={e => setFormData({...formData, destinatarioPais: e.target.value})}/>
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1">Observações</label>
                        <input className="w-full border-b border-slate-300 p-1 text-sm outline-none focus:border-blue-500" value={formData.observacoes || ''} onChange={e => setFormData({...formData, observacoes: e.target.value})}/>
                    </div>
                    <div className="col-span-2">
                        <div className="flex items-center gap-1 mb-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <label className="text-xs font-medium text-slate-600">Assunto</label>
                        </div>
                        <input 
                            className="w-full text-lg text-slate-700 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Indicar Assunto da Carta"
                            value={formData.assunto || ''}
                            onChange={e => setFormData({...formData, assunto: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            {/* DESCRIÇÕES TÉCNICAS */}
            <div className="bg-white rounded-none shadow-sm border border-slate-300 overflow-hidden">
                <div className="bg-white px-4 py-2 text-sm font-bold text-slate-800 border-b border-black">
                    Descrições Técnicas
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Data do Documento</label>
                        <input type="date" className="w-full border rounded p-2 text-lg font-mono" value={formData.date} onChange={handleDateChange}/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1">Descrição de Data</label>
                        <input className="w-full border rounded p-2 text-sm" value={dateExtended} readOnly/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1">Email do destinatário</label>
                        <input className="w-full border-b border-slate-300 p-1 text-sm outline-none" value={formData.emailDestinatario || ''} onChange={e => setFormData({...formData, emailDestinatario: e.target.value})}/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1">Adicionar Tracking/Origem</label>
                        <div className="relative">
                            <input className="w-full border rounded p-2 text-sm" value={formData.trackingOrigem || ''} onChange={e => setFormData({...formData, trackingOrigem: e.target.value})}/>
                            <ChevronDown className="absolute right-2 top-2.5 text-slate-400" size={16}/>
                        </div>
                    </div>
                    
                    <div className="flex gap-8 items-center border-t border-slate-200 pt-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Confidencial (Só o titular pode ver)</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-xs">SIM</span>
                                    <input type="radio" name="conf" checked={formData.confidencial} onChange={() => setFormData({...formData, confidencial: true})}/>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-xs">NÃO</span>
                                    <input type="radio" name="conf" checked={!formData.confidencial} onChange={() => setFormData({...formData, confidencial: false})}/>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Imprimir numero Página</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-xs">SIM</span>
                                    <input type="radio" name="page" checked={formData.imprimirPagina} onChange={() => setFormData({...formData, imprimirPagina: true})}/>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-xs">NÃO</span>
                                    <input type="radio" name="page" checked={!formData.imprimirPagina} onChange={() => setFormData({...formData, imprimirPagina: false})}/>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 border-t border-slate-200 pt-4">
                        <label className="text-xs font-medium text-slate-600 block mb-1">Referência</label>
                        <input className="w-full border-b border-slate-300 p-1 text-lg text-slate-500" placeholder="Aguarda referencia Automática" value={formData.referencia || ''} onChange={e => setFormData({...formData, referencia: e.target.value})}/>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Área/Sector/Departamento</label>
                        <input className="w-full border-b border-slate-300 p-1 text-sm" value={formData.departamento || ''} onChange={e => setFormData({...formData, departamento: e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-blue-700 block mb-1">Seleccione Série</label>
                        <select className="w-full border rounded p-2 text-sm bg-blue-50 font-bold focus:ring-2 focus:ring-blue-500" value={formData.seriesId} onChange={e => {
                            const s = series.find(ser => ser.id === e.target.value);
                            setFormData({...formData, seriesId: e.target.value, seriesCode: s?.code});
                        }}>
                            {series.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1">Tipo de Documento</label>
                        <select className="w-full border-b border-slate-300 p-2 text-xl" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                            <option value="Carta">Carta</option>
                            <option value="Declaração">Declaração</option>
                            <option value="Memorando">Memorando</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ESCREVER DOCUMENTO */}
            <div className="bg-white rounded-none shadow-sm border border-slate-300 overflow-hidden">
                <div className="bg-slate-200 px-4 py-1 text-xs font-bold text-slate-700 uppercase border-b border-slate-300">
                    - Escrever Documento
                </div>
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <Toolbar/>
                </div>
                <div className="p-4">
                    <div className="border border-slate-300 rounded bg-white min-h-[400px] flex flex-col p-4">
                        <div 
                            ref={editorRef}
                            className="flex-1 outline-none font-serif text-slate-800 leading-relaxed min-h-[300px]"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={() => setFormData({...formData, corpo: editorRef.current?.innerHTML})}
                        >
                        </div>
                    </div>
                </div>
            </div>

            {/* ACCORDIONS */}
            <div className="bg-slate-200 border border-slate-300 px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-slate-300 transition" onClick={() => setShowTracking(!showTracking)}>
                <span className="text-xs font-bold text-slate-700 uppercase">- Consultar Tracking...</span>
                {showTracking ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </div>
            
            <div className="bg-slate-200 border border-slate-300 px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-slate-300 transition" onClick={() => setShowAlerts(!showAlerts)}>
                <span className="text-xs font-bold text-slate-700 uppercase">+ Vencimento/Alertas</span>
                {showAlerts ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </div>

        </div>
    </div>
  );
};

export default SecretariaForm;