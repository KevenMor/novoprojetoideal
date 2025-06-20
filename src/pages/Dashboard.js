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

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { 
    selectedUnit, 
    availableUnits, 
    getSelectedUnitDisplay,
    isViewingAll
  } = useUnitFilter();
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
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [showAllTime, setShowAllTime] = useState(false);

  const carregarDadosDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const mesParaFiltro = showAllTime ? null : selectedMonth;
      console.log('🔄 Carregando dados do dashboard para:', selectedUnit, mesParaFiltro ? `(${mesParaFiltro})` : '(todos os meses)');
      
      // Buscar dados baseado na unidade selecionada
      const unidadesParaFiltrar = isViewingAll ? availableUnits : [selectedUnit];
      
      // Rodar todas as chamadas em paralelo
      const [mensagensData, contasData, cobrancasData, extratosData, atividadesData] = await Promise.all([
        dashboardService.getMensagensStats(unidadesParaFiltrar),
        dashboardService.getContasStats(unidadesParaFiltrar),
        dashboardService.getCobrancasStats(unidadesParaFiltrar),
        dashboardService.getExtratosStats(unidadesParaFiltrar, mesParaFiltro),
        dashboardService.getRecentActivities(unidadesParaFiltrar)
      ]);
      
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
  }, [selectedUnit, availableUnits, isViewingAll, selectedMonth, showAllTime]);

  // Carregar dados do dashboard
  useEffect(() => {
    if (user && availableUnits.length > 0) {
      carregarDadosDashboard();
    }
  }, [user, carregarDadosDashboard, availableUnits]);

  // Redirecionamento ao login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
      return;
    }
  }, [user, authLoading, navigate]);

  // Função para gerar opções de meses
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    // Gerar os últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
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
      {/* Header com seletor de unidade e competência */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Bem-vindo, {user?.nome}!
            </h1>
            <div className="flex items-center space-x-2 text-blue-100">
              {/* <Building2 className="h-5 w-5" /> */}
              <span>{getSelectedUnitDisplay()}</span>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Seletor de Competência */}
            <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
              <CalendarDays className="h-5 w-5 text-blue-200" />
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-blue-100">Competência:</label>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAllTime}
                      onChange={(e) => setShowAllTime(e.target.checked)}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-blue-100">Todos os meses</span>
                  </label>
                  {!showAllTime && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-white/20 border border-white/30 rounded px-3 py-1 text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                    >
                      {generateMonthOptions().map(option => (
                        <option key={option.value} value={option.value} className="text-gray-900">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
            
            {/* Controles de atualização */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Última atualização: {new Date().toLocaleTimeString('pt-BR')}</span>
              </div>
              <button
                onClick={carregarDadosDashboard}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Atualizar Dados</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mensagens Enviadas */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition"
          onClick={() => navigate('/mensagem')}
          title="Ver mensagens enviadas"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mensagens Enviadas</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.mensagens}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">+100%</span>
          </div>
        </div>

        {/* Contas Cadastradas */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition"
          onClick={() => navigate('/historico-contas-btg')}
          title="Ver contas BTG"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contas Cadastradas</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.contasAtivas}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">+100%</span>
          </div>
        </div>

        {/* Cobranças Ativas */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition"
          onClick={() => navigate('/cobrancas')}
          title="Ver cobranças"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cobranças Ativas</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.cobrancas}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Receipt className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-500 font-medium">0%</span>
          </div>
        </div>

        {/* Saldo (Extratos) */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition"
          onClick={() => navigate('/extratos')}
          title="Ver extratos"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Saldo (Extratos) {!showAllTime && (
                  <span className="text-xs text-gray-500">
                    - {generateMonthOptions().find(opt => opt.value === selectedMonth)?.label}
                  </span>
                )}
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats.saldo)}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Calendar className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-sm text-blue-600 font-medium">
              {showAllTime ? 'Todos os períodos' : 'Mês selecionado'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => navigate(action.href)}
                    className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left group"
                  >
                    <div className={`h-10 w-10 rounded-lg ${getIconBgClasses(action.color)} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm">{action.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{action.description}</p>
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