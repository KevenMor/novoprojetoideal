import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnitSelection } from '../hooks/useUnitSelection';
import { 
  CreditCard, 
  Eye, 
  CheckCircle, 
  Clock, 
  X, 
  Trash2, 
  Filter,
  RefreshCw,
  Building2,
  Target,
  Calendar
} from 'lucide-react';
import { contasBTGService } from '../services/contasBTGService';
import { formatCurrency, formatDate } from '../services/asaasService';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function HistoricoContasBTG() {
  const { isAdmin } = useAuth();
  const { 
    selectedUnit, 
    availableUnits, 
    handleUnitChange, 
    getUnitDisplayName, 
    shouldShowUnitSelector 
  } = useUnitSelection();
  
  const [loading, setLoading] = useState(false);
  const [contas, setContas] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [filtros, setFiltros] = useState({
    unidade: selectedUnit || '',
    status: '',
    tipo: '',
    dataInicial: '',
    dataFinal: ''
  });
  const [selecionadas, setSelecionadas] = useState([]);

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'AGUARDANDO', label: '⏳ Aguardando Pagamento' },
    { value: 'PAGO', label: '✅ Pago' },
    { value: 'CANCELADO', label: '❌ Cancelado' }
  ];

  const tipoOptions = [
    { value: '', label: 'Todos os tipos' },
    { value: 'boleto', label: '📄 Boleto' },
    { value: 'pix', label: '💳 PIX' }
  ];

  const carregarContas = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔄 Carregando histórico de contas BTG...');
      const contasCarregadas = await contasBTGService.buscarContas(filtros);
      console.log(`✅ ${contasCarregadas.length} contas carregadas`);
      setContas(contasCarregadas);
      
      // Carregar estatísticas
      const estatisticasCarregadas = await contasBTGService.buscarEstatisticas(filtros);
      setEstatisticas(estatisticasCarregadas);
    } catch (error) {
      console.error('❌ Erro ao carregar contas:', error);
      toast.error(`Erro ao carregar contas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    if (availableUnits.length > 0) {
      carregarContas();
    }
  }, [availableUnits, filtros, carregarContas]);

  const alterarStatus = async (contaId, novoStatus) => {
    try {
      console.log(`🔄 Alterando status da conta ${contaId} para ${novoStatus}`);
      await contasBTGService.alterarStatus(contaId, novoStatus);
      toast.success('Status alterado com sucesso!');
      carregarContas(); // Recarregar lista
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error);
      toast.error(`Erro ao alterar status: ${error.message}`);
    }
  };

  const excluirConta = async (contaId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      console.log(`🗑️ Excluindo conta ${contaId}`);
      await contasBTGService.excluirConta(contaId);
      toast.success('Conta excluída com sucesso!');
      carregarContas(); // Recarregar lista
    } catch (error) {
      console.error('❌ Erro ao excluir conta:', error);
      toast.error(`Erro ao excluir conta: ${error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'AGUARDANDO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'PAGO': 'bg-green-100 text-green-800 border-green-200',
      'CANCELADO': 'bg-red-100 text-red-800 border-red-200'
    };
    
    const icons = {
      'AGUARDANDO': <Clock className="w-4 h-4" />,
      'PAGO': <CheckCircle className="w-4 h-4" />,
      'CANCELADO': <X className="w-4 h-4" />
    };

    const labels = {
      'AGUARDANDO': 'Aguardando',
      'PAGO': 'Pago',
      'CANCELADO': 'Cancelado'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badges[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {icons[status]}
        {labels[status] || status}
      </span>
    );
  };

  const getTipoBadge = (tipo) => {
    return tipo === 'boleto' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
        📄 Boleto
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        💳 PIX
      </span>
    );
  };

  const handleExportarBTG = () => {
    // Cabeçalhos conforme os prints do usuário
    const headersTED = [
      'Banco do Favorecido', 'Agência do Favorecido', 'Conta do Favorecido', 'Tipo de Conta do Favorecido',
      'Nome / Razão Social do Favorecido', 'CPF/CNPJ do Favorecido', 'Tipo de Transferência', 'Valor',
      'Date de Pagamento (dd/mm/aaaa)', 'Descrição (Opcional)', 'Identificação Interna (Opcional)',
      'Agência de Origem', 'Conta de Origem'
    ];
    const headersPIX = [
      'Chave PIX ou Copia e Cola', 'Nome / Razão Social do Favorecido', 'CPF/CNPJ do Favorecido',
      'Valor', 'Date de Pagamento (dd/mm/aaaa)', 'Descrição (Opcional)', 'Identificação Interna (Opcional)',
      'Agência de Origem', 'Conta de Origem'
    ];
    const headersBOLETO = [
      'Código de Barras', 'Valor', 'Date de Pagamento (dd/mm/aaaa)', 'Identificação Interna (Opcional)',
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
    contas.filter(c => c.tipo === 'pix').forEach(conta => {
      let chavePix = conta.chavePix || '';
      if (conta.tipoChave === 'CPF' || conta.tipoChave === 'CNPJ') {
        chavePix = chavePix.replace(/\D/g, '');
      } else if (conta.tipoChave === 'Celular') {
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
    contas.filter(c => c.tipo === 'boleto').forEach(conta => {
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

    // Cria as abas
    const wsTED = XLSX.utils.aoa_to_sheet(tedRows);
    const wsPIX = XLSX.utils.aoa_to_sheet(pixRows);
    const wsBOLETO = XLSX.utils.aoa_to_sheet(boletoRows);

    // Monta o workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsTED, 'TED');
    XLSX.utils.book_append_sheet(wb, wsPIX, 'PIX');
    XLSX.utils.book_append_sheet(wb, wsBOLETO, 'BOLETO');

    // Gera o arquivo e faz download
    XLSX.writeFile(wb, 'BTG_PAGAMENTOS.xlsx');
  };

  const toggleSelecionada = (id) => {
    setSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelecionarTodas = () => {
    if (selecionadas.length === contas.length) {
      setSelecionadas([]);
    } else {
      setSelecionadas(contas.map((c) => c.id));
    }
  };

  const darBaixaEmLote = async () => {
    if (selecionadas.length === 0) return;
    try {
      setLoading(true);
      await contasBTGService.baixaEmLote(selecionadas);
      toast.success('Baixa em lote realizada com sucesso!');
      setSelecionadas([]);
      carregarContas();
    } catch (error) {
      toast.error('Erro ao dar baixa em lote: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Eye className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Contas BTG</h1>
          <p className="text-gray-600">Visualize e gerencie todas as contas BTG cadastradas</p>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Contas</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.totalContas}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aguardando</p>
                <p className="text-2xl font-bold text-yellow-600">{estatisticas.aguardando}</p>
                <p className="text-xs text-gray-500">{formatCurrency(estatisticas.valorAguardando)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagas</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.pagas}</p>
                <p className="text-xs text-gray-500">{formatCurrency(estatisticas.valorPago)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Canceladas</p>
                <p className="text-2xl font-bold text-red-600">{estatisticas.canceladas}</p>
                <p className="text-xs text-gray-500">Total: {formatCurrency(estatisticas.valorTotal)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Unidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unidade</label>
            <div className="relative">
              {/* <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /> */}
              {shouldShowUnitSelector ? (
                <select
                  value={filtros.unidade}
                  onChange={(e) => {
                    setFiltros({...filtros, unidade: e.target.value});
                    handleUnitChange(e.target.value);
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
                  {getUnitDisplayName()}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {tipoOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Inicial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={filtros.dataInicial}
                onChange={(e) => setFiltros({...filtros, dataInicial: e.target.value})}
                className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Data Final */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={filtros.dataFinal}
                onChange={(e) => setFiltros({...filtros, dataFinal: e.target.value})}
                className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Botão Atualizar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
            <button
              onClick={carregarContas}
              disabled={loading}
              className="w-full h-12 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Contas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">
            Contas Cadastradas ({contas.length})
          </h3>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={handleExportarBTG}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                title="Exportar arquivo para BTG"
              >
                <CreditCard className="w-4 h-4" />
                Exportar arquivo para BTG
              </button>
              <button
                onClick={darBaixaEmLote}
                disabled={selecionadas.length === 0 || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                title="Dar baixa em lote"
              >
                <CheckCircle className="w-4 h-4" />
                Dar baixa em lote
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando contas...</span>
          </div>
        ) : contas.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma conta encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selecionadas.length === contas.length && contas.length > 0}
                      onChange={toggleSelecionarTodas}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contas.map((conta) => (
                  <tr key={conta.id} className="hover:bg-gray-50">
                    <td className="px-2 py-4">
                      <input
                        type="checkbox"
                        checked={selecionadas.includes(conta.id)}
                        onChange={() => toggleSelecionada(conta.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {conta.descricao}
                        </div>
                        <div className="text-sm text-gray-500">
                          {conta.tipo === 'boleto' ? `Linha: ${conta.linhaDigitavel?.substring(0, 20)}...` : `${conta.tipoChave}: ${conta.chavePix}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTipoBadge(conta.tipo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(conta.valor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(conta.vencimento)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(conta.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {conta.unidade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(conta.dataCriacao)}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {/* Botões de Status */}
                          {conta.status === 'AGUARDANDO' && (
                            <>
                              <button
                                onClick={() => alterarStatus(conta.id, 'PAGO')}
                                className="text-green-600 hover:text-green-900"
                                title="Marcar como Pago"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => alterarStatus(conta.id, 'CANCELADO')}
                                className="text-red-600 hover:text-red-900"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {conta.status === 'PAGO' && (
                            <button
                              onClick={() => alterarStatus(conta.id, 'AGUARDANDO')}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Voltar para Aguardando"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}
                          
                          {conta.status === 'CANCELADO' && (
                            <button
                              onClick={() => alterarStatus(conta.id, 'AGUARDANDO')}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Reativar"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Botão Excluir */}
                          <button
                            onClick={() => excluirConta(conta.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir Conta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 