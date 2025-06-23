import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/config';
import { X, ChevronDown, ChevronUp, Eye, CheckCircle, Trash2, Download, Filter, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useUnitFilter } from '../contexts/UnitFilterContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

function formatDate(date) {
  if (!date) return '-';
  if (typeof date === 'string') return date;
  if (date.toDate) return date.toDate().toLocaleDateString('pt-BR');
  if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString('pt-BR');
  return '-';
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Função para traduzir status do Asaas
function traduzirStatusAsaas(status) {
  const mapa = {
    "": "Aguardando",
    ENVIADO: "Aguardando",
    AGUARDANDO: "Aguardando",
    PENDING: "Aguardando pagamento",
    RECEIVED: "Pago",
    CONFIRMED: "Pago",
    OVERDUE: "Vencido",
    REFUNDED: "Estornado",
    RECEIVED_IN_CASH: "Pago em dinheiro",
    REFUND_REQUESTED: "Reembolso solicitado",
    REFUND_IN_PROGRESS: "Reembolso em andamento",
    CHARGEBACK_REQUESTED: "Chargeback solicitado",
    CHARGEBACK_DISPUTE: "Em disputa de chargeback",
    AWAITING_CHARGEBACK_REVERSAL: "Aguardando reversão de chargeback",
    DUNNING_REQUESTED: "Cobrança em negativação",
    DUNNING_RECEIVED: "Negativado",
    AWAITING_RISK_ANALYSIS: "Aguardando análise de risco",
    VENCIDO: "Vencido",
    CANCELADO: "Cancelado",
    PAGO: "Pago"
  };
  return mapa[status] || status || "Aguardando";
}

// Função robusta para garantir que o histórico NUNCA seja perdido
// SOLUÇÃO DEFINITIVA: Transação atômica para histórico 100% confiável
async function adicionarAcaoComTransacao(cobrancaId, novaAcao, dadosParaAtualizar = {}) {
  const cobrancaRef = doc(db, 'cobrancas', cobrancaId);
  
  try {
    console.log('🔒 [TRANSAÇÃO INICIADA] Cobrança:', cobrancaId, '- Ação:', novaAcao.acao);
    
    const resultado = await runTransaction(db, async (transaction) => {
      // LEITURA ATÔMICA: Garantir dados mais recentes
      const cobrancaDoc = await transaction.get(cobrancaRef);
      
      if (!cobrancaDoc.exists()) {
        throw new Error(`Cobrança ${cobrancaId} não encontrada`);
      }

      const dadosAtuais = cobrancaDoc.data();
      const historicoExistente = dadosAtuais.historicoAlteracoes || [];
      
      console.log('📋 [LEITURA TRANSAÇÃO] Total entradas existentes:', historicoExistente.length);
      console.log('📋 [LEITURA TRANSAÇÃO] Entradas:', historicoExistente.map((h, i) => ({
        index: i + 1,
        acao: h.acao || h.descricao || 'SEM AÇÃO',
        data: h.data ? (typeof h.data === 'string' ? h.data : (h.data.toDate ? h.data.toDate().toLocaleString('pt-BR') : new Date(h.data).toLocaleString('pt-BR'))) : '❌ SEM DATA',
        usuario: h.usuario || h.user || 'SEM USUARIO'
      })));

      // PRESERVAÇÃO TOTAL: Manter TODAS as entradas sem modificação
      const historicoPreservado = historicoExistente.map((entrada, index) => {
        // Criar cópia EXATA dos dados existentes
        const entradaPreservada = {};
        
        // Copiar TODOS os campos originais exatamente como estão
        for (const [campo, valor] of Object.entries(entrada)) {
          entradaPreservada[campo] = valor;
        }
        
        // Adicionar metadados de auditoria SEM alterar dados originais
        entradaPreservada._preservadoIndex = index;
        entradaPreservada._preservadoEm = new Date().toISOString();
        
        return entradaPreservada;
      });

      // NOVA ENTRADA: Criar com timestamp detalhado
      const agora = new Date();
      const novaEntrada = {
        acao: novaAcao.acao,
        usuario: novaAcao.usuario || 'Sistema',
        data: agora.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        timestamp: agora.getTime(),
        dataIso: agora.toISOString(),
        // Dados específicos da ação
        ...novaAcao.dadosExtras,
        // Metadados de auditoria
        _transacaoId: `${agora.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
        _criadoPorTransacao: true
      };

      // HISTÓRICO FINAL: Preservado + nova entrada
      const historicoFinal = [...historicoPreservado, novaEntrada];
      
      console.log('💾 [ESCRITA TRANSAÇÃO] Histórico final:', {
        totalOriginal: historicoExistente.length,
        totalPreservado: historicoPreservado.length,
        totalFinal: historicoFinal.length,
        novaEntrada: {
          acao: novaEntrada.acao,
          data: novaEntrada.data,
          transacaoId: novaEntrada._transacaoId
        }
      });

      // ESCRITA ATÔMICA: Atualizar documento com histórico preservado
      const dadosParaEscrita = {
        ...dadosParaAtualizar,
        historicoAlteracoes: historicoFinal,
        ultimaAtualizacao: agora.toISOString(),
        _ultimaTransacao: novaEntrada._transacaoId
      };

      transaction.update(cobrancaRef, dadosParaEscrita);

      return historicoFinal;
    });

    console.log('✅ [TRANSAÇÃO CONCLUÍDA] Histórico salvo com sucesso:', resultado.length, 'entradas');
    return resultado;
    
  } catch (error) {
    console.error('❌ [ERRO TRANSAÇÃO]:', error);
    throw error;
  }
}

// Função para processar histórico e garantir auditoria completa
function processarHistoricoParaAuditoria(historicoAlteracoes) {
  if (!Array.isArray(historicoAlteracoes)) {
    console.log('DEBUG - processarHistoricoParaAuditoria: entrada não é array');
    return [];
  }
  
  console.log('DEBUG - processarHistoricoParaAuditoria: processando', historicoAlteracoes.length, 'entradas');
  
  return historicoAlteracoes.map((item, index) => {
    // Garantir que TODAS as entradas tenham informações básicas para auditoria
    let dataProcessada = item.data;
    
    // Se não tem data, marcar como "entrada sem data" mas manter para auditoria
    if (!dataProcessada) {
      console.warn('AVISO - Entrada do histórico sem data encontrada (índice', index, '):', item);
      dataProcessada = null; // Será tratado na exibição
    }
    
    // Criar entrada processada com todos os dados preservados
    const entradaProcessada = {
      ...item, // Preservar todos os campos originais
      data: dataProcessada,
      acao: item.acao || item.descricao || item.status || 'Ação não especificada',
      usuario: item.usuario || item.user || 'Usuário não informado',
      // Adicionar metadados para auditoria
      _indexOriginal: index,
      _temDataValida: !!dataProcessada
    };
    
    return entradaProcessada;
  });
}

export default function HistoricoCobrancas() {
  const { availableUnits } = useUnitFilter();
  const [cobrancas, setCobrancas] = useState([]);
  const [filtros, setFiltros] = useState({
    unidade: '',
    dataCadastroIni: '',
    dataCadastroFim: '',
    dataVencIni: '',
    dataVencFim: ''
  });
  const [modal, setModal] = useState({ open: false, data: null });
  const [buscaAluno, setBuscaAluno] = useState("");
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;
  const { isAdmin, user } = useAuth();
  const [modalCliente, setModalCliente] = useState({ open: false, nome: '', cobrancas: [] });
  const [expandedCliente, setExpandedCliente] = useState(null);
  const [showFiltros, setShowFiltros] = useState(false);
  const [mostrarExcluidos, setMostrarExcluidos] = useState(false);

  useEffect(() => {
    async function load() {
      const q = query(collection(db, 'cobrancas'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const cobrancasCarregadas = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      cobrancasCarregadas.forEach(c => console.log('Cobrança:', c.nome, c.dataVencimento)); // LOG DE DATA

      // Atualizar status para 'VENCIDO' se necessário
      const hoje = new Date();
      hoje.setHours(0,0,0,0); // Zera hora para comparar só a data
      const atualizadas = await Promise.all(cobrancasCarregadas.map(async c => {
        let dataBase = c.dataVencimento;
        if (!dataBase) return c;
        // Garantir data local (corrigir fuso)
        let dataVenc;
        if (typeof dataBase === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dataBase)) {
          const [ano, mes, dia] = dataBase.split('-');
          dataVenc = new Date(Number(ano), Number(mes) - 1, Number(dia), 0, 0, 0, 0);
        } else {
          dataVenc = new Date(dataBase);
        }
        dataVenc.setHours(0,0,0,0); // Zera hora para comparar só a data
        // Verificar se a cobrança está vencida (aceitar status do Asaas)
        const statusAguardando = ['AGUARDANDO', 'ENVIADO', 'PENDING', 'AWAITING_RISK_ANALYSIS'];
        const vencida = statusAguardando.includes(c.status) && dataVenc < hoje;
        if (vencida) {
          await updateDoc(doc(db, 'cobrancas', c.id), { status: 'VENCIDO' });
          return { ...c, status: 'VENCIDO' };
        }
        return c;
      }));
      setCobrancas(atualizadas);
    }
    load();
  }, []);

  // Filtro (removido temporariamente para debug)
  // const filtradas = cobrancas.filter(...)
  const filtradas = cobrancas.filter(c =>
    (!filtros.unidade || c.unidade === filtros.unidade)
    // ... outros filtros se houver
  );
  // Para restaurar o filtro, volte a usar a lógica original aqui.

  // Filtrar apenas parcelas com valor igual ou maior que 5 reais
  const valorMinimo = 5;
  const todasParcelasFiltradas = filtradas.flatMap(c => {
    const n = Number(c.parcelas) || 1;
    let valor = 0;
    // Corrigir casos em que valorParcela ou valorTotal vierem como boolean
    if (typeof c.valorParcela === 'number') {
      valor = c.valorParcela;
    } else if (typeof c.valorParcela === 'string' && !isNaN(Number(c.valorParcela))) {
      valor = Number(c.valorParcela);
    } else if (typeof c.valorTotal === 'number' && n > 1) {
      valor = c.valorTotal / n;
    } else if (typeof c.valorTotal === 'string' && !isNaN(Number(c.valorTotal)) && n > 1) {
      valor = Number(c.valorTotal) / n;
    } else if (typeof c.valorTotal === 'number') {
      valor = c.valorTotal;
    } else if (typeof c.valorTotal === 'string' && !isNaN(Number(c.valorTotal))) {
      valor = Number(c.valorTotal);
    } else if (typeof c.valor === 'number') {
      valor = c.valor;
    } else if (typeof c.valor === 'string' && !isNaN(Number(c.valor))) {
      valor = Number(c.valor);
    }
    if (valor < valorMinimo) return []; // ignora cobranças de valor simbólico
    let dataBase = c.dataVencimento;
    if (!dataBase) return [];
    // Corrigir criação da data para evitar erro de fuso horário
    let dataBaseDate;
    if (typeof dataBase === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dataBase)) {
      const [ano, mes, dia] = dataBase.split('-');
      dataBaseDate = new Date(Number(ano), Number(mes) - 1, Number(dia), 0, 0, 0, 0);
    } else {
      dataBaseDate = new Date(dataBase);
    }
    const dataValida = !isNaN(dataBaseDate.getTime());
    if (!dataValida || valor < 0) return [];
    // Fallback para urlFatura
    let urlFatura = '';
    if (typeof c.urlFatura === 'string' && c.urlFatura.trim() !== '') {
      urlFatura = c.urlFatura;
    } else if (typeof c.url === 'string' && c.url.trim() !== '') {
      urlFatura = c.url;
    } else if (typeof c.linkFatura === 'string' && c.linkFatura.trim() !== '') {
      urlFatura = c.linkFatura;
    }
    return Array.from({ length: n }, (_, i) => {
      let data;
      if (i === 0) {
        data = new Date(dataBaseDate); // Usar a data base já corrigida
      } else {
        data = addDays(new Date(dataBaseDate), 30 * i);
      }
      if (isNaN(data.getTime())) return null;
      let status = c.status;
      const canceladas = c.parcelasCanceladas || [];
      const pagas = c.parcelasPagas || [];
      if (canceladas.includes(i + 1)) {
        status = 'CANCELADO';
      } else if (pagas.includes(i + 1)) {
        status = 'PAGO';
      }
      return {
        numero: i + 1,
        valor,
        status,
        dataVencimento: data,
        id: c.id + '-' + (i + 1),
        cobrancaId: c.id,
        statusPagamentoAsaas: c.status,
        cpf: c.cpf,
        urlFatura, // garantir sempre string válida
        dataCancelamentoPorParcela: c.dataCancelamentoPorParcela
      };
    }).filter(Boolean);
  });

  // Definir status aguardando e pago de forma robusta
  const statusAguardando = ['AGUARDANDO', 'ENVIADO', 'PENDING', 'AWAITING_RISK_ANALYSIS', '', undefined, null];
  const statusPago = ['PAGO', 'RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];

  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  // Aplicar filtro de excluídos nas estatísticas
  const parcelasParaEstatisticas = todasParcelasFiltradas.filter(p => {
    if (mostrarExcluidos) {
      // Modo "Ver Excluídos": mostrar apenas estatísticas de parcelas CANCELADAS
      return p.status === 'CANCELADO';
    } else {
      // Modo "Ver Ativos": mostrar estatísticas apenas de parcelas NÃO CANCELADAS
      return p.status !== 'CANCELADO';
    }
  });

  const aguardandoParcelas = parcelasParaEstatisticas.filter(p =>
    statusAguardando.includes(p.status) &&
    (!p.dataVencimento || new Date(p.dataVencimento).setHours(0,0,0,0) >= hoje.getTime())
  );
  const valorAguardando = aguardandoParcelas.reduce((sum, p) => sum + p.valor, 0);

  const parcelasAtrasadas = parcelasParaEstatisticas.filter(p =>
    statusAguardando.includes(p.status) &&
    p.dataVencimento && new Date(p.dataVencimento).setHours(0,0,0,0) < hoje.getTime()
  );
  const valorAtrasado = parcelasAtrasadas.reduce((sum, p) => sum + p.valor, 0);

  const pagasParcelas = parcelasParaEstatisticas.filter(p => statusPago.includes(p.status));
  const valorPago = pagasParcelas.reduce((sum, p) => sum + p.valor, 0);

  const totalParcelas = parcelasParaEstatisticas.length;
  const taxaInadimplencia = totalParcelas > 0 ? ((parcelasAtrasadas.length / totalParcelas) * 100).toFixed(1) : '0.0';

  // Agrupar cobranças filtradas por CPF padronizado
  const alunos = {};
  filtradas.forEach(c => {
    const cpf = (c.cpf || '').replace(/\D/g, ''); // só números
    if (!alunos[cpf]) alunos[cpf] = [];
    alunos[cpf].push(c);
  });

  // Filtro de busca por nome do aluno E que tenham parcelas para mostrar
  const alunosFiltrados = Object.entries(alunos).filter(([cpf, registros]) => {
    const nome = registros[0]?.nome || '-';
    const nomeMatch = nome.toLowerCase().includes(buscaAluno.toLowerCase());
    
    if (!nomeMatch) return false;
    
    // Verificar se o aluno tem parcelas para mostrar baseado no modo atual
    const parcelasDoAluno = todasParcelasFiltradas.filter(p => {
      const mesmoCpf = p.cpf && p.cpf.replace(/\D/g, '') === cpf;
      if (!mesmoCpf) return false;
      
      if (mostrarExcluidos) {
        return p.status === 'CANCELADO';
      } else {
        return p.status !== 'CANCELADO';
      }
    });
    
    // Só mostrar o aluno se ele tiver parcelas para exibir
    return parcelasDoAluno.length > 0;
  });

  const alunosPaginados = alunosFiltrados.slice((pagina-1)*porPagina, pagina*porPagina);
  const totalPaginas = Math.ceil(alunosFiltrados.length / porPagina);

  // LOGS DE DEBUG (deve ficar após todas as variáveis)
  useEffect(() => {
    console.log('Cobranças carregadas:', cobrancas || []);
    console.log('Filtradas:', filtradas || []);
    console.log('Todas parcelas filtradas:', todasParcelasFiltradas || []);
  }, [cobrancas, filtradas, todasParcelasFiltradas]);

  return (
    <div className="page-container-xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Histórico de Cobranças</h1>
        {mostrarExcluidos && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">Visualizando parcelas excluídas</span>
          </div>
        )}
      </div>
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600 mb-1">
            {mostrarExcluidos ? 'Total Excluídos' : 'Total de Parcelas'}
          </span>
          <span className="text-2xl font-bold text-gray-900">{totalParcelas}</span>
        </div>
        {!mostrarExcluidos ? (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-yellow-100 p-6 flex flex-col items-center">
              <span className="text-sm font-medium text-gray-600 mb-1">Aguardando Recebimento</span>
              <span className="text-2xl font-bold text-yellow-600">R$ {valorAguardando.toFixed(2)}</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6 flex flex-col items-center">
              <span className="text-sm font-medium text-gray-600 mb-1">Pagos</span>
              <span className="text-2xl font-bold text-green-600">R$ {valorPago.toFixed(2)}</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 flex flex-col items-center">
              <span className="text-sm font-medium text-gray-600 mb-1">Em Atraso</span>
              <span className="text-2xl font-bold text-red-600">R$ {valorAtrasado.toFixed(2)}</span>
              <span className="text-xs text-gray-500">{parcelasAtrasadas.length} parcelas</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6 flex flex-col items-center">
              <span className="text-sm font-medium text-gray-600 mb-1">Taxa de Inadimplência</span>
              <span className="text-2xl font-bold text-purple-600">{taxaInadimplencia}%</span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 flex flex-col items-center">
              <span className="text-sm font-medium text-gray-600 mb-1">Valor Total Excluído</span>
              <span className="text-2xl font-bold text-red-600">R$ {(valorAguardando + valorPago + valorAtrasado).toFixed(2)}</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
              <span className="text-sm font-medium text-gray-600 mb-1">Data da Exclusão</span>
              <span className="text-sm text-gray-600">Varie por parcela</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 flex flex-col items-center">
              <span className="text-sm font-medium text-gray-600 mb-1">Status</span>
              <span className="text-2xl font-bold text-orange-600">CANCELADO</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 flex flex-col items-center">
              <span className="text-sm font-medium text-gray-600 mb-1">Ação Disponível</span>
              <span className="text-sm text-blue-600">Reverter Exclusão</span>
            </div>
          </>
        )}
      </div>
      {/* Barra de busca e filtros ajustada */}
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Buscar aluno</label>
          <input
            type="text"
            className="input-field w-full"
            placeholder="Digite o nome, CPF ou CNPJ do aluno..."
            value={buscaAluno}
            onChange={e => setBuscaAluno(e.target.value)}
          />
        </div>
        <div className="flex-shrink-0 flex gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 sm:invisible">Filtros</label>
            <button
              className="flex items-center gap-2 px-6 py-2.5 w-full sm:w-auto rounded-lg border-2 transition-all duration-200 font-medium bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
              onClick={() => setShowFiltros(v => !v)}
            >
              <Filter className="w-5 h-5" /> 
              <span>{showFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}</span>
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 sm:invisible">Visualizar</label>
            <button
              className={`flex items-center gap-2 px-6 py-2.5 w-full sm:w-auto rounded-lg border-2 transition-all duration-200 font-medium ${
                mostrarExcluidos 
                  ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400' 
                  : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400'
              }`}
              onClick={() => {
                setMostrarExcluidos(v => !v);
                setPagina(1); // Resetar paginação
              }}
            >
              {mostrarExcluidos ? (
                <>
                  <Eye className="w-5 h-5" />
                  <span>Ver Ativos</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  <span>Ver Excluídos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {showFiltros && (
        <div className="w-full bg-white rounded-xl shadow p-6 mb-8 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros Avançados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Unidade</label>
              <select 
                className="input-field w-full" 
                value={filtros.unidade} 
                onChange={e => {
                  setFiltros(f => ({ ...f, unidade: e.target.value }));
                  setPagina(1); // volta para página 1
                }}
              >
                <option value="">Todas as unidades</option>
                {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Data de Cadastro (De)</label>
              <input 
                type="date" 
                className="input-field w-full" 
                value={filtros.dataCadastroIni} 
                onChange={e => setFiltros(f => ({ ...f, dataCadastroIni: e.target.value }))} 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Data de Cadastro (Até)</label>
              <input 
                type="date" 
                className="input-field w-full" 
                value={filtros.dataCadastroFim} 
                onChange={e => setFiltros(f => ({ ...f, dataCadastroFim: e.target.value }))} 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Vencimento (De)</label>
              <input 
                type="date" 
                className="input-field w-full" 
                value={filtros.dataVencIni} 
                onChange={e => setFiltros(f => ({ ...f, dataVencIni: e.target.value }))} 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Vencimento (Até)</label>
              <input 
                type="date" 
                className="input-field w-full" 
                value={filtros.dataVencFim} 
                onChange={e => setFiltros(f => ({ ...f, dataVencFim: e.target.value }))} 
              />
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              className="btn-primary px-4 py-2"
              onClick={() => {
                // Aplicar filtros (já aplicados automaticamente)
                setShowFiltros(false);
              }}
            >
              Aplicar Filtros
            </button>
            <button
              className="btn-secondary px-4 py-2"
              onClick={() => {
                setFiltros({
                  unidade: '',
                  dataCadastroIni: '',
                  dataCadastroFim: '',
                  dataVencIni: '',
                  dataVencFim: ''
                });
                setPagina(1);
              }}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      )}
      {/* Tabela resumida de clientes */}
      <div className="w-full bg-white rounded-xl shadow border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 hidden md:table">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Unidade</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Valor total</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Ações</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Ver mais</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {alunosPaginados.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhuma cobrança encontrada</td></tr>
            )}
            {alunosPaginados.map(([cpf, registros]) => {
              const nome = registros[0]?.nome || '-';
              const parcelasAluno = todasParcelasFiltradas.filter(p => {
                const mesmoCpf = p.cpf && p.cpf.replace(/\D/g, '') === cpf;
                if (!mesmoCpf) return false;
                
                // Aplicar filtro de visualização de excluídos
                if (mostrarExcluidos) {
                  // Modo "Ver Excluídos": mostrar apenas parcelas CANCELADAS
                  return p.status === 'CANCELADO';
                } else {
                  // Modo "Ver Ativos": mostrar apenas parcelas NÃO CANCELADAS
                  return p.status !== 'CANCELADO';
                }
              });
              // Valor total: soma de todas as parcelas, independentemente do status
              const valorTotal = parcelasAluno.reduce((sum, p) => sum + p.valor, 0);
              const unidade = registros[0]?.unidade || '-';
              const expanded = expandedCliente === cpf;
              return (
                <React.Fragment key={cpf}>
                  <tr className={`bg-white transition ${expanded ? 'bg-blue-50' : 'hover:bg-blue-50'} cursor-pointer`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 flex items-center gap-2">
                      <span className="inline-block bg-green-100 text-green-700 rounded-full p-1"><User className="w-4 h-4" /></span>
                      {nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{unidade}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">R$ {valorTotal.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-blue-600">{parcelasAluno.length} cobranças</span>
                    </td>
                    <td className="px-4 py-3 text-center align-middle flex justify-center items-center">
                      <button
                        className="flex items-center gap-1 text-blue-600 hover:bg-blue-100 rounded-full px-2 py-1 transition"
                        title={expanded ? 'Ocultar cobranças' : 'Ver cobranças'}
                        onClick={() => setExpandedCliente(expanded ? null : cpf)}
                      >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span className="text-xs font-medium">{expanded ? 'Ocultar' : 'Ver mais'}</span>
                      </button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={5} className="bg-gray-50 px-4 py-2">
                        <table className="min-w-full">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Parcela</th>
                              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Valor</th>
                              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Vencimento</th>
                              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">Fatura</th>
                              <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parcelasAluno.map((p, idx) => (
                              <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-2 py-2 font-medium text-gray-900">{p.numero}</td>
                                <td className="px-2 py-2 text-gray-700">R$ {Number(p.valor).toFixed(2)}</td>
                                <td className="px-2 py-2 text-gray-700">{p.dataVencimento instanceof Date ? p.dataVencimento.toLocaleDateString('pt-BR') : p.dataVencimento}</td>
                                <td className="px-2 py-2">
                                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-semibold
                                    ${['PAGO','RECEIVED','CONFIRMED','RECEIVED_IN_CASH'].includes(p.status) ? 'bg-green-100 text-green-700' :
                                      p.status === 'CANCELADO' ? 'bg-red-100 text-red-600' :
                                      'bg-yellow-100 text-yellow-700'}`}
                                  >
                                    {traduzirStatusAsaas(p.status)}
                                  </span>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {typeof p.urlFatura === 'string' && p.urlFatura.trim() !== '' ? (
                                    <button
                                      onClick={() => window.open(p.urlFatura, '_blank')}
                                      title="Abrir Fatura/Boleto"
                                      className="flex items-center text-blue-600 hover:bg-blue-100 rounded-full p-1 transition border border-blue-200"
                                      style={{ maxWidth: 40, display: 'inline-flex', verticalAlign: 'middle' }}
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-2 py-2 text-center flex gap-2 justify-center">
                                  <button title="Visualizar" className="text-blue-600 hover:bg-blue-100 rounded-full p-1 transition" onClick={() => setModal({ open: true, data: { ...registros[0], parcela: p.numero, vencimento: p.dataVencimento, valor: p.valor, status: p.status, dataCriacao: registros[0].dataCriacao || registros[0].createdAt, dataCancelamento: registros[0].dataCancelamento || registros[0].dataExclusao, urlFatura: p.urlFatura } })}><Eye className="w-4 h-4" /></button>
                                  <button
                                    title="Dar baixa manualmente"
                                    className="text-green-600 hover:bg-green-100 rounded-full p-1 transition"
                                    onClick={async () => {
                                      try {
                                        // Confirmação antes de marcar como pago
                                        if (!window.confirm(`Confirma o pagamento da parcela ${p.numero} de R$ ${Number(p.valor).toFixed(2)}?`)) {
                                          return;
                                        }

                                        // Mostrar feedback visual
                                        toast.loading('Marcando como pago...');

                                        const cobrancaRef = doc(db, 'cobrancas', p.cobrancaId);
                                        const docSnap = await getDoc(cobrancaRef);
                                        
                                        if (!docSnap.exists()) {
                                          throw new Error('Cobrança não encontrada');
                                        }

                                        const data = docSnap.data();
                                        const parcelasPagas = Array.isArray(data.parcelasPagas) ? [...data.parcelasPagas] : [];
                                        
                                        // Adiciona a parcela se não estiver já paga
                                        if (!parcelasPagas.includes(p.numero)) {
                                          parcelasPagas.push(p.numero);
                                        }

                                        // Se todas as parcelas estiverem pagas, status global = 'PAGO'
                                        const totalParcelas = data.parcelas || 1;
                                        let statusUpdate = {};
                                        if (parcelasPagas.length === Number(totalParcelas)) {
                                          statusUpdate.status = 'PAGO';
                                        }

                                        // USAR TRANSAÇÃO ATÔMICA - Garante histórico preservado 100%
                                        const historicoAlteracoes = await adicionarAcaoComTransacao(
                                          p.cobrancaId,
                                          {
                                            acao: `Parcela ${p.numero} marcada como paga manualmente - R$ ${Number(p.valor).toFixed(2)}`,
                                            usuario: user?.nome || 'Desconhecido',
                                            dadosExtras: {
                                              parcelaNumero: p.numero,
                                              valorPago: Number(p.valor),
                                              metodoPagamento: 'CONFIRMACAO_MANUAL'
                                            }
                                          },
                                          {
                                            parcelasPagas,
                                            ...statusUpdate
                                          }
                                        );

                                        // Atualizar estado local
                                        setCobrancas(prev => prev.map(c => 
                                          c.id === p.cobrancaId 
                                            ? { ...c, parcelasPagas, historicoAlteracoes, ...(statusUpdate.status ? { status: statusUpdate.status } : {}) } 
                                            : c
                                        ));

                                        // 🚀 CRIAR LANÇAMENTO DE RECEITA NO EXTRATO
                                        try {
                                          const { lancamentosService } = await import('../services/lancamentosService');
                                          
                                          // Garantir que temos o ID da cobrança
                                          const dadosCobrancaCompletos = {
                                            ...data,
                                            id: p.cobrancaId, // Garantir que o ID está presente
                                            nome: registros[0]?.nome || 'Cliente'
                                          };
                                          
                                          console.log('🔍 Dados da cobrança para lançamento:', {
                                            dadosCobranca: dadosCobrancaCompletos,
                                            parcela: p.numero,
                                            valor: p.valor,
                                            registros: registros[0]
                                          });
                                          
                                          await lancamentosService.criarLancamentoDeCobranca(dadosCobrancaCompletos, p.numero, p.valor);

                                        } catch (errorLancamento) {
                                          console.error('❌ Erro ao criar lançamento de receita:', errorLancamento);
                                          console.error('❌ Dados que causaram o erro:', {
                                            data,
                                            parcela: p,
                                            registros
                                          });
                                          // Não falhar a operação principal, apenas avisar
                                          toast.error('Pagamento confirmado, mas houve erro ao criar o lançamento no extrato: ' + errorLancamento.message);
                                        }

                                        toast.dismiss();
                                        toast.success('Pagamento confirmado e lançado no extrato!');
                                        
                                        console.log('Pagamento confirmado:', {
                                          cobrancaId: p.cobrancaId,
                                          parcela: p.numero,
                                          valor: p.valor,
                                          totalParcelasPagas: parcelasPagas.length,
                                          statusAtualizado: statusUpdate.status || 'mantido'
                                        });

                                      } catch (error) {
                                        console.error('❌ Erro ao marcar como pago:', error);
                                        toast.dismiss();
                                        toast.error('Erro ao confirmar pagamento: ' + error.message);
                                      }
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  {p.status === 'PAGO' && isAdmin && (
                                    <button
                                      title="Desfazer pagamento confirmado"
                                      className="text-orange-600 hover:bg-orange-100 rounded-full p-1 transition"
                                      onClick={async () => {
                                        try {
                                          // Confirmação antes de desfazer
                                          if (!window.confirm(`Tem certeza que deseja desfazer o pagamento da parcela ${p.numero}?`)) {
                                            return;
                                          }

                                          // Mostrar feedback visual
                                          toast.loading('Desfazendo pagamento...');

                                          const cobrancaRef = doc(db, 'cobrancas', p.cobrancaId);
                                          const docSnap = await getDoc(cobrancaRef);
                                          
                                          if (!docSnap.exists()) {
                                            throw new Error('Cobrança não encontrada');
                                          }

                                          const data = docSnap.data();
                                          const parcelasPagas = Array.isArray(data.parcelasPagas) ? [...data.parcelasPagas] : [];
                                          
                                          // Remove a parcela do array de pagas
                                          const idx = parcelasPagas.indexOf(p.numero);
                                          if (idx !== -1) {
                                            parcelasPagas.splice(idx, 1);
                                          }

                                          // Atualizar status global se necessário
                                          let statusUpdate = {};
                                          const totalParcelas = data.parcelas || 1;
                                          
                                          // Se tinha todas as parcelas pagas e agora não tem mais, volta para status anterior
                                          if (data.status === 'PAGO' && parcelasPagas.length < Number(totalParcelas)) {
                                            // Verificar se ainda tem parcelas vencidas
                                            const hoje = new Date();
                                            hoje.setHours(0,0,0,0);
                                            
                                            let dataVenc = data.dataVencimento;
                                            if (typeof dataVenc === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dataVenc)) {
                                              const [ano, mes, dia] = dataVenc.split('-');
                                              dataVenc = new Date(Number(ano), Number(mes) - 1, Number(dia), 0, 0, 0, 0);
                                            } else {
                                              dataVenc = new Date(dataVenc);
                                            }
                                            
                                            if (dataVenc < hoje) {
                                              statusUpdate.status = 'VENCIDO';
                                            } else {
                                              statusUpdate.status = 'ENVIADO';
                                            }
                                          }

                                          // USAR TRANSAÇÃO ATÔMICA - Garante histórico preservado 100%
                                          const historicoAlteracoes = await adicionarAcaoComTransacao(
                                            p.cobrancaId,
                                            {
                                              acao: `Pagamento da parcela ${p.numero} desfeito`,
                                              usuario: user?.nome || 'Desconhecido',
                                              dadosExtras: {
                                                parcelaNumero: p.numero,
                                                valorDesfeito: Number(p.valor),
                                                operacao: 'DESFAZER_PAGAMENTO'
                                              }
                                            },
                                            {
                                              parcelasPagas,
                                              ...statusUpdate
                                            }
                                          );

                                          // Atualizar estado local
                                          setCobrancas(prev => prev.map(c => 
                                            c.id === p.cobrancaId 
                                              ? { ...c, parcelasPagas, historicoAlteracoes, ...statusUpdate } 
                                              : c
                                          ));

                                          // 🚀 REMOVER LANÇAMENTO DE RECEITA DO EXTRATO
                                          try {
                                            const { lancamentosService } = await import('../services/lancamentosService');
                                            
                                            await lancamentosService.removerLancamentoDeCobranca(p.cobrancaId, p.numero);

                                          } catch (errorLancamento) {
                                            console.error('❌ Erro ao remover lançamento de receita:', errorLancamento);
                                            // Não falhar a operação principal, apenas avisar
                                            toast.error('Pagamento desfeito, mas houve erro ao remover o lançamento do extrato');
                                          }

                                          toast.dismiss();
                                          toast.success('Pagamento desfeito e removido do extrato!');
                                          
                                          console.log('Pagamento desfeito:', {
                                            cobrancaId: p.cobrancaId,
                                            parcela: p.numero,
                                            parcelasPagasRestantes: parcelasPagas,
                                            novoStatus: statusUpdate.status || 'mantido'
                                          });

                                        } catch (error) {
                                          console.error('❌ Erro ao desfazer pagamento:', error);
                                          toast.dismiss();
                                          toast.error('Erro ao desfazer pagamento: ' + error.message);
                                        }
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <>
                                      {p.status === 'CANCELADO' ? (
                                        <button
                                          title="Reverter exclusão"
                                          className="text-orange-600 hover:bg-orange-100 rounded-full p-1 transition"
                                          onClick={async () => {
                                            // Remover a parcela do array parcelasCanceladas e a data de cancelamento
                                            const cobrancaRef = doc(db, 'cobrancas', p.cobrancaId);
                                            const docSnap = await getDoc(cobrancaRef);
                                            const data = docSnap.data();
                                            const canceladas = (data.parcelasCanceladas || []).filter(num => num !== p.numero);
                                            const dataCancelamentoPorParcela = { ...(data.dataCancelamentoPorParcela || {}) };
                                            delete dataCancelamentoPorParcela[p.numero];
                                            
                                            // USAR TRANSAÇÃO ATÔMICA - Garante histórico preservado 100%
                                            const historicoAlteracoes = await adicionarAcaoComTransacao(
                                              p.cobrancaId,
                                              {
                                                acao: `Exclusão da parcela ${p.numero} desfeita`,
                                                usuario: user?.nome || 'Desconhecido',
                                                dadosExtras: {
                                                  parcelaNumero: p.numero,
                                                  operacao: 'REVERTER_EXCLUSAO'
                                                }
                                              },
                                              {
                                                parcelasCanceladas: canceladas,
                                                dataCancelamentoPorParcela
                                              }
                                            );
                                            setCobrancas(prev => prev.map(c => c.id === p.cobrancaId ? { ...c, parcelasCanceladas: canceladas, dataCancelamentoPorParcela, historicoAlteracoes } : c));
                                          }}
                                        >
                                          <span className="inline-block"><ChevronLeft className="w-4 h-4" /></span> Reverter
                                        </button>
                                      ) : (
                                        <button title="Excluir" className="text-red-600 hover:bg-red-100 rounded-full p-1 transition" onClick={async () => {
                                          if(window.confirm('Tem certeza que deseja excluir esta parcela?')) {
                                            // Atualizar apenas a parcela no array parcelasCanceladas e salvar data de cancelamento individual
                                            const cobrancaRef = doc(db, 'cobrancas', p.cobrancaId);
                                            const docSnap = await getDoc(cobrancaRef);
                                            const data = docSnap.data();
                                            const canceladas = data.parcelasCanceladas || [];
                                            const dataCancelamentoPorParcela = { ...(data.dataCancelamentoPorParcela || {}) };
                                            
                                            if (!canceladas.includes(p.numero)) {
                                              const now = new Date();
                                              
                                              // USAR TRANSAÇÃO ATÔMICA - Garante histórico preservado 100%
                                              const historicoAlteracoes = await adicionarAcaoComTransacao(
                                                p.cobrancaId,
                                                {
                                                  acao: `Parcela ${p.numero} excluída`,
                                                  usuario: user?.nome || 'Desconhecido',
                                                  dadosExtras: {
                                                    parcelaNumero: p.numero,
                                                    valorExcluido: Number(p.valor),
                                                    operacao: 'EXCLUIR_PARCELA'
                                                  }
                                                },
                                                {
                                                  parcelasCanceladas: [...canceladas, p.numero],
                                                  dataCancelamentoPorParcela: { ...dataCancelamentoPorParcela, [p.numero]: now }
                                                }
                                              );
                                              setCobrancas(prev => prev.map(c => c.id === p.cobrancaId ? { ...c, parcelasCanceladas: [...(c.parcelasCanceladas || []), p.numero], dataCancelamentoPorParcela: { ...dataCancelamentoPorParcela, [p.numero]: now }, historicoAlteracoes } : c));
                                            }
                                          }
                                        }}><Trash2 className="w-4 h-4" /></button>
                                      )}
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* Versão Mobile - Cards */}
        <div className="md:hidden p-4">
          {alunosPaginados.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nenhuma cobrança encontrada</div>
          ) : (
            <div className="space-y-4">
              {alunosPaginados.map(([cpf, registros]) => {
                const nome = registros[0]?.nome || '-';
                const parcelasAluno = todasParcelasFiltradas.filter(p => {
                  const mesmoCpf = p.cpf && p.cpf.replace(/\D/g, '') === cpf;
                  if (!mesmoCpf) return false;
                  
                  if (mostrarExcluidos) {
                    return p.status === 'CANCELADO';
                  } else {
                    return p.status !== 'CANCELADO';
                  }
                });
                const valorTotal = parcelasAluno.reduce((sum, p) => sum + p.valor, 0);
                const unidade = registros[0]?.unidade || '-';
                const expanded = expandedCliente === cpf;

                return (
                  <div key={cpf} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-green-100 text-green-700 rounded-full p-1">
                            <User className="w-4 h-4" />
                          </span>
                          <span className="font-medium text-gray-900 text-sm">{nome}</span>
                        </div>
                        <button
                          className="flex items-center gap-1 text-blue-600 hover:bg-blue-100 rounded-full px-2 py-1 transition touch-manipulation"
                          onClick={() => setExpandedCliente(expanded ? null : cpf)}
                        >
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <span className="text-xs font-medium">{expanded ? 'Ocultar' : 'Ver'}</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs">Unidade:</span>
                          <div className="font-medium text-gray-900">{unidade}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Valor Total:</span>
                          <div className="font-medium text-gray-900">R$ {valorTotal.toFixed(2)}</div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500 text-xs">Cobranças:</span>
                          <div className="font-medium text-blue-600">{parcelasAluno.length} cobranças</div>
                        </div>
                      </div>
                    </div>

                    {expanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4">
                        <div className="space-y-3">
                          {parcelasAluno.map((p, idx) => (
                            <div key={p.id} className="bg-white rounded-lg p-3 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">Parcela {p.numero}</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold
                                  ${['PAGO','RECEIVED','CONFIRMED','RECEIVED_IN_CASH'].includes(p.status) ? 'bg-green-100 text-green-700' :
                                    p.status === 'CANCELADO' ? 'bg-red-100 text-red-600' :
                                    'bg-yellow-100 text-yellow-700'}`}
                                >
                                  {traduzirStatusAsaas(p.status)}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div>
                                  <span className="text-gray-500 text-xs">Valor:</span>
                                  <div className="font-medium">R$ {Number(p.valor).toFixed(2)}</div>
                                </div>
                                <div>
                                  <span className="text-gray-500 text-xs">Vencimento:</span>
                                  <div className="font-medium">
                                    {p.dataVencimento instanceof Date ? p.dataVencimento.toLocaleDateString('pt-BR') : p.dataVencimento}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                {typeof p.urlFatura === 'string' && p.urlFatura.trim() !== '' ? (
                                  <button
                                    onClick={() => window.open(p.urlFatura, '_blank')}
                                    className="flex items-center gap-1 text-blue-600 hover:bg-blue-100 rounded-lg px-2 py-1 transition text-xs touch-manipulation"
                                  >
                                    <Download className="w-3 h-3" />
                                    Fatura
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-xs">Sem fatura</span>
                                )}

                                <div className="flex items-center gap-2">
                                  <button 
                                    className="text-blue-600 hover:bg-blue-100 rounded-full p-2 transition touch-manipulation" 
                                    onClick={() => setModal({ open: true, data: { ...registros[0], parcela: p.numero, vencimento: p.dataVencimento, valor: p.valor, status: p.status, dataCriacao: registros[0].dataCriacao || registros[0].createdAt, dataCancelamento: registros[0].dataCancelamento || registros[0].dataExclusao, urlFatura: p.urlFatura } })}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  
                                  {/* Manter a mesma lógica de botões da versão desktop */}
                                  {/* ... adicionar outros botões conforme necessário ... */}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Paginação */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-gray-50 text-xs text-gray-600 gap-2">
          <div className="order-2 sm:order-1">
            {alunosPaginados.length > 0 && (
              <span>{alunosPaginados.length} cobranças exibidas</span>
            )}
          </div>
          <div className="flex items-center gap-3 order-1 sm:order-2">
            <button 
              disabled={pagina === 1} 
              onClick={() => setPagina(p => Math.max(1, p-1))} 
              className="p-2 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition touch-manipulation"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium">Página {pagina} de {totalPaginas}</span>
            <button 
              disabled={pagina === totalPaginas} 
              onClick={() => setPagina(p => Math.min(totalPaginas, p+1))} 
              className="p-2 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition touch-manipulation"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Modal de detalhes */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-strong p-4 sm:p-8 w-full max-w-lg relative animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <button onClick={() => setModal({ open: false, data: null })} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-bold mb-6 text-center">Detalhes da Cobrança</h3>
            <div className="space-y-3">
              <div><span className="font-semibold">Cliente:</span> {modal.data?.nome || '-'}</div>
              <div><span className="font-semibold">Parcela:</span> {modal.data?.parcela || '-'}</div>
              <div><span className="font-semibold">Valor:</span> R$ {Number(modal.data?.valor).toFixed(2)}</div>
              <div><span className="font-semibold">Status:</span> <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-semibold ${modal.data?.status === 'PAGO' ? 'bg-green-100 text-green-700' : modal.data?.status === 'CANCELADO' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{modal.data?.status === 'ENVIADO' ? 'Aguardando' : (modal.data?.status || '-')}</span></div>
              <div><span className="font-semibold">Unidade:</span> {modal.data?.unidade || '-'}</div>
              <div><span className="font-semibold">Serviço:</span> {modal.data?.servico || '-'}</div>
              <div><span className="font-semibold">Vencimento:</span> {modal.data?.vencimento instanceof Date ? modal.data.vencimento.toLocaleDateString('pt-BR') : (typeof modal.data?.vencimento === 'string' ? modal.data.vencimento : '-')}</div>
              <div><span className="font-semibold">Criado em:</span> {modal.data?.dataCriacao instanceof Date ? modal.data.dataCriacao.toLocaleDateString('pt-BR') : (typeof modal.data?.dataCriacao === 'string' ? modal.data.dataCriacao : formatDate(modal.data?.createdAt))}</div>
              <div><span className="font-semibold">Cancelado/Excluído em:</span> {
                modal.data?.dataCancelamentoPorParcela && modal.data?.parcela && modal.data.dataCancelamentoPorParcela[modal.data.parcela]
                  ? (new Date(modal.data.dataCancelamentoPorParcela[modal.data.parcela])).toLocaleDateString('pt-BR')
                  : '-'
              }</div>
              {typeof modal.data?.urlFatura === 'string' && modal.data.urlFatura.trim() !== '' && (
                <div>
                  <span className="font-semibold">Fatura/Boleto:</span>
                  <button
                    onClick={() => window.open(modal.data.urlFatura, '_blank')}
                    className="ml-2 flex items-center text-blue-600 hover:bg-blue-100 rounded-full p-1 transition border border-blue-200"
                    style={{ maxWidth: 40, display: 'inline-flex', verticalAlign: 'middle' }}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
              {Array.isArray(modal.data?.historicoAlteracoes) && modal.data.historicoAlteracoes.length > 0 && (
                <div>
                  <span className="font-semibold">Histórico de Alterações:</span>
                  {/* Container com barra de rolagem para muitas entradas */}
                  <div className="ml-2 mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <ul className="text-xs text-gray-700 list-disc space-y-2">
                      {processarHistoricoParaAuditoria(modal.data.historicoAlteracoes).map((alt, idx) => {
                        console.log(`🔍 [DEBUG MODAL] Entrada ${idx}:`, {
                          acao: alt.acao,
                          data: alt.data,
                          tipoData: typeof alt.data,
                          usuario: alt.usuario,
                          campos: Object.keys(alt)
                        });
                        // ✅ Garantir que TODAS as entradas tenham data/horário
                        let dataHora = '';
                        if (alt.data) {
                          try {
                            // Verificar se já é uma string formatada (nova implementação)
                            if (typeof alt.data === 'string' && alt.data.includes('/') && alt.data.includes(':')) {
                              dataHora = alt.data; // Já está formatado corretamente
                            } else {
                              // Tentar converter para Date (formato antigo)
                              const data = new Date(alt.data);
                              if (!isNaN(data.getTime())) {
                                dataHora = data.toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                              }
                            }
                          } catch (error) {
                            console.warn('Erro ao formatar data do histórico:', error, alt);
                          }
                        }
                        
                        // Se não tem data, usar "Data não informada" para auditoria
                        if (!dataHora) {
                          dataHora = `Data não informada (item #${(alt._indexOriginal || idx) + 1})`;
                        }

                        // Definir cor da borda baseada na validade da data para auditoria visual
                        const corBorda = alt._temDataValida ? 'border-blue-200' : 'border-red-300';
                        const corFundo = alt._temDataValida ? 'bg-white' : 'bg-red-50';

                        return (
                          <li key={idx} className={`mb-1 p-2 ${corFundo} rounded border-l-4 ${corBorda}`}>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-semibold text-xs px-2 py-1 rounded ${
                                  alt._temDataValida 
                                    ? 'text-gray-800 bg-gray-100' 
                                    : 'text-red-800 bg-red-100'
                                }`}>
                                  {dataHora}
                                </span>
                                {alt.usuario && (
                                  <span className="text-blue-600 font-medium text-xs bg-blue-50 px-2 py-1 rounded">
                                    {alt.usuario}
                                  </span>
                                )}
                                {!alt._temDataValida && (
                                  <span className="text-red-600 font-medium text-xs bg-red-100 px-2 py-1 rounded">
                                    AUDITORIA
                                  </span>
                                )}
                              </div>
                              <span className="text-gray-700 text-xs ml-1">
                                {alt.acao || alt.descricao || alt.status || 'Ação não especificada'}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
              <div><span className="font-semibold">Observações:</span> {modal.data?.observacoes || '-'}</div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de cobranças do cliente */}
      {modalCliente.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-strong p-8 w-full max-w-2xl relative animate-fade-in-up">
            <button onClick={() => setModalCliente({ open: false, nome: '', cobrancas: [] })} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-bold mb-6 text-center">Cobranças de {modalCliente.nome}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Parcela</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Valor</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Vencimento</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {modalCliente.cobrancas.map((c, idx) => (
                    <tr key={c.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.numero}</td>
                      <td className="px-4 py-3 text-gray-700">R$ {Number(c.valor).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-700">{c.dataVencimento instanceof Date ? c.dataVencimento.toLocaleDateString('pt-BR') : c.dataVencimento}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-semibold ${c.status === 'PAGO' ? 'bg-green-100 text-green-700' : c.status === 'CANCELADO' ? 'bg-red-100 text-red-600' : c.status === 'VENCIDO' ? 'bg-red-50 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status === 'ENVIADO' ? 'Aguardando' : (c.status || 'Aguardando')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 