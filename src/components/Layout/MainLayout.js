import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>

      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-4.5rem)] relative">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        {/* Main Content Area */}
        <main 
          id="main-content"
          className={`
            flex-1 flex flex-col layout-transition
            ${isMobile ? 'w-full' : 'lg:ml-0'}
            ${sidebarOpen && isMobile ? 'overflow-hidden' : ''}
          `}
        >
          {/* Content Container */}
          <div className="flex-1 overflow-auto">
            <div className="main-content py-6 lg:py-8">
              <div className="animate-fade-in-up">
                {children}
              </div>
            </div>
          </div>

          {/* Optional Footer */}
          <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm mt-auto">
            <div className="container-responsive py-4">
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