import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
  Building2,
  Receipt
} from 'lucide-react';
import { PERMISSIONS } from '../../utils/permissions';
import UnitSelector from '../UnitSelector';
import { useUnitFilter } from '../../contexts/UnitFilterContext';
import logo from '../../assets/logo.png';

export default function Sidebar({ sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed }) {
  const { user } = useAuth();
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

  // Definir menuItems usando useMemo para evitar re-renders
  const menuItems = useMemo(() => [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      permission: PERMISSIONS.DASHBOARD_VIEW,
      description: 'Visão geral do sistema'
    },
    {
      name: 'Mensagens',
      icon: MessageSquare,
      permission: PERMISSIONS.MESSAGES_VIEW,
      description: 'Envio e histórico de mensagens',
      submenu: [
        {
          name: 'Enviar Mensagem',
          href: '/enviar-mensagem',
          description: 'WhatsApp automático'
        },
        {
          name: 'Histórico de Mensagens',
          href: '/historico-mensagens',
          description: 'Mensagens enviadas'
        },
        // Adicionar submenu de gerenciamento de modelos para admin
        ...(user?.perfil === 'admin' ? [{
          name: 'Gerenciar Modelos',
          href: '/gerenciar-modelos-mensagem',
          description: 'Modelos de mensagem rápidas'
        }] : [])
      ]
    },
    {
      name: 'Contas BTG',
      icon: Building2,
      permission: PERMISSIONS.BTG_ACCOUNTS_VIEW,
      description: 'Gestão de contas BTG',
      submenu: [
        {
          name: 'Cadastrar Conta',
          href: '/cadastrar-contas-btg',
          description: 'Boleto e PIX'
        },
        {
          name: 'Gestão de Contas',
          href: '/gestao-contas-btg',
          description: 'Gerenciar todas as contas'
        },
        {
          name: 'Folha de Pagamento',
          href: '/folha-pagamento',
          description: 'Gestão de funcionários'
        }
      ]
    },
    {
      name: 'Cobranças',
      icon: Receipt,
      permission: PERMISSIONS.CHARGES_VIEW,
      description: 'Gestão de cobranças',
      submenu: [
        {
          name: 'Registrar',
          href: '/registrar-cobrancas',
          description: 'Nova cobrança'
        },
        {
          name: 'Histórico',
          href: '/historico-cobrancas',
          description: 'Cobranças registradas'
        }
      ]
    },
    {
      name: 'Extratos',
      icon: BarChart3,
      permission: PERMISSIONS.EXTRACTS_VIEW,
      description: 'Relatórios financeiros',
      submenu: [
        { name: 'Ver Extrato', href: '/extratos', description: 'Visualizar extrato financeiro' },
        {
          name: 'Cadastros',
          description: 'Cadastros auxiliares',
          submenu: [
            { name: 'Categorias', href: '/extratos/cadastros/categorias', description: 'Gerenciar categorias' },
            { name: 'Formas de Pagamento', href: '/extratos/cadastros/formas-pagamento', description: 'Gerenciar formas de pagamento' },
            { name: 'Contas', href: '/admin/contas', description: 'Gerenciar contas bancárias/cartões' },
            { name: 'Clientes/Fornecedores', href: '/admin/clientes-fornecedores', description: 'Gerenciar clientes e fornecedores' }
          ]
        }
      ]
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
      href: '/gerenciar-usuarios',
      icon: Users,
      permission: PERMISSIONS.USERS_VIEW,
      description: 'Gerenciar usuários do sistema'
    }
  ], [user?.perfil]);

  // Filtrar menus por permissão usando useMemo
  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter(item => {
      // Dashboard sempre deve aparecer
      if (item.name === 'Dashboard') return true;
      // Se não tem permissão definida, mostrar
      if (!item.permission) return true;
      // Verificar permissão
      return user?.permissions?.[item.permission] || false;
    });
  }, [user?.permissions, menuItems]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

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
        fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out smooth-scroll
        ${isMobile 
          ? `w-80 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : `${isCollapsed ? 'w-16' : 'w-64'} translate-x-0`
        }
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex flex-col items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 w-full justify-center">
              <div className="rounded-full bg-white shadow-md p-2 flex items-center justify-center">
                <img
                  src={logo}
                  alt="Logo Autoescola Ideal"
                  className={`h-24 w-24 object-contain transition-all duration-300 ${isCollapsed ? 'mx-auto' : ''}`}
                />
              </div>
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
                  // Verifica se algum submenu ou subsubmenu está ativo
                  const hasActiveSubmenu = item.submenu.some(subItem => {
                    if (subItem.href && location.pathname === subItem.href) return true;
                    if (subItem.submenu) {
                      return subItem.submenu.some(subSub => location.pathname === subSub.href);
                    }
                    return false;
                  });
                  return (
                    <div key={item.name} className="space-y-1">
                      <button
                        onClick={() => toggleSubmenu(item.name)}
                        className={`
                          group flex items-center w-full px-4 py-2 my-1 rounded-full transition touch-target
                          font-medium text-base
                          ${hasActiveSubmenu
                            ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm'
                            : 'text-gray-700 hover:bg-blue-50'}
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-5 h-5 flex-shrink-0 mr-2 ${hasActiveSubmenu ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className="text-base font-medium">{item.name}</span>
                        </div>
                        <ChevronRight className={`
                          h-4 w-4 ml-2 transition-transform duration-200
                          ${isExpanded ? 'rotate-90' : ''}
                          ${hasActiveSubmenu ? 'text-blue-600' : 'text-gray-400'}
                        `} />
                      </button>
                      {/* Submenu items */}
                      {isExpanded && (
                        <div className="ml-8 space-y-1">
                          {item.submenu.map((subItem) => {
                            // Se subItem tem submenu (sub-submenu)
                            if (subItem.submenu) {
                              const isSubExpanded = isSubmenuExpanded(item.name + '-' + subItem.name);
                              const hasActiveSubSubmenu = subItem.submenu.some(subSub => location.pathname === subSub.href);
                              return (
                                <div key={subItem.name} className="space-y-1">
                                  <button
                                    onClick={() => toggleSubmenu(item.name + '-' + subItem.name)}
                                    className={`flex items-center w-full px-2 py-1 rounded transition text-base font-semibold
                                      ${hasActiveSubSubmenu ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                                  >
                                    <span>{subItem.name}</span>
                                    <ChevronRight className={`h-3 w-3 ml-1 transition-transform duration-200 ${isSubExpanded ? 'rotate-90' : ''}`} />
                                  </button>
                                  {isSubExpanded && (
                                    <div className="ml-6 space-y-1">
                                      {subItem.submenu.map(subSub => (
                                        <NavLink
                                          key={subSub.name}
                                          to={subSub.href}
                                          onClick={closeSidebar}
                                          className={`block p-2 rounded-lg text-mobile-sm transition-all duration-200 touch-target text-base
                                            ${location.pathname === subSub.href ? 'bg-blue-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                          {subSub.name}
                                        </NavLink>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            // Submenu normal
                            return (
                              <NavLink
                                key={subItem.name}
                                to={subItem.href}
                                onClick={closeSidebar}
                                className={`block p-2 rounded-lg text-mobile-sm transition-all duration-200 touch-target text-base
                                  ${location.pathname === subItem.href ? 'bg-blue-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
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
                      group flex items-center w-full px-4 py-2 my-1
                      rounded-full transition touch-target font-medium text-base
                      ${isActive
                        ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm'
                        : 'text-gray-700 hover:bg-blue-50'}
                      ${isCollapsed ? 'justify-center' : 'space-x-3'}
                    `}
                    title={isCollapsed ? item.name : ''}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 mr-2 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {!isCollapsed && (
                      <span className="text-base font-medium">{item.name}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Footer - User info */}
          {!isCollapsed && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.nome || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || 'email@exemplo.com'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 