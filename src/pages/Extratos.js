import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnitFilter } from '../contexts/UnitFilterContext';
// import UnitSelector from '../components/UnitSelector'; // Não usado atualmente
import ModalLancamento from '../components/ModalLancamento';
import { Filter, Download, RefreshCw, Database, BarChart3, TrendingUp, TrendingDown, FileSpreadsheet, Target, CheckCircle, Trash2, Clock, X, Edit3, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [competenciaAtual, setCompetenciaAtual] = useState(() => {
    const hoje = new Date();
    return {
      mes: hoje.getMonth() + 1,
      ano: hoje.getFullYear()
    };
  });
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
  const [mostrarExcluidos, setMostrarExcluidos] = useState(false);

  const tiposTransacao = [
    { value: '', label: 'Todos os tipos' },
    { value: 'CREDIT', label: 'Receitas' },
    { value: 'DEBIT', label: 'Despesas' },
    { value: 'AGUARDANDO', label: 'Aguardando Pagamento' }
  ];

  // Função para navegar entre competências
  const navegarCompetencia = (direcao) => {
    setCompetenciaAtual(atual => {
      let novoMes = atual.mes;
      let novoAno = atual.ano;
      
      if (direcao === 'anterior') {
        novoMes--;
        if (novoMes < 1) {
          novoMes = 12;
          novoAno--;
        }
      } else {
        novoMes++;
        if (novoMes > 12) {
          novoMes = 1;
          novoAno++;
        }
      }
      
      return { mes: novoMes, ano: novoAno };
    });
  };

  // Função para formatar nome do mês
  const formatarMes = (mes, ano) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${meses[mes - 1]} de ${ano}`;
  };

  useEffect(() => {
    // Definir datas baseadas na competência selecionada
    const primeiroDia = new Date(competenciaAtual.ano, competenciaAtual.mes - 1, 1);
    const ultimoDia = new Date(competenciaAtual.ano, competenciaAtual.mes, 0);
    
    setFiltros(prev => ({
      ...prev,
      dataInicial: primeiroDia.toISOString().split('T')[0],
      dataFinal: ultimoDia.toISOString().split('T')[0],
      unidade: selectedUnit === 'all' ? '' : selectedUnit
    }));
  }, [selectedUnit, competenciaAtual]);

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
        unidade: selectedUnit === 'all' ? 'all' : (filtros.unidade || selectedUnit || userProfile?.unidades?.[0])
      };
      
      console.log('📋 Filtros completos aplicados:', filtrosCompletos);
      
      // Validar se temos dados mínimos necessários
      if (!filtrosCompletos.dataInicial || !filtrosCompletos.dataFinal) {
        console.warn('⚠️ Datas não definidas nos filtros');
        toast.error('Por favor, defina as datas inicial e final');
        return;
      }
      
      if (!filtrosCompletos.unidade && !isAdmin) {
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
      
      const extratosCarregados = await extratosService.buscarExtratos(filtrosCompletos);
      
      console.log(`✅ ${extratosCarregados.length} extratos carregados`);
      
      // Atualizar estado
      setExtratos(extratosCarregados);
      setEstatisticas(calcularEstatisticas(extratosCarregados));
      
    } catch (error) {
      console.error('❌ Erro ao carregar extratos:', error);
      toast.error('Erro ao carregar extratos. Por favor, tente novamente.');
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
    if (tipo === 'CREDIT' || tipo === 'RECEITA') return 'Receita';
    if (tipo === 'DEBIT' || tipo === 'DESPESA') return 'Despesa';
    return tipo;
  };

  const getTipoTransacaoColor = (extrato) => {
    const tipo = extrato.tipo || extrato.type;
    return tipo === 'CREDIT' || tipo === 'RECEITA' 
      ? 'text-green-600 bg-green-50' 
      : 'text-red-600 bg-red-50';
  };

  const getStatusColor = (extrato) => {
    // Se o extrato vier da planilha (tem observacoes), sempre será confirmado
    if (extrato.observacoes) {
      return 'bg-green-100 text-green-800';
    }

    const status = extrato.status;
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'EXCLUIDO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (extrato) => {
    // Se o extrato vier da planilha (tem observacoes), sempre será confirmado
    if (extrato.observacoes) {
      return 'Confirmado';
    }

    const status = extrato.status;
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmado';
      case 'PENDING':
        return 'Aguardando';
      case 'CANCELLED':
        return 'Cancelado';
      case 'EXCLUIDO':
        return 'Excluído';
      default:
        return 'Desconhecido';
    }
  };

  const calcularEstatisticas = (extratosList) => {
    // Filtrar lançamentos baseado no estado mostrarExcluidos
    const extratosFiltrados = extratosList.filter(extrato => {
      if (mostrarExcluidos) {
        // Se mostrarExcluidos está ativo, mostrar apenas os excluídos
        return extrato.status === 'EXCLUIDO';
      } else {
        // Se não, mostrar apenas os ativos (não excluídos)
        return extrato.status !== 'EXCLUIDO' && extrato.status !== 'CANCELLED';
      }
    });

    const stats = extratosFiltrados.reduce((acc, extrato) => {
      const valor = parseFloat(extrato.valor || extrato.value || 0);
      const tipo = extrato.tipo || extrato.type;

      if (tipo === 'CREDIT' || tipo === 'RECEITA') {
        acc.receitas += valor;
      } else if (tipo === 'DEBIT' || tipo === 'DESPESA') {
        acc.despesas += valor;
      }

      acc.transacoes++;
      return acc;
    }, {
      receitas: 0,
      despesas: 0,
      transacoes: 0
    });

    stats.saldo = stats.receitas - stats.despesas;
    return stats;
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
    if (!lancamentoId) {
      toast.error('ID do lançamento não encontrado');
      return;
    }

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

  const restaurarLancamento = async (lancamentoId) => {
    if (!lancamentoId) {
      toast.error('ID do lançamento não encontrado');
      return;
    }

    if (!window.confirm('Tem certeza que deseja restaurar este lançamento?')) {
      return;
    }

    try {
      console.log('🔄 Restaurando lançamento:', lancamentoId);
      await lancamentosService.restaurarLancamento(lancamentoId);
      toast.success('Lançamento restaurado com sucesso!');
      carregarExtratos(); // Recarregar lista
    } catch (error) {
      console.error('❌ Erro ao restaurar lançamento:', error);
      toast.error(`Erro ao restaurar lançamento: ${error.message}`);
    }
  };

  const isLancamentoManual = (extrato) => {
    // Verificar se é um lançamento manual (tem ID do Firebase)
    // Lançamentos da planilha não têm ID do Firebase
    const isManual = extrato.id && extrato.id.length > 0;
    
    // Log para debug
    if (isAdmin) {
      console.log('🔍 Verificando lançamento manual:', {
        id: extrato.id,
        descricao: extrato.descricao,
        isManual: isManual,
        status: extrato.status
      });
    }
    
    return isManual;
  };

  const editarLancamento = (extrato) => {
    console.log('✏️ Iniciando edição do lançamento:', extrato);
    
    // Converter tipo CREDIT/DEBIT para RECEITA/DESPESA
    const tipoConvertido = (extrato.tipo || extrato.type) === 'CREDIT' ? 'RECEITA' : 'DESPESA';
    
    // Preparar dados para edição
    const lancamentoFormatado = {
      id: extrato.id,
      tipo: tipoConvertido,
      valor: extrato.valor || extrato.value || 0,
      data: extrato.data || extrato.date,
      descricao: extrato.descricao || extrato.description || '',
      cliente: extrato.cliente || '',
      unidade: extrato.unidade || selectedUnit,
      formaPagamento: extrato.formaPagamento || '',
      status: extrato.status || 'CONFIRMED',
      origem: extrato.origem || 'MANUAL',
      fonte: extrato.fonte || 'firebase'
    };

    console.log('✏️ Dados formatados para edição:', lancamentoFormatado);
    setLancamentoParaEditar(lancamentoFormatado);
    setMostrarModalEdicao(true);
  };

  const handleEdicaoSucesso = () => {
    console.log('✅ Lançamento editado com sucesso, recarregando dados...');
    setMostrarModalEdicao(false);
    setLancamentoParaEditar(null);
    carregarExtratos();
    toast.success('Lançamento atualizado com sucesso!');
  };

  const agruparExtratosPorDia = (extratos) => {
    // Filtrar lançamentos baseado no estado mostrarExcluidos
    const extratosFiltrados = extratos.filter(extrato => {
      if (mostrarExcluidos) {
        // Se mostrarExcluidos está ativo, mostrar apenas os excluídos
        return extrato.status === 'EXCLUIDO';
      } else {
        // Se não, mostrar apenas os ativos (não excluídos)
        return extrato.status !== 'EXCLUIDO' && extrato.status !== 'CANCELLED';
      }
    });

    const grupos = {};
    
    extratosFiltrados.forEach(extrato => {
      const data = new Date(extrato.data || extrato.date);
      const dataKey = data.toISOString().split('T')[0];
      
      if (!grupos[dataKey]) {
        grupos[dataKey] = {
          data: data,
          extratos: [],
          totais: {
            receitas: 0,
            despesas: 0,
            saldo: 0
          }
        };
      }
      
      grupos[dataKey].extratos.push(extrato);
      
      // Atualizar totais do dia
      const valor = parseFloat(extrato.valor || extrato.value || 0);
      const tipo = extrato.tipo || extrato.type;
      if (tipo === 'CREDIT' || tipo === 'RECEITA') {
        grupos[dataKey].totais.receitas += valor;
      } else {
        grupos[dataKey].totais.despesas += valor;
      }
      grupos[dataKey].totais.saldo = grupos[dataKey].totais.receitas - grupos[dataKey].totais.despesas;
    });
    
    // Converter para array e ordenar por data
    return Object.values(grupos).sort((a, b) => b.data - a.data);
  };

  // Log para debug do status de admin
  console.log('👤 Status do usuário:', { isAdmin, userProfile });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho com título e botões de ação */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Extratos Financeiros</h1>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setMostrarModalReceita(true)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
              >
                <TrendingUp size={20} />
                Nova Receita
              </button>
              <button
                onClick={() => setMostrarModalDespesa(true)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
              >
                <TrendingDown size={20} />
                Nova Despesa
              </button>
            </>
          )}
          <button
            onClick={exportarCSV}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <FileSpreadsheet size={20} />
            Exportar CSV
          </button>
          {isAdmin && (
            <button
              onClick={() => setMostrarExcluidos(!mostrarExcluidos)}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                mostrarExcluidos 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              <Trash2 size={20} />
              {mostrarExcluidos ? 'Ocultar Excluídos' : 'Ver Excluídos'}
            </button>
          )}
        </div>
      </div>

      {/* Seletor de Unidade (se necessário) */}
      {shouldShowUnitSelector && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Database size={20} className="text-gray-500" />
            <span className="font-semibold">Unidade:</span>
          </div>
          <select
            value={selectedUnit}
            onChange={(e) => changeSelectedUnit(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {isAdmin && <option value="all">Geral</option>}
            {availableUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navegação de Competência */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
        <button
          onClick={() => navegarCompetencia('anterior')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-gray-500" />
          <span className="text-lg font-semibold">
            {formatarMes(competenciaAtual.mes, competenciaAtual.ano)}
          </span>
        </div>
        <button
          onClick={() => navegarCompetencia('proximo')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Filtro por Tipo de Transação */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={20} className="text-gray-500" />
          <span className="font-semibold">Filtrar por tipo:</span>
        </div>
        <select
          value={filtros.tipo}
          onChange={(e) => handleFiltroChange('tipo', e.target.value)}
          className="w-full p-2 border rounded"
        >
          {tiposTransacao.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </select>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {mostrarExcluidos ? 'Receitas Excluídas' : 'Total de Receitas'}
              </p>
              <p className="text-xl font-bold text-green-500">{formatCurrency(estatisticas.receitas)}</p>
            </div>
            <TrendingUp size={24} className="text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {mostrarExcluidos ? 'Despesas Excluídas' : 'Total de Despesas'}
              </p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(estatisticas.despesas)}</p>
            </div>
            <TrendingDown size={24} className="text-red-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {mostrarExcluidos ? 'Saldo Excluído' : 'Saldo'}
              </p>
              <p className={`text-xl font-bold ${estatisticas.saldo >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(estatisticas.saldo)}
              </p>
            </div>
            <BarChart3 size={24} className={estatisticas.saldo >= 0 ? 'text-green-500' : 'text-red-500'} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {mostrarExcluidos ? 'Transações Excluídas' : 'Total de Transações'}
              </p>
              <p className="text-xl font-bold text-blue-500">{estatisticas.transacoes}</p>
            </div>
            <Target size={24} className="text-blue-500" />
          </div>
        </div>
      </div>

      {/* Lista de Extratos */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
          </div>
        ) : extratos.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">
              {mostrarExcluidos 
                ? 'Nenhum lançamento excluído encontrado para o período selecionado.'
                : 'Nenhuma transação encontrada para o período selecionado.'
              }
            </p>
          </div>
        ) : (
          agruparExtratosPorDia(extratos).map((extratosData) => (
            <div key={extratosData.data.toISOString()} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{formatDate(extratosData.data)}</h3>
                  <div className="flex gap-4">
                    <span className="text-green-500">
                      + {formatCurrency(extratosData.totais.receitas)}
                    </span>
                    <span className="text-red-500">
                      - {formatCurrency(extratosData.totais.despesas)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Cliente</th>
                      <th className="px-4 py-2 text-left">Descrição</th>
                      <th className="px-4 py-2 text-left">Unidade</th>
                      <th className="px-4 py-2 text-left">Tipo</th>
                      <th className="px-4 py-2 text-right">Valor</th>
                      <th className="px-4 py-2 text-center">Status</th>
                      {isAdmin && <th className="px-4 py-2 text-center">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {extratosData.extratos.map(extrato => (
                      <tr key={extrato.id} className={`border-t hover:bg-gray-50 ${
                        extrato.status === 'EXCLUIDO' ? 'opacity-50 bg-gray-100' : ''
                      }`}>
                        <td className="px-4 py-2">{extrato.cliente || '-'}</td>
                        <td className="px-4 py-2">
                          {extrato.descricao || extrato.observacoes}
                          {extrato.status === 'EXCLUIDO' && (
                            <span className="ml-2 text-xs text-red-500">(EXCLUÍDO)</span>
                          )}
                        </td>
                        <td className="px-4 py-2">{extrato.unidade || '-'}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center gap-1 ${getTipoTransacaoColor(extrato)}`}>
                            {extrato.tipo === 'CREDIT' || extrato.tipo === 'RECEITA' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {getTipoTransacaoText(extrato)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className={extrato.tipo === 'CREDIT' || extrato.tipo === 'RECEITA' ? 'text-green-600' : 'text-gray-900'}>
                            {formatCurrency(extrato.valor)}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${getStatusColor(extrato)}`}>
                              {extrato.status === 'PENDING' ? (
                                <Clock size={16} />
                              ) : extrato.status === 'EXCLUIDO' ? (
                                <Trash2 size={16} />
                              ) : extrato.status === 'CANCELLED' ? (
                                <X size={16} />
                              ) : null}
                              {getStatusText(extrato)}
                            </span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-2">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => editarLancamento(extrato)}
                                className={`${extrato.status === 'EXCLUIDO' ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:text-blue-700'}`}
                                title={extrato.status === 'EXCLUIDO' ? 'Lançamento excluído' : 'Editar lançamento'}
                                disabled={extrato.status === 'EXCLUIDO'}
                              >
                                <Edit3 size={16} />
                              </button>
                              {isLancamentoManual(extrato) && extrato.status !== 'EXCLUIDO' && (
                                <button
                                  onClick={() => excluirLancamento(extrato.id)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Excluir lançamento"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                              {isLancamentoManual(extrato) && extrato.status === 'EXCLUIDO' && (
                                <button
                                  onClick={() => restaurarLancamento(extrato.id)}
                                  className="text-green-500 hover:text-green-700"
                                  title="Restaurar lançamento"
                                >
                                  <RefreshCw size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modais */}
      {mostrarModalReceita && (
        <ModalLancamento
          tipo="CREDIT"
          onClose={() => setMostrarModalReceita(false)}
          onSuccess={handleLancamentoSucesso}
        />
      )}
      {mostrarModalDespesa && (
        <ModalLancamento
          tipo="DEBIT"
          onClose={() => setMostrarModalDespesa(false)}
          onSuccess={handleLancamentoSucesso}
        />
      )}
      {mostrarModalEdicao && lancamentoParaEditar && (
        <ModalLancamento
          isOpen={mostrarModalEdicao}
          tipo={lancamentoParaEditar.tipo}
          lancamentoParaEditar={lancamentoParaEditar}
          modoEdicao={true}
          onClose={() => {
            setMostrarModalEdicao(false);
            setLancamentoParaEditar(null);
          }}
          onSucesso={handleEdicaoSucesso}
        />
      )}
    </div>
  );
}