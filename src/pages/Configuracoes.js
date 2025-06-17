import React, { useState, useEffect } from 'react';
import { Settings, Bell, Moon, Sun, Globe, Palette, Monitor, Save, RefreshCw, Car, Shield, Download, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

export default function Configuracoes() {
  const { userProfile, currentUser } = useAuth();
  const { theme, setThemeMode, isLoading: themeLoading, currentMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  
  const [configuracoes, setConfiguracoes] = useState({
    tema: currentMode || theme || 'system', // 'light', 'dark', 'system'
    idioma: 'pt-BR',
    notificacoes: {
      email: true,
      push: true,
      som: true,
      desktop: false,
      aulas: true,
      pagamentos: true,
      vencimentos: true
    },
    dashboard: {
      autoRefresh: true,
      refreshInterval: 30, // segundos
      showAnimations: true,
      compactMode: false,
      showWelcomeMessage: true
    },
    sistema: {
      timezone: 'America/Sao_Paulo',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      currency: 'BRL'
    },
    autoescola: {
      horariosAula: {
        inicio: '07:00',
        fim: '18:00',
        intervalo: 60 // minutos
      },
      categorias: ['A', 'B', 'AB', 'C', 'D', 'E'],
      configuracoesPagamento: {
        diasVencimento: 5,
        multaAtraso: 2.0, // porcentagem
        descontoAntecipado: 5.0, // porcentagem
        parcelamentoMaximo: 12
      },
      lembretes: {
        aulasPrevias: 24, // horas antes
        pagamentosPrevios: 72, // horas antes
        documentosVencimento: 168 // horas antes (1 semana)
      }
    },
    privacidade: {
      analytics: true,
      cookies: true,
      compartilharDados: false,
      backupAutomatico: true
    }
  });

  // Carregar configurações do localStorage e Firestore
  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        // Primeiro, tentar carregar do localStorage
        const savedConfig = localStorage.getItem('autoescola_config');
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          setConfiguracoes(prev => ({ ...prev, ...parsed }));
        }

        // Depois, carregar do Firestore se o usuário estiver logado
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'usuarios', currentUser.uid));
          if (userDoc.exists() && userDoc.data().configuracoes) {
            const firestoreConfig = userDoc.data().configuracoes;
            setConfiguracoes(prev => ({ ...prev, ...firestoreConfig }));
            // Sincronizar com localStorage
            localStorage.setItem('autoescola_config', JSON.stringify(firestoreConfig));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast.error('Erro ao carregar configurações');
      }
    };

    loadConfigurations();
  }, [currentUser]);

  // Sincronizar tema com o contexto
  useEffect(() => {
    if (!themeLoading) {
      setConfiguracoes(prev => ({ ...prev, tema: currentMode || theme }));
    }
  }, [theme, themeLoading, currentMode]);

  const validateConfigurations = (config) => {
    const errors = [];
    
    // Validar horários
    if (config.autoescola?.horariosAula) {
      const inicio = config.autoescola.horariosAula.inicio;
      const fim = config.autoescola.horariosAula.fim;
      if (inicio >= fim) {
        errors.push('Horário de início deve ser anterior ao horário de fim');
      }
    }

    // Validar configurações de pagamento
    if (config.autoescola?.configuracoesPagamento) {
      const { multaAtraso, descontoAntecipado, parcelamentoMaximo } = config.autoescola.configuracoesPagamento;
      if (multaAtraso < 0 || multaAtraso > 100) {
        errors.push('Multa por atraso deve estar entre 0% e 100%');
      }
      if (descontoAntecipado < 0 || descontoAntecipado > 50) {
        errors.push('Desconto antecipado deve estar entre 0% e 50%');
      }
      if (parcelamentoMaximo < 1 || parcelamentoMaximo > 24) {
        errors.push('Parcelamento máximo deve estar entre 1 e 24 vezes');
      }
    }

    return errors;
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Validar configurações
      const errors = validateConfigurations(configuracoes);
      if (errors.length > 0) {
        toast.error(`Erros encontrados: ${errors.join(', ')}`);
        return;
      }

      // Salvar no localStorage
      localStorage.setItem('autoescola_config', JSON.stringify(configuracoes));
      
      // Salvar no Firestore se o usuário estiver logado
      if (currentUser) {
        await updateDoc(doc(db, 'usuarios', currentUser.uid), {
          configuracoes: configuracoes,
          ultimaAtualizacaoConfig: new Date()
        });
      }
      
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja restaurar as configurações padrão? Esta ação não pode ser desfeita.')) {
      const defaultConfig = {
        tema: 'system',
        idioma: 'pt-BR',
        notificacoes: {
          email: true,
          push: true,
          som: true,
          desktop: false,
          aulas: true,
          pagamentos: true,
          vencimentos: true
        },
        dashboard: {
          autoRefresh: true,
          refreshInterval: 30,
          showAnimations: true,
          compactMode: false,
          showWelcomeMessage: true
        },
        sistema: {
          timezone: 'America/Sao_Paulo',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          currency: 'BRL'
        },
        autoescola: {
          horariosAula: {
            inicio: '07:00',
            fim: '18:00',
            intervalo: 60
          },
          categorias: ['A', 'B', 'AB', 'C', 'D', 'E'],
          configuracoesPagamento: {
            diasVencimento: 5,
            multaAtraso: 2.0,
            descontoAntecipado: 5.0,
            parcelamentoMaximo: 12
          },
          lembretes: {
            aulasPrevias: 24,
            pagamentosPrevios: 72,
            documentosVencimento: 168
          }
        },
        privacidade: {
          analytics: true,
          cookies: true,
          compartilharDados: false,
          backupAutomatico: true
        }
      };
      
      setConfiguracoes(defaultConfig);
      localStorage.removeItem('autoescola_config');
      setThemeMode('system');
      toast.success('Configurações restauradas para o padrão!');
    }
  };

  const handleBackup = () => {
    setBackupLoading(true);
    try {
      const backup = {
        configuracoes,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        usuario: userProfile?.email || 'unknown'
      };
      
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `backup-configuracoes-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Backup das configurações baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast.error('Erro ao criar backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (backup.configuracoes && backup.version) {
          setConfiguracoes(backup.configuracoes);
          toast.success('Configurações restauradas do backup!');
        } else {
          toast.error('Arquivo de backup inválido');
        }
      } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        toast.error('Erro ao ler arquivo de backup');
      }
    };
    reader.readAsText(file);
    
    // Limpar o input
    event.target.value = '';
  };

  const updateConfig = (section, key, value) => {
    setConfiguracoes(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const updateNestedConfig = (section, subsection, key, value) => {
    setConfiguracoes(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [key]: value
        }
      }
    }));
  };

  const updateSimpleConfig = (key, value) => {
    setConfiguracoes(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleThemeChange = (newTheme) => {
    updateSimpleConfig('tema', newTheme);
    setThemeMode(newTheme);
  };

  if (!userProfile || themeLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-8">
          <div className="loading-spinner w-8 h-8 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
              <p className="text-gray-600">Personalize sua experiência no sistema</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleBackup}
              disabled={backupLoading}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{backupLoading ? 'Baixando...' : 'Backup'}</span>
            </button>
            
            <label className="btn-secondary flex items-center space-x-2 cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>Restaurar</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                className="hidden"
              />
            </label>
            
            <button
              onClick={handleReset}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Padrão</span>
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aparência */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Palette className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Aparência</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tema
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
                  (currentMode || configuracoes.tema) === 'light' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
              >
                <Sun className="h-6 w-6 text-yellow-500" />
                <span className="text-sm font-medium">Claro</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
                  (currentMode || configuracoes.tema) === 'dark' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
              >
                <Moon className="h-6 w-6 text-blue-500" />
                <span className="text-sm font-medium">Escuro</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('system')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
                  (currentMode || configuracoes.tema) === 'system' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
              >
                <Monitor className="h-6 w-6 text-gray-500" />
                <span className="text-sm font-medium">Sistema</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              O tema do sistema seguirá as configurações do seu dispositivo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Idioma
            </label>
            <select
              value={configuracoes.idioma}
              onChange={(e) => updateSimpleConfig('idioma', e.target.value)}
              className="select-field w-full md:w-64"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notificações */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Bell className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Notificações</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Notificações por Email</h3>
              <p className="text-sm text-gray-500">Receber notificações importantes por email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configuracoes.notificacoes.email}
                onChange={(e) => updateConfig('notificacoes', 'email', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Notificações de Aulas</h3>
              <p className="text-sm text-gray-500">Lembrar sobre aulas agendadas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configuracoes.notificacoes.aulas}
                onChange={(e) => updateConfig('notificacoes', 'aulas', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Notificações de Pagamento</h3>
              <p className="text-sm text-gray-500">Lembrar sobre pagamentos pendentes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configuracoes.notificacoes.pagamentos}
                onChange={(e) => updateConfig('notificacoes', 'pagamentos', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Sons de Notificação</h3>
              <p className="text-sm text-gray-500">Reproduzir som ao receber notificações</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configuracoes.notificacoes.som}
                onChange={(e) => updateConfig('notificacoes', 'som', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Configurações da Autoescola */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Car className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Configurações da Autoescola</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Horários de Aula</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Início
                </label>
                <input
                  type="time"
                  value={configuracoes.autoescola.horariosAula.inicio}
                  onChange={(e) => updateNestedConfig('autoescola', 'horariosAula', 'inicio', e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fim
                </label>
                <input
                  type="time"
                  value={configuracoes.autoescola.horariosAula.fim}
                  onChange={(e) => updateNestedConfig('autoescola', 'horariosAula', 'fim', e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intervalo (min)
                </label>
                <select
                  value={configuracoes.autoescola.horariosAula.intervalo}
                  onChange={(e) => updateNestedConfig('autoescola', 'horariosAula', 'intervalo', parseInt(e.target.value))}
                  className="select-field w-full"
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos</option>
                  <option value={90}>90 minutos</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Pagamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias para Vencimento
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={configuracoes.autoescola.configuracoesPagamento.diasVencimento}
                  onChange={(e) => updateNestedConfig('autoescola', 'configuracoesPagamento', 'diasVencimento', parseInt(e.target.value))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Multa por Atraso (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={configuracoes.autoescola.configuracoesPagamento.multaAtraso}
                  onChange={(e) => updateNestedConfig('autoescola', 'configuracoesPagamento', 'multaAtraso', parseFloat(e.target.value))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desconto Antecipado (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={configuracoes.autoescola.configuracoesPagamento.descontoAntecipado}
                  onChange={(e) => updateNestedConfig('autoescola', 'configuracoesPagamento', 'descontoAntecipado', parseFloat(e.target.value))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parcelamento Máximo
                </label>
                <select
                  value={configuracoes.autoescola.configuracoesPagamento.parcelamentoMaximo}
                  onChange={(e) => updateNestedConfig('autoescola', 'configuracoesPagamento', 'parcelamentoMaximo', parseInt(e.target.value))}
                  className="select-field w-full"
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}x</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Monitor className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Atualização Automática</h3>
              <p className="text-sm text-gray-500">Atualizar dados automaticamente</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configuracoes.dashboard.autoRefresh}
                onChange={(e) => updateConfig('dashboard', 'autoRefresh', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {configuracoes.dashboard.autoRefresh && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intervalo de Atualização (segundos)
              </label>
              <select
                value={configuracoes.dashboard.refreshInterval}
                onChange={(e) => updateConfig('dashboard', 'refreshInterval', parseInt(e.target.value))}
                className="select-field w-full md:w-48"
              >
                <option value={15}>15 segundos</option>
                <option value={30}>30 segundos</option>
                <option value={60}>1 minuto</option>
                <option value={300}>5 minutos</option>
                <option value={600}>10 minutos</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Animações</h3>
              <p className="text-sm text-gray-500">Mostrar animações na interface</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configuracoes.dashboard.showAnimations}
                onChange={(e) => updateConfig('dashboard', 'showAnimations', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Sistema */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Globe className="h-6 w-6 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-900">Sistema</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuso Horário
            </label>
            <select
              value={configuracoes.sistema.timezone}
              onChange={(e) => updateConfig('sistema', 'timezone', e.target.value)}
              className="select-field w-full"
            >
              <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
              <option value="America/Manaus">Manaus (GMT-4)</option>
              <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato de Data
            </label>
            <select
              value={configuracoes.sistema.dateFormat}
              onChange={(e) => updateConfig('sistema', 'dateFormat', e.target.value)}
              className="select-field w-full"
            >
              <option value="DD/MM/YYYY">DD/MM/AAAA</option>
              <option value="MM/DD/YYYY">MM/DD/AAAA</option>
              <option value="YYYY-MM-DD">AAAA-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato de Hora
            </label>
            <select
              value={configuracoes.sistema.timeFormat}
              onChange={(e) => updateConfig('sistema', 'timeFormat', e.target.value)}
              className="select-field w-full"
            >
              <option value="24h">24 horas</option>
              <option value="12h">12 horas (AM/PM)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moeda
            </label>
            <select
              value={configuracoes.sistema.currency}
              onChange={(e) => updateConfig('sistema', 'currency', e.target.value)}
              className="select-field w-full"
            >
              <option value="BRL">Real (R$)</option>
              <option value="USD">Dólar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacidade */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-900">Privacidade e Segurança</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-500">Permitir coleta de dados para melhorar o sistema</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configuracoes.privacidade.analytics}
                onChange={(e) => updateConfig('privacidade', 'analytics', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Backup Automático</h3>
              <p className="text-sm text-gray-500">Fazer backup automático das configurações</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configuracoes.privacidade.backupAutomatico}
                onChange={(e) => updateConfig('privacidade', 'backupAutomatico', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="font-medium text-gray-700">Versão:</span>
            <span className="ml-2 text-gray-600">2.0.0</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="font-medium text-gray-700">Última Atualização:</span>
            <span className="ml-2 text-gray-600">Dezembro 2024</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="font-medium text-gray-700">Navegador:</span>
            <span className="ml-2 text-gray-600">{navigator.userAgent.split(' ')[0]}</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="font-medium text-gray-700">Resolução:</span>
            <span className="ml-2 text-gray-600">{window.screen.width}x{window.screen.height}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 