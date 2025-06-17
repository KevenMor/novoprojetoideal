import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Configurar URL base do backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Instância do axios para a API
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Erro ao obter token:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      console.error('Token inválido. Redimensionando para login...');
      // Aqui você pode redirecionar para login se necessário
    }
    
    return Promise.reject(error);
  }
);

export const messagesService = {
  /**
   * Enviar mensagem via backend com persistência no Firestore
   */
  async sendMessage(messageData) {
    try {
      console.log('📤 Enviando mensagem via backend:', messageData);
      
      const response = await api.post('/api/messages', messageData);
      
      console.log('✅ Mensagem enviada com sucesso:', response.data);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details || 
                          error.message || 
                          'Erro desconhecido ao enviar mensagem';
      
      return {
        success: false,
        error: errorMessage,
        messageId: error.response?.data?.messageId || null
      };
    }
  },

  /**
   * Listar mensagens com filtros
   */
  async getMessages(filters = {}) {
    try {
      console.log('📋 Buscando mensagens com filtros:', filters);
      
      const response = await api.get('/api/messages', { params: filters });
      
      console.log('✅ Mensagens carregadas:', response.data.data.length);
      
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erro ao buscar mensagens',
        data: []
      };
    }
  },

  /**
   * Buscar estatísticas de mensagens
   */
  async getMessageStats(filters = {}) {
    try {
      console.log('📊 Buscando estatísticas de mensagens:', filters);
      
      const response = await api.get('/api/messages/stats', { params: filters });
      
      console.log('✅ Estatísticas carregadas:', response.data.data);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erro ao buscar estatísticas',
        data: {}
      };
    }
  },

  /**
   * Buscar mensagem por ID
   */
  async getMessageById(messageId) {
    try {
      console.log('🔍 Buscando mensagem por ID:', messageId);
      
      const response = await api.get(`/api/messages/${messageId}`);
      
      console.log('✅ Mensagem encontrada:', response.data.data);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ Erro ao buscar mensagem:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erro ao buscar mensagem',
        data: null
      };
    }
  },

  /**
   * Reenviar mensagem que falhou
   */
  async retryMessage(messageId) {
    try {
      console.log('🔄 Reenviando mensagem:', messageId);
      
      const response = await api.post(`/api/messages/${messageId}/retry`);
      
      console.log('✅ Mensagem reenviada:', response.data);
      
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Erro ao reenviar mensagem:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erro ao reenviar mensagem'
      };
    }
  },

  /**
   * Validar dados da mensagem antes do envio
   */
  validateMessage(messageData) {
    const errors = [];
    
    if (!messageData.nome || messageData.nome.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }
    
    if (!messageData.whatsapp || messageData.whatsapp.replace(/\D/g, '').length < 10) {
      errors.push('WhatsApp deve ter pelo menos 10 dígitos');
    }
    
    if (!messageData.tipoMensagem) {
      errors.push('Tipo de mensagem é obrigatório');
    }
    
    if (!messageData.unidade) {
      errors.push('Unidade é obrigatória');
    }
    
    if (messageData.tipoMensagem === 'Chamar Cliente' && !messageData.mensagemPersonalizada) {
      errors.push('Mensagem personalizada é obrigatória para tipo "Chamar Cliente"');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Formatar número de WhatsApp
   */
  formatWhatsApp(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  },

  /**
   * Limpar número de WhatsApp (apenas dígitos)
   */
  cleanWhatsApp(phone) {
    return phone ? phone.replace(/\D/g, '') : '';
  }
};

// Exportar também a instância do axios para uso direto se necessário
export { api };

export default messagesService; 