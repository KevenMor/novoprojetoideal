import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, LogOut, User, Settings, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const { userProfile, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setUserMenuOpen(false);
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
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden transition-all duration-200"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
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
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User Profile Dropdown */}
              <div className="relative">
                {/* Backdrop para user menu - AGORA ANTES DO DROPDOWN */}
                {userMenuOpen && (
                  <div
                    className="fixed inset-0 z-40 bg-black/20"
                    onClick={() => setUserMenuOpen(false)}
                  />
                )}
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="hidden md:flex flex-col items-end text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {userProfile?.nome || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {userProfile?.perfil === 'admin' ? 'Administrador' : 
                       userProfile?.perfil === 'manager' ? 'Gerente' :
                       userProfile?.perfil === 'operator' ? 'Operador' :
                       userProfile?.perfil === 'viewer' ? 'Visualizador' : 'Personalizado'}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {userProfile?.nome?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {userProfile?.nome || 'Usuário'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {userProfile?.email || 'email@exemplo.com'}
                      </p>
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