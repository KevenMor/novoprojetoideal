import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnitFilter } from '../contexts/UnitFilterContext';
import { 
  Search, 
  Download, 
  Filter, 
  CheckCircle, 
  Clock, 
  X, 
  Trash2, 
  RefreshCw,
  Edit,
  FileText,
  QrCode,
  DollarSign,
  ChevronDown,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { contasBTGService } from '../services/contasBTGService';
import * as XLSX from 'xlsx';

export default function GestaoContasBTG() {
  const { isAdmin } = useAuth();
  const { selectedUnit } = useUnitFilter();
  const [loading, setLoading] = useState(true);
  const [contas, setContas] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [selecionadas, setSelecionadas] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [contaParaEditar, setContaParaEditar] = useState(null);
  const [filtros, setFiltros] = useState({
    unidade: selectedUnit || '',
    status: '',
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
  }, []);

  useEffect(() => {
    if (!initialLoad) {
      console.log('🔄 Effect triggered by filters/unit. Loading contas...');
      carregarContas();
    }
  }, [selectedUnit, filtros]);

  const carregarContas = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando contas BTG com filtros:', filtros);
      
      // Carregar todas as contas
      const todasContas = await contasBTGService.buscarContas();
      console.log('✅ Todas as contas carregadas:', todasContas);

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

      console.log('✅ Contas normalizadas:', contasNormalizadas);
      setContas(contasNormalizadas);

      // Calcular estatísticas
      const estatisticasCalculadas = {
        total: contasNormalizadas.length,
        totalAguardando: contasNormalizadas.filter(c => c.status === 'AGUARDANDO').length,
        totalPago: contasNormalizadas.filter(c => c.status === 'PAGO').length,
        totalCancelado: contasNormalizadas.filter(c => c.status === 'CANCELADO').length,
        valorAguardando: contasNormalizadas
          .filter(c => c.status === 'AGUARDANDO')
          .reduce((acc, curr) => acc + (curr.valor || 0), 0),
        valorPago: contasNormalizadas
          .filter(c => c.status === 'PAGO')
          .reduce((acc, curr) => acc + (curr.valor || 0), 0)
      };

      console.log('📊 Estatísticas calculadas:', estatisticasCalculadas);
      setEstatisticas(estatisticasCalculadas);
    } catch (error) {
      console.error('❌ Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    console.log('🔄 Filtro alterado:', name, value);
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
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
    const hoje = new Date();
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
    <div className="container mx-auto px-4 py-8">
      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total de Contas</h3>
            <p className="text-3xl font-bold text-gray-900">{estatisticas.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-yellow-700">Aguardando</h3>
            <p className="text-3xl font-bold text-yellow-600">{estatisticas.totalAguardando}</p>
            <p className="text-sm text-gray-500">{formatarValor(estatisticas.valorAguardando)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-green-700">Pagas</h3>
            <p className="text-3xl font-bold text-green-600">{estatisticas.totalPago}</p>
            <p className="text-sm text-gray-500">{formatarValor(estatisticas.valorPago)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-red-700">Canceladas</h3>
            <p className="text-3xl font-bold text-red-600">{estatisticas.totalCancelado}</p>
          </div>
        </div>
      )}

      {/* Header section with actions */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestão de Contas BTG</h1>
        <div className="flex items-center gap-4">
          {/* Batch actions dropdown - only show when items are selected */}
          {selecionadas.length > 0 && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowBatchActions(!showBatchActions)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
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
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              selecionadas.length === 0 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            title={selecionadas.length === 0 ? 'Selecione contas para exportar' : `Exportar ${selecionadas.length} conta(s) selecionada(s)`}
          >
            <CreditCard size={16} />
            {selecionadas.length === 0 
              ? 'Exportar BTG' 
              : `Exportar ${selecionadas.length} conta(s)`
            }
          </button>

          {/* Refresh button */}
          <button
            onClick={carregarContas}
            className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={filtros.status}
                onChange={handleFiltroChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Todos</option>
                <option value="AGUARDANDO">Aguardando</option>
                <option value="PAGO">Pago</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                name="tipo"
                value={filtros.tipo}
                onChange={handleFiltroChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Todos</option>
                <option value="boleto">Boleto</option>
                <option value="pix">PIX</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                name="dataInicial"
                value={filtros.dataInicial}
                onChange={handleFiltroChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                name="dataFinal"
                value={filtros.dataFinal}
                onChange={handleFiltroChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={carregarContas}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </button>
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

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
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
              {contas.map((conta) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição */}
      {showEditModal && contaParaEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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