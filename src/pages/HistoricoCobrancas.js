import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Calendar, CheckCircle, X, DollarSign, User, FileText, Eye, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useUnitFilter } from '../contexts/UnitFilterContext';
import * as XLSX from 'xlsx';

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

export default function HistoricoCobrancas() {
  const { availableUnits } = useUnitFilter();
  const [cobrancas, setCobrancas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    unidade: '',
    dataCadastroIni: '',
    dataCadastroFim: '',
    dataVencIni: '',
    dataVencFim: ''
  });
  const [modal, setModal] = useState({ open: false, data: null });
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const q = query(collection(db, 'cobrancas'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setCobrancas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    load();
  }, []);

  // Agrupar por aluno (nome + cpf)
  const agrupadas = cobrancas.reduce((acc, c) => {
    const key = (c.nome || '-') + '|' + (c.cpf || '-');
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  // Estatísticas
  const total = cobrancas.length;
  const pagas = cobrancas.filter(c => c.status === 'PAGO').length;
  const aguardando = cobrancas.filter(c => c.status === 'AGUARDANDO' || c.status === 'ENVIADO').length;
  const canceladas = cobrancas.filter(c => c.status === 'CANCELADO').length;

  // Filtro
  const filtradas = cobrancas.filter(c => {
    if (filtros.unidade && c.unidade !== filtros.unidade) return false;
    if (filtros.dataCadastroIni) {
      const d = c.dataCriacao?.toDate ? c.dataCriacao.toDate() : new Date(c.dataCriacao);
      if (d < new Date(filtros.dataCadastroIni)) return false;
    }
    if (filtros.dataCadastroFim) {
      const d = c.dataCriacao?.toDate ? c.dataCriacao.toDate() : new Date(c.dataCriacao);
      if (d > new Date(filtros.dataCadastroFim + 'T23:59:59')) return false;
    }
    if (filtros.dataVencIni) {
      const d = new Date(c.dataVencimento);
      if (d < new Date(filtros.dataVencIni)) return false;
    }
    if (filtros.dataVencFim) {
      const d = new Date(c.dataVencimento);
      if (d > new Date(filtros.dataVencFim + 'T23:59:59')) return false;
    }
    return true;
  });

  // Exportar Excel (agrupado)
  const exportarExcel = () => {
    const dados = cobrancas.map(c => ({
      Cliente: c.nome || '-',
      CPF: c.cpf || '-',
      Valor: `R$ ${Number(c.valor || c.valorTotal).toFixed(2)}`,
      Parcelas: c.parcelas || 1,
      Vencimento: c.dataVencimento || '-',
      Status: c.status || 'Aguardando',
      Unidade: c.unidade || '-',
      'Criado em': formatDate(c.dataCriacao || c.createdAt),
      Serviço: c.servico || '-',
      Observações: c.observacoes || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cobranças');
    XLSX.writeFile(wb, 'historico_cobrancas.xlsx');
  };

  // Gerar parcelas previstas para cada cobrança
  function gerarParcelas(c) {
    const parcelas = [];
    const n = Number(c.parcelas) || 1;
    const valor = Number(c.valorParcela || c.valor || c.valorTotal) || 0;
    let dataBase = c.dataVencimento;
    if (!dataBase) return [{
      numero: 1,
      valor,
      status: c.status,
      dataVencimento: '-',
      id: c.id
    }];
    for (let i = 0; i < n; i++) {
      let data;
      if (i === 0) {
        data = new Date(dataBase);
      } else {
        data = addDays(new Date(dataBase), 30 * i);
      }
      parcelas.push({
        numero: i + 1,
        valor,
        status: c.status,
        dataVencimento: data.toLocaleDateString('pt-BR'),
        id: c.id + '-' + (i + 1)
      });
    }
    return parcelas;
  }

  // Agrupar cobranças filtradas por aluno
  const alunos = {};
  filtradas.forEach(c => {
    const key = (c.nome || '-') + '|' + (c.cpf || '-');
    if (!alunos[key]) alunos[key] = [];
    alunos[key].push(c);
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Histórico de Cobranças</h1>
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-6xl mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600 mb-1">Total</span>
          <span className="text-2xl font-bold text-gray-900">{total}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-yellow-100 p-6 flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600 mb-1">Aguardando</span>
          <span className="text-2xl font-bold text-yellow-600">{aguardando}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6 flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600 mb-1">Pagas</span>
          <span className="text-2xl font-bold text-green-600">{pagas}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600 mb-1">Canceladas</span>
          <span className="text-2xl font-bold text-red-600">{canceladas}</span>
        </div>
      </div>
      {/* Filtros */}
      <div className="w-full max-w-6xl bg-white rounded-xl shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Unidade</label>
            <select className="input-field" value={filtros.unidade} onChange={e => setFiltros(f => ({ ...f, unidade: e.target.value }))}>
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
      {/* Agrupamento por aluno com accordion */}
      <div className="w-full max-w-6xl">
        {Object.entries(alunos).length === 0 && (
          <div className="text-center py-8 text-gray-400">Nenhuma cobrança encontrada</div>
        )}
        {Object.entries(alunos).map(([key, registros]) => {
          const [nome, cpf] = key.split('|');
          // Se houver mais de uma parcela, mostrar accordion
          const temParcelas = registros.some(c => (Number(c.parcelas) || 1) > 1);
          const primeira = registros[0];
          const parcelas = temParcelas ? gerarParcelas(primeira) : [{
            numero: 1,
            valor: Number(primeira.valorParcela || primeira.valor || primeira.valorTotal),
            status: primeira.status,
            dataVencimento: primeira.dataVencimento,
            id: primeira.id
          }];
          return (
            <div key={key} className="bg-white rounded-xl shadow mb-4 border border-gray-100">
              <button
                className="w-full flex items-center justify-between px-6 py-4 focus:outline-none hover:bg-blue-50/40 transition rounded-t-xl"
                onClick={() => setExpanded(e => ({ ...e, [key]: !e[key] }))}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                  <span className="font-bold text-lg text-gray-900">{nome}</span>
                  <span className="text-gray-500 text-sm">CPF: {cpf}</span>
                  <span className="text-gray-500 text-sm">Unidade: {primeira.unidade || '-'}</span>
                  <span className="text-gray-500 text-sm">Serviço: {primeira.servico || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{temParcelas ? `${parcelas.length} parcelas` : 'Cobrança única'}</span>
                  {expanded[key] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>
              {expanded[key] && (
                <div className="px-6 pb-6 pt-2">
                  <table className="min-w-full bg-white rounded-xl">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Parcela</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Valor</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Vencimento</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcelas.map((p, idx) => (
                        <tr key={p.id} className="border-b last:border-b-0 hover:bg-blue-50/30 transition">
                          <td className="px-4 py-3 font-medium text-gray-900">{p.numero}</td>
                          <td className="px-4 py-3 text-gray-700">R$ {Number(p.valor).toFixed(2)}</td>
                          <td className="px-4 py-3 text-gray-700">{p.dataVencimento}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-semibold ${p.status === 'PAGO' ? 'bg-green-100 text-green-700' : p.status === 'CANCELADO' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>{p.status === 'ENVIADO' ? 'Aguardando' : (p.status || 'Aguardando')}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button title="Visualizar" className="text-blue-600 hover:bg-blue-100 rounded-full p-2 transition" onClick={() => setModal({ open: true, data: { ...primeira, parcela: p.numero, vencimento: p.dataVencimento, valor: p.valor } })}>
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
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
              <div><span className="font-semibold">Vencimento:</span> {modal.data?.vencimento || '-'}</div>
              <div><span className="font-semibold">Criado em:</span> {formatDate(modal.data?.dataCriacao || modal.data?.createdAt)}</div>
              <div><span className="font-semibold">Observações:</span> {modal.data?.observacoes || '-'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 