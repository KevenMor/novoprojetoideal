import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
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

// Função utilitária para obter data/hora no fuso de Brasília
function getDataHoraBrasil() {
  const now = new Date();
  // Ajusta para UTC-3 (Brasília)
  const brasilOffset = -3 * 60; // minutos
  const localOffset = now.getTimezoneOffset();
  const diff = brasilOffset - localOffset;
  return new Date(now.getTime() + diff * 60000);
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
  const { isAdmin, userProfile } = useAuth();
  const [modalCliente, setModalCliente] = useState({ open: false, nome: '', cobrancas: [] });
  const [expandedCliente, setExpandedCliente] = useState(null);
  const [showFiltros, setShowFiltros] = useState(false);

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

  const aguardandoParcelas = todasParcelasFiltradas.filter(p =>
    statusAguardando.includes(p.status) &&
    (!p.dataVencimento || new Date(p.dataVencimento).setHours(0,0,0,0) >= hoje.getTime())
  );
  const valorAguardando = aguardandoParcelas.reduce((sum, p) => sum + p.valor, 0);

  const parcelasAtrasadas = todasParcelasFiltradas.filter(p =>
    statusAguardando.includes(p.status) &&
    p.dataVencimento && new Date(p.dataVencimento).setHours(0,0,0,0) < hoje.getTime()
  );
  const valorAtrasado = parcelasAtrasadas.reduce((sum, p) => sum + p.valor, 0);

  const pagasParcelas = todasParcelasFiltradas.filter(p => statusPago.includes(p.status));
  const valorPago = pagasParcelas.reduce((sum, p) => sum + p.valor, 0);

  const totalParcelas = todasParcelasFiltradas.length;
  const taxaInadimplencia = totalParcelas > 0 ? ((parcelasAtrasadas.length / totalParcelas) * 100).toFixed(1) : '0.0';

  // Agrupar cobranças filtradas por CPF padronizado
  const alunos = {};
  filtradas.forEach(c => {
    const cpf = (c.cpf || '').replace(/\D/g, ''); // só números
    if (!alunos[cpf]) alunos[cpf] = [];
    alunos[cpf].push(c);
  });

  // Filtro de busca por nome do aluno
  const alunosFiltrados = Object.entries(alunos).filter(([cpf, registros]) => {
    const nome = registros[0]?.nome || '-';
    return nome.toLowerCase().includes(buscaAluno.toLowerCase());
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
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Histórico de Cobranças</h1>
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full max-w-6xl mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600 mb-1">Total de Parcelas</span>
          <span className="text-2xl font-bold text-gray-900">{totalParcelas}</span>
        </div>
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
      </div>
      {/* Barra de busca e filtros ajustada */}
      <div className="w-full max-w-6xl flex flex-row items-center gap-2 mb-4">
        <input
          type="text"
          className="input-field max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg"
          placeholder="Buscar por nome do aluno..."
          value={buscaAluno}
          onChange={e => setBuscaAluno(e.target.value)}
        />
        <button
          className="btn-secondary flex items-center gap-1 px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50"
          onClick={() => setShowFiltros(v => !v)}
        >
          <Filter className="w-4 h-4" /> Filtros
        </button>
      </div>
      {showFiltros && (
        <div className="w-full max-w-6xl bg-white rounded-xl shadow p-6 mb-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unidade</label>
              <select className="input-field" value={filtros.unidade} onChange={e => {
                setFiltros(f => ({ ...f, unidade: e.target.value }));
                setShowFiltros(false); // fecha filtros ao selecionar
                setPagina(1); // volta para página 1
              }}>
                <option value="">Todas</option>
                {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cadastro: de</label>
              <input type="date" className="input-field" value={filtros.dataCadastroIni} onChange={e => setFiltros(f => ({ ...f, dataCadastroIni: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cadastro: até</label>
              <input type="date" className="input-field" value={filtros.dataCadastroFim} onChange={e => setFiltros(f => ({ ...f, dataCadastroFim: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vencimento: de</label>
              <input type="date" className="input-field" value={filtros.dataVencIni} onChange={e => setFiltros(f => ({ ...f, dataVencIni: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vencimento: até</label>
              <input type="date" className="input-field" value={filtros.dataVencFim} onChange={e => setFiltros(f => ({ ...f, dataVencFim: e.target.value }))} />
            </div>
          </div>
        </div>
      )}
      {/* Tabela resumida de clientes */}
      <div className="w-full max-w-6xl bg-white rounded-xl shadow border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
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
                return p.cpf && p.cpf.replace(/\D/g, '') === cpf;
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
                                      const cobrancaRef = doc(db, 'cobrancas', p.cobrancaId);
                                      const docSnap = await getDoc(cobrancaRef);
                                      const data = docSnap.data();
                                      const historicoAlteracoes = Array.isArray(data.historicoAlteracoes) ? [...data.historicoAlteracoes] : [];
                                      const parcelasPagas = Array.isArray(data.parcelasPagas) ? [...data.parcelasPagas] : [];
                                      if (!parcelasPagas.includes(p.numero)) parcelasPagas.push(p.numero);
                                      historicoAlteracoes.push({
                                        data: getDataHoraBrasil(),
                                        usuario: userProfile?.nome || 'Desconhecido',
                                        acao: `Parcela ${p.numero} marcada como paga`
                                      });
                                      // Se todas as parcelas estiverem pagas, status global = 'PAGO'
                                      const totalParcelas = data.parcelas || 1;
                                      let statusUpdate = {};
                                      if (parcelasPagas.length === Number(totalParcelas)) {
                                        statusUpdate.status = 'PAGO';
                                      }
                                      await updateDoc(cobrancaRef, { parcelasPagas, historicoAlteracoes, ...statusUpdate });
                                      setCobrancas(prev => prev.map(c => c.id === p.cobrancaId ? { ...c, parcelasPagas, historicoAlteracoes, ...(statusUpdate.status ? { status: statusUpdate.status } : {}) } : c));
                                      if (window.toast) toast.success('Cobrança marcada como paga!');
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  {p.status === 'PAGO' && isAdmin && (
                                    <button
                                      title="Desfazer pagamento confirmado"
                                      className="text-orange-600 hover:bg-orange-100 rounded-full p-1 transition"
                                      onClick={async () => {
                                        const cobrancaRef = doc(db, 'cobrancas', p.cobrancaId);
                                        const docSnap = await getDoc(cobrancaRef);
                                        const data = docSnap.data();
                                        const historicoAlteracoes = Array.isArray(data.historicoAlteracoes) ? [...data.historicoAlteracoes] : [];
                                        const parcelasPagas = Array.isArray(data.parcelasPagas) ? [...data.parcelasPagas] : [];
                                        const idx = parcelasPagas.indexOf(p.numero);
                                        if (idx !== -1) parcelasPagas.splice(idx, 1);
                                        historicoAlteracoes.push({
                                          data: getDataHoraBrasil(),
                                          usuario: userProfile?.nome || 'Desconhecido',
                                          acao: `Pagamento da parcela ${p.numero} desfeito`
                                        });
                                        await updateDoc(cobrancaRef, { parcelasPagas, historicoAlteracoes });
                                        setCobrancas(prev => prev.map(c => c.id === p.cobrancaId ? { ...c, parcelasPagas, historicoAlteracoes } : c));
                                        if (window.toast) toast.success('Pagamento desfeito!');
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
                                            const historicoAlteracoes = Array.isArray(data.historicoAlteracoes) ? [...data.historicoAlteracoes] : [];
                                            historicoAlteracoes.push({
                                              data: getDataHoraBrasil(),
                                              usuario: userProfile?.nome || 'Desconhecido',
                                              acao: `Exclusão da parcela ${p.numero} desfeita`
                                            });
                                            await updateDoc(cobrancaRef, { parcelasCanceladas: canceladas, dataCancelamentoPorParcela, historicoAlteracoes });
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
                                            const historicoAlteracoes = Array.isArray(data.historicoAlteracoes) ? [...data.historicoAlteracoes] : [];
                                            if (!canceladas.includes(p.numero)) {
                                              const now = new Date();
                                              historicoAlteracoes.push({
                                                data: getDataHoraBrasil(),
                                                usuario: userProfile?.nome || 'Desconhecido',
                                                acao: `Parcela ${p.numero} excluída`
                                              });
                                              await updateDoc(cobrancaRef, {
                                                parcelasCanceladas: [...canceladas, p.numero],
                                                dataCancelamentoPorParcela: { ...dataCancelamentoPorParcela, [p.numero]: now },
                                                historicoAlteracoes
                                              });
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
        {/* Paginação */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-xs text-gray-600">
          <div>
            {alunosPaginados.length > 0 && (
              <span>{alunosPaginados.length} cobranças exibidas</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button disabled={pagina === 1} onClick={() => setPagina(p => Math.max(1, p-1))} className="p-1 rounded disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <span>Página {pagina} de {totalPaginas}</span>
            <button disabled={pagina === totalPaginas} onClick={() => setPagina(p => Math.min(totalPaginas, p+1))} className="p-1 rounded disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
      {/* Modal de detalhes */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-strong p-8 w-full max-w-lg relative animate-fade-in-up">
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
                  <ul className="ml-2 mt-1 text-xs text-gray-700 list-disc">
                    {modal.data.historicoAlteracoes.map((alt, idx) => {
                      let dataHora = '';
                      if (alt.data) {
                        const data = new Date(alt.data);
                        dataHora = data.toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      }
                      return (
                        <li key={idx} className="mb-1">
                          <span className="font-medium text-gray-600">{dataHora}</span>
                          {alt.usuario && <span className="text-blue-600"> • {alt.usuario}</span>}
                          <span className="text-gray-800"> • {alt.acao || alt.descricao || alt.status}</span>
                        </li>
                      );
                    })}
                  </ul>
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