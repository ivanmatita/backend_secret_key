
export enum InvoiceStatus {
  DRAFT = 'Rascunho',
  PENDING = 'Pendente',
  PAID = 'Pago',
  PARTIAL = 'Parcelar',
  OVERDUE = 'Vencido',
  CANCELLED = 'Anulado'
}

export enum InvoiceType {
  FT = 'Fatura',
  FR = 'Fatura/Recibo',
  PP = 'Fatura Pró-forma',
  OR = 'Orçamento',
  GR = 'Guia de Remessa',
  GT = 'Guia de Transporte',
  GE = 'Guia de Entrega',
  NE = 'Nota de Encomenda',
  NC = 'Nota de Crédito',
  ND = 'Nota de Débito',
  RG = 'Recibo',
  VD = 'Venda a Dinheiro',
  FS = 'Fatura Simplificada'
}

export enum PurchaseType {
  FT = 'Fatura Fornecedor',
  FR = 'Fatura/Recibo Fornecedor',
  ND = 'Nota de Débito',
  NC = 'Nota de Crédito',
  VD = 'Venda a Dinheiro',
  REC = 'Recibo'
}

export type PaymentMethod = 'CASH' | 'MULTICAIXA' | 'TRANSFER' | 'CHECK' | 'CREDIT_CARD' | 'CREDIT_ACCOUNT';

export type LicensePlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type CompanyStatus = 'TEST' | 'ACTIVE' | 'SUSPENDED';

export type AppLanguage = 'PT' | 'EN' | 'FR';

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO Date
  time?: string;
  completed: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type ViewState = 
  | 'DASHBOARD' 
  | 'WORKSPACE' 
  | 'SECRETARIA_LIST' 
  | 'SECRETARIA_FORM'
  | 'INVOICES_GROUP' 
  | 'CREATE_INVOICE' 
  | 'INVOICES' 
  | 'ACCOUNTING_REGULARIZATION' 
  | 'CLIENTS' 
  | 'PURCHASES_GROUP' 
  | 'CREATE_PURCHASE' 
  | 'PURCHASES' 
  | 'SUPPLIERS' 
  | 'PURCHASE_ANALYSIS' 
  | 'STOCK_GROUP' 
  | 'STOCK' 
  | 'FINANCE_GROUP' 
  | 'FINANCE_CASH' 
  | 'FINANCE_MAPS' 
  | 'FINANCE_REPORTS' 
  | 'ACCOUNTING_GROUP' 
  | 'ACCOUNTING_VAT' 
  | 'ACCOUNTING_PGC' 
  | 'ACCOUNTING_CLASSIFY_GROUP'
  | 'ACCOUNTING_CLASSIFY_SALES'
  | 'ACCOUNTING_CLASSIFY_PURCHASES'
  | 'ACCOUNTING_CLASSIFY_SALARY_PROC'
  | 'ACCOUNTING_CLASSIFY_SALARY_PAY' 
  | 'ACCOUNTING_RUBRICAS_GROUP'
  | 'ACCOUNTING_RUBRICAS_SALES'
  | 'ACCOUNTING_RUBRICAS_PURCHASES'
  | 'ACCOUNTING_MAPS' 
  | 'ACCOUNTING_DECLARATIONS' 
  | 'ACCOUNTING_TAXES' 
  | 'ACCOUNTING_CALC' 
  | 'ACCOUNTING_SAFT' 
  | 'ACCOUNTING_OPENING_BALANCE'
  | 'ACCOUNTING_ACCOUNT_EXTRACT'
  | 'HR_GROUP'
  | 'HR_EMPLOYEES'
  | 'HR' 
  | 'HR_PERFORMANCE'
  | 'POS_GROUP'
  | 'POS' 
  | 'POS_SETTINGS'
  | 'CASH_CLOSURE'
  | 'CASH_CLOSURE_HISTORY'
  | 'RESTAURANT' 
  | 'HOTEL' 
  | 'SETTINGS';

export interface Company {
  id: string;
  name: string;
  nif: string;
  address: string;
  email: string;
  phone: string;
  logo?: string;
  regime: 'Geral' | 'Simplificado' | 'Exclusão';
  licensePlan: LicensePlan;
  status: CompanyStatus;
  validUntil: string;
  registrationDate: string;
}

export interface POSConfig {
  defaultSeriesId: string;
  printerType: '80mm' | 'A4';
  autoPrint: boolean;
  allowDiscounts: boolean;
  defaultClientId: string;
  defaultPaymentMethod: PaymentMethod;
  showImages: boolean;
  quickMode: boolean; // Ocultar elementos avançados
}

export interface CashClosure {
  id: string;
  date: string; // ISO string
  openedAt: string;
  closedAt: string;
  operatorId: string;
  operatorName: string;
  cashRegisterId: string;
  
  // System Calculated
  expectedCash: number;
  expectedMulticaixa: number;
  expectedTransfer: number;
  expectedCredit: number;
  totalSales: number;

  // Actual Count
  actualCash: number;
  
  // Diff
  difference: number; // + sobra, - quebra
  
  initialBalance: number;
  finalBalance: number;
  
  status: 'CLOSED';
  notes?: string;
}

export interface DocumentSeries {
  id: string;
  name: string;
  code: string;
  type: 'NORMAL' | 'MANUAL';
  currentSequence: number; 
  sequences: Record<string, number>; // Mandatory for strict sequential numbering per type
  year: number;
  bankDetails?: string;
  logo?: string;
  watermark?: string;
  footerText?: string;
  
  // New Footer Config Fields
  footerEmail?: string;
  footerPhone?: string;
  footerAddress?: string;
  footerLogo?: string;

  allowedUserIds: string[];
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'OPERATOR' | 'MANAGER';
  companyId: string;
  permissions: ViewState[];
  obs?: string;
  createdAt: string;
  avatar?: string;
}

export interface ClientTransaction {
  id: string;
  date: string;
  type: 'DEBIT' | 'CREDIT'; 
  description: string;
  documentNumber: string;
  amount: number;
  urn?: string;
  fileInterno?: string;
  docType?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  vatNumber: string;
  address: string;
  city: string;
  country: string;
  accountBalance: number;
  transactions?: ClientTransaction[];
  postalCode?: string;
  province?: string;
  municipality?: string;
  webPage?: string;
  clientType?: string;
}

export interface SupplierTransaction {
  id: string;
  date: string;
  type: 'DEBIT' | 'CREDIT';
  description: string;
  documentNumber: string;
  amount: number;
}

export interface Supplier {
  id: string;
  name: string;
  vatNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province?: string;
  accountBalance: number;
  transactions?: SupplierTransaction[];
}

export interface CashRegister {
  id: string;
  name: string;
  status: 'OPEN' | 'CLOSED';
  operatorId?: string;
  balance: number;
  initialBalance?: number;
}

export interface CashMovement {
  id: string;
  date: string;
  type: 'ENTRY' | 'EXIT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  amount: number;
  description: string;
  cashRegisterId: string;
  targetCashRegisterId?: string; // For transfers
  documentRef?: string; // Links to Invoice or Purchase
  operatorName: string;
  source: 'MANUAL' | 'SALES' | 'PURCHASES';
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
}

export interface WorkLocation {
  id: string;
  name: string;
  address: string;
  managerName?: string;
  phone?: string;
}

export interface PriceTable {
  id: string;
  name: string;
  percentage: number;
}

export interface ServicePrice {
  id: string;
  description: string;
  price: number;
  priceTableId: string;
}

export interface Product {
  id: string;
  name: string;
  costPrice: number;
  price: number;
  unit: string;
  category?: string;
  stock: number;
  warehouseId: string;
  priceTableId: string;
  minStock: number;
  imageUrl?: string;
  barcode?: string; // Added for POS
}

export interface StockMovement {
  id: string;
  date: string;
  type: 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT';
  productId: string;
  productName: string;
  quantity: number;
  warehouseId: string;
  targetWarehouseId?: string;
  documentRef?: string;
  notes?: string;
}

export interface PurchaseItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discount?: number;
  rubrica?: string; // PGC Account Code
  type?: 'PRODUCT' | 'SERVICE';
}

export interface Purchase {
  id: string;
  type: PurchaseType;
  supplierId?: string;
  supplier: string;
  nif: string;
  date: string;
  dueDate: string;
  documentNumber: string;
  items: PurchaseItem[];
  subtotal: number;
  globalDiscount?: number;
  taxAmount: number;
  total: number;
  status: 'PAID' | 'PENDING';
  notes?: string;
  currency?: 'AOA' | 'USD' | 'EUR' | 'BRL';
  exchangeRate?: number;
  workLocationId?: string;
  paymentMethod?: PaymentMethod;
  cashRegisterId?: string;
  retentionType?: 'NONE' | 'CAT_50' | 'CAT_100';
  retentionAmount?: number;
  attachment?: string;
  warehouseId?: string; 
  hash?: string; // New AGT Certification Hash for Purchases
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  type: 'PRODUCT' | 'SERVICE';
  description: string;
  reference?: string; // New: SKU/Ref
  quantity: number;
  unit?: string; // New: un, kg, etc
  unitPrice: number;
  discount: number;
  taxRate: number; 
  total: number;
  rubrica?: string; // PGC Account Code
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  seriesId: string;
  seriesCode?: string;
  number: string;
  date: string;
  time?: string;
  dueDate: string;
  clientId: string;
  clientName: string;
  clientNif?: string;
  items: InvoiceItem[];
  subtotal: number;
  globalDiscount: number;
  taxRate: number; 
  taxAmount: number;
  withholdingAmount: number;
  retentionType?: 'NONE' | 'CAT_50' | 'CAT_100';
  retentionAmount?: number;
  total: number;
  paidAmount?: number; 
  currency: 'AOA' | 'USD' | 'EUR' | 'BRL';
  exchangeRate: number;
  contraValue?: number;
  status: InvoiceStatus;
  notes?: string;
  hash?: string;
  isCertified: boolean;
  companyId: string;
  workLocationId?: string;
  paymentMethod?: PaymentMethod;
  cashRegisterId?: string;
  operatorName?: string;
  typology?: string;
  sourceInvoiceId?: string;
  cancellationReason?: string;
  attachment?: string;
  // Transport Fields
  driverName?: string;
  vehiclePlate?: string;
  deliveryAddress?: string;
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
  
  source?: 'MANUAL' | 'POS'; // Added to distinguish source
}

export interface Profession {
  id: string;
  code: string;
  name: string;
  category?: string; 
  group?: string; 
  description?: string;
}

export interface Employee {
  id: string;
  employeeNumber?: string; // Auto-generated
  name: string;
  nif: string;
  biNumber?: string;
  ssn: string; // INSS Number
  role: string; // Função / Cargo
  category?: string; // Categoria
  professionId?: string; // Link to Profession
  professionName?: string; // Cache Name
  department: string;
  workLocationId: string;
  baseSalary: number;
  status: 'Active' | 'OnLeave' | 'Terminated';
  admissionDate: string;
  terminationDate?: string;
  email?: string;
  phone?: string;
  
  // Banking
  bankAccount?: string; // Account Number
  bankName?: string;
  iban?: string;

  photoUrl?: string;
  contractType?: 'Determinado' | 'Indeterminado' | 'Estagio';
  contractClauses?: string[];
  dependents?: number;
  
  // Specific Subsidies for Salary Map
  subsidyTransport?: number;
  subsidyFood?: number;
  subsidyFamily?: number;
  subsidyHousing?: number;
  subsidyChristmas?: number;
  subsidyVacation?: number;
  subsidyCommunication?: number;
  subsidyOther?: number;
  
  // Demographics
  gender?: 'M' | 'F';
  birthDate?: string;
  maritalStatus?: 'Solteiro' | 'Casado' | 'Divorciado' | 'Viuvo';
  nationality?: string;
  
  // Address
  address?: string;
  municipality?: string;
  neighborhood?: string;

  // AI Metrics
  performanceScore?: number;
  turnoverRisk?: 'Low' | 'Medium' | 'High';
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  dateProcessed: string;
  items: SalarySlip[];
  totalNet: number;
  totalTax: number;
  totalSS: number;
}

export interface SalarySlip {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  professionCode?: string; // For map
  baseSalary: number;
  allowances: number;
  bonuses: number;
  absences: number; // Value deducted
  absencesDays?: number; // Days deducted
  overtimeHours?: number;
  overtimeValue?: number;
  advances: number;
  subsidies: number; // General/Other
  
  // Detailed Subsidies
  subsidyTransport: number;
  subsidyFood: number;
  subsidyFamily: number;
  subsidyHousing: number;

  // Totals
  grossTotal: number;
  inss: number;
  irt: number;
  netTotal: number;
}

export type HrTransactionType = 'BONUS' | 'ALLOWANCE' | 'ABSENCE' | 'ADVANCE';

export interface HrTransaction {
  id: string;
  employeeId: string;
  date: string;
  type: HrTransactionType;
  amount: number;
  description?: string;
  processed?: boolean;
}

export interface HrVacation {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED';
  year: number;
}

export type SaftType = 'SALES' | 'PURCHASE';

export type AccountingView = 'GENERAL' | 'SIMPLIFIED' | 'ANNEX_SUPPLIERS' | 'ANNEX_REGULARIZATIONS';

export interface PGCAccount {
  id: string;
  code: string;
  description: string;
  type: 'CLASSE' | 'GRUPO' | 'SUBGRUPO' | 'CONTA' | 'SUBCONTA';
  nature: 'DEBITO' | 'CREDITO' | 'AMBOS';
  parentCode?: string;
  systemAuto?: boolean;
}

export interface Contract {
  id: string;
  employeeId: string;
  type: 'Determinado' | 'Indeterminado' | 'Estagio';
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Expired' | 'Terminated';
  clauses: string[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  justification?: string;
  overtimeHours?: number;
}

export interface VatSettlement {
  id: string;
  month: number;
  year: number;
  dateProcessed: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  status: 'PROCESSED';
  details: {
      salesAdjust: number;
      purchaseAdjust: number;
  };
}

export interface OpeningBalance {
  id?: string;
  year: number;
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
  balanceType: 'DEBIT' | 'CREDIT';
}

export interface SecretariaDocument {
  id: string;
  type: 'Carta' | 'Declaração' | 'Memorando' | 'Outros';
  seriesId: string;
  seriesCode: string;
  number: string;
  date: string;
  dateExtended?: string;
  destinatarioIntro?: string;
  destinatarioNome: string;
  destinatarioMorada?: string;
  destinatarioLocalidade?: string;
  destinatarioProvincia?: string;
  destinatarioCodigoPostal?: string;
  destinatarioPais?: string;
  assunto: string;
  corpo: string;
  observacoes?: string;
  emailDestinatario?: string;
  trackingOrigem?: string;
  confidencial: boolean;
  imprimirPagina: boolean;
  referencia?: string;
  departamento?: string;
  createdBy: string;
  createdAt: string;
  isLocked: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  appliedRole: string;
  stage: 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
  applicationDate: string;
  aiMatchScore?: number;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  date: string;
  score: number;
  comments: string;
  reviewerId: string;
}

export interface DisciplinaryAction {
  id: string;
  employeeId: string;
  date: string;
  type: 'VERBAL_WARNING' | 'WRITTEN_WARNING' | 'SUSPENSION' | 'DISMISSAL';
  description: string;
  status: 'OPEN' | 'CLOSED';
}

export interface TrainingCourse {
  id: string;
  title: string;
  provider: string;
  startDate: string;
  endDate: string;
  participants: string[]; // Employee IDs
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface UserActivityLog {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  action: string;
  details?: string;
  module?: string;
}

export interface PerformanceRecord {
  userId: string;
  userName: string;
  date: string;
  loginTime: string;
  docsRegistered: number;
  activeTimeMinutes: number;
  score: 'HIGH' | 'MEDIUM' | 'LOW';
}
