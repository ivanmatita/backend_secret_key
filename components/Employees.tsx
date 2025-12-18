
import React, { useState, useMemo, useEffect } from 'react';
import { Employee, WorkLocation, Profession } from '../types';
import { generateId, formatCurrency, calculateINSS, calculateIRT } from '../utils';
import { 
  Users, UserPlus, Search, Filter, Printer, FileText, Trash2, Edit2, Eye, Ban, CheckCircle, 
  MapPin, Phone, Mail, Calendar, CreditCard, Building2, ChevronDown, X, Save, Upload, User
} from 'lucide-react';

interface EmployeesProps {
  employees: Employee[];
  onSaveEmployee: (emp: Employee) => void;
  workLocations: WorkLocation[];
  professions: Profession[];
}

const Employees: React.FC<EmployeesProps> = ({ employees, onSaveEmployee, workLocations, professions }) => {
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  
  // Form State
  const [formData, setFormData] = useState<Partial<Employee>>({
      status: 'Active',
      contractType: 'Determinado',
      nationality: 'Angolana',
      gender: 'M',
      maritalStatus: 'Solteiro',
      subsidyFood: 0,
      subsidyTransport: 0,
      baseSalary: 0
  });

  // Derived Calculations for Form
  const formCalculations = useMemo(() => {
      const base = Number(formData.baseSalary || 0);
      const subFood = Number(formData.subsidyFood || 0);
      const subTransport = Number(formData.subsidyTransport || 0);
      const subFamily = Number(formData.subsidyFamily || 0);
      const subHousing = Number(formData.subsidyHousing || 0);
      const subOther = Number(formData.subsidyOther || 0);
      
      const totalSubsidies = subFood + subTransport + subFamily + subHousing + subOther;
      const grossTotal = base + totalSubsidies; // Assuming all subsidies part of gross for simplicity in this view, tax logic handles exemptions
      
      // INSS (3% of Gross/Base depending on rule, usually Base + Taxable Allowances)
      // Using Base for INSS calculation standard or Base + Allowances if configured. Using helper.
      const inssWorker = calculateINSS(base); 
      const inssCompany = base * 0.08; // 8%
      
      // IRT
      const irt = calculateIRT(base, inssWorker);
      
      const net = grossTotal - inssWorker - irt;

      return { totalSubsidies, grossTotal, inssWorker, inssCompany, irt, net };
  }, [formData]);

  const filteredEmployees = useMemo(() => {
      return employees.filter(e => {
          const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              e.nif.includes(searchTerm) || 
                              (e.biNumber && e.biNumber.includes(searchTerm));
          
          const matchStatus = statusFilter === 'ALL' || 
                              (statusFilter === 'ACTIVE' && e.status === 'Active') ||
                              (statusFilter === 'INACTIVE' && e.status !== 'Active');
                              
          const matchDept = deptFilter === 'ALL' || e.department === deptFilter;

          return matchSearch && matchStatus && matchDept;
      });
  }, [employees, searchTerm, statusFilter, deptFilter]);

  const departments = Array.from(new Set(employees.map(e => e.department))).filter(Boolean);

  const handleEdit = (emp: Employee) => {
      setFormData(emp);
      setView('FORM');
  };

  const handleCreate = () => {
      setFormData({
          status: 'Active',
          contractType: 'Determinado',
          nationality: 'Angolana',
          gender: 'M',
          maritalStatus: 'Solteiro',
          baseSalary: 0,
          subsidyFood: 0,
          subsidyTransport: 0,
          admissionDate: new Date().toISOString().split('T')[0]
      });
      setView('FORM');
  };

  const handleSave = () => {
      if (!formData.name || !formData.nif || !formData.baseSalary) {
          alert("Preencha os campos obrigatórios: Nome, NIF e Salário Base.");
          return;
      }

      // Generate Number if new
      let empNum = formData.employeeNumber;
      if (!empNum) {
          const nextNum = employees.length + 1;
          empNum = String(nextNum).padStart(4, '0');
      }

      const employee: Employee = {
          ...formData as Employee,
          id: formData.id || generateId(),
          employeeNumber: empNum,
          // Ensure numbers
          baseSalary: Number(formData.baseSalary),
          subsidyFood: Number(formData.subsidyFood || 0),
          subsidyTransport: Number(formData.subsidyTransport || 0),
          subsidyFamily: Number(formData.subsidyFamily || 0),
          subsidyHousing: Number(formData.subsidyHousing || 0),
          subsidyCommunication: Number(formData.subsidyCommunication || 0),
          subsidyOther: Number(formData.subsidyOther || 0),
          ssn: formData.ssn || 'N/A'
      };

      onSaveEmployee(employee);
      setView('LIST');
  };

  const toggleStatus = (emp: Employee) => {
      const newStatus = emp.status === 'Active' ? 'Terminated' : 'Active';
      if (confirm(`Tem a certeza que deseja alterar o estado para ${newStatus === 'Active' ? 'ATIVO' : 'INATIVO'}?`)) {
          onSaveEmployee({ ...emp, status: newStatus });
      }
  };

  const handleDelete = (emp: Employee) => {
      if (confirm("Tem a certeza que deseja eliminar este funcionário? Esta ação não é recomendada se houver histórico.")) {
          // In a real app, delete logic or soft delete
          alert("Funcionalidade de eliminação permanente restrita. Use a opção de desativar/demitir.");
      }
  };

  if (view === 'FORM') {
      return (
          <div className="bg-slate-50 min-h-screen p-6 animate-in fade-in">
              <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                  {/* Header */}
                  <div className="bg-slate-900 text-white p-6 flex justify-between items-center sticky top-0 z-10">
                      <div className="flex items-center gap-4">
                          <button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-800 rounded-full transition"><X size={24}/></button>
                          <div>
                              <h1 className="text-xl font-bold uppercase tracking-wide">Ficha de Funcionário</h1>
                              <p className="text-xs text-slate-400">Admissão e Cadastro de Pessoal</p>
                          </div>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={() => setView('LIST')} className="px-6 py-2 border border-slate-600 rounded-lg hover:bg-slate-800 transition">Cancelar</button>
                          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg transition flex items-center gap-2">
                              <Save size={18}/> Salvar Ficha
                          </button>
                      </div>
                  </div>

                  <div className="p-8 grid grid-cols-12 gap-8">
                      {/* Left Column: Photo & Personal */}
                      <div className="col-span-12 md:col-span-3 space-y-6">
                          <div className="flex flex-col items-center">
                              <div className="w-48 h-48 bg-slate-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center relative overflow-hidden mb-4 group cursor-pointer">
                                  {formData.photoUrl ? (
                                      <img src={formData.photoUrl} alt="Foto" className="w-full h-full object-cover"/>
                                  ) : (
                                      <Users size={64} className="text-slate-300"/>
                                  )}
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                      <span className="text-white text-xs font-bold flex items-center gap-2"><Upload size={14}/> Alterar</span>
                                  </div>
                              </div>
                              <p className="text-xs text-slate-500 text-center">Clique para carregar foto</p>
                          </div>

                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                              <h3 className="font-bold text-blue-900 mb-3 text-sm uppercase border-b border-blue-200 pb-1">Resumo Salarial</h3>
                              <div className="space-y-2 text-sm">
                                  <div className="flex justify-between"><span>Base:</span> <span className="font-bold">{formatCurrency(Number(formData.baseSalary || 0))}</span></div>
                                  <div className="flex justify-between"><span>Subsídios:</span> <span className="font-bold">{formatCurrency(formCalculations.totalSubsidies)}</span></div>
                                  <div className="flex justify-between text-red-600"><span>Impostos:</span> <span>-{formatCurrency(formCalculations.inssWorker + formCalculations.irt)}</span></div>
                                  <div className="border-t border-blue-200 pt-2 flex justify-between text-lg font-black text-blue-700">
                                      <span>Líquido:</span>
                                      <span>{formatCurrency(formCalculations.net)}</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Right Column: Form Fields */}
                      <div className="col-span-12 md:col-span-9 space-y-8">
                          
                          {/* 1. Personal Info */}
                          <section>
                              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                                  <User className="text-blue-600"/> Dados Pessoais
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                                      <input className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Nascimento</label>
                                      <input type="date" className="w-full p-2 border rounded-lg bg-slate-50 focus:bg-white transition" value={formData.birthDate || ''} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Género</label>
                                      <select className="w-full p-2 border rounded-lg bg-slate-50" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                                          <option value="M">Masculino</option>
                                          <option value="F">Feminino</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado Civil</label>
                                      <select className="w-full p-2 border rounded-lg bg-slate-50" value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value as any})}>
                                          <option value="Solteiro">Solteiro(a)</option>
                                          <option value="Casado">Casado(a)</option>
                                          <option value="Divorciado">Divorciado(a)</option>
                                          <option value="Viuvo">Viúvo(a)</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nacionalidade</label>
                                      <input className="w-full p-2 border rounded-lg bg-slate-50" value={formData.nationality || ''} onChange={e => setFormData({...formData, nationality: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nº BI / Passaporte</label>
                                      <input className="w-full p-2 border rounded-lg bg-slate-50" value={formData.biNumber || ''} onChange={e => setFormData({...formData, biNumber: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NIF</label>
                                      <input className="w-full p-2 border rounded-lg bg-slate-50 font-mono" value={formData.nif || ''} onChange={e => setFormData({...formData, nif: e.target.value})} />
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                  <div className="md:col-span-3">
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço Completo</label>
                                      <input className="w-full p-2 border rounded-lg bg-slate-50" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Município</label>
                                      <input className="w-full p-2 border rounded-lg bg-slate-50" value={formData.municipality || ''} onChange={e => setFormData({...formData, municipality: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bairro</label>
                                      <input className="w-full p-2 border rounded-lg bg-slate-50" value={formData.neighborhood || ''} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                                      <input className="w-full p-2 border rounded-lg bg-slate-50" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                      <input className="w-full p-2 border rounded-lg bg-slate-50" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                                  </div>
                              </div>
                          </section>

                          {/* 2. Labor Info */}
                          <section>
                              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                                  <Building2 className="text-orange-600"/> Informação Laboral
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nº Funcionário</label>
                                      <input className="w-full p-2 border rounded-lg bg-slate-100 text-slate-500" value={formData.employeeNumber || 'Auto'} disabled />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Admissão</label>
                                      <input type="date" className="w-full p-2 border rounded-lg bg-slate-50" value={formData.admissionDate || ''} onChange={e => setFormData({...formData, admissionDate: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Departamento</label>
                                      <input className="w-full p-2 border rounded-lg bg-slate-50" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Função / Cargo</label>
                                      <input className="w-full p-2 border rounded-lg bg-slate-50" value={formData.role || ''} onChange={e => setFormData({...formData, role: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                                      <select className="w-full p-2 border rounded-lg bg-slate-50" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})}>
                                          <option value="">Selecione...</option>
                                          <option value="Direcção">Direcção</option>
                                          <option value="Técnico">Técnico</option>
                                          <option value="Administrativo">Administrativo</option>
                                          <option value="Operacional">Operacional</option>
                                          <option value="Estagiário">Estagiário</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo Contrato</label>
                                      <select className="w-full p-2 border rounded-lg bg-slate-50" value={formData.contractType} onChange={e => setFormData({...formData, contractType: e.target.value as any})}>
                                          <option value="Determinado">Determinado (Certo)</option>
                                          <option value="Indeterminado">Indeterminado</option>
                                          <option value="Estagio">Estágio</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nº Seg. Social</label>
                                      <input className="w-full p-2 border rounded-lg bg-slate-50" value={formData.ssn || ''} onChange={e => setFormData({...formData, ssn: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Local Trabalho</label>
                                      <select className="w-full p-2 border rounded-lg bg-slate-50" value={formData.workLocationId || ''} onChange={e => setFormData({...formData, workLocationId: e.target.value})}>
                                          <option value="">Selecione...</option>
                                          {workLocations.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                      </select>
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                  <div className="col-span-3 text-xs font-bold uppercase text-slate-500 mb-2">Dados Bancários</div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1">Banco</label>
                                      <input className="w-full p-2 border rounded-lg bg-white" placeholder="Ex: BFA" value={formData.bankName || ''} onChange={e => setFormData({...formData, bankName: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1">Nº Conta</label>
                                      <input className="w-full p-2 border rounded-lg bg-white" value={formData.bankAccount || ''} onChange={e => setFormData({...formData, bankAccount: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1">IBAN</label>
                                      <input className="w-full p-2 border rounded-lg bg-white font-mono" value={formData.iban || ''} onChange={e => setFormData({...formData, iban: e.target.value})} />
                                  </div>
                              </div>
                          </section>

                          {/* 3. Salary Info */}
                          <section>
                              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                                  <CreditCard className="text-green-600"/> Informação Salarial
                              </h3>
                              <div className="flex flex-col md:flex-row gap-6">
                                  <div className="flex-1 space-y-4">
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Salário Base</label>
                                          <input type="number" className="w-full p-3 border-2 border-slate-300 rounded-lg text-lg font-bold text-slate-800 focus:border-green-500 outline-none" value={formData.baseSalary || ''} onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})} placeholder="0.00"/>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sub. Alimentação</label>
                                              <input type="number" className="w-full p-2 border rounded-lg bg-slate-50" value={formData.subsidyFood || ''} onChange={e => setFormData({...formData, subsidyFood: Number(e.target.value)})} />
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sub. Transporte</label>
                                              <input type="number" className="w-full p-2 border rounded-lg bg-slate-50" value={formData.subsidyTransport || ''} onChange={e => setFormData({...formData, subsidyTransport: Number(e.target.value)})} />
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sub. Família/Abono</label>
                                              <input type="number" className="w-full p-2 border rounded-lg bg-slate-50" value={formData.subsidyFamily || ''} onChange={e => setFormData({...formData, subsidyFamily: Number(e.target.value)})} />
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Outros Subsídios</label>
                                              <input type="number" className="w-full p-2 border rounded-lg bg-slate-50" value={formData.subsidyOther || ''} onChange={e => setFormData({...formData, subsidyOther: Number(e.target.value)})} />
                                          </div>
                                      </div>
                                  </div>

                                  <div className="w-full md:w-80 bg-slate-100 p-5 rounded-xl border border-slate-200">
                                      <h4 className="font-bold text-slate-700 mb-4 border-b border-slate-300 pb-2">Simulação de Processamento</h4>
                                      <div className="space-y-2 text-sm">
                                          <div className="flex justify-between"><span>Vencimento Base</span> <span className="font-mono">{formatCurrency(Number(formData.baseSalary))}</span></div>
                                          <div className="flex justify-between"><span>Total Subsídios</span> <span className="font-mono">{formatCurrency(formCalculations.totalSubsidies)}</span></div>
                                          <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-200">
                                              <span>Total Ilíquido</span> 
                                              <span>{formatCurrency(formCalculations.grossTotal)}</span>
                                          </div>
                                          <div className="py-2 space-y-1">
                                              <div className="flex justify-between text-red-600"><span>INSS Trab. (3%)</span> <span>-{formatCurrency(formCalculations.inssWorker)}</span></div>
                                              <div className="flex justify-between text-red-600"><span>IRT (Tabela)</span> <span>-{formatCurrency(formCalculations.irt)}</span></div>
                                          </div>
                                          <div className="flex justify-between font-black text-lg text-blue-700 border-t-2 border-white pt-2 bg-blue-50 p-2 rounded">
                                              <span>Líquido a Receber</span>
                                              <span>{formatCurrency(formCalculations.net)}</span>
                                          </div>
                                          <div className="text-[10px] text-slate-500 mt-2 text-center">
                                              Custo Empresa (INSS 8%): {formatCurrency(formCalculations.inssCompany)}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </section>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // LIST VIEW
  return (
    <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Users className="text-blue-600"/> Funcionários</h1>
                <p className="text-xs text-slate-500">Gestão de Recursos Humanos</p>
            </div>
            <div className="flex gap-2">
                <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md transition transform hover:-translate-y-0.5">
                    <UserPlus size={18}/> Admitir Funcionário
                </button>
                <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-50">
                    <Printer size={18}/> Imprimir Lista
                </button>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                <input 
                    className="w-full pl-10 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Pesquisar por Nome, Nº Mecanográfico, BI..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div>
                <select className="w-full p-2 border border-slate-300 rounded-lg bg-white" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                    <option value="ALL">Todos os Departamentos</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div>
                <select className="w-full p-2 border border-slate-300 rounded-lg bg-white" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                    <option value="ALL">Todos os Estados</option>
                    <option value="ACTIVE">Ativos</option>
                    <option value="INACTIVE">Inativos / Desligados</option>
                </select>
            </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                        <tr>
                            <th className="p-4 w-16 text-center">Foto</th>
                            <th className="p-4 w-24">Nº Mec.</th>
                            <th className="p-4 min-w-[200px]">Nome Completo</th>
                            <th className="p-4">Departamento</th>
                            <th className="p-4">Função</th>
                            <th className="p-4">Admissão</th>
                            <th className="p-4 text-right">Salário Base</th>
                            <th className="p-4 text-right">Subsídios</th>
                            <th className="p-4 text-right">Líquido</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-center w-32">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredEmployees.map((emp) => {
                            // Calculate values for display
                            const base = emp.baseSalary;
                            const subsidies = (emp.subsidyFood||0)+(emp.subsidyTransport||0)+(emp.subsidyFamily||0)+(emp.subsidyHousing||0)+(emp.subsidyOther||0);
                            const inss = calculateINSS(base);
                            const irt = calculateIRT(base, inss);
                            const net = (base + subsidies) - inss - irt;

                            return (
                                <tr key={emp.id} className="hover:bg-blue-50 transition-colors group">
                                    <td className="p-3 text-center">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 mx-auto overflow-hidden border border-slate-300">
                                            {emp.photoUrl ? <img src={emp.photoUrl} className="w-full h-full object-cover"/> : <Users className="w-full h-full p-2 text-slate-400"/>}
                                        </div>
                                    </td>
                                    <td className="p-3 font-mono font-bold text-slate-600">{emp.employeeNumber || '---'}</td>
                                    <td className="p-3 font-bold text-slate-800">{emp.name}</td>
                                    <td className="p-3">{emp.department}</td>
                                    <td className="p-3 text-slate-600">{emp.role}</td>
                                    <td className="p-3">{emp.admissionDate}</td>
                                    <td className="p-3 text-right font-mono">{formatCurrency(base).replace('Kz','')}</td>
                                    <td className="p-3 text-right font-mono text-slate-500">{formatCurrency(subsidies).replace('Kz','')}</td>
                                    <td className="p-3 text-right font-bold text-blue-700">{formatCurrency(net).replace('Kz','')}</td>
                                    <td className="p-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {emp.status === 'Active' ? 'ATIVO' : 'INATIVO'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(emp)} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="Editar"><Edit2 size={14}/></button>
                                            <button className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200" title="Imprimir Ficha"><FileText size={14}/></button>
                                            <button onClick={() => toggleStatus(emp)} className={`p-1.5 rounded hover:opacity-80 ${emp.status === 'Active' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`} title={emp.status === 'Active' ? "Desativar" : "Ativar"}>
                                                {emp.status === 'Active' ? <Ban size={14}/> : <CheckCircle size={14}/>}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredEmployees.length === 0 && (
                            <tr>
                                <td colSpan={11} className="p-8 text-center text-slate-400 italic">
                                    Nenhum funcionário encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="bg-slate-50 p-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                <span>Total: {filteredEmployees.length} Registos</span>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border bg-white rounded disabled:opacity-50">Anterior</button>
                    <button className="px-3 py-1 border bg-white rounded">Próximo</button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Employees;
