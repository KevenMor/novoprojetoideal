import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnitFilter } from '../contexts/UnitFilterContext';
// import UnitSelector from '../components/UnitSelector'; // Não usado atualmente
import ModalLancamento from '../components/ModalLancamento';
import { Filter, Download, RefreshCw, Database, BarChart3, TrendingUp, TrendingDown, FileSpreadsheet, Target, CheckCircle, Trash2, Clock, X, Edit3, Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { extratosService } from '../services/extratosService';
import { lancamentosService } from '../services/lancamentosService';
import { formatCurrency, formatDate } from '../services/asaasService';
import toast from 'react-hot-toast';

// Helpers para padronizar a identificação de transações
const isReceita = (extrato) => {
  if (!extrato) return false;
  const tipo = extrato.tipo || extrato.type;
  // Compara em minúsculas para robustez
  return String(tipo).toLowerCase() === 'credit' || String(tipo).toLowerCase() === 'receita';
};

const isDespesa = (extrato) => {
  if (!extrato) return false;
  const tipo = extrato.tipo || extrato.type;
  // Compara em minúsculas para robustez
  return String(tipo).toLowerCase() === 'debit' || String(tipo).toLowerCase() === 'despesa';
};

export default function Extratos() {
  const { user, isAdmin } = useAuth();
  const { 
    selectedUnit, 
    availableUnits, 
    changeSelectedUnit, 
    // getSelectedUnitDisplay, // Não usado atualmente
    hasMultipleUnits,
    shouldShowUnitData
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

  // Estados para ações em lote
  const [selecionados, setSelecionados] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [novoStatus, setNovoStatus] = useState('');
  const [novaUnidade, setNovaUnidade] = useState('');

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

  const formatarDataCompleta = (dataString) => {
    const data = new Date(dataString);
    data.setDate(data.getDate() + 1); // Corrige fuso horário
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(data);
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
      console.log('👤 Perfil do usuário:', user);
      console.log('🏢 Unidade selecionada:', selectedUnit);
      console.log('📋 Filtros atuais:', filtros);
      
      const filtrosCompletos = {
        ...filtros,
        unidade: selectedUnit === 'all' ? 'all' : (filtros.unidade || selectedUnit || user?.unidades?.[0])
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
      
      let extratosCarregados = await extratosService.buscarExtratos(filtrosCompletos);
      
      console.log(`📊 [EXTRATOS] ${extratosCarregados.length} extratos carregados para ${filtrosCompletos.unidade || 'todas as unidades'}`);

      // Filtra os excluídos, a menos que "mostrarExcluidos" seja verdadeiro
      const extratosFiltrados = extratosCarregados.filter(extrato => {
        const status = String(extrato.status || '').toLowerCase();
        return mostrarExcluidos ? true : (status !== 'excluido' && status !== 'deleted');
      });
      
      // Atualizar estado
      setExtratos(extratosFiltrados);
      setEstatisticas(calcularEstatisticas(extratosFiltrados));
      
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
    if (isReceita(extrato)) return 'Receita';
    if (isDespesa(extrato)) return 'Despesa';
    return 'N/A';
  };

  const getTipoTransacaoColor = (extrato) => {
    const tipo = extrato.tipo || extrato.type;
    return tipo === 'CREDIT' || tipo === 'RECEITA' 
      ? 'text-green-600 bg-green-50' 
      : 'text-red-600 bg-red-50';
  };

  const getStatusColor = (extrato) => {
    if (!extrato) return 'bg-gray-100 text-gray-800';
    
    let status = extrato.status ? String(extrato.status).toLowerCase() : '';
    
    if (!status && isReceita(extrato)) {
      status = 'confirmado';
    }

    switch (status) {
      case 'pago':
      case 'recebido':
      case 'concluido':
      case 'confirmado':
        return 'bg-green-100 text-green-800';
      case 'pendente':
      case 'aguardando':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencido':
        return 'bg-orange-100 text-orange-800';
      case 'cancelado':
        return 'bg-gray-400 text-white';
      case 'excluido':
      case 'deleted':
        return 'bg-red-200 text-red-800 font-bold';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (extrato) => {
    if (!extrato) return 'N/A';
    
    if (!extrato.status && isReceita(extrato)) {
      return 'Confirmado';
    }

    const status = extrato.status ? String(extrato.status).toLowerCase() : '';

    switch (status) {
      case 'pago':
      case 'recebido':
      case 'concluido':
      case 'confirmado':
        return 'Confirmado';
      case 'pendente':
      case 'aguardando':
        return 'Aguardando';
      case 'vencido':
        return 'Vencido';
      case 'cancelado':
        return 'Cancelado';
      case 'excluido':
      case 'deleted':
        return 'Deletado';
      default:
        // Retorna o status original se não for reconhecido, ou N/A
        return extrato.status ? extrato.status.charAt(0).toUpperCase() + extrato.status.slice(1) : 'N/A';
    }
  };

  const calcularEstatisticas = (extratosList) => {
    // Filtra transações que não estão excluídas para o cálculo dos cards
    const transacoesAtivas = extratosList.filter(e => {
        const status = String(e.status || '').toLowerCase();
        return status !== 'excluido' && status !== 'deleted';
    });

    const receitas = transacoesAtivas
      .filter(e => isReceita(e))
      .reduce((acc, curr) => acc + (curr.valor || curr.value || 0), 0);
  
    const despesas = transacoesAtivas
      .filter(e => isDespesa(e))
      .reduce((acc, curr) => acc + (curr.valor || curr.value || 0), 0);
  
    const saldo = receitas - despesas;
    const transacoes = transacoesAtivas.length;

    console.log('🎯 [EXTRATOS] Saldo calculado:', {
      receitas: `R$ ${receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      despesas: `R$ ${despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      saldo: `R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      transacoes
    });
  
    return { receitas, despesas, saldo, transacoes };
  };

  const handleFiltroChange = (campo, valor) => {
    console.log(`[Filtro] Campo '${campo}' alterado para:`, valor);
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
    toast.promise(
      lancamentosService.restaurarLancamento(lancamentoId),
      {
        loading: 'Restaurando lançamento...',
        success: () => {
          carregarExtratos();
          return 'Lançamento restaurado com sucesso!';
        },
        error: (err) => {
          console.error("Erro ao restaurar lançamento:", err);
          return err.message || 'Falha ao restaurar lançamento.';
        }
      }
    );
  };

  // Função para alternar a exibição de excluídos
  const toggleMostrarExcluidos = () => {
    setMostrarExcluidos(prev => !prev);
  };

  // Recarregar extratos quando 'mostrarExcluidos' mudar
  useEffect(() => {
    carregarExtratos();
  }, [mostrarExcluidos]);

  const isLancamentoManual = (extrato) => {
    return extrato && extrato.origem === 'manual';
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
    const grupos = {};
    
    extratos.forEach(extrato => {
      // Normalização segura da data
      let data;
      if (extrato.data?.toDate) { // Se for um Timestamp do Firebase
        data = extrato.data.toDate();
      } else if (extrato.data || extrato.date) { // Se for string ou Date
        data = new Date(extrato.data || extrato.date);
      }

      // Pular este extrato se a data for inválida
      if (!data || isNaN(data.getTime())) {
        console.warn('Extrato com data inválida pulado:', extrato);
        return;
      }

      const dataKey = data.toISOString().split('T')[0];
      
      if (!grupos[dataKey]) {
        grupos[dataKey] = {
          data: data,
          extratos: [],
          saldoDia: 0
        };
      }
      
      grupos[dataKey].extratos.push(extrato);
      
      // Atualizar saldo do dia
      const valor = parseFloat(extrato.valor || extrato.value || 0);
      const tipo = extrato.tipo || extrato.type;
      if (tipo === 'CREDIT' || tipo === 'RECEITA') {
        grupos[dataKey].saldoDia += valor;
      } else {
        grupos[dataKey].saldoDia -= valor;
      }
    });
    
    return grupos;
  };

  const handleBatchDelete = async () => {
    if (window.confirm(`Tem certeza de que deseja excluir ${selecionados.length} lançamentos?`)) {
      try {
        setLoading(true);
        await extratosService.excluirEmLote(selecionados);
        toast.success('Lançamentos excluídos com sucesso!');
        setSelecionados([]);
        await carregarExtratos();
      } catch (error) {
        toast.error(`Erro ao excluir em lote: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBatchStatusChange = async () => {
    if (!novoStatus) {
      toast.error('Por favor, selecione um novo status.');
      return;
    }
    try {
      setLoading(true);
      await extratosService.alterarStatusEmLote(selecionados, novoStatus);
      toast.success('Status dos lançamentos alterado com sucesso!');
      setShowStatusModal(false);
      setSelecionados([]);
      await carregarExtratos();
    } catch (error) {
      toast.error(`Erro ao alterar status em lote: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUnitChange = async () => {
    if (!novaUnidade) {
      toast.error('Por favor, selecione uma nova unidade.');
      return;
    }
    try {
      setLoading(true);
      await extratosService.alterarUnidadeEmLote(selecionados, novaUnidade);
      toast.success('Unidade dos lançamentos alterada com sucesso!');
      setShowUnitModal(false);
      setSelecionados([]);
      await carregarExtratos();
    } catch (error) {
      toast.error(`Erro ao alterar unidade em lote: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Log para debug do status de admin
  console.log('👤 Status do usuário:', { isAdmin, user });

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
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <FileSpreadsheet size={16} />
            Exportar
          </button>
          
          {/* Ações em Lote Dropdown */}
          {selecionados.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBatchActions(!showBatchActions)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                Ações em Lote ({selecionados.length})
                <ChevronDown size={16} />
              </button>
              {showBatchActions && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 border">
                  <ul className="py-1">
                    <li
                      onClick={() => { setShowStatusModal(true); setShowBatchActions(false); }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    >
                      <Edit3 size={16} /> Alterar Status
                    </li>
                    <li
                      onClick={() => { setShowUnitModal(true); setShowBatchActions(false); }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    >
                      <Target size={16} /> Alterar Unidade
                    </li>
                    <li
                      onClick={() => { handleBatchDelete(); setShowBatchActions(false); }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600 flex items-center gap-2"
                    >
                      <Trash2 size={16} /> Excluir Lançamentos
                    </li>
                  </ul>
                </div>
              )}
            </div>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 mb-6 p-4 bg-white rounded-lg shadow">
        {/* Controles de navegação de competência */}
        <div className="flex items-center justify-center space-x-2">
          <button onClick={() => navegarCompetencia('anterior')} className="p-2 rounded-md hover:bg-gray-100 transition-colors">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <span className="text-lg font-semibold text-gray-700 w-48 text-center">
            {formatarMes(competenciaAtual.mes, competenciaAtual.ano)}
          </span>
          <button onClick={() => navegarCompetencia('proxima')} className="p-2 rounded-md hover:bg-gray-100 transition-colors">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Filtros e Ações */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button 
            onClick={carregarExtratos}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </button>
          <button
            onClick={toggleMostrarExcluidos}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors shadow ${
              mostrarExcluidos
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white text-gray-700 hover:bg-gray-100 border'
            }`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {mostrarExcluidos ? 'Ocultar Excluídos' : 'Mostrar Excluídos'}
          </button>
          <div className="relative">
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
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
          Object.entries(agruparExtratosPorDia(extratos)).map(([dia, grupo]) => (
            <div key={dia} className="mb-6">
              <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700 rounded-t-lg">
                {formatarDataCompleta(dia)} - Saldo do dia: {formatCurrency(grupo.saldoDia)}
              </div>
              <div className="bg-white rounded-b-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-8 px-4 py-2">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelecionados(extratos.map(ext => ext.id));
                            } else {
                              setSelecionados([]);
                            }
                          }}
                          checked={selecionados.length === extratos.length && extratos.length > 0}
                        />
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {grupo.extratos.map(extrato => (
                      <tr key={extrato.id} className={`hover:bg-gray-50 ${extrato.status === 'DELETED' ? 'bg-red-50 opacity-60' : ''}`}>
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selecionados.includes(extrato.id)}
                            onChange={() => {
                              setSelecionados(prev => 
                                prev.includes(extrato.id)
                                  ? prev.filter(id => id !== extrato.id)
                                  : [...prev, extrato.id]
                              );
                            }}
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">{extrato.descricao || extrato.description}</td>
                        <td className={`px-4 py-2 text-sm font-semibold ${getTipoTransacaoColor(extrato)}`}>
                          {formatCurrency(extrato.valor || extrato.value)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{getTipoTransacaoText(extrato)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(extrato)}`}>
                            {getStatusText(extrato)}
                          </span>
                        </td>
                         <td className="px-4 py-2 text-sm text-gray-500">{extrato.unidade}</td>
                        <td className="px-4 py-2 text-sm">
                          {extrato.status === 'DELETED' ? (
                            <button onClick={() => restaurarLancamento(extrato.id)} className="text-blue-600 hover:text-blue-800">
                              Restaurar
                            </button>
                          ) : (
                            <div className="flex items-center space-x-2">
                              {isLancamentoManual(extrato) && (
                                <button onClick={() => editarLancamento(extrato)} className="text-blue-600 hover:text-blue-800">
                                  <Edit3 size={16} />
                                </button>
                              )}
                              <button onClick={() => excluirLancamento(extrato.id)} className="text-red-600 hover:text-red-800">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
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

      {/* Modais de Ações em Lote */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold mb-4">Alterar Status em Lote</h3>
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione o status</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="PENDING">Pendente</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowStatusModal(false)} className="mr-2 px-4 py-2 rounded bg-gray-200">Cancelar</button>
              <button onClick={handleBatchStatusChange} className="px-4 py-2 rounded bg-blue-600 text-white">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {showUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold mb-4">Alterar Unidade em Lote</h3>
            <select
              value={novaUnidade}
              onChange={(e) => setNovaUnidade(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione a unidade</option>
              {availableUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowUnitModal(false)} className="mr-2 px-4 py-2 rounded bg-gray-200">Cancelar</button>
              <button onClick={handleBatchUnitChange} className="px-4 py-2 rounded bg-blue-600 text-white">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}