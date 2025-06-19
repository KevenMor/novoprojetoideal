import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnitFilter } from '../contexts/UnitFilterContext';
// import UnitSelector from '../components/UnitSelector'; // Não usado atualmente
import ModalLancamento from '../components/ModalLancamento';
import { Filter, Download, RefreshCw, Database, BarChart3, TrendingUp, TrendingDown, FileSpreadsheet, Target, CheckCircle, Trash2, Clock, X, Edit3, Calendar } from 'lucide-react';
import { extratosService } from '../services/extratosService';
import { lancamentosService } from '../services/lancamentosService';
import { formatCurrency, formatDate } from '../services/asaasService';
import toast from 'react-hot-toast';

export default function Extratos() {
  const { userProfile, isAdmin } = useAuth();
  const { 
    selectedUnit, 
    availableUnits, 
    changeSelectedUnit, 
    // getSelectedUnitDisplay, // Não usado atualmente
    hasMultipleUnits 
  } = useUnitFilter();
  
  const shouldShowUnitSelector = hasMultipleUnits();
  
  const [loading, setLoading] = useState(false);
  const [extratos, setExtratos] = useState([]);
  const [filtros, setFiltros] = useState({
    dataInicial: '',
    dataFinal: '',
    unidade: selectedUnit || '',
    tipo: ''
  });
  const [estatisticas, setEstatisticas] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    transacoes: 0
  });
  
  // Estados para os modais de lançamento
  const [mostrarModalReceita, setMostrarModalReceita] = useState(false);
  const [mostrarModalDespesa, setMostrarModalDespesa] = useState(false);
  const [mostrarModalEdicao, setMostrarModalEdicao] = useState(false);
  const [lancamentoParaEditar, setLancamentoParaEditar] = useState(null);

  const tiposTransacao = [
    { value: '', label: 'Todos os tipos' },
    { value: 'CREDIT', label: 'Receitas' },
    { value: 'DEBIT', label: 'Despesas' },
    { value: 'AGUARDANDO', label: 'Aguardando Pagamento' }
  ];

  useEffect(() => {
    // Definir período padrão AMPLO para incluir dados das planilhas (2024-2026)
    // const hoje = new Date(); // Não usado atualmente
    const inicioAno = new Date(2024, 0, 1); // 1º de janeiro de 2024
    const fimAno = new Date(2026, 11, 31); // 31 de dezembro de 2026
    
    console.log('📅 Definindo período padrão AMPLO:', {
      inicio: inicioAno.toISOString().split('T')[0],
      fim: fimAno.toISOString().split('T')[0]
    });
    
    setFiltros(prev => ({
      ...prev,
      dataInicial: inicioAno.toISOString().split('T')[0],
      dataFinal: fimAno.toISOString().split('T')[0],
      unidade: selectedUnit === 'all' ? '' : selectedUnit
    }));
  }, [selectedUnit]);

  // Carregar dados automaticamente quando filtros estão prontos
  useEffect(() => {
    console.log('🔄 useEffect - Verificando se deve carregar extratos...');
    console.log('📋 Filtros atuais:', filtros);
    console.log('🏢 Unidade selecionada:', selectedUnit);
    console.log('🏢 Unidades disponíveis:', availableUnits);
    
    if (filtros.dataInicial && filtros.dataFinal && availableUnits.length > 0) {
      console.log('✅ Condições atendidas, carregando extratos...');
      carregarExtratos();
    } else {
      console.log('⚠️ Condições não atendidas:', {
        temDataInicial: !!filtros.dataInicial,
        temDataFinal: !!filtros.dataFinal,
        temUnidades: availableUnits.length > 0
      });
    }
  }, [filtros.dataInicial, filtros.dataFinal, availableUnits]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aplicar filtros automaticamente quando a unidade é alterada
  useEffect(() => {
    console.log('🔄 Unidade alterada, limpando estado anterior...');
    
    // LIMPAR ESTADO ANTERIOR para evitar que dados "grudem"
    setExtratos([]);
    setEstatisticas({
      receitas: 0,
      despesas: 0,
      saldo: 0,
      transacoes: 0
    });
    
    if (filtros.dataInicial && filtros.dataFinal && filtros.unidade) {
      console.log('✅ Recarregando extratos para nova unidade:', filtros.unidade);
      carregarExtratos();
    }
  }, [filtros.unidade]); // eslint-disable-line react-hooks/exhaustive-deps

  const carregarExtratos = async () => {
    setLoading(true);
    try {
      console.log('🔄 Carregando extratos...');
      console.log('👤 Perfil do usuário:', userProfile);
      console.log('🏢 Unidade selecionada:', selectedUnit);
      console.log('📋 Filtros atuais:', filtros);
      
      const filtrosCompletos = {
        ...filtros,
        unidade: filtros.unidade || selectedUnit || (userProfile?.unidades?.[0])
      };
      
      console.log('📋 Filtros completos aplicados:', filtrosCompletos);
      
      // Validar se temos dados mínimos necessários
      if (!filtrosCompletos.dataInicial || !filtrosCompletos.dataFinal) {
        console.warn('⚠️ Datas não definidas nos filtros');
        toast.error('Por favor, defina as datas inicial e final');
        return;
      }
      
      if (!filtrosCompletos.unidade) {
        console.warn('⚠️ Nenhuma unidade definida nos filtros');
        console.log('🏢 Unidades disponíveis:', availableUnits);
        
        if (availableUnits && availableUnits.length > 0) {
          filtrosCompletos.unidade = availableUnits[0];
          console.log(`🔄 Usando primeira unidade disponível: ${filtrosCompletos.unidade}`);
        } else {
          toast.error('Nenhuma unidade disponível para consulta');
          return;
        }
      }
      
      console.log('🚀 Iniciando busca com filtros:', filtrosCompletos);
      
      // COMPARAÇÃO: Testar exatamente como o teste de configuração faz
      console.log('🔍 COMPARAÇÃO: Testando como o teste de configuração...');
      const { googleSheetsService } = await import('../services/googleSheetsService');
      const testeConfiguracao = await googleSheetsService.buscarExtratosFiltrados({ unidade: filtrosCompletos.unidade });
      console.log(`🔍 COMPARAÇÃO: ${testeConfiguracao.length} extratos encontrados pelo método de teste`);
      
      // TESTE: Primeiro tentar buscar SEM filtros de data (como o Dashboard faz)
      console.log('🧪 TESTE: Buscando extratos SEM filtros de data...');
      const extratosSemFiltro = await extratosService.buscarExtratos({ unidade: filtrosCompletos.unidade });
      console.log(`🧪 TESTE: ${extratosSemFiltro.length} extratos encontrados SEM filtros de data`);
      
      if (extratosSemFiltro.length > 0) {
        console.log('🧪 TESTE: Primeiros 3 extratos sem filtro:', extratosSemFiltro.slice(0, 3));
      }
      
      // Agora buscar COM filtros completos
      console.log('📋 FILTROS COMPLETOS: Buscando com todos os filtros...');
      console.log('📋 FILTROS COMPLETOS: Parâmetros:', filtrosCompletos);
      const extratosCarregados = await extratosService.buscarExtratos(filtrosCompletos);
      
      console.log(`✅ ${extratosCarregados.length} extratos carregados COM filtros`);
      console.log('📊 Primeiros 3 extratos com filtros:', extratosCarregados.slice(0, 3));
      
      // Buscar lançamentos manuais do Firebase
      console.log('💰 Buscando lançamentos manuais do Firebase...');
      console.log('💰 Filtros para lançamentos:', filtrosCompletos);
      
      const lancamentosManuais = await lancamentosService.buscarLancamentos(filtrosCompletos);
      console.log(`💰 ${lancamentosManuais.length} lançamentos manuais encontrados`);
      
      if (lancamentosManuais.length > 0) {
        console.log('💰 Primeiros lançamentos encontrados:', lancamentosManuais.slice(0, 3));
      }
      
      // Converter lançamentos para formato de extrato
      const lancamentosFormatados = lancamentosManuais.map(lancamento => {
        const formatado = lancamentosService.formatarParaExtrato(lancamento);
        console.log('💰 Lançamento formatado:', { original: lancamento, formatado });
        return formatado;
      });
      
      // Escolher a melhor fonte de dados (prioridade: filtros completos > sem filtros > teste configuração)
      let extratosFinais = extratosCarregados;
      let fonteUsada = 'filtros completos';
      
      if (extratosCarregados.length === 0 && extratosSemFiltro.length > 0) {
        console.log('🔄 Nenhum extrato encontrado com filtros, usando dados sem filtros de data');
        extratosFinais = extratosSemFiltro;
        fonteUsada = 'sem filtros de data';
      } else if (extratosCarregados.length === 0 && extratosSemFiltro.length === 0 && testeConfiguracao.length > 0) {
        console.log('🔄 Nenhum extrato encontrado pelos métodos normais, usando dados do teste de configuração');
        extratosFinais = testeConfiguracao;
        fonteUsada = 'teste de configuração';
      }
      
      // Combinar extratos das planilhas com lançamentos manuais
      const todosDados = [...extratosFinais, ...lancamentosFormatados];
      
      // Aplicar filtro por tipo/status se especificado
      let dadosFiltrados = todosDados;
      if (filtrosCompletos.tipo) {
        console.log(`🔍 Aplicando filtro por tipo: ${filtrosCompletos.tipo}`);
        
        if (filtrosCompletos.tipo === 'AGUARDANDO') {
          // Filtrar apenas extratos com status AGUARDANDO
          dadosFiltrados = todosDados.filter(extrato => {
            const status = extrato.status || 'CONFIRMADO';
            return status === 'AGUARDANDO';
          });
        } else {
          // Filtrar por tipo normal (CREDIT/DEBIT)
          dadosFiltrados = todosDados.filter(extrato => {
            const tipo = extrato.tipo || extrato.type;
            return tipo === filtrosCompletos.tipo;
          });
        }
        
        console.log(`${dadosFiltrados.length} extratos após filtro por tipo/status`);
      }
      
      // Ordenar por data (mais recente primeiro)
      dadosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));
      
      console.log(`RESULTADO FINAL: ${dadosFiltrados.length} registros (${extratosFinais.length} planilhas + ${lancamentosFormatados.length} lançamentos)`);
      
      if (dadosFiltrados.length > 0) {
        console.log('RESULTADO FINAL: Primeiros 3 registros:', dadosFiltrados.slice(0, 3));
      }
      
      setExtratos(dadosFiltrados);
      
      // Calcular estatísticas com TODOS os dados (não filtrados por tipo)
      // para manter as estatísticas gerais corretas
      const stats = calcularEstatisticas(todosDados);
      console.log('📈 Estatísticas calculadas:', stats);
      setEstatisticas(stats);
      
      if (dadosFiltrados.length === 0) {
        toast.error('Nenhum extrato encontrado para os filtros selecionados');
      } else {
        toast.success(`${dadosFiltrados.length} extratos carregados (${fonteUsada})`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar extratos:', error);
      console.error('❌ Stack trace:', error.stack);
      toast.error(`Erro ao carregar extratos: ${error.message}`);
      setExtratos([]);
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = async () => {
    try {
      if (extratos.length === 0) {
        toast.error('Nenhum dado para exportar');
        return;
      }

      const csvContent = [
        ['Data', 'Descrição', 'Tipo', 'Valor', 'Status', 'Unidade', 'Cliente', 'Forma de Pagamento'].join(','),
        ...extratos.map(extrato => [
          formatDate(extrato.data),
          `"${extrato.descricao || extrato.description || ''}"`,
          extrato.tipo || extrato.type || '',
          extrato.valor || extrato.value || 0,
          extrato.status || '',
          extrato.unidade || '',
          `"${extrato.cliente || ''}"`,
          `"${extrato.formaPagamento || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `extratos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Arquivo CSV exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar arquivo CSV');
    }
  };

  const getTipoTransacaoText = (extrato) => {
    const tipo = extrato.tipo || extrato.type;
    return tipo === 'CREDIT' || tipo === 'RECEITA' ? 'Receita' : 'Despesa';
  };

  const getTipoTransacaoColor = (extrato) => {
    const tipo = extrato.tipo || extrato.type;
    return tipo === 'CREDIT' || tipo === 'RECEITA' 
      ? 'text-green-600 bg-green-50' 
      : 'text-red-600 bg-red-50';
  };

  const calcularEstatisticas = (extratosList) => {
    // Filtrar apenas extratos da unidade selecionada
    const extratosDaUnidade = extratosList.filter(e => e.unidade === filtros.unidade);

    // Filtrar apenas extratos confirmados para as estatísticas
    // Contas "AGUARDANDO" não devem ser contabilizadas como despesa
    const extratosConfirmados = extratosDaUnidade.filter(extrato => {
      const status = extrato.status || 'CONFIRMADO';
      return status === 'CONFIRMADO' || status === 'RECEIVED' || status === 'PAGO';
    });
    // Filtrar extratos aguardando para cálculos separados
    const extratosAguardando = extratosDaUnidade.filter(e => e.status === 'AGUARDANDO');
    
    console.log('Calculando estatísticas: ...');
    
    const receitas = extratosConfirmados
      .filter(e => (e.tipo === 'RECEITA' || e.type === 'CREDIT'))
      .reduce((sum, e) => sum + (e.valor || e.value || 0), 0);
    
    const despesas = extratosConfirmados
      .filter(e => (e.tipo === 'DESPESA' || e.type === 'DEBIT'))
      .reduce((sum, e) => sum + (e.valor || e.value || 0), 0);
    
    // Calcular valor total das contas aguardando
    const valorAguardando = extratosAguardando
      .reduce((sum, e) => sum + (e.valor || e.value || 0), 0);
    
    // Contar extratos por status
    const aguardando = extratosAguardando.length;
    const cancelados = extratosDaUnidade.filter(e => e.status === 'CANCELADO').length;
    
    console.log('Estatísticas detalhadas:', {
      receitas,
      despesas,
      saldo: receitas - despesas,
      confirmados: extratosConfirmados.length,
      aguardando,
      valorAguardando,
      cancelados,
      total: extratosDaUnidade.length
    });
    
    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
      transacoes: extratosConfirmados.length, // Apenas confirmados
      aguardando, // Quantidade aguardando
      valorAguardando, // Valor total aguardando
      cancelados, // Informação adicional
      total: extratosDaUnidade.length // Total incluindo aguardando e cancelados
    };
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => {
      // Se o campo for dataInicial ou dataFinal e o outro estiver vazio, preenche ambos
      if (campo === 'dataInicial' && (!prev.dataFinal || prev.dataFinal === '')) {
        return { ...prev, dataInicial: valor, dataFinal: valor };
      }
      if (campo === 'dataFinal' && (!prev.dataInicial || prev.dataInicial === '')) {
        return { ...prev, dataInicial: valor, dataFinal: valor };
      }
      return { ...prev, [campo]: valor };
    });
  };

  // Atualizar filtros quando selectedUnit mudar
  React.useEffect(() => {
    setFiltros(prev => ({
      ...prev,
      unidade: selectedUnit === 'all' ? '' : selectedUnit
    }));
  }, [selectedUnit]);

  // Função para recarregar dados após criar lançamento
  const handleLancamentoSucesso = () => {
    console.log('💰 Lançamento criado com sucesso, recarregando dados...');
    carregarExtratos();
  };

  const excluirLancamento = async (lancamentoId) => {
    if (!window.confirm('Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      console.log('🗑️ Excluindo lançamento:', lancamentoId);
      await lancamentosService.excluirLancamento(lancamentoId);
      toast.success('Lançamento excluído com sucesso!');
      carregarExtratos(); // Recarregar lista
    } catch (error) {
      console.error('❌ Erro ao excluir lançamento:', error);
      toast.error(`Erro ao excluir lançamento: ${error.message}`);
    }
  };

  const isLancamentoManual = (extrato) => {
    // Verificar se é um lançamento manual (tem ID do Firebase)
    return extrato.id && extrato.fonte === 'firebase';
  };

  const editarLancamento = (extrato) => {
    // Buscar o lançamento original do Firebase para edição
    const lancamentoOriginal = {
      id: extrato.id,
      descricao: extrato.descricao || extrato.description,
      valor: extrato.valor || extrato.value,
      data: extrato.data || extrato.date,
      tipo: extrato.tipo === 'CREDIT' ? 'RECEITA' : 'DESPESA',
      unidade: extrato.unidade,
      categoria: extrato.categoria,
      formaPagamento: extrato.formaPagamento,
      observacoes: extrato.observacoes
    };
    
    console.log('✏️ Editando lançamento:', lancamentoOriginal);
    setLancamentoParaEditar(lancamentoOriginal);
    setMostrarModalEdicao(true);
  };

  const handleEdicaoSucesso = () => {
    console.log('✅ Lançamento editado com sucesso, recarregando dados...');
    setMostrarModalEdicao(false);
    setLancamentoParaEditar(null);
    carregarExtratos();
  };

  return (
    <div className="space-y-6">

      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Extratos Financeiros</h1>
          <p className="text-gray-600">Visualize e gerencie os extratos das unidades</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setMostrarModalReceita(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <TrendingUp className="w-4 h-4" />
            Cadastrar Receita
          </button>
          <button
            onClick={() => setMostrarModalDespesa(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <TrendingDown className="w-4 h-4" />
            Cadastrar Despesa
          </button>
          <button
            onClick={exportarCSV}
            disabled={loading || extratos.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={carregarExtratos}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transações Confirmadas</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.transacoes}</p>
              <p className="text-xs text-gray-500">de {estatisticas.total} total</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Receitas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(estatisticas.receitas)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Despesas Confirmadas</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(estatisticas.despesas)}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aguardando Pagamento</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(estatisticas.valorAguardando || 0)}</p>
              <p className="text-xs text-gray-500">{estatisticas.aguardando || 0} cobrança{(estatisticas.aguardando || 0) !== 1 ? 's' : ''} pendente{(estatisticas.aguardando || 0) !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Líquido</p>
              <p className={`text-2xl font-bold ${estatisticas.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(estatisticas.saldo)}
              </p>
              <p className="text-xs text-gray-500">apenas confirmadas</p>
            </div>
            <div className={`p-3 rounded-full ${estatisticas.saldo >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <Target className={`w-6 h-6 ${estatisticas.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Data Inicial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Inicial
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={filtros.dataInicial}
                onChange={(e) => handleFiltroChange('dataInicial', e.target.value)}
                className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Data Final */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Final
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={filtros.dataFinal}
                onChange={(e) => handleFiltroChange('dataFinal', e.target.value)}
                className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Unidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {shouldShowUnitSelector ? 'Unidade' : 'Unidade'}
            </label>
            <div className="relative">
              {/* <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /> */}
              {shouldShowUnitSelector ? (
                <select
                  value={selectedUnit === 'all' ? '' : selectedUnit}
                  onChange={(e) => {
                    const unit = e.target.value || 'all';
                    handleFiltroChange('unidade', unit === 'all' ? '' : unit);
                    changeSelectedUnit(unit);
                  }}
                  className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Todas as Unidades</option>
                  {availableUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 flex items-center">
                  {filtros.unidade || 'Nenhuma unidade'}
                </div>
              )}
            </div>
            {!shouldShowUnitSelector && !filtros.unidade && (
              <p className="mt-1 text-sm text-red-600">
                ⚠️ Nenhuma unidade atribuída. Entre em contato com o administrador.
              </p>
            )}
          </div>

          {/* Tipo de Transação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {tiposTransacao.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Botão Atualizar */}
          <div>
            <button
              onClick={carregarExtratos}
              disabled={loading}
              className="w-full h-12 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Extratos */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Extratos {filtros.unidade && filtros.unidade !== 'all' ? `- ${filtros.unidade}` : ''}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Database className="w-4 h-4" />
              {extratos.length} registros encontrados
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Carregando extratos...</p>
          </div>
        ) : extratos.length === 0 ? (
          <div className="p-8 text-center">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Nenhum extrato encontrado para os filtros selecionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente/Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Forma de Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {extratos
                  .filter(e => {
                    if (!filtros.unidade || filtros.unidade === 'all') return true;
                    return e.unidade && e.unidade.toLowerCase().trim() === filtros.unidade.toLowerCase().trim();
                  })
                  .map((extrato, index) => (
                    <tr key={extrato.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(extrato.data || extrato.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{extrato.cliente || 'Cliente'}</div>
                          <div className="text-gray-500 text-xs">
                            {extrato.descricao || extrato.description || 'Sem descrição'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoTransacaoColor(extrato)}`}>
                          {getTipoTransacaoText(extrato)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(extrato.valor || extrato.value || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          {/* <Building2 className="w-4 h-4 text-gray-400" /> */}
                          {extrato.unidade || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {extrato.formaPagamento || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const status = extrato.status || 'Confirmado';
                          if (status === 'AGUARDANDO') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-50 text-yellow-600">
                                <Clock className="w-3 h-3" />
                                Aguardando
                              </span>
                            );
                          } else if (status === 'CANCELADO') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-600">
                                <X className="w-3 h-3" />
                                Cancelado
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                Confirmado
                              </span>
                            );
                          }
                        })()}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {isLancamentoManual(extrato) ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => editarLancamento(extrato)}
                                className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                title="Editar lançamento manual"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => excluirLancamento(extrato.id)}
                                className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                title="Excluir lançamento manual"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              Planilha
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais de Lançamento */}
      <ModalLancamento
        isOpen={mostrarModalReceita}
        onClose={() => setMostrarModalReceita(false)}
        tipo="RECEITA"
        onSucesso={handleLancamentoSucesso}
      />
      
      <ModalLancamento
        isOpen={mostrarModalDespesa}
        onClose={() => setMostrarModalDespesa(false)}
        tipo="DESPESA"
        onSucesso={handleLancamentoSucesso}
      />

      {/* Modal de Edição */}
      <ModalLancamento
        isOpen={mostrarModalEdicao}
        onClose={() => {
          setMostrarModalEdicao(false);
          setLancamentoParaEditar(null);
        }}
        tipo={lancamentoParaEditar?.tipo || 'RECEITA'}
        onSucesso={handleEdicaoSucesso}
        lancamentoParaEditar={lancamentoParaEditar}
        modoEdicao={true}
      />
    </div>
  );
}