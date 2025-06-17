import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Valor padrão mais seguro
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar tema
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Verificar se há tema salvo no localStorage
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          if (savedTheme === 'system') {
            // Se for sistema, verificar preferência
            const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            setTheme(systemPreference);
          } else {
            setTheme(savedTheme);
          }
        } else {
          // Verificar preferência do sistema como fallback
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
          } else {
            setTheme('light');
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar tema do localStorage:', error);
        setTheme('light'); // Fallback seguro
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();
  }, []);

  // Aplicar tema ao documento
  useEffect(() => {
    if (isLoading) return; // Não aplicar se ainda estiver carregando

    try {
      const root = document.documentElement;
      
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Salvar no localStorage apenas se não estiver em modo system
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme !== 'system') {
        localStorage.setItem('theme', theme);
      }
    } catch (error) {
      console.warn('Erro ao aplicar tema:', error);
    }
  }, [theme, isLoading]);

  // Escutar mudanças na preferência do sistema
  useEffect(() => {
    if (isLoading) return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e) => {
        // Só aplicar se estiver em modo system
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'system') {
          setTheme(e.matches ? 'dark' : 'light');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } catch (error) {
      console.warn('Erro ao configurar listener de preferência do sistema:', error);
    }
  }, [isLoading]);

  const toggleTheme = () => {
    if (isLoading) return;
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setThemeMode = (mode) => {
    if (isLoading) return;
    
    try {
      if (mode === 'system') {
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setTheme(systemPreference);
        localStorage.setItem('theme', 'system');
      } else if (['light', 'dark'].includes(mode)) {
        setTheme(mode);
        localStorage.setItem('theme', mode);
      }
    } catch (error) {
      console.warn('Erro ao definir modo de tema:', error);
    }
  };

  // Obter tema atual considerando preferência salva
  const getCurrentThemeMode = () => {
    try {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme || theme;
    } catch (error) {
      return theme;
    }
  };

  const value = {
    theme,
    toggleTheme,
    setThemeMode,
    isDark: theme === 'dark',
    isLoading,
    currentMode: getCurrentThemeMode()
  };

  // Mostrar loading enquanto inicializa
  if (isLoading) {
    return (
      <ThemeContext.Provider value={{ theme: 'light', isLoading: true }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 