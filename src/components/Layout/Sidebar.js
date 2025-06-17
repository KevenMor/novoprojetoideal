import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  MessageSquare, 
  CreditCard, 
  Receipt, 
  BarChart3, 
  Users, 
  X,
  ChevronRight,
  Settings,
  ChevronLeft
} from 'lucide-react';
import { PERMISSIONS } from '../../utils/permissions';
import UnitSelector from '../UnitSelector';
import { useUnitFilter } from '../../contexts/UnitFilterContext';

export default function Sidebar({ sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed }) {
  const { userProfile, hasPermission } = useAuth();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const { hasMultipleUnits } = useUnitFilter();

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(false); // No mobile, sempre expandido quando aberto
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsCollapsed]);

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      permission: PERMISSIONS.DASHBOARD_VIEW,
      description: 'Visão geral do sistema'
    },
    {
      name: 'Enviar Mensagem',
      href: '/mensagem',
      icon: MessageSquare,
      permission: PERMISSIONS.MESSAGES_VIEW,
      description: 'WhatsApp automático'
    },
    {
      name: 'Contas BTG',
      icon: CreditCard,
      permission: PERMISSIONS.BTG_ACCOUNTS_VIEW,
      description: 'Gestão de contas BTG',
      submenu: [
        {
          name: 'Cadastrar Conta',
          href: '/contas-btg',
          description: 'Boleto e PIX'
        },
        {
          name: 'Histórico',
          href: '/historico-contas-btg',
          description: 'Gerenciar contas'
        }
      ]
    },
    {
      name: 'Registrar Cobranças',
      href: '/cobrancas',
      icon: Receipt,
      permission: PERMISSIONS.CHARGES_VIEW,
      description: 'Gestão de pagamentos'
    },
    {
      name: 'Extratos',
      href: '/extratos',
      icon: BarChart3,
      permission: PERMISSIONS.EXTRACTS_VIEW,
      description: 'Relatórios financeiros'
    },
    {
      name: 'Configuração Sheets',
      href: '/configuracao-sheets',
      icon: Settings,
      permission: PERMISSIONS.SETTINGS_VIEW,
      description: 'Configurar Google Sheets'
    },
    {
      name: 'Gerenciar Usuários',
      href: '/usuarios',
      icon: Users,
      permission: PERMISSIONS.USERS_VIEW,
      description: 'Controle de acesso'
    }
  ];

  // Filtrar menus por permissão
  let filteredMenuItems = [];
  
  try {
    if (!userProfile || typeof hasPermission !== 'function') {
      filteredMenuItems = menuItems;
    } else {
      filteredMenuItems = menuItems.filter(item => {
        if (!item.permission) {
          return true;
        }
        return hasPermission(item.permission);
      });
    }
  } catch (error) {
    console.error('Erro na filtragem de menus:', error);
    filteredMenuItems = menuItems;
  }

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleCollapse = () => {
    if (!isMobile && setIsCollapsed) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const toggleSubmenu = (menuName) => {
    if (!isCollapsed) {
      setExpandedMenus(prev => ({
        ...prev,
        [menuName]: !prev[menuName]
      }));
    }
  };

  const isSubmenuExpanded = (menuName) => {
    return expandedMenus[menuName] || false;
  };

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      closeSidebar();
    }
  }, [location.pathname, isMobile, closeSidebar]);

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out
        ${isMobile 
          ? `w-80 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : `${isCollapsed ? 'w-16' : 'w-64'} translate-x-0`
        }
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex flex-col items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 w-full justify-center">
              <img
                src="https://static.wixstatic.com/media/030da1_fec378b6fe8d4ee2b9a5a51b96f6febb~mv2.png"
                alt="Logo Autoescola Ideal"
                className={`h-20 w-auto object-contain transition-all duration-300 ${isCollapsed ? 'mx-auto' : ''}`}
              />
            </div>
            {/* UnitSelector abaixo do logo, só quando sidebar não está colapsado */}
            {hasMultipleUnits() && !isCollapsed && (
              <div className="w-full mt-4">
                <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 shadow-sm">
                  <UnitSelector />
                </div>
              </div>
            )}
            {/* Toggle buttons */}
            <div className={`flex items-center space-x-2 ${isCollapsed && !isMobile ? 'mx-auto' : ''}`}>
              {!isMobile && (
                <button
                  onClick={toggleCollapse}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                  aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </button>
              )}
              {isMobile && (
                <button
                  onClick={closeSidebar}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                  aria-label="Fechar menu"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {filteredMenuItems.map((item, index) => {
                const Icon = item.icon;
                
                // Se tem submenu
                if (item.submenu && !isCollapsed) {
                  const isExpanded = isSubmenuExpanded(item.name);
                  const hasActiveSubmenu = item.submenu.some(subItem => location.pathname === subItem.href);
                  
                  return (
                    <div key={item.name} className="space-y-1">
                      {/* Menu principal com submenu */}
                      <button
                        onClick={() => toggleSubmenu(item.name)}
                        className={`
                          group flex items-center justify-between w-full p-2 rounded-lg transition-all duration-200
                          ${hasActiveSubmenu 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <ChevronRight className={`
                          h-4 w-4 transition-transform duration-200
                          ${isExpanded ? 'rotate-90' : ''}
                        `} />
                      </button>
                      
                      {/* Submenu items */}
                      {isExpanded && (
                        <div className="ml-8 space-y-1">
                          {item.submenu.map((subItem) => {
                            const isActive = location.pathname === subItem.href;
                            
                            return (
                              <NavLink
                                key={subItem.name}
                                to={subItem.href}
                                onClick={closeSidebar}
                                className={`
                                  block p-2 rounded-lg text-sm transition-all duration-200
                                  ${isActive 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-600 hover:bg-gray-100'
                                  }
                                `}
                              >
                                {subItem.name}
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Menu normal
                const isActive = location.pathname === item.href;
                
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={closeSidebar}
                    className={`
                      group flex items-center p-2 rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                      ${isCollapsed ? 'justify-center' : 'space-x-3'}
                    `}
                    title={isCollapsed ? item.name : ''}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Footer - User info */}
          {!isCollapsed && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {userProfile?.nome?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userProfile?.nome || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userProfile?.email || 'email@exemplo.com'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botão de retração flutuante */}
      {!isMobile && (
        <button
          onClick={toggleCollapse}
          className={`fixed top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 shadow-lg rounded-full w-9 h-9 flex items-center justify-center transition-all duration-200 hover:bg-gray-100
            ${isCollapsed ? 'left-16' : 'left-64'}`}
          aria-label="Retract sidebar"
        >
          <ChevronLeft className={`h-5 w-5 text-blue-600 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      )}
    </>
  );
} 