import React, { useState } from 'react';
import { useUnitSelection } from '../hooks/useUnitSelection';
import { MessageSquare, Phone, User, Send, Eye, Building2 } from 'lucide-react';
import InputMask from 'react-input-mask';
import toast from 'react-hot-toast';
import { messagesService } from '../services/messagesService';

export default function EnviarMensagem() {
  const { 
    selectedUnit, 
    availableUnits, 
    handleUnitChange, 
    getUnitDisplayName, 
    shouldShowUnitSelector 
  } = useUnitSelection();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    whatsapp: '',
    tipoMensagem: '',
    unidade: selectedUnit
  });

  // Atualizar unidade no form quando selectedUnit mudar
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      unidade: selectedUnit || ''
    }));
  }, [selectedUnit]);

  const tiposMensagem = [
    { value: 'Boas-vindas', label: 'Boas-vindas' },
    { value: 'Chamar Cliente', label: 'Chamar Cliente' }
  ];

  const getFirstName = (fullName) => {
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    return names[0].charAt(0).toUpperCase() + names[0].slice(1).toLowerCase();
  };

  const getMessagePreview = (tipo, nome) => {
    const firstName = getFirstName(nome);
    
    switch (tipo) {
      case 'Boas-vindas':
        return `Bem-vindo(a) à Autoescola Ideal! 
É uma alegria ter você como nosso aluno! A partir de agora, você terá acesso a um ensino de qualidade e profissionais dedicados para te ajudar a conquistar sua habilitação.

Seja bem-vindo(a) à família Autoescola Ideal! 🚗✨`;
        
      case 'Chamar Cliente':
        return `Temos um recado importante pra você!
Olá ${firstName}! Nossa equipe precisa falar com você sobre assuntos importantes relacionados ao seu processo de habilitação.

Por favor, entre em contato conosco o mais breve possível.

Clique para ativar a conversa! 📞`;
        
      default:
        return '💬 Selecione um tipo de mensagem para ver o preview';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar se unidade está selecionada
    if (!formData.unidade) {
      toast.error('⚠️ Por favor, selecione uma unidade');
      return;
    }
    
    // Preparar dados da mensagem
    const messageData = {
      nome: formData.nomeCompleto.trim(),
      whatsapp: messagesService.cleanWhatsApp(formData.whatsapp),
      tipoMensagem: formData.tipoMensagem,
      unidade: formData.unidade,
      mensagemPersonalizada: null
    };

    // Validar dados usando o serviço
    const validation = messagesService.validateMessage(messageData);
    
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    
    try {
      console.log('📤 Enviando mensagem com persistência no Firestore:', messageData);
      
      const result = await messagesService.sendMessage(messageData);
      
      if (result.success) {
        toast.success(result.message || 'Mensagem enviada com sucesso!');
        console.log('✅ Mensagem salva no Firestore e enviada via webhook. ID:', result.data?.id);
        
        // Reset form
        setFormData({
          nomeCompleto: '',
          whatsapp: '',
          tipoMensagem: '',
          unidade: selectedUnit || ''
        });
      } else {
        toast.error(result.error || 'Erro ao enviar mensagem');
        
        if (result.messageId) {
          console.log('🔄 Mensagem salva no Firestore mas falhou no webhook. ID para retry:', result.messageId);
          toast.info('Mensagem foi salva e pode ser reenviada mais tarde.');
        }
      }
      
    } catch (error) {
      console.error('❌ Erro inesperado ao enviar mensagem:', error);
      toast.error('Erro inesperado. Verifique sua conexão e tente novamente.');
    } finally {
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

          {/* Seção 2: Configurações da Mensagem */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              Configurações da Mensagem
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Unidade */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Unidade *
                </label>
                {shouldShowUnitSelector && availableUnits.length > 0 ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      required
                      className="input-field pl-10 h-12"
                      value={formData.unidade}
                      onChange={(e) => {
                        const unit = e.target.value;
                        setFormData({...formData, unidade: unit});
                        handleUnitChange(unit);
                      }}
                    >
                      <option value="">🏢 Selecione uma unidade</option>
                      {availableUnits.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="input-field pl-10 h-12 bg-gray-100"
                      value={getUnitDisplayName()}
                      disabled
                    />
                  </div>
                )}
                {!shouldShowUnitSelector && !formData.unidade && (
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    Nenhuma unidade atribuída. Entre em contato com o administrador.
                  </p>
                )}
              </div>

              {/* Tipo de Mensagem */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Mensagem *
                </label>
                <select
                  required
                  className="select-field h-12"
                  value={formData.tipoMensagem}
                  onChange={(e) => setFormData({...formData, tipoMensagem: e.target.value})}
                >
                  <option value="">💬 Selecione o tipo de mensagem</option>
                  {tiposMensagem.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

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

      {/* Preview Card */}
      {formData.tipoMensagem && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Preview da Mensagem</h3>
              <p className="text-sm text-gray-600">Veja como a mensagem aparecerá no WhatsApp</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-sm text-gray-900 whitespace-pre-line leading-relaxed">
                    {getMessagePreview(formData.tipoMensagem, formData.nomeCompleto)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-600 font-medium">
                    Autoescola Ideal • {formData.unidade || 'Unidade não selecionada'}
                  </p>
                  <div className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 