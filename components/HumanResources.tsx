
import React, { useState } from 'react';
import { Employee, HrTransaction, HrVacation, SalarySlip, Profession, Candidate, PerformanceReview, DisciplinaryAction, TrainingCourse, Contract, AttendanceRecord } from '../types';
import { generateId, formatCurrency, formatDate, calculateINSS, calculateIRT, calculateINSSEntity } from '../utils';
import { Users, UserPlus, ClipboardList, Briefcase, Calculator, Calendar, FileText, Download, Printer, Search, Plus, Trash2, Camera, AlertTriangle, CheckCircle, Wallet, FileCheck, X, Table, User, MapPin, TrendingUp, BookOpen, GraduationCap, Gavel, BarChart3, BrainCircuit, Sparkles, AlertCircle, Clock, HeartHandshake, Shield, ListChecks } from 'lucide-react';
import SalaryMap from './SalaryMap';
import ProfessionManager from './ProfessionManager';

interface HumanResourcesProps {
  employees: Employee[];
  onSaveEmployee: (emp: Employee) => void;
  transactions: HrTransaction[];
  onSaveTransaction: (t: HrTransaction) => void;
  vacations: HrVacation[];
  onSaveVacation: (v: HrVacation) => void;
  payroll: SalarySlip[]; 
  onProcessPayroll: (slips: SalarySlip[]) => void;
  professions: Profession[];
  onSaveProfession: (p: Profession) => void;
  onDeleteProfession: (id: string) => void;
  contracts: Contract[];
  onSaveContract: (c: Contract) => void;
  attendance: AttendanceRecord[];
  onSaveAttendance: (a: AttendanceRecord) => void;
}

const HumanResources: React.FC<HumanResourcesProps> = ({ 
    employees, onSaveEmployee, transactions, onSaveTransaction, 
    vacations, onSaveVacation, payroll, onProcessPayroll,
    professions, onSaveProfession, onDeleteProfession,
    contracts, onSaveContract, attendance, onSaveAttendance
}) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'GESTÃO' | 'RECRUTAMENTO' | 'FÉRIAS' | 'ASSIDUIDADE' | 'CONTRATOS' | 'PROCESSAMENTO' | 'DISCIPLINAR' | 'FORMAÇÃO' | 'BENEFICIOS' | 'RELATORIOS' | 'PROFISSÕES' | 'MAPAS'>('DASHBOARD');
  
  // Forms & Modals
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showTransModal, setShowTransModal] = useState(false);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showDisciplinaryModal, setShowDisciplinaryModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  // New Data States for Forms
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({ status: 'Active', contractType: 'Determinado' });
  const [newTrans, setNewTrans] = useState<Partial<HrTransaction>>({ type: 'ABSENCE', amount: 0 });
  const [newVacation, setNewVacation] = useState<Partial<HrVacation>>({ status: 'REQUESTED' });
  const [newAttendance, setNewAttendance] = useState<Partial<AttendanceRecord>>({ status: 'Present' });
  const [newContract, setNewContract] = useState<Partial<Contract>>({ status: 'Active' });
  const [newDisciplinary, setNewDisciplinary] = useState<Partial<DisciplinaryAction>>({ status: 'OPEN' });
  const [newCourse, setNewCourse] = useState<Partial<TrainingCourse>>({ status: 'SCHEDULED' });

  // Filters & State
  const [contractClause, setContractClause] = useState('');
  const [showProfessionPicker, setShowProfessionPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingMonth, setProcessingMonth] = useState(new Date().getMonth() + 1);
  const [processingYear, setProcessingYear] = useState(new Date().getFullYear());
  const [previewSlips, setPreviewSlips] = useState<SalarySlip[]>([]);
  const [isPayrollCertified, setIsPayrollCertified] = useState(false);

  // Mock Data for View Only sections
  const [candidates, setCandidates] = useState<Candidate[]>([
      { id: 'c1', name: 'Ana Silva', email: 'ana@mail.com', phone: '923000000', appliedRole: 'Contabilista', stage: 'SCREENING', applicationDate: '2024-05-01', aiMatchScore: 85 }
  ]);

  // --- Handlers ---

  const handleSaveEmployee = () => {
      if (!newEmp.name || !newEmp.nif || !newEmp.baseSalary) return alert("Preencha campos obrigatórios: Nome, NIF, Salário Base");
      const emp: Employee = {
          id: newEmp.id || generateId(),
          name: newEmp.name!,
          nif: newEmp.nif!,
          biNumber: newEmp.biNumber || '',
          ssn: newEmp.ssn || 'N/A',
          role: newEmp.role || 'Geral',
          professionId: newEmp.professionId,
          professionName: newEmp.professionName,
          department: newEmp.department || 'Geral',
          workLocationId: newEmp.workLocationId || '',
          baseSalary: Number(newEmp.baseSalary),
          status: newEmp.status || 'Active',
          admissionDate: newEmp.admissionDate || new Date().toISOString().split('T')[0],
          contractType: newEmp.contractType,
          contractClauses: newEmp.contractClauses || [],
          photoUrl: newEmp.photoUrl,
          bankAccount: newEmp.bankAccount,
          email: newEmp.email,
          phone: newEmp.phone,
          gender: newEmp.gender,
          birthDate: newEmp.birthDate,
          maritalStatus: newEmp.maritalStatus,
          address: newEmp.address,
          subsidyTransport: Number(newEmp.subsidyTransport || 0),
          subsidyFood: Number(newEmp.subsidyFood || 0),
          subsidyFamily: Number(newEmp.subsidyFamily || 0),
          subsidyHousing: Number(newEmp.subsidyHousing || 0),
          subsidyChristmas: Number(newEmp.subsidyChristmas || 0),
          subsidyVacation: Number(newEmp.subsidyVacation || 0),
          turnoverRisk: 'Low'
      };
      onSaveEmployee(emp);
      setShowEmpModal(false);
      setNewEmp({ status: 'Active', contractType: 'Determinado' });
  };

  const handleSaveVacation = () => {
      if (!newVacation.employeeId || !newVacation.startDate || !newVacation.days) return alert("Preencha os campos obrigatórios");
      onSaveVacation({
          id: generateId(),
          employeeId: newVacation.employeeId!,
          startDate: newVacation.startDate!,
          endDate: newVacation.endDate || newVacation.startDate!,
          days: Number(newVacation.days),
          status: newVacation.status || 'REQUESTED',
          year: new Date().getFullYear()
      });
      setShowVacationModal(false);
      setNewVacation({ status: 'REQUESTED' });
  };

  const handleSaveAttendance = () => {
      if (!newAttendance.employeeId || !newAttendance.date) return alert("Preencha funcionário e data");
      onSaveAttendance({
          id: generateId(),
          employeeId: newAttendance.employeeId!,
          date: newAttendance.date!,
          checkIn: newAttendance.checkIn,
          checkOut: newAttendance.checkOut,
          status: newAttendance.status || 'Present',
          justification: newAttendance.justification,
          overtimeHours: Number(newAttendance.overtimeHours || 0)
      });
      setShowAttendanceModal(false);
      setNewAttendance({ status: 'Present' });
  };

  const handleSaveContract = () => {
      if (!newContract.employeeId || !newContract.type || !newContract.startDate) return alert("Preencha os campos do contrato");
      onSaveContract({
          id: generateId(),
          employeeId: newContract.employeeId!,
          type: newContract.type!,
          startDate: newContract.startDate!,
          endDate: newContract.endDate,
          status: 'Active',
          clauses: newContract.clauses || []
      });
      setShowContractModal(false);
      setNewContract({ status: 'Active' });
  };

  const calculatePayrollPreview = () => {
      const slips: SalarySlip[] = employees.filter(e => e.status === 'Active').map(e => {
          const empTrans = transactions.filter(t => 
              t.employeeId === e.id && 
              !t.processed &&
              new Date(t.date).getMonth() + 1 === processingMonth &&
              new Date(t.date).getFullYear() === processingYear
          );

          const bonuses = empTrans.filter(t => t.type === 'BONUS').reduce((acc, t) => acc + t.amount, 0);
          const allowances = empTrans.filter(t => t.type === 'ALLOWANCE').reduce((acc, t) => acc + t.amount, 0);
          const totalSubsidies = (e.subsidyTransport || 0) + (e.subsidyFood || 0) + (e.subsidyFamily || 0) + (e.subsidyHousing || 0);
          
          const dailyRate = e.baseSalary / 22; 
          const absenceAmount = empTrans.filter(t => t.type === 'ABSENCE').reduce((acc, t) => acc + t.amount, 0);
          const advances = empTrans.filter(t => t.type === 'ADVANCE').reduce((acc, t) => acc + t.amount, 0); 

          const gross = e.baseSalary + bonuses + allowances - absenceAmount; 
          const inss = calculateINSS(gross);
          const irt = calculateIRT(gross, inss);
          const net = gross + totalSubsidies - inss - irt - advances;

          return {
              employeeId: e.id,
              employeeName: e.name,
              employeeRole: e.role,
              professionCode: e.professionId ? professions.find(p => p.id === e.professionId)?.code : '',
              baseSalary: e.baseSalary,
              allowances: allowances + bonuses, 
              bonuses,
              subsidies: totalSubsidies,
              subsidyTransport: e.subsidyTransport || 0,
              subsidyFood: e.subsidyFood || 0,
              subsidyFamily: e.subsidyFamily || 0,
              subsidyHousing: e.subsidyHousing || 0,
              absences: absenceAmount,
              advances,
              grossTotal: gross,
              inss,
              irt,
              netTotal: net
          };
      });
      setPreviewSlips(slips);
      setIsPayrollCertified(false);
  };

  const certifyPayroll = () => {
      if (previewSlips.length === 0) return;
      if (window.confirm("ATENÇÃO: Ao certificar, os movimentos financeiros serão gerados e os recibos emitidos. Continuar?")) {
          onProcessPayroll(previewSlips);
          setIsPayrollCertified(true);
          alert("Processamento Certificado com Sucesso!");
      }
  };

  const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- RENDER SECTIONS ---

  const renderDashboard = () => (
      <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase">Total Colaboradores</p>
                      <h2 className="text-3xl font-black text-blue-900">{employees.filter(e => e.status === 'Active').length}</h2>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24}/></div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase">Custo Mensal (Estim.)</p>
                      <h2 className="text-2xl font-bold text-slate-800">{formatCurrency(employees.reduce((acc, e) => acc + e.baseSalary, 0))}</h2>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Wallet size={24}/></div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase">Faltas no Mês</p>
                      <h2 className="text-3xl font-black text-orange-500">{attendance.filter(a => a.status === 'Absent').length}</h2>
                  </div>
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Clock size={24}/></div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase">Turnover (Risco)</p>
                      <h2 className="text-3xl font-black text-red-500">{employees.filter(e => e.turnoverRisk === 'High').length}</h2>
                  </div>
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg"><TrendingUp size={24}/></div>
              </div>
          </div>
          {/* Charts/Graphs placeholders */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-64 flex items-center justify-center text-slate-400">
              <BarChart3 size={48} className="mr-4"/>
              <span>Gráficos de evolução salarial e assiduidade (Visualização)</span>
          </div>
      </div>
  );

  const renderGestao = () => (
      <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="relative">
                  <Search className="absolute left-2 top-2.5 text-slate-400" size={16}/>
                  <input className="pl-8 p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Procurar Colaborador" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
              </div>
              <button onClick={() => setShowEmpModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md">
                  <UserPlus size={16}/> Cadastrar Funcionário
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map(e => (
                  <div key={e.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition relative overflow-hidden">
                      <div className="w-16 h-16 bg-slate-100 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-200">
                          {e.photoUrl ? <img src={e.photoUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-400"><Users/></div>}
                      </div>
                      <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-800">{e.name}</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase mb-2">{e.role}</p>
                          <div className="text-xs text-slate-600 space-y-1">
                              <p>Contrato: {e.contractType}</p>
                              <p>Salário Base: <span className="font-bold text-slate-900">{formatCurrency(e.baseSalary)}</span></p>
                          </div>
                          <div className="mt-3 pt-3 border-t flex gap-2">
                              <button onClick={() => { setNewEmp(e); setShowEmpModal(true); }} className="flex-1 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded hover:bg-slate-200 font-bold">Editar Ficha</button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderVacations = () => (
      <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Calendar size={20} className="text-orange-500"/> Mapa de Férias</h3>
              <button onClick={() => setShowVacationModal(true)} className="bg-orange-600 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2">
                  <Plus size={16}/> Marcar Férias
              </button>
          </div>
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold"><tr><th className="p-3">Funcionário</th><th className="p-3">Início</th><th className="p-3">Fim</th><th className="p-3">Dias</th><th className="p-3">Estado</th></tr></thead>
                  <tbody>
                      {vacations.map(v => {
                          const empName = employees.find(e => e.id === v.employeeId)?.name || 'Desconhecido';
                          return (
                              <tr key={v.id} className="border-b">
                                  <td className="p-3">{empName}</td>
                                  <td className="p-3">{formatDate(v.startDate)}</td>
                                  <td className="p-3">{formatDate(v.endDate)}</td>
                                  <td className="p-3 font-bold">{v.days}</td>
                                  <td className="p-3"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold text-[10px]">{v.status}</span></td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderAttendance = () => (
      <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={20} className="text-blue-500"/> Assiduidade e Ponto</h3>
              <button onClick={() => setShowAttendanceModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2">
                  <Plus size={16}/> Registar Ponto
              </button>
          </div>
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold"><tr><th className="p-3">Funcionário</th><th className="p-3">Data</th><th className="p-3">Entrada</th><th className="p-3">Saída</th><th className="p-3">Estado</th></tr></thead>
                  <tbody>
                      {attendance.map(a => {
                          const empName = employees.find(e => e.id === a.employeeId)?.name || 'Desconhecido';
                          return (
                              <tr key={a.id} className="border-b">
                                  <td className="p-3">{empName}</td>
                                  <td className="p-3">{formatDate(a.date)}</td>
                                  <td className="p-3">{a.checkIn || '--:--'}</td>
                                  <td className="p-3">{a.checkOut || '--:--'}</td>
                                  <td className="p-3"><span className={`px-2 py-1 rounded font-bold text-[10px] ${a.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{a.status}</span></td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderContracts = () => (
      <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><HeartHandshake size={20} className="text-purple-500"/> Gestão de Contratos</h3>
              <button onClick={() => setShowContractModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2">
                  <Plus size={16}/> Novo Contrato
              </button>
          </div>
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold"><tr><th className="p-3">Funcionário</th><th className="p-3">Tipo</th><th className="p-3">Início</th><th className="p-3">Fim</th><th className="p-3">Estado</th><th className="p-3">Ações</th></tr></thead>
                  <tbody>
                      {contracts.map(c => {
                          const empName = employees.find(e => e.id === c.employeeId)?.name || 'Desconhecido';
                          return (
                              <tr key={c.id} className="border-b">
                                  <td className="p-3">{empName}</td>
                                  <td className="p-3">{c.type}</td>
                                  <td className="p-3">{formatDate(c.startDate)}</td>
                                  <td className="p-3">{c.endDate ? formatDate(c.endDate) : 'Indefinido'}</td>
                                  <td className="p-3"><span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold text-[10px]">{c.status}</span></td>
                                  <td className="p-3 text-center"><button className="text-blue-600 hover:underline"><Printer size={14}/></button></td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderBenefits = () => (
      <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Wallet size={20} className="text-green-600"/> Configuração de Benefícios e Subsídios</h3>
              <p className="text-xs text-slate-500 mb-4">Os valores são configurados na ficha individual de cada funcionário.</p>
              <table className="w-full text-left text-xs border">
                  <thead className="bg-slate-100 font-bold"><tr><th className="p-3">Funcionário</th><th className="p-3 text-right">Transporte</th><th className="p-3 text-right">Alimentação</th><th className="p-3 text-right">Família</th><th className="p-3 text-right">Habitação</th><th className="p-3 text-right">Total</th></tr></thead>
                  <tbody>
                      {employees.map(e => (
                          <tr key={e.id} className="border-b hover:bg-slate-50">
                              <td className="p-3 font-medium">{e.name}</td>
                              <td className="p-3 text-right">{formatCurrency(e.subsidyTransport || 0)}</td>
                              <td className="p-3 text-right">{formatCurrency(e.subsidyFood || 0)}</td>
                              <td className="p-3 text-right">{formatCurrency(e.subsidyFamily || 0)}</td>
                              <td className="p-3 text-right">{formatCurrency(e.subsidyHousing || 0)}</td>
                              <td className="p-3 text-right font-bold text-green-700">{formatCurrency((e.subsidyTransport||0)+(e.subsidyFood||0)+(e.subsidyFamily||0)+(e.subsidyHousing||0))}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderReports = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center hover:bg-blue-50 transition" onClick={() => window.print()}>
              <FileCheck size={32} className="text-blue-600 mb-2"/>
              <span className="font-bold text-slate-800">Recibos de Vencimento</span>
          </button>
          <button className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center hover:bg-green-50 transition">
              <Table size={32} className="text-green-600 mb-2"/>
              <span className="font-bold text-slate-800">Mapa de INSS</span>
          </button>
          <button className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center hover:bg-orange-50 transition">
              <Calculator size={32} className="text-orange-600 mb-2"/>
              <span className="font-bold text-slate-800">Mapa de IRT</span>
          </button>
      </div>
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users/> Recursos Humanos & Salários</h1>
                <p className="text-xs text-slate-500">Gestão completa conforme Legislação Angolana</p>
            </div>
            <div className="flex gap-2 bg-white p-1 rounded-lg border shadow-sm overflow-x-auto w-full md:w-auto custom-scrollbar">
                {['DASHBOARD', 'GESTÃO', 'PROFISSÕES', 'MAPAS', 'FÉRIAS', 'ASSIDUIDADE', 'CONTRATOS', 'PROCESSAMENTO', 'DISCIPLINAR', 'FORMAÇÃO', 'BENEFICIOS', 'RELATORIOS'].map(t => (
                    <button 
                        key={t}
                        onClick={() => setActiveTab(t as any)}
                        className={`px-3 py-2 rounded-md font-bold text-[10px] uppercase transition-all whitespace-nowrap ${activeTab === t ? 'bg-slate-800 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        {t === 'MAPAS' ? 'MAPAS SAL.' : t}
                    </button>
                ))}
            </div>
        </div>

        {activeTab === 'DASHBOARD' && renderDashboard()}
        {activeTab === 'GESTÃO' && renderGestao()}
        {activeTab === 'PROFISSÕES' && <div className="h-[calc(100vh-200px)]"><ProfessionManager professions={professions} onSave={onSaveProfession} onDelete={onDeleteProfession}/></div>}
        {activeTab === 'MAPAS' && <SalaryMap payroll={payroll} employees={employees} />}
        {activeTab === 'FÉRIAS' && renderVacations()}
        {activeTab === 'ASSIDUIDADE' && renderAttendance()}
        {activeTab === 'CONTRATOS' && renderContracts()}
        {activeTab === 'BENEFICIOS' && renderBenefits()}
        {activeTab === 'RELATORIOS' && renderReports()}
        
        {activeTab === 'PROCESSAMENTO' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold mb-4">Processamento Salarial Mensal</h3>
                <div className="flex gap-4 mb-4 items-end">
                    <div>
                        <label className="text-xs font-bold block mb-1">Mês</label>
                        <select className="border p-2 rounded" value={processingMonth} onChange={e => setProcessingMonth(Number(e.target.value))}>
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold block mb-1">Ano</label>
                        <select className="border p-2 rounded" value={processingYear} onChange={e => setProcessingYear(Number(e.target.value))}>
                            <option value={2024}>2024</option>
                            <option value={2025}>2025</option>
                        </select>
                    </div>
                    <button onClick={calculatePayrollPreview} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-xs h-[38px]">Calcular Folha</button>
                    <button onClick={certifyPayroll} disabled={previewSlips.length === 0} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-xs h-[38px] disabled:opacity-50">Certificar e Emitir</button>
                </div>
                {previewSlips.length > 0 && (
                    <table className="w-full text-xs text-left border">
                        <thead><tr className="bg-slate-100 font-bold"><th className="p-2">Nome</th><th className="p-2 text-right">Base</th><th className="p-2 text-right">Subsídios</th><th className="p-2 text-right">IRT</th><th className="p-2 text-right">INSS</th><th className="p-2 text-right">Líquido</th></tr></thead>
                        <tbody>
                            {previewSlips.map(s => (
                                <tr key={s.employeeId} className="border-b"><td className="p-2">{s.employeeName}</td><td className="p-2 text-right">{formatCurrency(s.baseSalary)}</td><td className="p-2 text-right">{formatCurrency(s.subsidies)}</td><td className="p-2 text-right text-red-600">{formatCurrency(s.irt)}</td><td className="p-2 text-right text-red-600">{formatCurrency(s.inss)}</td><td className="p-2 text-right font-bold">{formatCurrency(s.netTotal)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        )}

        {/* MODALS */}
        
        {/* EMPLOYEE MODAL */}
        {showEmpModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 shadow-2xl">
                    <div className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus size={20}/> {newEmp.id ? 'Editar Trabalhador' : 'Admitir Trabalhador'}</h3>
                        <button onClick={() => setShowEmpModal(false)}><X size={20}/></button>
                    </div>
                    <div className="p-6">
                        <h4 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-100 pb-2 mb-4">Dados Pessoais</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div><label className="text-xs font-bold uppercase text-slate-500">Nome Completo</label><input className="w-full border p-2 rounded bg-slate-50" value={newEmp.name || ''} onChange={e => setNewEmp({...newEmp, name: e.target.value})}/></div>
                            <div><label className="text-xs font-bold uppercase text-slate-500">NIF</label><input className="w-full border p-2 rounded bg-slate-50" value={newEmp.nif || ''} onChange={e => setNewEmp({...newEmp, nif: e.target.value})}/></div>
                            <div><label className="text-xs font-bold uppercase text-slate-500">BI Nº</label><input className="w-full border p-2 rounded bg-slate-50" value={newEmp.biNumber || ''} onChange={e => setNewEmp({...newEmp, biNumber: e.target.value})}/></div>
                            <div><label className="text-xs font-bold uppercase text-slate-500">Género</label><select className="w-full border p-2 rounded bg-slate-50" value={newEmp.gender} onChange={e => setNewEmp({...newEmp, gender: e.target.value as any})}><option value="M">Masculino</option><option value="F">Feminino</option></select></div>
                            <div><label className="text-xs font-bold uppercase text-slate-500">Estado Civil</label><select className="w-full border p-2 rounded bg-slate-50" value={newEmp.maritalStatus} onChange={e => setNewEmp({...newEmp, maritalStatus: e.target.value as any})}><option value="Solteiro">Solteiro</option><option value="Casado">Casado</option></select></div>
                            <div><label className="text-xs font-bold uppercase text-slate-500">Nascimento</label><input type="date" className="w-full border p-2 rounded bg-slate-50" value={newEmp.birthDate} onChange={e => setNewEmp({...newEmp, birthDate: e.target.value})}/></div>
                            <div className="col-span-3"><label className="text-xs font-bold uppercase text-slate-500">Morada</label><input className="w-full border p-2 rounded bg-slate-50" value={newEmp.address || ''} onChange={e => setNewEmp({...newEmp, address: e.target.value})}/></div>
                        </div>
                        <h4 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-100 pb-2 mb-4">Dados Contratuais e Financeiros</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div><label className="text-xs font-bold uppercase text-slate-500">Salário Base</label><input type="number" className="w-full border p-2 rounded font-bold text-lg" value={newEmp.baseSalary || ''} onChange={e => setNewEmp({...newEmp, baseSalary: Number(e.target.value)})}/></div>
                            <div><label className="text-xs font-bold uppercase text-slate-500">Sub. Transporte</label><input type="number" className="w-full border p-2 rounded" value={newEmp.subsidyTransport || ''} onChange={e => setNewEmp({...newEmp, subsidyTransport: Number(e.target.value)})}/></div>
                            <div><label className="text-xs font-bold uppercase text-slate-500">Sub. Alimentação</label><input type="number" className="w-full border p-2 rounded" value={newEmp.subsidyFood || ''} onChange={e => setNewEmp({...newEmp, subsidyFood: Number(e.target.value)})}/></div>
                            <div><label className="text-xs font-bold uppercase text-slate-500">Outros Sub.</label><input type="number" className="w-full border p-2 rounded" value={newEmp.subsidyFamily || ''} onChange={e => setNewEmp({...newEmp, subsidyFamily: Number(e.target.value)})}/></div>
                        </div>
                    </div>
                    <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 sticky bottom-0">
                        <button onClick={() => setShowEmpModal(false)} className="px-4 py-2 border rounded hover:bg-white">Cancelar</button>
                        <button onClick={handleSaveEmployee} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Salvar Ficha</button>
                    </div>
                </div>
            </div>
        )}

        {/* VACATION MODAL */}
        {showVacationModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6">
                    <h3 className="font-bold text-lg mb-4">Marcar Férias</h3>
                    <div className="space-y-4">
                        <select className="w-full border p-2 rounded" value={newVacation.employeeId || ''} onChange={e => setNewVacation({...newVacation, employeeId: e.target.value})}>
                            <option value="">Selecione Funcionário...</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold">Início</label><input type="date" className="w-full border p-2 rounded" onChange={e => setNewVacation({...newVacation, startDate: e.target.value})}/></div>
                            <div><label className="text-xs font-bold">Dias</label><input type="number" className="w-full border p-2 rounded" onChange={e => setNewVacation({...newVacation, days: Number(e.target.value)})}/></div>
                        </div>
                        <button onClick={handleSaveVacation} className="w-full bg-blue-600 text-white py-2 rounded font-bold">Confirmar</button>
                        <button onClick={() => setShowVacationModal(false)} className="w-full border py-2 rounded">Cancelar</button>
                    </div>
                </div>
            </div>
        )}

        {/* ATTENDANCE MODAL */}
        {showAttendanceModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6">
                    <h3 className="font-bold text-lg mb-4">Registo de Ponto</h3>
                    <div className="space-y-4">
                        <select className="w-full border p-2 rounded" value={newAttendance.employeeId || ''} onChange={e => setNewAttendance({...newAttendance, employeeId: e.target.value})}>
                            <option value="">Selecione Funcionário...</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                        <input type="date" className="w-full border p-2 rounded" onChange={e => setNewAttendance({...newAttendance, date: e.target.value})}/>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="time" className="w-full border p-2 rounded" placeholder="Entrada" onChange={e => setNewAttendance({...newAttendance, checkIn: e.target.value})}/>
                            <input type="time" className="w-full border p-2 rounded" placeholder="Saída" onChange={e => setNewAttendance({...newAttendance, checkOut: e.target.value})}/>
                        </div>
                        <select className="w-full border p-2 rounded" value={newAttendance.status} onChange={e => setNewAttendance({...newAttendance, status: e.target.value as any})}>
                            <option value="Present">Presente</option>
                            <option value="Absent">Falta</option>
                            <option value="Late">Atraso</option>
                        </select>
                        <button onClick={handleSaveAttendance} className="w-full bg-blue-600 text-white py-2 rounded font-bold">Registar</button>
                        <button onClick={() => setShowAttendanceModal(false)} className="w-full border py-2 rounded">Cancelar</button>
                    </div>
                </div>
            </div>
        )}

        {/* CONTRACT MODAL */}
        {showContractModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6">
                    <h3 className="font-bold text-lg mb-4">Novo Contrato</h3>
                    <div className="space-y-4">
                        <select className="w-full border p-2 rounded" value={newContract.employeeId || ''} onChange={e => setNewContract({...newContract, employeeId: e.target.value})}>
                            <option value="">Selecione Funcionário...</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                        <select className="w-full border p-2 rounded" value={newContract.type} onChange={e => setNewContract({...newContract, type: e.target.value as any})}>
                            <option value="Determinado">Termo Certo (Determinado)</option>
                            <option value="Indeterminado">Sem Termo (Indeterminado)</option>
                            <option value="Estagio">Estágio</option>
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold">Início</label><input type="date" className="w-full border p-2 rounded" onChange={e => setNewContract({...newContract, startDate: e.target.value})}/></div>
                            <div><label className="text-xs font-bold">Fim</label><input type="date" className="w-full border p-2 rounded" onChange={e => setNewContract({...newContract, endDate: e.target.value})}/></div>
                        </div>
                        <button onClick={handleSaveContract} className="w-full bg-purple-600 text-white py-2 rounded font-bold">Criar Contrato</button>
                        <button onClick={() => setShowContractModal(false)} className="w-full border py-2 rounded">Cancelar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default HumanResources;
