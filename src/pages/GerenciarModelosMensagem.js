import React, { useEffect, useState } from 'react';
import { getQuickMessages, addQuickMessage, updateQuickMessage, deleteQuickMessage } from '../services/quickMessagesService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, X } from 'lucide-react';

const DEFAULT_MESSAGES = [
  {
    titulo: 'Boas-vindas',
    texto: `Seja muito bem-vindo(a) à nossa Central Oficial e Verificada do Grupo Ideal Sorocaba! Este novo canal de atendimento foi criado para oferecer um contato ainda mais ágil, seguro e estável com você.\n\nPor favor, salve este número para receber lembretes, novidades e todo tipo de comunicação relacionada à sua unidade de ensino.\n\nAgradecemos a sua compreensão e pedimos desculpas por qualquer transtorno causado durante essa transição. Conte sempre conosco!\n\nAtenciosamente,\nEquipe Grupo Ideal Sorocaba`,
    categoria: 'Automática',
    ativa: true
  },
  {
    titulo: 'Comercial',
    texto: `Olá, {{nome}}! 👋\nNotamos que você demonstrou interesse em tirar sua CNH com a gente e estamos prontos para te ajudar a dar o próximo passo.\nQueremos saber: ainda está em busca da melhor opção? Podemos te ajudar com condições especiais! 🚗💙\nClique no botão abaixo pra conversar com a gente rapidinho.`,
    categoria: 'Comercial',
    ativa: true
  },
  {
    titulo: 'Chamar Cliente',
    texto: `Temos um recado importante pra você!\nOlá {{nome}}! Nossa equipe precisa falar com você sobre assuntos importantes relacionados ao seu processo de habilitação.\nPor favor, entre em contato conosco o mais breve possível.\nClique para ativar a conversa! 📞`,
    categoria: 'Atendimento',
    ativa: true
  }
];

export default function GerenciarModelosMensagem() {
  const { user } = useAuth();
  const [modelos, setModelos] = useState([]);
  const [msgModal, setMsgModal] = useState({ open: false, mode: 'new', data: { titulo: '', texto: '', categoria: '', ativa: true } });
  const [msgLoading, setMsgLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  useEffect(() => {
    if (user?.perfil === 'admin') loadMessages();
  }, [user]);

  const loadMessages = async () => {
    setMsgLoading(true);
    let msgs = await getQuickMessages();
    // Se não houver mensagens, popular com os padrões
    if (msgs.length === 0) {
      for (const m of DEFAULT_MESSAGES) {
        await addQuickMessage(m);
      }
      msgs = await getQuickMessages();
    }
    setModelos(msgs);
    setMsgLoading(false);
  };

  const openMsgModal = (mode, data = null) => {
    setMsgModal({ open: true, mode, data: data || { titulo: '', texto: '', categoria: '', ativa: true } });
  };
  const closeMsgModal = () => setMsgModal({ ...msgModal, open: false });

  const handleMsgSave = async (e) => {
    e.preventDefault();
    setMsgLoading(true);
    try {
      if (msgModal.mode === 'new') {
        await addQuickMessage(msgModal.data);
        toast.success('Mensagem criada!');
      } else {
        await updateQuickMessage(msgModal.data.id, msgModal.data);
        toast.success('Mensagem atualizada!');
      }
      setModelos(await getQuickMessages());
      closeMsgModal();
    } catch (err) {
      toast.error('Erro ao salvar mensagem: ' + err.message);
    } finally {
      setMsgLoading(false);
    }
  };
  const handleMsgDelete = async (id) => {
    if (!window.confirm('Excluir esta mensagem?')) return;
    setMsgLoading(true);
    try {
      await deleteQuickMessage(id);
      setModelos(await getQuickMessages());
      toast.success('Mensagem excluída!');
    } catch (err) {
      toast.error('Erro ao excluir: ' + err.message);
    } finally {
      setMsgLoading(false);
    }
  };

  if (user?.perfil !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600">Apenas administradores podem gerenciar modelos de mensagem.</p>
        </div>
      </div>
    );
  }

  // Contagem para cards
  const total = modelos.length;
  const ativos = modelos.filter(m => m.ativa).length;
  const inativos = modelos.filter(m => !m.ativa).length;

  return (
    <div className="page-container-xl space-y-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Gerenciar Modelos de Mensagem</h1>
      {/* Cards de estatísticas */}
      <div className="stats-grid mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600 mb-1">Total de Modelos</span>
          <span className="text-2xl font-bold text-gray-900">{total}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6 flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600 mb-1">Ativos</span>
          <span className="text-2xl font-bold text-green-600">{ativos}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center">
          <span className="text-sm font-medium text-gray-600 mb-1">Inativos</span>
          <span className="text-2xl font-bold text-gray-400">{inativos}</span>
        </div>
      </div>
              <div className="w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-6 flex justify-between items-center">
          <span className="text-lg font-semibold">Modelos Cadastrados</span>
          <button className="btn-primary flex items-center gap-2 px-5 py-2.5 text-base" onClick={() => openMsgModal('new')}>
            <Plus className="w-5 h-5" /> Nova Mensagem
          </button>
        </div>
        {/* Lista de modelos no padrão visual do histórico */}
        <div className="space-y-4">
          {msgLoading ? (
            <div className="text-center py-12 text-gray-400">Carregando...</div>
          ) : modelos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhuma mensagem cadastrada</div>
          ) : modelos.map(msg => (
            <div key={msg.id} className="flex flex-col md:flex-row md:items-center justify-between bg-gray-50 border border-gray-100 rounded-xl shadow-sm px-6 py-5 gap-4 hover:shadow-md transition">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="text-lg font-bold text-gray-900">{msg.titulo}</span>
                  {msg.categoria && <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-semibold">{msg.categoria}</span>}
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-semibold ${msg.ativa ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{msg.ativa ? 'Ativa' : 'Inativa'}</span>
                </div>
                <div className="text-gray-700 text-base whitespace-pre-line break-words max-w-3xl">
                  {expanded[msg.id] || msg.texto.length <= 180 ? (
                    <>
                      {msg.texto}
                      {msg.texto.length > 180 && (
                        <span className="text-blue-500 cursor-pointer ml-2" onClick={() => toggleExpand(msg.id)}>ver menos</span>
                      )}
                    </>
                  ) : (
                    <>
                      {msg.texto.slice(0, 180)}... <span className="text-blue-500 cursor-pointer" onClick={() => toggleExpand(msg.id)}>ver mais</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2 md:gap-4 items-center mt-4 md:mt-0">
                <button title="Editar" className="text-blue-600 hover:bg-blue-100 rounded-full p-2 transition" onClick={() => openMsgModal('edit', msg)}>
                  <Edit3 className="w-5 h-5" />
                </button>
                <button title="Excluir" className="text-red-600 hover:bg-red-100 rounded-full p-2 transition" onClick={() => handleMsgDelete(msg.id)}>
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Modal de mensagem */}
      {msgModal.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-strong p-8 w-full max-w-lg relative animate-fade-in-up">
            <button onClick={closeMsgModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-bold mb-6 text-center">{msgModal.mode === 'new' ? 'Nova Mensagem' : 'Editar Mensagem'}</h3>
            <form onSubmit={handleMsgSave} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Título</label>
                <input type="text" className="input-field text-base py-3" value={msgModal.data.titulo} onChange={e => setMsgModal(m => ({ ...m, data: { ...m.data, titulo: e.target.value } }))} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Texto</label>
                <textarea className="input-field text-base py-3" rows={5} value={msgModal.data.texto} onChange={e => setMsgModal(m => ({ ...m, data: { ...m.data, texto: e.target.value } }))} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Categoria</label>
                <input type="text" className="input-field text-base py-3" value={msgModal.data.categoria} onChange={e => setMsgModal(m => ({ ...m, data: { ...m.data, categoria: e.target.value } }))} />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <input type="checkbox" id="ativa" checked={msgModal.data.ativa} onChange={e => setMsgModal(m => ({ ...m, data: { ...m.data, ativa: e.target.checked } }))} className="w-5 h-5" />
                <label htmlFor="ativa" className="text-base">Ativa</label>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" className="btn-secondary px-6 py-2.5 text-base" onClick={closeMsgModal}>Cancelar</button>
                <button type="submit" className="btn-primary px-6 py-2.5 text-base" disabled={msgLoading}>{msgLoading ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 