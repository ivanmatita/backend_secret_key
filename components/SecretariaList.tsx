
import React, { useState } from 'react';
import { SecretariaDocument } from '../types';
import { formatDate } from '../utils';
import { printDocument, downloadPDF, downloadExcel } from "../utils/exportUtils";
import { Search, Plus, Printer, FileText, Download, Lock, Unlock, Mail, Edit2, Copy, Trash2, X, ArrowLeft } from 'lucide-react';

interface SecretariaListProps {
  documents: SecretariaDocument[];
  onCreateNew: () => void;
  onEdit: (doc: SecretariaDocument) => void;
  onDelete?: (doc: SecretariaDocument) => void; 
}

const SecretariaList: React.FC<SecretariaListProps> = ({ documents, onCreateNew, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState<SecretariaDocument | null>(null);

  const filteredDocs = documents.filter(doc => 
    doc.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.destinatarioNome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintDoc = (doc: SecretariaDocument) => {
      setPreviewDoc(doc);
  };

  const handleDelete = (doc: SecretariaDocument) => {
      if(confirm('Tem a certeza que deseja apagar este documento?')) {
          if (onDelete) {
              onDelete(doc);
          } else {
              alert("Função de apagar não disponível neste contexto.");
          }
      }
  };

  const handleClone = (doc: SecretariaDocument) => {
      alert("Função de clonagem: Cria novo com dados base deste. (Em desenvolvimento)");
      // onCreateNew(); // Would need to pre-fill
  };

  const renderPreviewModal = () => {
      if (!previewDoc) return null;

      return (
          <div className="fixed inset-0 bg-slate-800 z-[100] overflow-y-auto flex flex-col items-center animate-in fade-in duration-200">
              <div className="w-full bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg print:hidden">
                  <h2 className="text-lg font-bold flex items-center gap-2"><Printer/> Visualização de Impressão (A4)</h2>
                  <div className="flex gap-3">
                      <button onClick={() => printDocument("docPrintArea")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 font-bold"><Printer size={18}/> Imprimir Agora</button>
                      <button onClick={() => setPreviewDoc(null)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded hover:bg-slate-600"><ArrowLeft size={18}/> Fechar</button>
                  </div>
              </div>
              
              <div id="docPrintArea" className="bg-white shadow-2xl my-8 p-[25mm] w-[210mm] min-h-[297mm] text-black font-serif text-[11pt] leading-relaxed relative print-container">
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
                      <p className="font-bold">{previewDoc.destinatarioIntro}</p>
                      <p className="font-bold uppercase text-lg">{previewDoc.destinatarioNome}</p>
                      <p>{previewDoc.destinatarioMorada}</p>
                      <p>{previewDoc.destinatarioLocalidade}</p>
                      <p className="uppercase mt-2 font-bold underline">{previewDoc.destinatarioPais}</p>
                  </div>

                  {/* Date & Ref */}
                  <div className="text-right mb-8">
                      <p>{previewDoc.dateExtended || `Luanda, ${formatDate(previewDoc.date)}`}</p>
                      <p className="mt-2 font-bold">Nossa Ref: {previewDoc.number}</p>
                      <p className="text-xs">Vossa Ref: {previewDoc.referencia || '---'}</p>
                  </div>

                  {/* Subject */}
                  <div className="mb-8 font-bold uppercase">
                      ASSUNTO: {previewDoc.assunto}
                  </div>

                  {/* Body Content */}
                  <div className="text-justify min-h-[100mm]" dangerouslySetInnerHTML={{ __html: previewDoc.corpo }}></div>

                  {/* Signature Area */}
                  <div className="mt-12 text-center w-[80mm] mx-auto">
                      <p className="mb-8">Atenciosamente,</p>
                      <div className="border-t border-black pt-2">
                          <p className="font-bold">A Gerência</p>
                      </div>
                  </div>

                  {/* Footer */}
                  {previewDoc.imprimirPagina && (
                      <div className="absolute bottom-[10mm] left-0 w-full text-center text-xs text-gray-400">
                          Página 1/1
                      </div>
                  )}
              </div>
              <style>{`@media print { body * { visibility: hidden; } .print-container, .print-container * { visibility: visible; } .print-container { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 25mm; } }`}</style>
          </div>
      );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 p-6 bg-slate-50 min-h-screen">
      {renderPreviewModal()}

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-t-lg border-b border-slate-300 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-xl font-bold text-slate-800">Cartas Emitidas / Série S2024-Sede</h1>
            <p className="text-xs text-slate-500">Gestão de expediente e documentação oficial</p>
        </div>
        
        <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50 flex items-center gap-2">
                <Printer size={16}/> Imprimir Lista
            </button>
            <button className="bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50 flex items-center gap-2">
                <FileText size={16}/> PDF
            </button>
            <button onClick={() => downloadExcel("docsTable", "Lista_Documentos.xlsx")} className="bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50 flex items-center gap-2">
                <Download size={16}/> Excel
            </button>
            <button onClick={onCreateNew} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                <Plus size={16}/> Criar Documento
            </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 border-x border-slate-300 flex items-center gap-2">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Pesquisar por Assunto, Entidade, Número..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-300 shadow-sm overflow-x-auto rounded-b-lg">
          <table className="w-full text-left text-xs" id="docsTable">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300">
                  <tr>
                      <th className="p-3 w-28">Data Doc</th>
                      <th className="p-3 w-24">Tipo / Série</th>
                      <th className="p-3 w-40">Ref / Dep</th>
                      <th className="p-3 min-w-[200px]">Destinatário</th>
                      <th className="p-3 min-w-[200px]">Assunto</th>
                      <th className="p-3 w-16 text-center">CONF</th>
                      <th className="p-3 w-16 text-center">Estado</th>
                      <th className="p-3 text-center min-w-[140px]">Ações</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                  {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 group transition-colors">
                          <td className="p-3 align-middle font-bold">{formatDate(doc.date)}</td>
                          <td className="p-3 align-middle bg-slate-50/50">
                              <div className="font-bold text-slate-800">{doc.type}</div>
                              <div className="text-slate-500">{doc.seriesCode}</div>
                          </td>
                          <td className="p-3 align-middle bg-slate-100/50">
                              <div className="font-mono text-slate-600">{doc.number}</div>
                              <div className="text-slate-500 text-[10px] mt-1">{doc.departamento || '-'}</div>
                          </td>
                          <td className="p-3 align-middle">
                              <div className="font-bold text-slate-800">{doc.destinatarioNome}</div>
                              {doc.emailDestinatario && <div className="text-slate-500 flex items-center gap-1 mt-1"><Mail size={10}/> {doc.emailDestinatario}</div>}
                          </td>
                          <td className="p-3 align-middle bg-slate-50/50">
                              <div className="font-medium text-slate-700 line-clamp-2">{doc.assunto}</div>
                          </td>
                          <td className="p-3 align-middle text-center">
                              <span className={`font-bold ${doc.confidencial ? 'text-red-600' : 'text-slate-400'}`}>
                                  {doc.confidencial ? 'S' : 'N'}
                              </span>
                          </td>
                          <td className="p-3 align-middle text-center">
                              {doc.isLocked ? <Lock size={16} className="text-yellow-600 mx-auto"/> : <Unlock size={16} className="text-slate-300 mx-auto"/>}
                          </td>
                          <td className="p-3 align-middle text-center">
                              <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => handlePrintDoc(doc)} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Imprimir / Visualizar Final"><Printer size={16}/></button>
                                  <button onClick={() => onEdit(doc)} className="p-1.5 hover:bg-blue-100 rounded text-blue-600" title="Editar"><Edit2 size={16}/></button>
                                  <button onClick={() => handleClone(doc)} className="p-1.5 hover:bg-purple-100 rounded text-purple-600" title="Clonar"><Copy size={16}/></button>
                                  <button onClick={() => handleDelete(doc)} className="p-1.5 hover:bg-red-100 rounded text-red-600" title="Apagar"><Trash2 size={16}/></button>
                              </div>
                          </td>
                      </tr>
                  ))}
                  {filteredDocs.length === 0 && (
                      <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                              Nenhum documento encontrado. Clique em "Criar Documento" para começar.
                          </td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>
      
      {/* Pagination Mock */}
      <div className="flex justify-end pt-2">
          <span className="bg-white border px-3 py-1 rounded-full text-xs font-bold text-blue-600 shadow-sm">Pág 1/1</span>
      </div>
    </div>
  );
};

export default SecretariaList;
