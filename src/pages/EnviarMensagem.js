import React, { useState } from 'react';
import { useUnitSelection } from '../hooks/useUnitSelection';
import { MessageSquare, Phone, User, Send } from 'lucide-react';
import InputMask from 'react-input-mask';
import toast from 'react-hot-toast';
import { messagesService } from '../services/messagesService';
import { useAuth } from '../contexts/AuthContext';
import { getQuickMessages } from '../services/quickMessagesService';

export default function EnviarMensagem() {
  const { 
    selectedUnit, 
    getUnitDisplayName 
  } = useUnitSelection();
  const { isAdmin, unidades: unidadesUsuario } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    whatsapp: '',
    tipoMensagem: '',
    unidade: isAdmin ? '' : (selectedUnit || '')
  });
  const [modelos, setModelos] = useState([]);

  // Atualizar unidade no form quando selectedUnit mudar (apenas para não-admin)
  React.useEffect(() => {
    if (!isAdmin) {
      setFormData(prev => ({
        ...prev,
        unidade: selectedUnit || ''
      }));
    }
  }, [selectedUnit, isAdmin]);

  React.useEffect(() => {
    async function loadModelos() {
      const all = await getQuickMessages();
      setModelos(all.filter(m => m.ativa));
    }
    loadModelos();
  }, []);

  const getFirstName = (fullName) => {
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    return names[0].charAt(0).toUpperCase() + names[0].slice(1).toLowerCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.unidade) {
      toast.error('⚠️ Por favor, selecione uma unidade');
      return;
    }
    const firstName = getFirstName(formData.nomeCompleto);
    const modeloSelecionado = modelos.find(m => m.id === formData.tipoMensagem);
    const messageData = {
      nome: firstName,
      whatsapp: messagesService.cleanWhatsApp(formData.whatsapp),
      tipoMensagem: modeloSelecionado?.titulo || '',
      unidade: formData.unidade,
      mensagemPersonalizada: modeloSelecionado?.texto.replace('{{nome}}', firstName || 'Aluno')
    };
    const validation = messagesService.validateMessage(messageData);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }
    setLoading(true);
    try {
      let result;
      if (["Boas-vindas", "Comercial", "Chamar Cliente"].includes(messageData.tipoMensagem)) {
        result = await messagesService.sendMessageToWebhook(messageData);
        await messagesService.saveMessageHistory(messageData, result);
      } else {
        result = await messagesService.sendMessage(messageData);
        await messagesService.saveMessageHistory(messageData, result);
      }
      if (result.success) {
        toast.success('Mensagem enviada com sucesso!');
        setFormData({ nomeCompleto: '', whatsapp: '', tipoMensagem: '', unidade: selectedUnit || '' });
      } else {
        toast.error(result.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      // Salvar histórico mesmo em caso de erro
      const webhookResponse = error?.response?.data || { success: false, message: error.message || 'Erro desconhecido' };
      await messagesService.saveMessageHistory(messageData, webhookResponse);
      toast.error('Erro inesperado. Verifique sua conexão e tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enviar Mensagem</h1>
            <p className="text-gray-600">Envie mensagens via WhatsApp para os alunos</p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Se admin, campo de seleção de unidade antes dos dados do destinatário */}
          {isAdmin && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                {/* <Building2 className="w-5 h-5 mr-2 text-blue-600" /> */}
                Selecione a Unidade
              </h3>
              <select
                className="input-field h-12"
                value={formData.unidade}
                onChange={e => setFormData({ ...formData, unidade: e.target.value })}
                required
              >
                <option value="">Selecione a unidade</option>
                {[...new Set([...(unidadesUsuario || []), 'Comercial'])].map((unidade) => (
                  <option key={unidade} value={unidade}>{getUnitDisplayName(unidade)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Seção 1: Dados do Destinatário */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Dados do Destinatário
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Nome Completo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nome Completo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    className="input-field pl-10 h-12"
                    placeholder="Digite o nome completo do aluno"
                    value={formData.nomeCompleto}
                    onChange={(e) => setFormData({...formData, nomeCompleto: e.target.value})}
                  />
                </div>
                {formData.nomeCompleto && (
                  <p className="text-sm text-gray-500">
                    Primeiro nome: <span className="font-medium text-blue-600">{getFirstName(formData.nomeCompleto)}</span>
                  </p>
                )}
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  WhatsApp *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <InputMask
                    mask="(99) 99999-9999"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    className="input-field pl-10 h-12"
                    placeholder="Digite o WhatsApp (11) 99999-9999"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Adicionar cards de seleção de mensagem antes do botão de envio */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              Selecione o tipo de mensagem
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modelos.map((modelo) => (
                <div
                  key={modelo.id}
                  className={`cursor-pointer border rounded-lg p-4 shadow-sm transition-all duration-200 ${formData.tipoMensagem === modelo.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}`}
                  onClick={() => setFormData({ ...formData, tipoMensagem: modelo.id })}
                >
                  <div className="font-bold text-blue-700 mb-2">{modelo.titulo}</div>
                  <div className="text-xs inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold mb-2">{modelo.categoria || 'Sem categoria'}</div>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {modelo.texto.replace('{{nome}}', getFirstName(formData.nomeCompleto) || 'Aluno')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview da mensagem selecionada */}
          {formData.tipoMensagem && (
            <div className="my-6 p-4 bg-gray-100 rounded border border-blue-200">
              <div className="font-semibold text-blue-700 mb-2">Pré-visualização da mensagem:</div>
              <div className="whitespace-pre-line text-gray-800">
                {modelos.find(m => m.id === formData.tipoMensagem)?.texto.replace('{{nome}}', getFirstName(formData.nomeCompleto) || 'Aluno')}
              </div>
            </div>
          )}

          {/* Botão de Envio */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2 px-8 py-3 text-base font-medium"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Enviar Mensagem</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 