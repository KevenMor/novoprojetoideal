import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { CheckCircle, X, Clock, MessageSquare, Filter, Trash2, Download, Smartphone } from 'lucide-react';
import { useUnitSelection } from '../hooks/useUnitSelection';

function exportToCSV(data) {
  const headers = ['Nome', 'Tipo', 'WhatsApp', 'Unidade', 'Data/Hora', 'Status', 'Retorno'];
  const rows = data.map(msg => [
    msg.nome,
    msg.tipoMensagem,
    msg.whatsapp,
    msg.unidade,
    msg.dataEnvio?.seconds ? new Date(msg.dataEnvio.seconds * 1000).toLocaleString('pt-BR') : '',
    msg.status,
    msg.mensagemRetorno
  ]);
  let csv = [headers, ...rows].map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'historico_mensagens.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoricoMensagens() {
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    unidade: '',
    tipo: '',
    status: '',
    dataInicial: '',
    dataFinal: ''
  });
  const { availableUnits, getUnitDisplayName } = useUnitSelection();
  const [showTooltip, setShowTooltip] = useState(null);

  useEffect(() => {
    const fetchMensagens = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'historico_mensagens'), orderBy('dataEnvio', 'desc'));
        const snapshot = await getDocs(q);
        const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMensagens(lista);
      } catch (error) {
        console.error('Erro ao buscar histórico de mensagens:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMensagens();
  }, []);

  // Filtros locais
  const mensagensFiltradas = mensagens.filter(msg => {
    const matchUnidade = !filtros.unidade || msg.unidade === filtros.unidade;
    const matchTipo = !filtros.tipo || msg.tipoMensagem === filtros.tipo;
    const matchStatus = !filtros.status || msg.status === filtros.status;
    let matchData = true;
    if (filtros.dataInicial) {
      const dataMsg = msg.dataEnvio?.seconds ? new Date(msg.dataEnvio.seconds * 1000) : new Date(msg.dataEnvio);
      const dataIni = new Date(filtros.dataInicial);
      matchData = matchData && dataMsg >= dataIni;
    }
    if (filtros.dataFinal) {
      const dataMsg = msg.dataEnvio?.seconds ? new Date(msg.dataEnvio.seconds * 1000) : new Date(msg.dataEnvio);
      const dataFim = new Date(filtros.dataFinal);
      matchData = matchData && dataMsg <= dataFim;
    }
    return matchUnidade && matchTipo && matchStatus && matchData;
  });

  const filtrosAtivos = Object.values(filtros).some(v => v);

  const limparFiltros = () => setFiltros({ unidade: '', tipo: '', status: '', dataInicial: '', dataFinal: '' });

  const getStatusBadge = (status) => {
    if (status === 'success') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100"><CheckCircle className="w-4 h-4" /> Enviado</span>;
    } else if (status === 'error') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100"><X className="w-4 h-4" /> Erro</span>;
    } else {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100"><Clock className="w-4 h-4" /> Pendente</span>;
    }
  };

  const getTipoBadge = (tipo) => {
    const cores = {
      'Boas-vindas': 'bg-blue-50 text-blue-700 border-blue-100',
      'Comercial': 'bg-indigo-50 text-indigo-700 border-indigo-100',
      'Chamar Cliente': 'bg-teal-50 text-teal-700 border-teal-100'
    };
    return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${cores[tipo] || 'bg-gray-50 text-gray-700 border-gray-100'}`}><MessageSquare className="w-4 h-4" /> {tipo}</span>;
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 px-2">
      {/* Filtros visualmente destacados */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4 items-end border border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Unidade</label>
          <select className="w-48 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200" value={filtros.unidade} onChange={e => setFiltros({ ...filtros, unidade: e.target.value })}>
            <option value="">Todas</option>
            {availableUnits.map(unit => (
              <option key={unit} value={unit}>{getUnitDisplayName(unit)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
          <select className="w-40 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200" value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}>
            <option value="">Todos</option>
            <option value="Boas-vindas">Boas-vindas</option>
            <option value="Comercial">Comercial</option>
            <option value="Chamar Cliente">Chamar Cliente</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select className="w-36 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200" value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })}>
            <option value="">Todos</option>
            <option value="success">Enviado</option>
            <option value="error">Erro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data Inicial</label>
          <input type="date" className="w-36 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200" value={filtros.dataInicial} onChange={e => setFiltros({ ...filtros, dataInicial: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data Final</label>
          <input type="date" className="w-36 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200" value={filtros.dataFinal} onChange={e => setFiltros({ ...filtros, dataFinal: e.target.value })} />
        </div>
        <div className="flex gap-2 items-center mt-2 md:mt-0">
          <button onClick={() => exportToCSV(mensagensFiltradas)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition"><Download className="w-4 h-4" /> Exportar CSV</button>
          {filtrosAtivos && <button onClick={limparFiltros} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /> Limpar</button>}
        </div>
      </div>
      {/* Tabela visual no padrão contas cadastradas */}
      {loading ? (
        <div className="text-center text-gray-500">Carregando...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100">
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">WhatsApp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unidade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Retorno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mensagensFiltradas.map((msg, idx) => (
                  <tr key={msg.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{msg.nome}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{getTipoBadge(msg.tipoMensagem)}</td>
                    <td className="px-4 py-2 whitespace-nowrap flex items-center gap-2"><Smartphone className="w-4 h-4 text-green-600" />{msg.whatsapp}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{getUnitDisplayName(msg.unidade)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(msg.dataEnvio)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{getStatusBadge(msg.status)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600 relative">
                      {msg.mensagemRetorno && msg.mensagemRetorno.length > 30 ? (
                        <span
                          onMouseEnter={() => setShowTooltip(msg.id)}
                          onMouseLeave={() => setShowTooltip(null)}
                          className="cursor-pointer underline decoration-dotted"
                        >
                          {msg.mensagemRetorno.slice(0, 30)}... 
                          {showTooltip === msg.id && (
                            <span className="absolute z-20 left-0 top-full mt-1 w-64 p-2 bg-white border border-gray-200 rounded shadow text-xs text-gray-800">
                              {msg.mensagemRetorno}
                            </span>
                          )}
                        </span>
                      ) : (
                        msg.mensagemRetorno
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mensagensFiltradas.length === 0 && (
            <div className="text-center text-gray-500 py-8">Nenhuma mensagem encontrada com os filtros selecionados.</div>
          )}
        </div>
      )}
    </div>
  );
} 