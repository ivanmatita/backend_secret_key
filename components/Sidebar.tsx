
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, Users, Settings, LogOut, X,
  ShoppingBasket, UtensilsCrossed, Building2, Briefcase, 
  Calculator, CreditCard, ShoppingBag, Package, ChevronDown, ChevronRight, User, BriefcaseBusiness, FileJson,
  Percent, Table, BookOpen, ListTree, CheckCircle, Scale, Paperclip, Monitor, BarChart3
} from 'lucide-react';
import { ViewState, User as UserType } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentUser: UserType | null;
  onLogout?: () => void; // New Prop
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, setIsOpen, currentUser, onLogout }) => {
  // State for accordions - strict single open policy
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [userAvatar, setUserAvatar] = useState(currentUser?.avatar || '');

  const menuItems = [
    { id: 'DASHBOARD', label: 'Painel de Bordo', icon: LayoutDashboard },
    { id: 'WORKSPACE', label: 'Local de Trabalho', icon: BriefcaseBusiness },
    { id: 'SECRETARIA_LIST', label: 'Secretaria Beta', icon: Paperclip },
    
    // NEW POS GROUP
    { id: 'POS_GROUP', label: 'Ponto de Venda', icon: Monitor, hasSubmenu: true, 
      children: [
        { id: 'POS', label: 'Frente de Caixa (POS)' },
        { id: 'CASH_CLOSURE', label: 'Fecho de Caixa' },
        { id: 'CASH_CLOSURE_HISTORY', label: 'Fechos Efetuados' },
        { id: 'POS_SETTINGS', label: 'Configurações POS' }
      ]
    },

    { id: 'INVOICES_GROUP', label: 'Vendas', icon: FileText, hasSubmenu: true, 
      children: [
        { id: 'CREATE_INVOICE', label: 'Nova Fatura' },
        { id: 'INVOICES', label: 'Documentos de Venda' },
        { id: 'ACCOUNTING_REGULARIZATION', label: 'Regularização Clientes' },
        { id: 'CLIENTS', label: 'Clientes' }
      ]
    }, 
    { id: 'PURCHASES_GROUP', label: 'Compras', icon: ShoppingBag, hasSubmenu: true,
      children: [
        { id: 'CREATE_PURCHASE', label: 'Registar Compra' },
        { id: 'PURCHASES', label: 'Documentos de Compra' },
        { id: 'SUPPLIERS', label: 'Fornecedores' },
        { id: 'PURCHASE_ANALYSIS', label: 'Análise de Compras' }
      ]
    },
    { id: 'STOCK_GROUP', label: 'Stocks & Inventário', icon: Package, hasSubmenu: true,
      children: [
        { id: 'STOCK', label: 'Gestão de Artigos' }
      ]
    }, 
    { id: 'FINANCE_GROUP', label: 'Finanças', icon: CreditCard, hasSubmenu: true,
      children: [
        { id: 'FINANCE_CASH', label: 'Caixa (Gestão)' },
        { id: 'FINANCE_MAPS', label: 'Mapas Custos/Proveitos' },
        { id: 'FINANCE_REPORTS', label: 'Relatórios de Gestão' }
      ]
    },
    { id: 'ACCOUNTING_GROUP', label: 'Contabilidade', icon: Calculator, hasSubmenu: true,
      children: [
        { id: 'ACCOUNTING_VAT', label: 'Apuramento de IVA', icon: Scale }, 
        { id: 'ACCOUNTING_PGC', label: 'Contas PGC', icon: BookOpen },
        // Expanded Classify Submenu
        { 
            id: 'ACCOUNTING_CLASSIFY_GROUP', 
            label: 'Classificar Movimentos', 
            icon: CheckCircle,
            isSubheader: true,
            children: [
                { id: 'ACCOUNTING_CLASSIFY_SALES', label: 'Classificar Vendas' },
                { id: 'ACCOUNTING_CLASSIFY_PURCHASES', label: 'Classificar Compras' },
                { id: 'ACCOUNTING_CLASSIFY_SALARY_PROC', label: 'Processo Salário' },
                { id: 'ACCOUNTING_CLASSIFY_SALARY_PAY', label: 'Pagamento Salário' }
            ]
        }, 
        // Expanded Rubricas Submenu
        { 
            id: 'ACCOUNTING_RUBRICAS_GROUP', 
            label: 'Ajuste de Rubricas', 
            icon: ListTree,
            isSubheader: true,
            children: [
                { id: 'ACCOUNTING_RUBRICAS_SALES', label: 'Ajustar Vendas' },
                { id: 'ACCOUNTING_RUBRICAS_PURCHASES', label: 'Ajustar Compras' }
            ]
        },
        { id: 'ACCOUNTING_MAPS', label: 'Mapas Contabilísticos', icon: Table },
        { id: 'ACCOUNTING_DECLARATIONS', label: 'Modelo 7' },
        { id: 'ACCOUNTING_TAXES', label: 'Impostos' },
        { id: 'ACCOUNTING_CALC', label: 'Cálculos de Impostos', icon: Percent },
        { id: 'ACCOUNTING_SAFT', label: 'Ficheiro SAFT', icon: FileJson }
      ]
    },
    { id: 'HR_GROUP', label: 'Recursos Humanos', icon: Users, hasSubmenu: true, 
      children: [
        { id: 'HR_EMPLOYEES', label: 'Funcionários' },
        { id: 'HR', label: 'Gestão Geral' },
        { id: 'HR_PERFORMANCE', label: 'Análise de Desempenho', icon: BarChart3 } // NEW ITEM
      ]
    },
    { id: 'RESTAURANT', label: 'Restaurante', icon: UtensilsCrossed },
    { id: 'HOTEL', label: 'Hotelaria', icon: Building2 },
    { id: 'SETTINGS', label: 'Definições', icon: Settings },
  ];

  // Filter items based on permissions
  const filteredItems = menuItems.filter(item => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    
    // Check main item or children permissions
    if (item.hasSubmenu && item.children) {
       return item.children.some(child => currentUser.permissions.includes(child.id as ViewState));
    }
    return currentUser.permissions.includes(item.id as ViewState);
  });

  const handleMenuClick = (item: any) => {
      if (item.hasSubmenu) {
          // Accordion: If clicking the open one, close it. If clicking a new one, open it and close others.
          setOpenMenuId(openMenuId === item.id ? null : item.id);
      } else {
          setOpenMenuId(null);
          onChangeView(item.id as ViewState);
          setIsOpen(false);
      }
  };

  const handleSubMenuClick = (viewId: ViewState) => {
      onChangeView(viewId);
      setIsOpen(false);
  }

  const handleAvatarClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setUserAvatar(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-full shadow-2xl border-r border-slate-800 font-sans
      `}>
        {/* User Profile */}
        <div className="p-6 flex flex-col items-center border-b border-slate-800 relative bg-slate-950">
            <div 
                className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-700 mb-3 flex items-center justify-center overflow-hidden cursor-pointer hover:border-white transition-colors group shadow-lg"
                onClick={handleAvatarClick}
            >
                {userAvatar ? (
                    <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                ) : (
                    <User size={32} className="text-slate-400 group-hover:text-white" />
                )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <div className="font-bold text-lg text-white">{currentUser?.name}</div>
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">{currentUser?.role}</div>
            
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 lg:hidden text-white/70 hover:text-white">
                <X size={24} />
            </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar pb-6 pt-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-3">Menu Principal</div>
          {filteredItems.map((item) => {
             const Icon = item.icon;
             const isMenuOpen = openMenuId === item.id;
             const isActive = currentView === item.id;
             
             // Check if any child is active to highlight parent
             // Recursively check children for nested submenus logic (flatten for check)
             const flatChildren = item.children?.flatMap(c => c.children ? c.children : c) || [];
             const isChildActive = item.hasSubmenu && flatChildren.some(c => c.id === currentView);

             return (
               <div key={item.id} className="mb-1">
                   <button
                     onClick={() => handleMenuClick(item)}
                     className={`
                       w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 group
                       ${isActive || isChildActive
                         ? 'bg-slate-800 text-white font-bold border-l-4 border-blue-500 shadow-sm' 
                         : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                       }
                     `}
                   >
                     <div className="flex items-center gap-3">
                         <Icon size={20} className={`${isActive || isChildActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} />
                         <span className="text-sm tracking-wide">{item.label}</span>
                     </div>
                     {item.hasSubmenu && (
                         isMenuOpen ? <ChevronDown size={14} className="text-white"/> : <ChevronRight size={14} className="text-slate-500"/>
                     )}
                   </button>
                   
                   {/* Submenu */}
                   {item.hasSubmenu && isMenuOpen && (
                       <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-2 animate-in slide-in-from-left-2 duration-200">
                           {item.children?.map(child => {
                               // Handle Sub-Headers (Like "Classificar Movimentos" Group)
                               if (child.isSubheader) {
                                   return (
                                       <div key={child.id} className="mt-2 mb-1">
                                           <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-1 flex items-center gap-2">
                                              {child.icon && <child.icon size={12}/>} {child.label}
                                           </div>
                                           <div className="pl-2 space-y-1 border-l border-slate-800 ml-2">
                                               {child.children?.map(subChild => {
                                                   const isSubActive = currentView === subChild.id;
                                                   return (
                                                       <button 
                                                            key={subChild.id}
                                                            onClick={() => handleSubMenuClick(subChild.id as ViewState)} 
                                                            className={`
                                                                w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between
                                                                ${isSubActive 
                                                                    ? 'text-blue-400 font-bold bg-slate-800/50' 
                                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                                }
                                                            `}
                                                       >
                                                           {subChild.label}
                                                       </button>
                                                   )
                                               })}
                                           </div>
                                       </div>
                                   );
                               }

                               const isSubActive = currentView === child.id;
                               return (
                                   <button 
                                    key={child.id}
                                    onClick={() => handleSubMenuClick(child.id as ViewState)} 
                                    className={`
                                        w-full text-left px-3 py-2 text-xs rounded-md transition-colors flex items-center justify-between
                                        ${isSubActive 
                                            ? 'bg-blue-600 text-white font-bold shadow-sm' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }
                                    `}
                                   >
                                       {child.label}
                                       {child.icon && <child.icon size={12} className="mr-1 inline"/>}
                                       {isSubActive && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                   </button>
                               )
                           })}
                       </div>
                   )}
               </div>
             );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
          <button 
            onClick={onLogout} // TRIGGER LOGOUT
            className="flex items-center gap-3 text-slate-400 hover:text-white w-full px-4 py-2 transition-colors hover:bg-slate-800 rounded-lg group"
          >
            <LogOut size={20} className="group-hover:text-red-400"/>
            <span className="font-medium group-hover:text-red-400">Terminar Sessão</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
