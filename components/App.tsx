import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import InvoiceList from './InvoiceList';
import InvoiceForm from './InvoiceForm';
import PurchaseList from './PurchaseList';
import PurchaseForm from './PurchaseForm';
import ClientList from './ClientList';
import SupplierList from './SupplierList';
import Settings from './Settings';
import StockManager from './StockManager'; 
import TaxManager from './TaxManager';
import CostRevenueMap from './CostRevenueMap';
import TaxCalculationMap from './TaxCalculationMap';
import RegularizationMap from './RegularizationMap';
import Model7 from './Model7';
import CashManager from './CashManager'; 
import HumanResources from './HumanResources'; 
import Employees from './Employees'; 
import Workspace from './Workspace';
import SaftExport from './SaftExport';
import ManagementReports from './ManagementReports';
import AccountingMaps from './AccountingMaps';
import PGCManager from './PGCManager'; 
import RubricasManager from './RubricasManager';
import ClassifyMovement from './ClassifyMovement';
import VatSettlementMap from './VatSettlementMap'; 
import OpeningBalanceMap from './OpeningBalanceMap'; 
import AccountExtract from './AccountExtract'; 
import SecretariaList from './SecretariaList'; 
import SecretariaForm from './SecretariaForm';
import PurchaseAnalysis from './PurchaseAnalysis'; 
// POS Imports
import POS from './POS';
import POSSettings from './POSSettings';
import CashClosure from './CashClosure';
import CashClosureHistory from './CashClosureHistory';
// LOGIN
import LoginPage from './LoginPage';
// HR PERFORMANCE
import PerformanceAnalysis from './PerformanceAnalysis';

import { 
  Invoice, InvoiceStatus, ViewState, Client, Product, InvoiceType, 
  Warehouse, PriceTable, StockMovement, Purchase, SaftType, Company, User,
  Employee, PayrollRun, SalarySlip, HrTransaction, HrTransactionType, WorkLocation, CashRegister, DocumentSeries,
  AccountingView, PurchaseType, LicensePlan, Supplier, PaymentMethod, CashMovement, HrVacation, PGCAccount, Profession, Contract, AttendanceRecord,
  VatSettlement, OpeningBalance, SecretariaDocument, POSConfig, CashClosure as CashClosureType, UserActivityLog, Task, AppLanguage
} from '../types';
import { 
  Menu, Lock, Bell, CheckSquare, Flag, Calendar as CalendarIcon, Plus, X, Trash2, Edit
} from 'lucide-react';
import { generateId, generateInvoiceHash, getDocumentPrefix } from '../utils';

// --- MOCK DATA ---
const MOCK_COMPANY_DEFAULT: Company = {
  id: 'comp1', name: 'C & V - COMERCIO GERAL E PRESTAÇAO DE SERVIÇOS, LDA', nif: '5000780316', 
  address: 'Luanda, Angola', email: 'geral@empresa.ao', phone: '+244 923 000 000', regime: 'Geral',
  licensePlan: 'ENTERPRISE', status: 'ACTIVE', validUntil: '2025-12-31', registrationDate: '2024-01-01'
};

const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Admin', email: 'admin@sistema.ao', password: '123', role: 'ADMIN', companyId: 'comp1', permissions: [], createdAt: '2024-01-01' },
    { id: 'u2', name: 'João Operador', email: 'joao@sistema.ao', password: '123', role: 'OPERATOR', companyId: 'comp1', permissions: ['DASHBOARD', 'INVOICES', 'CREATE_INVOICE', 'POS'], createdAt: '2024-02-01' }
];

const MOCK_ACTIVITY_LOGS: UserActivityLog[] = [
    { id: 'l1', userId: 'u1', userName: 'Admin', timestamp: new Date().toISOString(), action: 'Login', module: 'System', details: 'Acesso ao sistema' },
    { id: 'l2', userId: 'u1', userName: 'Admin', timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'Create Invoice', module: 'Sales', details: 'Fatura FT 2024/1 criada' },
    { id: 'l3', userId: 'u2', userName: 'João Operador', timestamp: new Date(Date.now() - 7200000).toISOString(), action: 'Login', module: 'System', details: 'Início de turno' },
    { id: 'l4', userId: 'u2', userName: 'João Operador', timestamp: new Date(Date.now() - 5000000).toISOString(), action: 'POS Sale', module: 'POS', details: 'Venda rápida POS' },
];

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Angola Telecom', email: 'billing@angolatelecom.ao', vatNumber: '500123456', address: 'Rua Principal, 123', city: 'Luanda', country: 'Angola', phone: '+244 923 111 222', accountBalance: 250000, clientType: 'Empresa Nacional', province: 'Luanda', transactions: [] },
  { id: '2', name: 'Tech Solutions Lda', email: 'contact@techsol.ao', vatNumber: '500987654', address: 'Av. Liberdade, 45', city: 'Benguela', country: 'Angola', phone: '+244 923 333 444', accountBalance: 1299600, clientType: 'Empresa Nacional', province: 'Benguela', transactions: [] },
  { id: '3', name: 'Padaria Central', email: 'geral@padariacentral.ao', vatNumber: '500555444', address: 'Rua do Comércio', city: 'Lobito', country: 'Angola', phone: '+244 923 555 666', accountBalance: 0, clientType: 'Empresa Nacional', province: 'Benguela', transactions: [] },
];

const MOCK_SUPPLIERS: Supplier[] = [
    { id: 's1', name: 'Fornecedor A', vatNumber: '500999888', email: 'compras@fornecedora.ao', phone: '923000111', address: 'Viana', city: 'Luanda', province: 'Luanda', accountBalance: 0, transactions: [] }
];

const MOCK_WAREHOUSES: Warehouse[] = [
  { id: 'wh1', name: 'Armazém Central', location: 'Viana, Luanda' },
  { id: 'wh2', name: 'Loja Benfica', location: 'Benfica, Luanda' }
];

const MOCK_PRICE_TABLES: PriceTable[] = [
  { id: 'pt1', name: 'PVP Geral', percentage: 30 },
  { id: 'pt2', name: 'Revenda', percentage: 15 },
  { id: 'pt3', name: 'VIP', percentage: 10 },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Computador HP i7', costPrice: 200000, price: 280000, unit: 'un', category: 'Informatica', stock: 15, warehouseId: 'wh1', priceTableId: 'pt1', minStock: 5 },
  { id: 'p2', name: 'Impressora Epson', costPrice: 80000, price: 120000, unit: 'un', category: 'Informatica', stock: 8, warehouseId: 'wh1', priceTableId: 'pt1', minStock: 2 },
  { id: 'p3', name: 'Café Grão 1kg', costPrice: 4000, price: 6500, unit: 'kg', category: 'Alimentar', stock: 50, warehouseId: 'wh2', priceTableId: 'pt1', minStock: 10 },
  { id: 'p4', name: 'Hambúrguer Simples', costPrice: 1500, price: 3500, unit: 'un', category: 'Restaurante', stock: 100, warehouseId: 'wh2', priceTableId: 'pt1', minStock: 20 },
  { id: 'p5', name: 'Sumo Natural', costPrice: 500, price: 1500, unit: 'un', category: 'Restaurante', stock: 200, warehouseId: 'wh2', priceTableId: 'pt1', minStock: 20 },
];

const MOCK_SERIES: DocumentSeries[] = [
    { 
        id: 's1', 
        name: 'Série Geral 2024', 
        code: 'A', 
        type: 'NORMAL', 
        year: 2024, 
        currentSequence: 120, 
        sequences: { 
            [InvoiceType.FT]: 1, 
            [InvoiceType.FR]: 1, 
            [InvoiceType.NC]: 1, 
            [InvoiceType.ND]: 1,
            [InvoiceType.RG]: 1,
            [InvoiceType.GR]: 1,
            [InvoiceType.GT]: 1,
            [InvoiceType.PP]: 1,
            [InvoiceType.OR]: 1,
            [InvoiceType.VD]: 1,
            [InvoiceType.NE]: 1,
            [InvoiceType.GE]: 1,
            [InvoiceType.FS]: 1
        }, 
        isActive: true, 
        allowedUserIds: [], 
        bankDetails: 'BFA: AO06 0001 0000 \nBAI: AO06 0040 0000', 
        footerText: 'Processado por imatec soft' 
    },
    { 
        id: 's2', 
        name: 'Recuperação 2023', 
        code: 'REC', 
        type: 'MANUAL', 
        year: 2023, 
        currentSequence: 50, 
        sequences: {},
        isActive: true, 
        allowedUserIds: [], 
        bankDetails: 'BFA: AO06 0001 0000', 
        footerText: 'Documento Manual Recuperado' 
    },
    { 
        id: 's3', 
        name: 'Secretaria 2024', 
        code: 'S2024', 
        type: 'NORMAL', 
        year: 2024, 
        currentSequence: 5, 
        sequences: {},
        isActive: true, 
        allowedUserIds: [], 
        footerText: 'Secretaria Geral' 
    }
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv1', number: 'FT A 2024/1', type: InvoiceType.FT, date: '2024-05-01', dueDate: '2024-05-15', clientId: '1', clientName: 'Angola Telecom',
    items: [{ id: 'i1', type: 'SERVICE', description: 'Consultoria', quantity: 10, unitPrice: 25000, discount: 0, taxRate: 14, total: 250000, rubrica: '62.1' }],
    subtotal: 250000, globalDiscount: 0, taxRate: 14, taxAmount: 35000, withholdingAmount: 16250, total: 268750, status: InvoiceStatus.PAID, paidAmount: 268750,
    currency: 'AOA', exchangeRate: 1, contraValue: 268750,
    companyId: 'comp1', isCertified: true, hash: 'X8jK', workLocationId: 'wl1', seriesId: 's1', seriesCode: 'A'
  },
];

const MOCK_SECRETARIA_DOCS: SecretariaDocument[] = [
    {
        id: 'sd1', type: 'Carta', seriesId: 's3', seriesCode: 'S2024', number: 'CL/0001457.2671.2025.00003', date: '2025-10-23', dateExtended: 'Luanda, 23 de Outubro de 2025',
        destinatarioIntro: 'Sua Excia. Senhor', destinatarioNome: 'Administrador do Município do Calumbo', assunto: 'Obtenção do Alvará de Restauração',
        corpo: 'Vimos por este meio solicitar...', confidencial: false, imprimirPagina: true, createdBy: 'Admin', createdAt: '2025-10-23', isLocked: false
    },
    {
        id: 'sd2', type: 'Carta', seriesId: 's3', seriesCode: 'S2024', number: 'CL/0001457.2671.2025.00002', date: '2025-09-30', dateExtended: 'Luanda, 30 de Setembro de 2025',
        destinatarioIntro: 'AO', destinatarioNome: 'BANCO BIC', assunto: 'DECLARAÇÃO',
        corpo: 'Declara-se para os devidos efeitos...', confidencial: false, imprimirPagina: true, createdBy: 'Admin', createdAt: '2025-09-30', isLocked: false
    }
];

const MOCK_WORK_LOCATIONS: WorkLocation[] = [
    { id: 'wl1', name: 'Sede Principal', address: 'Luanda, Centro', managerName: 'Admin' },
    { id: 'wl2', name: 'Filial Viana', address: 'Viana, Luanda', managerName: 'João' }
];

const MOCK_CASH_REGISTERS: CashRegister[] = [
    { id: 'cr1', name: 'Caixa Principal', status: 'OPEN', balance: 50000, initialBalance: 0 }
];

const MOCK_PROFESSIONS: Profession[] = [
    { id: 'p1', code: '622', name: 'Encarregado de Limpeza', category: 'Operacional' },
    { id: 'p2', code: '925', name: 'Operador de fim de máquina - papel', category: 'Técnico' },
    { id: 'p3', code: '968', name: 'Operador de forno de cal', category: 'Técnico' },
    { id: 'p4', code: '2251', name: 'Motorista de pesados', category: 'Operacional' },
    { id: 'p5', code: '325', name: 'Decalcador - Cinema de Animação', category: 'Arte' },
    { id: 'p6', code: '326', name: 'Colorista - Cinema de Animação', category: 'Arte' },
    { id: 'p7', code: '333', name: 'Cantor', category: 'Arte' },
];

const INITIAL_PGC_ACCOUNTS: PGCAccount[] = [
    { id: 'pgc1', code: '1', description: 'MEIOS FIXOS E INVESTIMENTOS', type: 'CLASSE', nature: 'DEBITO' },
    { id: 'pgc11', code: '11', description: 'IMOBILIZAÇÕES CORPÓREAS', type: 'GRUPO', nature: 'DEBITO', parentCode: '1' },
    { id: 'pgc31', code: '31', description: 'CLIENTES', type: 'GRUPO', nature: 'AMBOS' },
    { id: 'pgc311', code: '31.1', description: 'Clientes Conta Corrente', type: 'SUBGRUPO', nature: 'AMBOS' },
    { id: 'pgc32', code: '32', description: 'FORNECEDORES', type: 'GRUPO', nature: 'CREDITO' },
    { id: 'pgc34', code: '34', description: 'ESTADO', type: 'GRUPO', nature: 'AMBOS' },
    { id: 'pgc61', code: '61', description: 'VENDAS', type: 'GRUPO', nature: 'CREDITO' },
    { id: 'pgc62', code: '62', description: 'PRESTAÇÃO DE SERVIÇOS', type: 'GRUPO', nature: 'CREDITO' },
    { id: 'pgc71', code: '71', description: 'CUSTO DAS MERCADORIAS', type: 'GRUPO', nature: 'DEBITO' },
    { id: 'pgc72', code: '72', description: 'CUSTOS COM PESSOAL', type: 'GRUPO', nature: 'DEBITO' },
    { id: 'pgc75', code: '75', description: 'FORNECIMENTOS E SERVIÇOS TERCEIROS', type: 'GRUPO', nature: 'DEBITO' },
    { id: 'pgc88', code: '88', description: 'RESULTADO LÍQUIDO DO EXERCÍCIO', type: 'GRUPO', nature: 'AMBOS', parentCode: '8' }
];

const DEFAULT_POS_CONFIG: POSConfig = {
    defaultSeriesId: '',
    printerType: '80mm',
    autoPrint: true,
    allowDiscounts: true,
    defaultClientId: 'CONSUMIDOR_FINAL',
    defaultPaymentMethod: 'CASH',
    showImages: true,
    quickMode: false
};

const SupplierManagementView: React.FC<{ suppliers: Supplier[], onSaveSupplier: (s: Supplier) => void }> = ({ suppliers, onSaveSupplier }) => {
    return (
        <SupplierList 
            suppliers={suppliers} 
            onSaveSupplier={onSaveSupplier} 
        />
    );
}

const App = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // App Global State
  const [globalYear, setGlobalYear] = useState<number>(new Date().getFullYear());
  const [appLanguage, setAppLanguage] = useState<AppLanguage>('PT');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskManager, setShowTaskManager] = useState(false);

  // Data State
  const [currentCompany, setCurrentCompany] = useState<Company>(MOCK_COMPANY_DEFAULT);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(MOCK_WAREHOUSES);
  const [priceTables, setPriceTables] = useState<PriceTable[]>(MOCK_PRICE_TABLES);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>(MOCK_WORK_LOCATIONS);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>(MOCK_CASH_REGISTERS);
  const [series, setSeries] = useState<DocumentSeries[]>(MOCK_SERIES);
  
  // LOGIN BYPASS: Initialize with MOCK_USERS[0] instead of null
  const [currentUser, setCurrentUser] = useState<User | null>(MOCK_USERS[0]); 
  
  const [pgcAccounts, setPgcAccounts] = useState<PGCAccount[]>(INITIAL_PGC_ACCOUNTS);
  const [professions, setProfessions] = useState<Profession[]>(MOCK_PROFESSIONS);

  // POS State
  const [posConfig, setPosConfig] = useState<POSConfig>(DEFAULT_POS_CONFIG);
  const [cashClosures, setCashClosures] = useState<CashClosureType[]>([]);

  // HR & Cash State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hrTransactions, setHrTransactions] = useState<HrTransaction[]>([]);
  const [hrVacations, setHrVacations] = useState<HrVacation[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<SalarySlip[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>(MOCK_ACTIVITY_LOGS);

  // New Accounting State
  const [vatSettlements, setVatSettlements] = useState<VatSettlement[]>([]);
  const [openingBalances, setOpeningBalances] = useState<OpeningBalance[]>([]);
  const [selectedExtractAccount, setSelectedExtractAccount] = useState<string | null>(null);

  // SECRETARIA STATE
  const [secretariaDocs, setSecretariaDocs] = useState<SecretariaDocument[]>(MOCK_SECRETARIA_DOCS);
  const [editingSecretariaDoc, setEditingSecretariaDoc] = useState<SecretariaDocument | undefined>(undefined);

  // Invoice Form State
  const [invoiceInitialType, setInvoiceInitialType] = useState<InvoiceType>(InvoiceType.FT);
  const [invoiceInitialData, setInvoiceInitialData] = useState<Partial<Invoice> | undefined>(undefined);
  
  // Selection State
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const certifiedInvoices = useMemo(() => invoices.filter(i => i.isCertified), [invoices]);
  const allPurchases = useMemo(() => purchases, [purchases]);

  const yearInvoices = useMemo(() => invoices.filter(i => new Date(i.date).getFullYear() === globalYear), [invoices, globalYear]);
  const yearPurchases = useMemo(() => purchases.filter(p => new Date(p.date).getFullYear() === globalYear), [purchases, globalYear]);

  // Task Management
  const handleSaveTask = (task: Task) => {
      const existing = tasks.find(t => t.id === task.id);
      if (existing) {
          setTasks(tasks.map(t => t.id === task.id ? task : t));
      } else {
          setTasks([...tasks, task]);
      }
  };

  const handleDeleteTask = (id: string) => {
      setTasks(tasks.filter(t => t.id !== id));
  };

  const checkReminders = () => {
      const pending = tasks.filter(t => !t.completed && new Date(t.date) <= new Date());
      if (pending.length > 0) {
          console.log("Tarefas pendentes:", pending.length);
      }
  };

  useEffect(() => {
      const interval = setInterval(checkReminders, 60000); 
      return () => clearInterval(interval);
  }, [tasks]);

  const handleLogin = (email: string, password: string) => {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
          setCurrentUser(user);
          const newLog: UserActivityLog = {
              id: generateId(), userId: user.id, userName: user.name, timestamp: new Date().toISOString(), action: 'Login', module: 'System', details: 'Sessão iniciada'
          };
          setActivityLogs(prev => [newLog, ...prev]);
      } else {
          if (email === 'admin@sistema.ao' && (password === '123' || password === '')) {
              const admin = MOCK_USERS[0];
              setCurrentUser(admin);
              const newLog: UserActivityLog = {
                  id: generateId(), userId: admin.id, userName: admin.name, timestamp: new Date().toISOString(), action: 'Login', module: 'System', details: 'Sessão iniciada'
              };
              setActivityLogs(prev => [newLog, ...prev]);
          } else {
              alert("Credenciais inválidas");
          }
      }
  };

  const handleLogout = () => {
      if (currentUser) {
          const newLog: UserActivityLog = {
              id: generateId(), userId: currentUser.id, userName: currentUser.name, timestamp: new Date().toISOString(), action: 'Logout', module: 'System', details: 'Sessão terminada'
          };
          setActivityLogs(prev => [newLog, ...prev]);
      }
      setCurrentUser(null);
      setCurrentView('DASHBOARD');
  };

  const handleRegister = (companyData: Company, userData: User) => {
      setCurrentCompany(companyData);
      setUsers(prev => [...prev, userData]);
      setCurrentUser(userData);
      setInvoices([]);
      setClients([]);
      setPurchases([]);
      setProducts([]);
      setInvoices([]);
      setPurchases([]);
      setStockMovements([]);
      setCashMovements([]);
      setPayrollHistory([]);
      setSeries([
          { 
            id: generateId(), 
            name: 'Série Geral 2025', 
            code: 'A', 
            type: 'NORMAL', 
            year: 2025, 
            currentSequence: 0, 
            sequences: {}, 
            isActive: true, 
            allowedUserIds: [], 
            footerText: 'Processado por IMATEC SOFTWARE' 
          }
      ]);
  };

  const handleSaveSecretaria = (doc: SecretariaDocument) => {
      const existing = secretariaDocs.find(d => d.id === doc.id);
      if (existing) {
          setSecretariaDocs(prev => prev.map(d => d.id === doc.id ? doc : d));
      } else {
          if (doc.seriesId) {
              setSeries(series.map(s => s.id === doc.seriesId ? { ...s, currentSequence: s.currentSequence + 1 } : s));
          }
          setSecretariaDocs([doc, ...secretariaDocs]);
      }
      setCurrentView('SECRETARIA_LIST');
  };

  const handleDeleteSecretaria = (doc: SecretariaDocument) => {
      setSecretariaDocs(prev => prev.filter(d => d.id !== doc.id));
  };

  const handleCreateInvoice = (type: InvoiceType = InvoiceType.FT, initialItems: any[] = [], notes: string = '') => {
      setInvoiceInitialType(type);
      setInvoiceInitialData(initialItems.length > 0 ? { items: initialItems, notes } : undefined);
      setCurrentView('CREATE_INVOICE');
  };

  const handleEditInvoice = (invoice: Invoice) => {
      setInvoiceInitialType(invoice.type);
      setInvoiceInitialData(invoice);
      setCurrentView('CREATE_INVOICE');
  };

  const handleViewClientAccount = (clientId: string) => {
      setSelectedClientId(clientId);
      setCurrentView('CLIENTS');
  };

  const handleSaveInvoice = (invoice: Invoice, seriesId: string, action?: 'PRINT' | 'CERTIFY') => {
      const docSeries = series.find(s => s.id === seriesId);
      let finalInvoice = { ...invoice };
      
      if (!invoice.isCertified && (!invoice.id || !invoices.find(i => i.id === invoice.id) || invoice.number === 'DRAFT' || invoice.number === 'POS-Gen')) {
          if (action === 'CERTIFY' || invoice.status === InvoiceStatus.PAID) {
             if (docSeries) {
                 const typeKey = invoice.type;
                 const currentSeqMap = docSeries.sequences || {};
                 const currentSeq = currentSeqMap[typeKey] || 0;
                 const nextSeq = currentSeq + 1;

                 finalInvoice.number = `${getDocumentPrefix(invoice.type)} ${docSeries.code}${docSeries.year}/${nextSeq}`;
                 finalInvoice.seriesCode = docSeries.code;
                 
                 const newSeries = series.map(s => {
                     if (s.id === seriesId) {
                         const newSeqs = { ...(s.sequences || {}) };
                         newSeqs[typeKey] = nextSeq;
                         return { 
                             ...s, 
                             sequences: newSeqs, 
                             currentSequence: s.currentSequence + 1 
                         }; 
                     }
                     return s;
                 });
                 setSeries(newSeries);
             }
          }
      }

      if (action === 'CERTIFY') {
          finalInvoice.isCertified = true;
          finalInvoice.hash = generateInvoiceHash(finalInvoice);
          if (finalInvoice.status === InvoiceStatus.DRAFT) finalInvoice.status = InvoiceStatus.PENDING;
          
          finalInvoice.items.forEach(item => {
              if (item.type === 'PRODUCT' && item.productId) {
                  const productIndex = products.findIndex(p => p.id === item.productId);
                  if (productIndex >= 0) {
                      const newProducts = [...products];
                      const qty = item.quantity;
                      if (finalInvoice.type === InvoiceType.NC) {
                          newProducts[productIndex].stock += qty;
                      } else {
                          newProducts[productIndex].stock -= qty;
                      }
                      setProducts(newProducts);
                      
                      const movement: StockMovement = {
                          id: generateId(),
                          date: new Date().toISOString(),
                          type: finalInvoice.type === InvoiceType.NC ? 'ENTRY' : 'EXIT',
                          productId: item.productId,
                          productName: item.description,
                          quantity: qty,
                          warehouseId: finalInvoice.sourceWarehouseId || products[productIndex].warehouseId,
                          documentRef: finalInvoice.number,
                          notes: `Via ${finalInvoice.type}`
                      };
                      setStockMovements([...stockMovements, movement]);
                  }
              }
          });

          const clientIndex = clients.findIndex(c => c.id === finalInvoice.clientId);
          if (clientIndex >= 0) {
              const client = clients[clientIndex];
              const amount = finalInvoice.currency === 'AOA' ? finalInvoice.total : finalInvoice.contraValue || finalInvoice.total;
              let newBalance = client.accountBalance;
              const newTransactions = [...(client.transactions || [])];

              let type: 'DEBIT' | 'CREDIT' = 'DEBIT'; 
              
              if (finalInvoice.type === InvoiceType.NC || finalInvoice.type === InvoiceType.RG) {
                  type = 'CREDIT'; 
                  newBalance -= amount;
              } else {
                  newBalance += amount;
              }

              newTransactions.push({ 
                  id: generateId(), 
                  date: finalInvoice.date, 
                  type: type, 
                  description: `${finalInvoice.type} - ${finalInvoice.items.map(i=>i.description).join(', ').substring(0,30)}...`, 
                  documentNumber: finalInvoice.number, 
                  amount,
                  docType: finalInvoice.type
              });

              if (finalInvoice.type === InvoiceType.FR || finalInvoice.type === InvoiceType.VD || finalInvoice.type === InvoiceType.FS) {
                   newTransactions.push({ 
                      id: generateId(), 
                      date: finalInvoice.date, 
                      type: 'CREDIT', 
                      description: `Pagamento Imediato (${finalInvoice.paymentMethod})`, 
                      documentNumber: finalInvoice.number, 
                      amount,
                      docType: 'PAG'
                  });
                  newBalance -= amount;
              }

              const updatedClients = [...clients];
              updatedClients[clientIndex] = { ...client, accountBalance: newBalance, transactions: newTransactions };
              setClients(updatedClients);
          }
          
          if (finalInvoice.cashRegisterId && finalInvoice.paymentMethod && finalInvoice.status === InvoiceStatus.PAID) {
              const amount = finalInvoice.currency === 'AOA' ? finalInvoice.total : finalInvoice.contraValue || finalInvoice.total;
              setCashRegisters(prev => prev.map(cr => cr.id === finalInvoice.cashRegisterId ? { ...cr, balance: cr.balance + amount } : cr));
          }

          const newLog: UserActivityLog = {
              id: generateId(),
              userId: currentUser!.id,
              userName: currentUser!.name,
              timestamp: new Date().toISOString(),
              action: 'Create Document',
              module: 'Sales',
              details: `Emitiu ${finalInvoice.type} ${finalInvoice.number}`
          };
          setActivityLogs(prev => [newLog, ...prev]);
      }

      const existingIndex = invoices.findIndex(i => i.id === finalInvoice.id);
      if (existingIndex >= 0) {
          const newInvoices = [...invoices];
          newInvoices[existingIndex] = finalInvoice;
          setInvoices(newInvoices);
      } else {
          setInvoices([finalInvoice, ...invoices]);
      }
      
      if (finalInvoice.source !== 'POS') {
          setCurrentView('INVOICES');
      }
  };

  const handleLiquidate = (invoice: Invoice, amount: number, method: PaymentMethod, registerId: string) => {
      const receiptSeries = series.find(s => s.code === 'REC') || series[0];
      const typeKey = InvoiceType.RG;
      const currentSeq = (receiptSeries.sequences && receiptSeries.sequences[typeKey]) ? receiptSeries.sequences[typeKey] : 0;
      const nextSeq = currentSeq + 1;
      
      const receipt: Invoice = {
          id: generateId(),
          type: InvoiceType.RG,
          seriesId: receiptSeries.id,
          seriesCode: receiptSeries.code,
          number: `RG ${receiptSeries.year}/${nextSeq}`,
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          clientId: invoice.clientId,
          clientName: invoice.clientName,
          clientNif: invoice.clientNif,
          items: [{id: generateId(), type: 'SERVICE', description: `Liq. ${invoice.number}`, quantity: 1, unitPrice: amount, discount: 0, taxRate: 0, total: amount}],
          subtotal: amount,
          globalDiscount: 0,
          taxRate: 0,
          taxAmount: 0,
          withholdingAmount: 0,
          total: amount,
          currency: invoice.currency,
          exchangeRate: invoice.exchangeRate,
          status: InvoiceStatus.PAID,
          isCertified: true,
          hash: generateInvoiceHash(invoice), 
          companyId: invoice.companyId,
          workLocationId: invoice.workLocationId,
          paymentMethod: method,
          cashRegisterId: registerId,
          sourceInvoiceId: invoice.id
      };

      const updatedInvoice = { ...invoice, status: InvoiceStatus.PAID, paidAmount: (invoice.paidAmount || 0) + amount };
      
      setInvoices(prev => prev.map(i => i.id === invoice.id ? updatedInvoice : i).concat(receipt));
      
      const newSeries = series.map(s => {
         if (s.id === receiptSeries.id) {
             const newSeqs = { ...(s.sequences || {}) };
             newSeqs[typeKey] = nextSeq;
             return { ...s, sequences: newSeqs, currentSequence: s.currentSequence + 1 };
         }
         return s;
      });
      setSeries(newSeries);

      const clientIndex = clients.findIndex(c => c.id === invoice.clientId);
      if (clientIndex >= 0) {
          const client = clients[clientIndex];
          const newTransactions = [...(client.transactions || [])];
          newTransactions.push({ 
              id: generateId(), 
              date: receipt.date, 
              type: 'CREDIT', 
              description: `Recibo de Pagamento ${receipt.number}`, 
              documentNumber: receipt.number, 
              amount: amount,
              docType: InvoiceType.RG
          });
          const updatedClients = [...clients];
          updatedClients[clientIndex] = { ...client, accountBalance: client.accountBalance - amount, transactions: newTransactions };
          setClients(updatedClients);
      }

      setCashRegisters(prev => prev.map(cr => cr.id === registerId ? { ...cr, balance: cr.balance + amount } : cr));
  };

  const handleCancelInvoice = (id: string, reason: string) => {
      const original = invoices.find(i => i.id === id);
      if(!original) return;

      let newDocType: InvoiceType | null = null;
      if (original.type === InvoiceType.FT || original.type === InvoiceType.FR || original.type === InvoiceType.VD || original.type === InvoiceType.ND || original.type === InvoiceType.FS) {
          newDocType = InvoiceType.NC;
      } else if (original.type === InvoiceType.NC) {
          newDocType = InvoiceType.ND;
      }

      let newInvoice: Invoice | null = null;

      if (newDocType && original.isCertified) {
          const docSeries = series.find(s => s.id === original.seriesId);
          if (docSeries) {
              const typeKey = newDocType;
              const currentSeq = (docSeries.sequences && docSeries.sequences[typeKey]) ? docSeries.sequences[typeKey] : 0;
              const nextSeq = currentSeq + 1;
              
              newInvoice = {
                  ...original,
                  id: generateId(),
                  type: newDocType,
                  number: `${getDocumentPrefix(newDocType)} ${docSeries.code}${docSeries.year}/${nextSeq}`,
                  date: new Date().toISOString().split('T')[0],
                  dueDate: new Date().toISOString().split('T')[0],
                  status: InvoiceStatus.PAID,
                  sourceInvoiceId: original.id,
                  notes: `Anulação do documento ${original.number}. Motivo: ${reason}`,
                  isCertified: true,
                  hash: generateInvoiceHash(original)
              };

              const updatedSeries = series.map(s => {
                  if (s.id === docSeries.id) {
                      const newSeqs = { ...(s.sequences || {}) };
                      newSeqs[typeKey] = nextSeq;
                      return { ...s, sequences: newSeqs, currentSequence: s.currentSequence + 1 };
                  }
                  return s;
              });
              setSeries(updatedSeries);
          }
      }

      setInvoices(prev => {
          const updatedOriginals = prev.map(i => i.id === id ? { ...i, status: InvoiceStatus.CANCELLED, cancellationReason: reason } : i);
          return newInvoice ? [newInvoice, ...updatedOriginals] : updatedOriginals;
      });
  };

  const handleCreateDerived = (source: Invoice, type: InvoiceType) => {
      setInvoiceInitialType(type);
      setInvoiceInitialData({
          clientId: source.clientId,
          items: source.items.map(i => ({ ...i, id: generateId() })), 
          sourceInvoiceId: source.id,
          currency: source.currency,
          exchangeRate: source.exchangeRate
      });
      setCurrentView('CREATE_INVOICE');
  };

  const handleSavePurchase = (purchase: Purchase) => {
      setPurchases([...purchases, purchase]);
      purchase.items.forEach(item => {
          if (item.productId) {
              const productIndex = products.findIndex(p => p.id === item.productId);
              if (productIndex >= 0) {
                  const newProducts = [...products];
                  newProducts[productIndex].stock += item.quantity;
                  setProducts(newProducts);
              }
          }
      });

      if (purchase.supplierId) {
          const supplierIndex = suppliers.findIndex(s => s.id === purchase.supplierId);
          if (supplierIndex >= 0) {
              const supplier = suppliers[supplierIndex];
              const newTransactions = [...(supplier.transactions || [])];
              
              newTransactions.push({
                  id: generateId(),
                  date: purchase.date,
                  type: 'CREDIT',
                  description: `Compra ${purchase.documentNumber}`,
                  documentNumber: purchase.documentNumber,
                  amount: purchase.total
              });

              if (purchase.status === 'PAID') {
                  newTransactions.push({
                      id: generateId(),
                      date: purchase.date,
                      type: 'DEBIT',
                      description: `Pagamento ${purchase.paymentMethod}`,
                      documentNumber: purchase.documentNumber,
                      amount: purchase.total
                  });
              }

              const totalCredit = newTransactions.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);
              const totalDebit = newTransactions.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
              const newBalance = totalCredit - totalDebit;

              const updatedSuppliers = [...suppliers];
              updatedSuppliers[supplierIndex] = { ...supplier, accountBalance: newBalance, transactions: newTransactions };
              setSuppliers(updatedSuppliers);
          }
      }

      setCurrentView('PURCHASES');
  };

  const handleUpdateInvoice = (invoice: Invoice) => {
      setInvoices(prev => prev.map(i => i.id === invoice.id ? invoice : i));
  };

  const handleUpdatePurchase = (purchase: Purchase) => {
      setPurchases(prev => prev.map(p => p.id === purchase.id ? purchase : p));
  };

  const handleSaveOpeningBalances = (balances: OpeningBalance[]) => {
      const year = balances[0]?.year || new Date().getFullYear();
      const otherBalances = openingBalances.filter(b => b.year !== year);
      setOpeningBalances([...otherBalances, ...balances]);
  };

  const handleUpdateAccountCode = (oldCode: string, newCode: string) => {
      setSelectedExtractAccount(newCode);
  };

  const handleUpdateSingleBalance = (balance: OpeningBalance) => {
      setOpeningBalances(prev => prev.map(b => b.id === balance.id ? balance : b));
  };

  // Task Manager Modal Component
  const TaskManagerModal = () => {
      const [newTask, setNewTask] = useState<Partial<Task>>({ priority: 'MEDIUM', completed: false });
      
      const addTask = () => {
          if(!newTask.title || !newTask.date) return;
          handleSaveTask({
              id: generateId(),
              title: newTask.title,
              description: newTask.description || '',
              date: newTask.date,
              time: newTask.time || '',
              completed: false,
              priority: newTask.priority || 'MEDIUM'
          });
          setNewTask({ priority: 'MEDIUM', completed: false });
      };

      return (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl h-[600px] flex flex-col">
                  <div className="bg-slate-900 text-white p-4 rounded-t-xl flex justify-between items-center">
                      <h3 className="font-bold flex items-center gap-2"><CheckSquare/> Gestão de Tarefas & Lembretes</h3>
                      <button onClick={() => setShowTaskManager(false)}><X/></button>
                  </div>
                  
                  <div className="p-4 bg-slate-50 border-b">
                      <div className="space-y-2">
                          <input className="w-full border p-2 rounded" placeholder="Título da Tarefa" value={newTask.title || ''} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                          <div className="flex gap-2">
                              <input type="date" className="border p-2 rounded" value={newTask.date || ''} onChange={e => setNewTask({...newTask, date: e.target.value})} />
                              <input type="time" className="border p-2 rounded" value={newTask.time || ''} onChange={e => setNewTask({...newTask, time: e.target.value})} />
                              <select className="border p-2 rounded" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as any})}>
                                  <option value="LOW">Baixa</option>
                                  <option value="MEDIUM">Média</option>
                                  <option value="HIGH">Alta</option>
                              </select>
                          </div>
                          <textarea className="w-full border p-2 rounded h-16 resize-none" placeholder="Detalhes..." value={newTask.description || ''} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
                          <button onClick={addTask} className="w-full bg-blue-600 text-white py-2 rounded font-bold flex items-center justify-center gap-2"><Plus size={16}/> Adicionar Tarefa</button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {tasks.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(task => (
                          <div key={task.id} className={`p-3 border rounded-lg flex justify-between items-start ${task.completed ? 'bg-slate-100 opacity-60' : 'bg-white'}`}>
                              <div className="flex items-start gap-3">
                                  <input type="checkbox" checked={task.completed} onChange={() => handleSaveTask({...task, completed: !task.completed})} className="mt-1"/>
                                  <div>
                                      <div className={`font-bold ${task.completed ? 'line-through' : ''}`}>{task.title}</div>
                                      <div className="text-xs text-slate-500">{task.date} {task.time} • <span className={task.priority === 'HIGH' ? 'text-red-600 font-bold' : ''}>{task.priority}</span></div>
                                      <div className="text-xs text-slate-400 mt-1">{task.description}</div>
                                  </div>
                              </div>
                              <button onClick={() => handleDeleteTask(task.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                          </div>
                      ))}
                      {tasks.length === 0 && <div className="text-center text-slate-400 mt-10">Sem tarefas agendadas.</div>}
                  </div>
              </div>
          </div>
      );
  }

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard invoices={yearInvoices.filter(i => i.isCertified)} />; 
      case 'WORKSPACE':
        return <Workspace invoices={yearInvoices.filter(i => i.isCertified)} purchases={yearPurchases} onViewInvoice={(inv) => handleEditInvoice(inv)} />;
      case 'SECRETARIA_LIST':
        return <SecretariaList documents={secretariaDocs} onCreateNew={() => { setEditingSecretariaDoc(undefined); setCurrentView('SECRETARIA_FORM'); }} onEdit={(doc) => { setEditingSecretariaDoc(doc); setCurrentView('SECRETARIA_FORM'); }} onDelete={handleDeleteSecretaria} />;
      case 'SECRETARIA_FORM':
        return <SecretariaForm document={editingSecretariaDoc} onSave={handleSaveSecretaria} onCancel={() => setCurrentView('SECRETARIA_LIST')} series={series} />;
      case 'INVOICES':
        return <InvoiceList 
                  invoices={yearInvoices} 
                  onDelete={(id) => setInvoices(invoices.filter(i => i.id !== id))} 
                  onUpdate={handleEditInvoice}
                  onLiquidate={handleLiquidate}
                  onCancelInvoice={handleCancelInvoice}
                  onCertify={(inv) => handleSaveInvoice(inv, inv.seriesId, 'CERTIFY')}
                  onCreateNew={() => handleCreateInvoice()}
                  onCreateDerived={handleCreateDerived}
                  onUpload={(id, file) => { const url = URL.createObjectURL(file); setInvoices(invoices.map(i => i.id === id ? { ...i, attachment: url } : i)); }}
                  onViewReports={() => setCurrentView('FINANCE_REPORTS')}
                  onQuickUpdate={(id, updates) => setInvoices(invoices.map(i => i.id === id ? { ...i, ...updates } : i))}
                  onViewClientAccount={handleViewClientAccount}
                  currentCompany={currentCompany}
                  workLocations={workLocations}
                  cashRegisters={cashRegisters}
                  series={series}
                  warehouses={warehouses} 
                  purchases={allPurchases}
               />;
      case 'CREATE_INVOICE':
        return <InvoiceForm 
                  onSave={handleSaveInvoice} 
                  onCancel={() => setCurrentView('INVOICES')} 
                  onViewList={() => setCurrentView('INVOICES')}
                  onAddWorkLocation={() => setCurrentView('SETTINGS')}
                  onSaveClient={(c) => setClients([...clients, c])}
                  onSaveWorkLocation={(wl) => setWorkLocations([...workLocations, wl])}
                  clients={clients} 
                  products={products}
                  workLocations={workLocations}
                  cashRegisters={cashRegisters}
                  series={series}
                  warehouses={warehouses}
                  initialType={invoiceInitialType}
                  initialData={invoiceInitialData}
                  currentUser={currentUser!.name}
                  currentUserId={currentUser!.id}
                  currentCompany={currentCompany}
               />;
      case 'PURCHASES':
        return <PurchaseList purchases={yearPurchases} onDelete={(id) => setPurchases(purchases.filter(p => p.id !== id))} onCreateNew={() => setCurrentView('CREATE_PURCHASE')} onUpload={() => {}} onSaveSupplier={(s) => setSuppliers([...suppliers, s])} />;
      case 'CREATE_PURCHASE':
        return <PurchaseForm onSave={handleSavePurchase} onCancel={() => setCurrentView('PURCHASES')} products={products} suppliers={suppliers} workLocations={workLocations} cashRegisters={cashRegisters} warehouses={warehouses} onSaveSupplier={(s) => setSuppliers([...suppliers, s])} />;
      case 'PURCHASE_ANALYSIS': 
        return <PurchaseAnalysis purchases={allPurchases} />;
      case 'CLIENTS':
        return <ClientList clients={clients} onSaveClient={(c) => setClients([...clients, c])} initialSelectedClientId={selectedClientId} onClearSelection={() => setSelectedClientId(null)} />;
      case 'SUPPLIERS':
        return <SupplierManagementView suppliers={suppliers} onSaveSupplier={(s) => setSuppliers([...suppliers, s])} />;
      case 'STOCK':
        return <StockManager products={products} setProducts={setProducts} warehouses={warehouses} setWarehouses={setWarehouses} priceTables={priceTables} setPriceTables={setPriceTables} movements={stockMovements} onStockMovement={(m) => setStockMovements([...stockMovements, m])} onCreateDocument={handleCreateInvoice} onOpenReportOverlay={() => alert("Report Overlay")} />;
      case 'SETTINGS':
        return <Settings series={series} onSaveSeries={(s) => setSeries([...series, s])} onEditSeries={(s) => setSeries(series.map(ser => ser.id === s.id ? s : ser))} users={users} onSaveUser={(u) => setUsers([...users, u])} onDeleteUser={(id) => setUsers(users.filter(u => u.id !== id))} workLocations={workLocations} onSaveWorkLocation={(wl) => setWorkLocations([...workLocations, wl])} onDeleteWorkLocation={(id) => setWorkLocations(workLocations.filter(w => w.id !== id))} cashRegisters={cashRegisters} onSaveCashRegister={(cr) => setCashRegisters([...cashRegisters, cr])} onDeleteCashRegister={(id) => setCashRegisters(cashRegisters.filter(c => c.id !== id))} />;
      case 'FINANCE_CASH':
          return <CashManager cashRegisters={cashRegisters} onUpdateCashRegister={(cr) => setCashRegisters(prev => prev.map(c => c.id === cr.id ? cr : c).concat(prev.find(c => c.id === cr.id) ? [] : [cr]))} movements={cashMovements} onAddMovement={(m) => setCashMovements([...cashMovements, m])} invoices={certifiedInvoices} purchases={allPurchases} />;
      case 'FINANCE_MAPS':
          return <CostRevenueMap invoices={certifiedInvoices} purchases={allPurchases} />;
      case 'FINANCE_REPORTS':
          return <ManagementReports invoices={certifiedInvoices} products={products} />;
      case 'ACCOUNTING_DECLARATIONS':
          return <Model7 invoices={certifiedInvoices} purchases={allPurchases} company={currentCompany} />;
      case 'ACCOUNTING_MAPS':
          return <AccountingMaps invoices={certifiedInvoices} purchases={allPurchases} company={currentCompany} onOpenOpeningBalance={() => setCurrentView('ACCOUNTING_OPENING_BALANCE')} />;
      case 'ACCOUNTING_TAXES':
          return <TaxManager invoices={invoices} company={currentCompany} purchases={allPurchases} payroll={payrollHistory} stockMovements={stockMovements} />;
      case 'ACCOUNTING_CALC':
          return <TaxCalculationMap invoices={certifiedInvoices} purchases={allPurchases} />;
      case 'ACCOUNTING_REGULARIZATION':
          return <RegularizationMap invoices={invoices} onViewInvoice={(inv) => handleEditInvoice(inv)} />;
      case 'ACCOUNTING_SAFT':
          return <SaftExport invoices={invoices} purchases={allPurchases} />;
      case 'ACCOUNTING_PGC': 
          return <PGCManager accounts={pgcAccounts} onSaveAccount={(acc) => setPgcAccounts([...pgcAccounts, acc])} onUpdateAccount={(acc) => setPgcAccounts(pgcAccounts.map(a => a.id === acc.id ? acc : a))} />;
      case 'ACCOUNTING_RUBRICAS_SALES': 
          return <RubricasManager mode="SALES" invoices={invoices} pgcAccounts={pgcAccounts} onUpdateInvoice={handleUpdateInvoice} />;
      case 'ACCOUNTING_RUBRICAS_PURCHASES': 
          return <RubricasManager mode="PURCHASES" invoices={invoices} purchases={allPurchases} pgcAccounts={pgcAccounts} onUpdateInvoice={handleUpdateInvoice} onUpdatePurchase={handleUpdatePurchase} />;
      case 'ACCOUNTING_CLASSIFY_SALES': 
          return <ClassifyMovement mode="SALES" invoices={invoices} clients={clients} pgcAccounts={pgcAccounts} onOpenRubricas={() => setCurrentView('ACCOUNTING_RUBRICAS_SALES')} />;
      case 'ACCOUNTING_CLASSIFY_PURCHASES': 
          return <ClassifyMovement mode="PURCHASES" invoices={[]} purchases={allPurchases} clients={clients} pgcAccounts={pgcAccounts} onOpenRubricas={() => setCurrentView('ACCOUNTING_RUBRICAS_PURCHASES')} />;
      case 'ACCOUNTING_CLASSIFY_SALARY_PROC':
          return <ClassifyMovement mode="SALARY_PROC" invoices={[]} payroll={payrollHistory} clients={clients} pgcAccounts={pgcAccounts} onOpenRubricas={() => {}} />;
      case 'ACCOUNTING_CLASSIFY_SALARY_PAY':
          return <ClassifyMovement mode="SALARY_PAY" invoices={[]} payroll={payrollHistory} clients={clients} pgcAccounts={pgcAccounts} onOpenRubricas={() => {}} />;
      case 'ACCOUNTING_VAT':
          return <VatSettlementMap invoices={certifiedInvoices} purchases={allPurchases} onSaveSettlement={(s) => setVatSettlements([...vatSettlements, s])} history={vatSettlements} />;
      case 'ACCOUNTING_OPENING_BALANCE':
          return <OpeningBalanceMap accounts={pgcAccounts} savedBalances={openingBalances} onSaveBalances={handleSaveOpeningBalances} onBack={() => setCurrentView('ACCOUNTING_MAPS')} onViewAccount={(code) => { setSelectedExtractAccount(code); setCurrentView('ACCOUNTING_ACCOUNT_EXTRACT'); }} />;
      case 'ACCOUNTING_ACCOUNT_EXTRACT':
          return <AccountExtract company={currentCompany} accountCode={selectedExtractAccount || ''} year={new Date().getFullYear()} pgcAccounts={pgcAccounts} openingBalances={openingBalances} invoices={certifiedInvoices} onBack={() => setCurrentView('ACCOUNTING_OPENING_BALANCE')} onUpdateAccountCode={handleUpdateAccountCode} onUpdateBalance={handleUpdateSingleBalance} />;
      case 'HR':
          return <HumanResources employees={employees} onSaveEmployee={(e) => setEmployees(prev => prev.map(emp => emp.id === e.id ? e : emp).concat(prev.find(emp => emp.id === e.id) ? [] : [e]))} transactions={hrTransactions} onSaveTransaction={(t) => setHrTransactions([...hrTransactions, t])} vacations={hrVacations} onSaveVacation={(v) => setHrVacations([...hrVacations, v])} payroll={payrollHistory} onProcessPayroll={(p) => setPayrollHistory([...payrollHistory, ...p])} professions={professions} onSaveProfession={(p) => setProfessions(prev => prev.map(pr => pr.id === p.id ? p : pr).concat(prev.find(pr => pr.id === p.id) ? [] : [p]))} onDeleteProfession={(id) => setProfessions(professions.filter(p => p.id !== id))} contracts={contracts} onSaveContract={(c) => setContracts(prev => prev.map(ct => ct.id === c.id ? c : ct).concat(prev.find(ct => ct.id === c.id) ? [] : [c]))} attendance={attendance} onSaveAttendance={(a) => setAttendance([...attendance, a])} />;
      case 'HR_EMPLOYEES':
          return <Employees 
                    employees={employees} 
                    onSaveEmployee={(e) => setEmployees(prev => prev.map(emp => emp.id === e.id ? e : emp).concat(prev.find(emp => emp.id === e.id) ? [] : [e]))}
                    workLocations={workLocations}
                    professions={professions}
                 />;
      case 'HR_PERFORMANCE':
          return <PerformanceAnalysis 
                    logs={activityLogs} 
                    employees={employees} 
                    users={users}
                 />;
      case 'POS':
          return <POS 
                    products={products} 
                    clients={clients} 
                    invoices={invoices} 
                    series={series} 
                    cashRegisters={cashRegisters}
                    config={posConfig}
                    onSaveInvoice={handleSaveInvoice}
                    onGoBack={() => setCurrentView('DASHBOARD')}
                    currentUser={currentUser!}
                    company={currentCompany}
                 />;
      case 'POS_SETTINGS':
          return <POSSettings 
                    config={posConfig} 
                    onSaveConfig={setPosConfig} 
                    series={series} 
                    clients={clients} 
                 />;
      case 'CASH_CLOSURE':
          return <CashClosure 
                    registers={cashRegisters} 
                    invoices={invoices} 
                    movements={cashMovements}
                    onSaveClosure={(c) => setCashClosures([...cashClosures, c])}
                    onGoBack={() => setCurrentView('DASHBOARD')}
                    currentUser={currentUser!.name}
                    currentUserId={currentUser!.id}
                 />;
      case 'CASH_CLOSURE_HISTORY':
          return <CashClosureHistory closures={cashClosures} />;
      
      default:
        return <div className="p-8 text-center text-slate-400">Módulo em desenvolvimento...</div>;
    }
  };

  if (!currentUser) {
      return (
          <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
      );
  }

  const isImmersivePOS = currentView === 'POS' || currentView === 'CASH_CLOSURE';

  if (isImmersivePOS) {
      return (
          <div className="h-screen bg-slate-100 font-sans">
              {renderView()}
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {showTaskManager && <TaskManagerModal />}
      <Sidebar currentView={currentView} onChangeView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} currentUser={currentUser} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded"><Menu /></button>
          
          <div className="flex items-center gap-4">
             <h2 className="font-bold text-slate-700 hidden sm:block">{currentCompany.name}</h2>
             <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-200">{currentCompany.licensePlan}</span>
          </div>

          <div className="flex items-center gap-6">
             {/* Year Selector */}
             <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                 <CalendarIcon size={14} className="text-slate-500 ml-2"/>
                 <select 
                    className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                    value={globalYear}
                    onChange={(e) => setGlobalYear(Number(e.target.value))}
                 >
                     <option value={2023}>2023</option>
                     <option value={2024}>2024</option>
                     <option value={2025}>2025</option>
                 </select>
             </div>

             {/* Language Selector */}
             <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded" onClick={() => setAppLanguage(appLanguage === 'PT' ? 'EN' : 'PT')}>
                 <Flag size={16} className="text-slate-500"/>
                 <span className="text-xs font-bold">{appLanguage}</span>
             </div>

             {/* Tasks */}
             <button onClick={() => setShowTaskManager(true)} className="relative p-2 hover:bg-slate-100 rounded-full transition">
                 <Bell size={20} className="text-slate-600"/>
                 {tasks.filter(t => !t.completed).length > 0 && (
                     <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                 )}
             </button>

             <div className="hidden lg:block text-right border-l border-slate-200 pl-6">
                 <div className="text-xs font-black text-slate-800 tracking-widest uppercase">IMATEC SOFTWARE</div>
                 <div className="text-[9px] text-slate-400 font-bold">Autenticação IMATEC SOFT</div>
             </div>
             
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold border-2 border-slate-100 shadow-sm cursor-pointer hover:bg-slate-700 transition" onClick={handleLogout} title="Sair">
                     {currentUser.name.charAt(0)}
                 </div>
             </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 relative">{renderView()}</main>
      </div>
    </div>
  );
};

export default App;