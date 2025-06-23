import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, LogOut, User, Settings, X, ChevronDown, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.lida).length;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    setShowUserMenu(false);
  };

  const handleMarkAsRead = async (id) => {
    // await markNotificationAsRead(id); // Função não disponível no momento
    setNotifications(notifications => notifications.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 lg:px-6">
          <div className="flex justify-between items-center h-16 relative">
            {/* Logo, menu e UnitSelector sempre visível */}
            <div className="flex items-center space-x-4 relative z-50">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden transition-all duration-200 touch-manipulation"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              {/* Logo */}
              <div className="flex flex-col justify-center">
                {/* <h1 className="text-xl font-bold text-blue-600">
                  Sistema Autoescola Ideal
                </h1> */}
              </div>
            </div>

            {/* Right side - Notifications and User Menu */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setNotifOpen(v => !v)} className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 touch-manipulation">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100 font-semibold text-gray-900">Notificações</div>
                    {notifications.length === 0 && (
                      <div className="px-4 py-6 text-gray-500 text-sm text-center">Nenhuma notificação</div>
                    )}
                    {notifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 border-b last:border-b-0 flex flex-col gap-1 ${n.lida ? 'bg-gray-50' : 'bg-blue-50'}`}> 
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800">{n.titulo || 'Atualização'}</span>
                          {!n.lida && (
                            <button onClick={() => handleMarkAsRead(n.id)} className="text-xs text-blue-600 hover:underline">Marcar como lida</button>
                          )}
                        </div>
                        <span className="text-xs text-gray-600">{n.mensagem}</span>
                        <span className="text-xs text-gray-400 mt-1">{n.createdAt && (new Date(n.createdAt.seconds ? n.createdAt.seconds * 1000 : n.createdAt).toLocaleString('pt-BR'))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Profile Dropdown */}
              <div className="relative">
                {/* Backdrop para user menu - AGORA ANTES DO DROPDOWN */}
                {showUserMenu && (
                  <div
                    className="fixed inset-0 z-40 bg-black/20"
                    onClick={() => setShowUserMenu(false)}
                  />
                )}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 touch-manipulation"
                >
                  <div className="hidden md:flex flex-col items-end text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.nome || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.perfil === 'admin' ? 'Administrador' : 
                       user?.perfil === 'manager' ? 'Gerente' :
                       user?.perfil === 'operator' ? 'Operador' :
                       user?.perfil === 'viewer' ? 'Visualizador' : 'Personalizado'}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.nome || 'Usuário'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user?.perfil === 'admin' ? 'Administrador' :
                         user?.perfil === 'manager' ? 'Gerente' :
                         user?.perfil === 'operator' ? 'Operador' :
                         user?.perfil === 'viewer' ? 'Visualizador' : 'Personalizado'}
                      </p>
                    </div>
                    
                    <div className="p-2">
                      <div className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {user?.nome || 'Usuário'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user?.email || 'email@exemplo.com'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <button
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => handleNavigate('/perfil')}
                      >
                        <User className="h-4 w-4" />
                        <span>Perfil</span>
                      </button>
                      
                      <button
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => handleNavigate('/configuracoes')}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Configurações</span>
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header; 