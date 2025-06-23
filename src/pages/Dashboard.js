import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUnitFilter } from '../contexts/UnitFilterContext';
import { 
  MessageSquare, 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  Users, 
  Calendar, 
  Clock, 
  MapPin,
  BarChart3,
  Building2,
  RefreshCw,
  CalendarDays
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const { selectedUnit, availableUnits } = useUnitFilter();
  const navigate = useNavigate();
  
  // Estados de carregamento
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    mensagens: 0,
    contas: 0,
    contasAtivas: 0,
    cobrancas: 0,
    saldo: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  
  // Estado para seleção de competência
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    console.log('📅 [DASHBOARD] Data atual detectada:', now.toLocaleDateString('pt-BR'));
    console.log('📅 [DASHBOARD] Mês selecionado inicial:', mesAtual);
    console.log('📅 [DASHBOARD] Ano:', now.getFullYear(), 'Mês:', now.getMonth() + 1);
    return mesAtual;
  });
  const [showAllTime, setShowAllTime] = useState(false); // Mudando de volta para false para filtrar por mês

  const carregarDadosDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const mesParaFiltro = showAllTime ? null : selectedMonth;
      console.log('🔄 Carregando dados do dashboard para:', selectedUnit, mesParaFiltro ? `(${mesParaFiltro})` : '(todos os meses)');
      
      // Buscar dados baseado na unidade selecionada
      const unidadesParaFiltrar = availableUnits;
      
      // DEBUG: Comparar cálculos
      console.log('🔍 [DEBUG DASHBOARD] Unidades para filtrar:', unidadesParaFiltrar);
      
      // Rodar todas as chamadas em paralelo
      const [mensagensData, contasData, cobrancasData, extratosData, atividadesData] = await Promise.all([
        dashboardService.getMensagensStats(unidadesParaFiltrar),
        dashboardService.getContasStats(unidadesParaFiltrar),
        dashboardService.getCobrancasStats(unidadesParaFiltrar),
        dashboardService.getExtratosStats(unidadesParaFiltrar, mesParaFiltro),
        dashboardService.getRecentActivities(unidadesParaFiltrar)
      ]);
      
      console.log('🎯 [DEBUG DASHBOARD] Dados dos extratos recebidos:', extratosData);
      
      setDashboardStats({
        mensagens: mensagensData.total || 0,
        contas: contasData.total || 0,
        contasAtivas: contasData.ativas || 0,
        cobrancas: cobrancasData.ativas || 0,
        saldo: extratosData.saldo || 0
      });
      setRecentActivities(atividadesData || []);
      
      console.log('✅ Dados do dashboard carregados:', {
        unidade: selectedUnit,
        competencia: mesParaFiltro || 'Todos os meses',
        stats: {
          mensagens: mensagensData.total || 0,
          contas: contasData.total || 0,
          cobrancas: cobrancasData.ativas || 0,
          saldo: extratosData.saldo || 0
        }
      });
    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
      setError('Falha ao carregar dados. Tente recarregar a página.');
    } finally {
      setLoading(false);
    }
  }, [selectedUnit, availableUnits, selectedMonth, showAllTime]);

  // Carregar dados do dashboard
  useEffect(() => {
    if (user && availableUnits.length > 0) {
      carregarDadosDashboard();
    }
  }, [user, carregarDadosDashboard, availableUnits]);

  // Função para gerar opções de meses
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    console.log('📅 [DASHBOARD] Gerando opções de meses a partir de:', now.toLocaleDateString('pt-BR'));
    
    // Gerar os últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      console.log(`📅 [DASHBOARD] Opção ${i}: ${label} (${value})`);
      options.push({ value, label });
    }
    
    return options;
  };

  const quickActions = [
    {
      name: 'Enviar Mensagem',
      description: 'WhatsApp automático',
      icon: MessageSquare,
      color: 'blue',
      href: '/mensagem'
    },
    {
      name: 'Cadastrar Conta BTG',
      description: 'Boleto e PIX',
      icon: CreditCard,
      color: 'green',
      href: '/contas-btg'
    },
    {
      name: 'Registrar Cobrança',
      description: 'Gestão de pagamentos',
      icon: Receipt,
      color: 'purple',
      href: '/cobrancas'
    },
    {
      name: 'Ver Extratos',
      description: 'Relatórios financeiros',
      icon: BarChart3,
      color: 'orange',
      href: '/extratos'
    }
  ];

  const getIconComponent = (iconName) => {
    const icons = {
      MessageSquare,
      CreditCard,
      Receipt,
      TrendingUp,
      Users,
      Calendar,
      Clock,
      MapPin,
      BarChart3,
      Building2
    };
    return icons[iconName] || MessageSquare;
  };

  const getIconClasses = (color) => {
    const classes = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      purple: 'text-purple-600 bg-purple-100',
      orange: 'text-orange-600 bg-orange-100',
      red: 'text-red-600 bg-red-100'
    };
    return classes[color] || 'text-gray-600 bg-gray-100';
  };

  const getIconBgClasses = (color) => {
    const classes = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };
    return classes[color] || 'bg-gray-500';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={carregarDadosDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com seletor de unidade e filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600 text-lg">
              Unidade: {selectedUnit}
            </p>
          </div>
          
          {/* Filtro de Período Modernizado */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-white" />
              </div>
              
              <label className="flex items-center gap-2 text-gray-700 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showAllTime}
                    onChange={(e) => setShowAllTime(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                    showAllTime 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-300 group-hover:border-blue-400'
                  }`}>
                    {showAllTime && (
                      <svg className="w-2.5 h-2.5 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium">Todos os períodos</span>
              </label>
              
              {!showAllTime && (
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700 font-medium appearance-none cursor-pointer hover:border-gray-300 transition-all duration-200 min-w-[160px]"
                  >
                    {generateMonthOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {/* Mensagens Enviadas */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200 group touch-manipulation"
          onClick={() => navigate('/mensagem')}
          title="Ver mensagens enviadas"
        >
          <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-2 sm:mb-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors mb-2 sm:mb-0">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardStats.mensagens}</p>
              <p className="text-xs sm:text-sm text-gray-500">Mensagens</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:justify-between">
            <p className="text-xs sm:text-sm font-medium text-gray-600 text-center sm:text-left mb-1 sm:mb-0">Mensagens Enviadas</p>
            <div className="flex items-center text-green-600">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs sm:text-sm font-medium">+100%</span>
            </div>
          </div>
        </div>

        {/* Contas Cadastradas */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6 cursor-pointer hover:shadow-md hover:border-green-200 transition-all duration-200 group touch-manipulation"
          onClick={() => navigate('/historico-contas-btg')}
          title="Ver contas BTG"
        >
          <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-2 sm:mb-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors mb-2 sm:mb-0">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardStats.contasAtivas}</p>
              <p className="text-xs sm:text-sm text-gray-500">Contas</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:justify-between">
            <p className="text-xs sm:text-sm font-medium text-gray-600 text-center sm:text-left mb-1 sm:mb-0">Contas Cadastradas</p>
            <div className="flex items-center text-green-600">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs sm:text-sm font-medium">+100%</span>
            </div>
          </div>
        </div>

        {/* Cobranças Ativas */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6 cursor-pointer hover:shadow-md hover:border-purple-200 transition-all duration-200 group touch-manipulation"
          onClick={() => navigate('/cobrancas')}
          title="Ver cobranças"
        >
          <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-2 sm:mb-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors mb-2 sm:mb-0">
              <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardStats.cobrancas}</p>
              <p className="text-xs sm:text-sm text-gray-500">Cobranças</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:justify-between">
            <p className="text-xs sm:text-sm font-medium text-gray-600 text-center sm:text-left mb-1 sm:mb-0">Cobranças Ativas</p>
            <div className="flex items-center text-gray-500">
              <span className="text-xs sm:text-sm font-medium">Estável</span>
            </div>
          </div>
        </div>

        {/* Saldo (Extratos) */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6 cursor-pointer hover:shadow-md hover:border-orange-200 transition-all duration-200 group touch-manipulation"
          onClick={() => navigate('/extratos')}
          title="Ver extratos"
        >
          <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-2 sm:mb-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors mb-2 sm:mb-0">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats.saldo)}</p>
              <p className="text-xs sm:text-sm text-gray-500">Saldo</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:justify-between">
            <p className="text-xs sm:text-sm font-medium text-gray-600 text-center sm:text-left">
              Saldo Atual
              {!showAllTime && (
                <span className="block text-xs text-gray-400 mt-1">
                  {generateMonthOptions().find(opt => opt.value === selectedMonth)?.label}
                </span>
              )}
            </p>
            <div className="flex items-center text-blue-600 mt-1 sm:mt-0">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-xs sm:text-sm font-medium">
                {showAllTime ? 'Total' : 'Mensal'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Atividades Recentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Atividades Recentes</h2>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((activity, index) => {
                  const Icon = getIconComponent(activity.icon);
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getIconClasses(activity.color)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                        <div className="flex items-center mt-1 space-x-2 text-xs text-gray-400">
                          <span>{activity.time}</span>
                          <span>•</span>
                          <span>{activity.unit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Ações Rápidas</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => navigate(action.href)}
                    className="p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left group touch-manipulation"
                  >
                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg ${getIconBgClasses(action.color)} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h3 className="font-medium text-gray-900 text-xs sm:text-sm">{action.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 hidden sm:block">{action.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
