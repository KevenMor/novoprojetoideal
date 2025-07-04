import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnitFilter } from '../contexts/UnitFilterContext';
import { 
  Trash2, 
  DollarSign, 
  RefreshCw,
  FileText,
  X,
  ChevronDown,
  CheckCircle,
  CreditCard,
  Filter,
  Clock,
  QrCode,
  Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import { contasBTGService } from '../services/contasBTGService';
import * as XLSX from 'xlsx';
import { normalizeUnitName } from '../utils/unitNormalizer';

export default function GestaoContasBTG() {
  const { isAdmin } = useAuth();
  const { selectedUnit } = useUnitFilter();
  
  // Debug logs
  console.log('🔍 GestaoContasBTG - selectedUnit:', selectedUnit);
  console.log('🔍 GestaoContasBTG - isAdmin:', isAdmin);
  
  const [loading, setLoading] = useState(true);
  const [contas, setContas] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [selecionadas, setSelecionadas] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [contaParaEditar, setContaParaEditar] = useState(null);
  const [filtros, setFiltros] = useState({
    unidade: '',  // Iniciar vazio para não filtrar por unidade inicialmente
    status: 'AGUARDANDO', // Sempre abrir com status aguardando
    tipo: '',
    dataInicial: '',
    dataFinal: ''
  });
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const processarLote = async () => {
      const loteString = localStorage.getItem('lotePagamentoFolha');
      if (loteString) {
        localStorage.removeItem('lotePagamentoFolha');
        setLoading(true);
        const { lote, tipo } = JSON.parse(loteString);
        console.log(`Lote de ${tipo} encontrado, processando...`);
        
        try {
          const promessas = lote.map(pagamento => {
            const dadosConta = {
              descricao: `Pagamento de ${tipo} para ${pagamento.nome}`,
              valor: pagamento.valor,
              unidade: pagamento.unidade,
              tipo: 'pix', // Assumindo que todos os pagamentos da folha são PIX
              vencimento: new Date(), // Vencimento hoje
              favorecido: pagamento.nome,
              cpfCnpjFavorecido: pagamento.cpf,
              chavePix: pagamento.chavePix,
              tipoChave: pagamento.tipoPix,
              status: 'AGUARDANDO',
            };
            return contasBTGService.criarConta(dadosConta);
          });

          await Promise.all(promessas);
          toast.success(`${lote.length} pagamentos processados com sucesso!`);
          
        } catch (error) {
          console.error("Erro ao processar lote de pagamentos:", error);
          toast.error("Falha ao processar o lote de pagamentos.");
        } finally {
          await carregarContas();
          setLoading(false);
        }
      } else {
        carregarContas();
      }
    };
    
    processarLote();
    setInitialLoad(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialLoad) {
      console.log('🔄 Effect triggered by filters/unit. Loading contas...');
      console.log('🔄 Current filtros:', filtros);
      console.log('🔄 Current selectedUnit:', selectedUnit);
      carregarContas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnit, filtros, initialLoad]);

  // Atualizar filtro de unidade para usar normalização ao filtrar contas
  const carregarContas = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando contas BTG com filtros:', filtros);
      console.log('🔄 selectedUnit:', selectedUnit);
      
      // Buscar todas as contas SEM filtro de unidade no backend
      let todasContas = await contasBTGService.listarContasBTG({
        ...filtros,
        unidade: undefined // Remove filtro de unidade do backend
      });
      console.log('✅ Contas carregadas (todas):', todasContas.length);

      // Filtrar por unidade usando normalização no frontend
      if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== 'Geral') {
        const unidadeFiltroNorm = normalizeUnitName(selectedUnit);
        todasContas = todasContas.filter(conta => normalizeUnitName(conta.unidade) === unidadeFiltroNorm);
      }

      // Garantir que todas as contas têm os campos necessários
      const contasNormalizadas = todasContas.map(conta => ({
        id: conta.id || '',
        descricao: conta.descricao || '',
        valor: Number(conta.valor || 0),
        status: conta.status || 'AGUARDANDO',
        tipo: conta.tipo || 'boleto',
        unidade: conta.unidade || '',
        vencimento: conta.vencimento || null,
        dataCriacao: conta.dataCriacao || null,
        dataPagamento: conta.dataPagamento || null,
        linhaDigitavel: conta.linhaDigitavel || '',
        chavePix: conta.chavePix || '',
        emailCriador: conta.emailCriador || '',
        favorecido: conta.favorecido || '',
        cpfCnpjFavorecido: conta.cpfCnpjFavorecido || '',
        tipoChave: conta.tipoChave || '',
        tipoConta: conta.tipoConta || ''
      }));

      setContas(contasNormalizadas);

      // Carregar estatísticas globais (sem filtros) para o dashboard
      await carregarEstatisticasGlobais();
    } catch (error) {
      console.error('❌ Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticasGlobais = async () => {
    try {
      // Buscar todas as contas para estatísticas (sem filtros)
      const todasContasParaEstatisticas = await contasBTGService.listarContasBTG({});
      
      const estatisticasCalculadas = {
        total: todasContasParaEstatisticas.length,
        totalAguardando: todasContasParaEstatisticas.filter(c => c.status === 'AGUARDANDO').length,
        totalPago: todasContasParaEstatisticas.filter(c => c.status === 'PAGO').length,
        totalCancelado: todasContasParaEstatisticas.filter(c => c.status === 'CANCELADO').length,
        valorAguardando: todasContasParaEstatisticas
          .filter(c => c.status === 'AGUARDANDO')
          .reduce((acc, curr) => acc + (curr.valor || 0), 0),
        valorPago: todasContasParaEstatisticas
          .filter(c => c.status === 'PAGO')
          .reduce((acc, curr) => acc + (curr.valor || 0), 0)
      };

      setEstatisticas(estatisticasCalculadas);
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
      // Não bloquear a interface se as estatísticas falharem
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    console.log('🔄 Filtro alterado:', name, value);
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
    // Os dados são carregados automaticamente através do useEffect
  };

  const formatarData = (data) => {
    if (!data) return '-';
    try {
      if (data instanceof Date) {
        return data.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
      return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
  };

  const formatarValor = (valor) => {
    if (typeof valor !== 'number') return 'R$ 0,00';
    try {
      return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    } catch (error) {
      console.error('Erro ao formatar valor:', error);
      return 'R$ 0,00';
    }
  };

  const formatarDataParaInput = (data) => {
    if (!data) return '';
    const d = new Date(data);
    const ano = d.getFullYear();
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const dia = d.getDate().toString().padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const handleSalvarEdicao = async (e) => {
    e.preventDefault();
    if (!contaParaEditar) return;

    try {
      setLoading(true);
      await contasBTGService.atualizarConta(contaParaEditar.id, contaParaEditar);
      toast.success('Conta atualizada com sucesso!');
      setShowEditModal(false);
      setContaParaEditar(null);
      await carregarContas();
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      toast.error('Erro ao salvar alterações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportarBTG = () => {
    // Verifica se há contas selecionadas
    if (selecionadas.length === 0) {
      toast.error('Selecione pelo menos uma conta para exportar');
      return;
    }

    // Filtra apenas as contas selecionadas
    const contasParaExportar = contas.filter(conta => selecionadas.includes(conta.id));

    // Cabeçalhos conforme os prints do usuário
    const headersTED = [
      'Banco do Favorecido', 'Agência do Favorecido', 'Conta do Favorecido', 'Tipo de Conta do Favorecido',
      'Nome / Razão Social do Favorecido', 'CPF/CNPJ do Favorecido', 'Tipo de Transferência', 'Valor',
      'Data de Pagamento (dd/mm/aaaa)', 'Descrição (Opcional)', 'Identificação Interna (Opcional)',
      'Agência de Origem', 'Conta de Origem'
    ];
    const headersPIX = [
      'Chave PIX ou Copia e Cola', 'Nome / Razão Social do Favorecido', 'CPF/CNPJ do Favorecido',
      'Valor', 'Data de Pagamento (dd/mm/aaaa)', 'Descrição (Opcional)', 'Identificação Interna (Opcional)',
      'Agência de Origem', 'Conta de Origem'
    ];
    const headersBOLETO = [
      'Código de Barras', 'Valor', 'Data de Pagamento (dd/mm/aaaa)', 'Identificação Interna (Opcional)',
      'Agência de Origem', 'Conta de Origem'
    ];

    // Data de exportação (hoje)
    const hoje = new Date();
    const dataPagamento = hoje.toLocaleDateString('pt-BR'); // DD/MM/AAAA

    // Função para formatar valor
    const formatValor = (valor) => {
      if (!valor) return '';
      return Number(valor).toFixed(2).replace(',', '.');
    };

    // Função para descrição
    const getDescricao = (conta) => {
      return `${conta.descricao} - ${conta.unidade}`;
    };

    // Função para agência/conta de origem
    const agenciaOrigem = '0050';
    const contaOrigem = '4278202';

    // TED (não implementado pois não há dados de TED, mas estrutura mantida)
    const tedRows = [headersTED];

    // PIX
    const pixRows = [headersPIX];
    contasParaExportar.filter(c => c.tipo === 'pix').forEach(conta => {
      let chavePix = conta.chavePix || '';
      const tipoChave = (conta.tipoChave || '').toLowerCase();
      if (tipoChave === 'cpf' || tipoChave === 'cnpj') {
        chavePix = chavePix.replace(/\D/g, '');
      } else if (tipoChave === 'celular' || tipoChave === 'telefone') {
        chavePix = chavePix.replace(/\D/g, '');
        if (chavePix.length === 11) {
          chavePix = `+55${chavePix}`;
        }
      }
      // Monta linha PIX
      pixRows.push([
        chavePix,
        conta.favorecido || '',
        conta.cpfCnpjFavorecido ? conta.cpfCnpjFavorecido.replace(/\D/g, '') : '',
        formatValor(conta.valor),
        dataPagamento,
        getDescricao(conta),
        '', // Identificação Interna (Opcional)
        agenciaOrigem,
        contaOrigem
      ]);
    });

    // BOLETO
    const boletoRows = [headersBOLETO];
    contasParaExportar.filter(c => c.tipo === 'boleto').forEach(conta => {
      let codigoBarras = conta.linhaDigitavel ? conta.linhaDigitavel.replace(/\D/g, '') : '';
      boletoRows.push([
        codigoBarras,
        formatValor(conta.valor),
        dataPagamento,
        getDescricao(conta),
        agenciaOrigem,
        contaOrigem
      ]);
    });

    // Cria as abas, forçando todas as células como texto
    const createSheetWithTextFormat = (rows) => {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = { c: C, r: R };
          const cell_ref = XLSX.utils.encode_cell(cell_address);
          if (ws[cell_ref]) {
            ws[cell_ref].t = 's'; // 's' para string (texto)
          }
        }
      }
      return ws;
    };

    const wsTED = createSheetWithTextFormat(tedRows);
    const wsPIX = createSheetWithTextFormat(pixRows);
    const wsBOLETO = createSheetWithTextFormat(boletoRows);

    // Monta o workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsTED, 'TED');
    XLSX.utils.book_append_sheet(wb, wsPIX, 'PIX');
    XLSX.utils.book_append_sheet(wb, wsBOLETO, 'BOLETO');

    // Contabiliza por tipo
    const pixCount = contasParaExportar.filter(c => c.tipo === 'pix').length;
    const boletoCount = contasParaExportar.filter(c => c.tipo === 'boleto').length;

    // Nome do arquivo com informação de quantas contas foram exportadas
    const nomeArquivo = `BTG_PAGAMENTOS_${contasParaExportar.length}_CONTAS_${hoje.toLocaleDateString('pt-BR').replace(/\//g, '_')}.xlsx`;

    // Gera o arquivo e faz download
    XLSX.writeFile(wb, nomeArquivo);
    toast.success(`Arquivo exportado com sucesso! ${contasParaExportar.length} contas exportadas (${pixCount} PIX, ${boletoCount} Boletos)`);
  };

  const darBaixaEmLote = async () => {
    if (!window.confirm(`Tem certeza que deseja dar baixa em ${selecionadas.length} contas?`)) {
      return;
    }

    try {
      setLoading(true);
      await contasBTGService.darBaixaEmLote(selecionadas);
      toast.success('Baixa em lote realizada com sucesso!');
      setSelecionadas([]);
      setShowBatchActions(false);
      await carregarContas();
    } catch (error) {
      console.error('Erro ao dar baixa em lote:', error);
      toast.error('Erro ao dar baixa em lote: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDarBaixaIndividual = async (contaId) => {
    if (!window.confirm('Tem certeza que deseja dar baixa nesta conta?')) {
      return;
    }

    try {
      await contasBTGService.darBaixaIndividual(contaId);
      toast.success('Baixa realizada com sucesso!');
      carregarContas();
    } catch (error) {
      console.error('Erro ao dar baixa:', error);
      toast.error('Erro ao dar baixa: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'AGUARDANDO': 'bg-yellow-100 text-yellow-800',
      'PAGO': 'bg-green-100 text-green-800',
      'CANCELADO': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const handleExcluirConta = async (contaId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) {
      return;
    }

    try {
      await contasBTGService.excluirConta(contaId);
      toast.success('Conta excluída com sucesso!');
      carregarContas();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta: ' + error.message);
    }
  };

  const handleEditarConta = (conta) => {
    setContaParaEditar({
      ...conta,
      vencimento: conta.vencimento ? formatarDataParaInput(conta.vencimento) : ''
    });
    setShowEditModal(true);
  };

  const handleExcluirEmLote = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir ${selecionadas.length} contas?`)) {
      return;
    }

    try {
      setLoading(true);
      await contasBTGService.excluirEmLote(selecionadas);
      toast.success('Contas excluídas com sucesso!');
      setSelecionadas([]);
      setShowBatchActions(false);
      await carregarContas();
    } catch (error) {
      console.error('Erro ao excluir em lote:', error);
      toast.error('Erro ao excluir em lote: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchAction = (action) => {
    switch (action) {
      case 'baixa':
        darBaixaEmLote();
        break;
      case 'excluir':
        handleExcluirEmLote();
        break;
      default:
        break;
    }
    setShowBatchActions(false);
  };

  // Função para calcular o valor total das contas selecionadas
  const calcularValorSelecionadas = () => {
    const contasSelecionadas = contas.filter(conta => selecionadas.includes(conta.id));
    return contasSelecionadas.reduce((total, conta) => total + (conta.valor || 0), 0);
  };

  return (
    <div className="page-container-xl">
      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Total</h3>
            <p className="text-xl sm:text-3xl font-bold text-gray-900">{estatisticas.total}</p>
          </div>
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
            <h3 className="text-sm sm:text-lg font-semibold text-yellow-700">Aguardando</h3>
            <p className="text-xl sm:text-3xl font-bold text-yellow-600">{estatisticas.totalAguardando}</p>
            <p className="text-xs sm:text-sm text-gray-500">{formatarValor(estatisticas.valorAguardando)}</p>
          </div>
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
            <h3 className="text-sm sm:text-lg font-semibold text-green-700">Pagas</h3>
            <p className="text-xl sm:text-3xl font-bold text-green-600">{estatisticas.totalPago}</p>
            <p className="text-xs sm:text-sm text-gray-500">{formatarValor(estatisticas.valorPago)}</p>
          </div>
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
            <h3 className="text-sm sm:text-lg font-semibold text-red-700">Canceladas</h3>
            <p className="text-xl sm:text-3xl font-bold text-red-600">{estatisticas.totalCancelado}</p>
          </div>
        </div>
      )}

      {/* Header section with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Gestão de Contas BTG</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Batch actions dropdown - only show when items are selected */}
          {selecionadas.length > 0 && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowBatchActions(!showBatchActions)}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm sm:text-base touch-manipulation"
                >
                  Ações em Lote ({selecionadas.length})
                  <ChevronDown size={16} />
                </button>
                
                {showBatchActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
                    <div className="py-1">
                      <button
                        onClick={() => handleBatchAction('baixa')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Dar Baixa
                      </button>
                      <button
                        onClick={() => handleBatchAction('excluir')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Valor total das contas selecionadas */}
              <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2 flex items-center gap-2">
                <DollarSign size={16} className="text-green-600" />
                <span className="text-green-800 font-semibold">
                  Total Selecionado: {formatarValor(calcularValorSelecionadas())}
                </span>
              </div>
            </>
          )}
          
          {/* Export BTG button */}
          <button
            onClick={handleExportarBTG}
            disabled={selecionadas.length === 0}
            className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base touch-manipulation ${
              selecionadas.length === 0 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            title={selecionadas.length === 0 ? 'Selecione contas para exportar' : `Exportar ${selecionadas.length} conta(s) selecionada(s)`}
          >
            <CreditCard size={16} />
            <span className="hidden sm:inline">
              {selecionadas.length === 0 
                ? 'Exportar BTG' 
                : `Exportar ${selecionadas.length} conta(s)`
              }
            </span>
            <span className="sm:hidden">
              {selecionadas.length === 0 ? 'Exportar' : `${selecionadas.length} item(s)`}
            </span>
          </button>

          {/* Refresh button */}
          <button
            onClick={carregarContas}
            className="bg-gray-600 text-white p-2 sm:p-2 rounded-lg hover:bg-gray-700 transition-colors touch-manipulation"
            title="Atualizar lista"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 mb-6 sm:mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Filtros de Pesquisa</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-8">
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Status
              </label>
              <select
                name="status"
                value={filtros.status}
                onChange={handleFiltroChange}
                className="w-full h-12 sm:h-14 px-3 sm:px-4 rounded-lg border-2 border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base touch-manipulation"
              >
                <option value="">Todos os status</option>
                <option value="AGUARDANDO">⏳ Aguardando</option>
                <option value="PAGO">✅ Pago</option>
                <option value="CANCELADO">❌ Cancelado</option>
              </select>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Tipo
              </label>
              <select
                name="tipo"
                value={filtros.tipo}
                onChange={handleFiltroChange}
                className="w-full h-12 sm:h-14 px-3 sm:px-4 rounded-lg border-2 border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base touch-manipulation"
              >
                <option value="">Todos os tipos</option>
                <option value="boleto">📄 Boleto</option>
                <option value="pix">💳 PIX</option>
              </select>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Data Inicial
              </label>
              <input
                type="date"
                name="dataInicial"
                value={filtros.dataInicial}
                onChange={handleFiltroChange}
                className="w-full h-12 sm:h-14 px-3 sm:px-4 rounded-lg border-2 border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base touch-manipulation"
              />
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Data Final
              </label>
              <input
                type="date"
                name="dataFinal"
                value={filtros.dataFinal}
                onChange={handleFiltroChange}
                className="w-full h-12 sm:h-14 px-3 sm:px-4 rounded-lg border-2 border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base touch-manipulation"
              />
            </div>

            <div className="space-y-2 sm:space-y-3 col-span-1 sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 invisible">Ações</label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={carregarContas}
                  className="flex-1 h-12 sm:h-14 bg-blue-600 text-white px-4 sm:px-6 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 sm:gap-3 font-semibold text-sm sm:text-base transition-colors touch-manipulation"
                >
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                  Atualizar Lista
                </button>
                <button
                  onClick={() => {
                    setFiltros({
                      unidade: '',
                      status: '',
                      tipo: '',
                      dataInicial: '',
                      dataFinal: ''
                    });
                    console.log('🔄 Filtros limpos');
                  }}
                  className="flex-1 h-12 sm:h-14 bg-gray-600 text-white px-4 sm:px-6 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 sm:gap-3 font-semibold text-sm sm:text-base transition-colors touch-manipulation"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de resumo das seleções - só aparece quando há itens selecionados */}
        {selecionadas.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-blue-800 font-medium">
                  {selecionadas.length} {selecionadas.length === 1 ? 'conta selecionada' : 'contas selecionadas'}
                </span>
                <span className="text-blue-600 font-semibold">
                  Valor total: {formatarValor(calcularValorSelecionadas())}
                </span>
              </div>
              <button
                onClick={() => setSelecionadas([])}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Limpar seleção
              </button>
            </div>
          </div>
        )}

        <div className="table-container">
          {/* Versão Desktop - Tabela */}
          <div className="table-scroll hidden md:block">
            <table className="w-full min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={contas.length > 0 && selecionadas.length === contas.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelecionadas(contas.map(c => c.id));
                      } else {
                        setSelecionadas([]);
                      }
                      setShowBatchActions(false);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Carregando contas...
                    </div>
                  </td>
                </tr>
              ) : contas.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <CreditCard className="w-12 h-12 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Nenhuma conta encontrada</p>
                      <p className="text-sm text-gray-400">
                        {filtros.status || filtros.unidade || filtros.tipo || filtros.dataInicial || filtros.dataFinal
                          ? 'Tente ajustar os filtros para ver mais resultados'
                          : 'Cadastre a primeira conta BTG para começar'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                contas.map((conta) => (
                  <tr key={conta.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selecionadas.includes(conta.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelecionadas([...selecionadas, conta.id]);
                          } else {
                            setSelecionadas(selecionadas.filter(id => id !== conta.id));
                          }
                          setShowBatchActions(false);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{conta.descricao}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{formatarValor(conta.valor)}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(conta.status)}`}>
                        {conta.status === 'AGUARDANDO' && <Clock className="w-3 h-3 mr-1" />}
                        {conta.status === 'PAGO' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {conta.status === 'CANCELADO' && <X className="w-3 h-3 mr-1" />}
                        {conta.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{formatarData(conta.vencimento)}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{formatarData(conta.dataPagamento) || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      <span className="inline-flex items-center">
                        {conta.tipo === 'boleto' ? (
                          <FileText className="w-4 h-4 mr-1 text-gray-500" />
                        ) : (
                          <QrCode className="w-4 h-4 mr-1 text-gray-500" />
                        )}
                        {conta.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{conta.unidade}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        {conta.status === 'AGUARDANDO' && (
                          <button
                            onClick={() => handleDarBaixaIndividual(conta.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Dar baixa"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditarConta(conta)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExcluirConta(conta.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>

          {/* Versão Mobile - Cards */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                <span className="text-gray-500">Carregando contas...</span>
              </div>
            ) : contas.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CreditCard className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">Nenhuma conta encontrada</p>
                <p className="text-sm text-gray-400 mt-2">
                  {filtros.status || filtros.unidade || filtros.tipo || filtros.dataInicial || filtros.dataFinal
                    ? 'Tente ajustar os filtros para ver mais resultados'
                    : 'Cadastre a primeira conta BTG para começar'
                  }
                </p>
              </div>
            ) : (
              contas.map((conta) => (
                <div key={conta.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  {/* Header do card */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selecionadas.includes(conta.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelecionadas([...selecionadas, conta.id]);
                          } else {
                            setSelecionadas(selecionadas.filter(id => id !== conta.id));
                          }
                          setShowBatchActions(false);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(conta.status)}`}>
                        {conta.status === 'AGUARDANDO' && <Clock className="w-3 h-3 mr-1" />}
                        {conta.status === 'PAGO' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {conta.status === 'CANCELADO' && <X className="w-3 h-3 mr-1" />}
                        {conta.status}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{formatarValor(conta.valor)}</span>
                  </div>

                  {/* Informações principais */}
                  <div className="space-y-2 mb-3">
                    <div>
                      <span className="text-xs text-gray-500">Descrição:</span>
                      <p className="text-sm font-medium text-gray-900">{conta.descricao}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-gray-500">Tipo:</span>
                        <div className="flex items-center">
                          {conta.tipo === 'boleto' ? (
                            <FileText className="w-4 h-4 mr-1 text-gray-500" />
                          ) : (
                            <QrCode className="w-4 h-4 mr-1 text-gray-500" />
                          )}
                          <span className="font-medium">{conta.tipo}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Unidade:</span>
                        <p className="font-medium">{conta.unidade}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-gray-500">Vencimento:</span>
                        <p className="font-medium">{formatarData(conta.vencimento)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Pagamento:</span>
                        <p className="font-medium">{formatarData(conta.dataPagamento) || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
                    {conta.status === 'AGUARDANDO' && (
                      <button
                        onClick={() => handleDarBaixaIndividual(conta.id)}
                        className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors touch-manipulation"
                        title="Dar baixa"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditarConta(conta)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors touch-manipulation"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleExcluirConta(conta.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors touch-manipulation"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {showEditModal && contaParaEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-4 sm:p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Editar Conta</h2>
            <form onSubmit={handleSalvarEdicao}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <input
                    type="text"
                    value={contaParaEditar.descricao}
                    onChange={(e) => setContaParaEditar({ ...contaParaEditar, descricao: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={contaParaEditar.valor}
                    onChange={(e) => setContaParaEditar({ ...contaParaEditar, valor: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full pl-20 rounded-md border-gray-300 shadow-sm"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vencimento</label>
                  <input
                    type="date"
                    value={contaParaEditar.vencimento}
                    onChange={(e) => setContaParaEditar({ ...contaParaEditar, vencimento: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={contaParaEditar.status}
                    onChange={(e) => setContaParaEditar({ ...contaParaEditar, status: e.target.value })}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="AGUARDANDO">Aguardando</option>
                    <option value="PAGO">Pago</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Categoria e Forma de Pagamento da Baixa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoria</label>
                  <select
                    value={contaParaEditar.categoria || 'CONTA_BTG'}
                    onChange={(e) => setContaParaEditar({ ...contaParaEditar, categoria: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="CONTA_BTG">Conta BTG</option>
                    <option value="COMBUSTIVEL">Combustível</option>
                    <option value="MANUTENCAO">Manutenção</option>
                    <option value="SALARIO">Salário</option>
                    <option value="ALUGUEL">Aluguel</option>
                    <option value="CONTA">Contas (Luz, Água, etc.)</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Forma de Pagamento da Baixa</label>
                  <select
                    value={contaParaEditar.formaPagamentoBaixa || 'DINHEIRO'}
                    onChange={(e) => setContaParaEditar({ ...contaParaEditar, formaPagamentoBaixa: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                    <option value="BOLETO">Boleto</option>
                    <option value="BANCO_BTG">Banco BTG</option>
                  </select>
                </div>
              </div>

              {/* Campos específicos de tipo */}
              {contaParaEditar.tipo === 'boleto' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Linha Digitável</label>
                  <input
                    type="text"
                    value={contaParaEditar.linhaDigitavel}
                    onChange={(e) => setContaParaEditar({ ...contaParaEditar, linhaDigitavel: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
              )}
              {contaParaEditar.tipo === 'pix' && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700">Chave PIX</label>
                    <input
                      type="text"
                      value={contaParaEditar.chavePix}
                      onChange={(e) => setContaParaEditar({ ...contaParaEditar, chavePix: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700">Favorecido</label>
                    <input
                      type="text"
                      value={contaParaEditar.favorecido}
                      onChange={(e) => setContaParaEditar({ ...contaParaEditar, favorecido: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 