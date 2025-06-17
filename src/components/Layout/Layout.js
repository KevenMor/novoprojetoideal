import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
        setIsCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>

      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex flex-1">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        
        {/* Main Content Area */}
        <main 
          id="main-content"
          className={`
            flex-1 flex flex-col transition-all duration-300 ease-in-out
            ${!isMobile ? (isCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'}
          `}
        >
          {/* Content Container */}
          <div className="flex-1 overflow-auto">
            <div className="p-6 lg:p-8">
              <div className="animate-fade-in-up">
                <Outlet />
              </div>
            </div>
          </div>

          {/* Optional Footer */}
          <footer className="border-t border-gray-200 bg-white">
            <div className="px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>&copy; 2024 Autoescola Ideal</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">Todos os direitos reservados</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Sistema v1.0.0</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">React + Firebase</span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Loading overlay for page transitions */}
      <div id="loading-overlay" className="hidden fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="loading-spinner mx-auto"></div>
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    </div>
  );
} 