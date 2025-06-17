import axios from 'axios';

const ASAAS_API_URL = 'https://www.asaas.com/api/v3';
const ASAAS_TOKEN = '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmEyZDE3Mzk1LTI4MTktNGVhMy1hMzJlLTY2ZTI1ODc5ZGE0Njo6JGFhY2hfN2I5YmY3YTktMGUwNi00YjExLWFhNmMtNjYyYjcyZDA1NTY2';

const asaasApi = axios.create({
  baseURL: ASAAS_API_URL,
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'access_token': ASAAS_TOKEN,
    'Content-Type': 'application/json'
  }
});

// Interceptor para debug de requisições
asaasApi.interceptors.request.use(request => {
  console.log('🔗 Chamada Asaas:', {
    method: request.method,
    url: request.url,
    params: request.params
  });
  return request;
});

// Interceptor para debug de respostas
asaasApi.interceptors.response.use(
  response => {
    console.log('✅ Resposta Asaas:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('❌ Erro Asaas:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });
    return Promise.reject(error);
  }
);

export const asaasService = {
  // Criar cliente
  async criarCliente(dadosCliente) {
    try {
      const response = await asaasApi.post('/customers', {
        name: dadosCliente.nome,
        cpfCnpj: dadosCliente.cpf.replace(/\D/g, ''),
        email: dadosCliente.email,
        phone: dadosCliente.whatsapp.replace(/\D/g, ''),
        mobilePhone: dadosCliente.whatsapp.replace(/\D/g, ''),
        externalReference: `AUTOESCOLA_${dadosCliente.unidade}_${Date.now()}`
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  },

  // Buscar cliente por CPF
  async buscarClientePorCpf(cpf) {
    try {
      const response = await asaasApi.get('/customers', {
        params: {
          cpfCnpj: cpf.replace(/\D/g, '')
        }
      });
      return response.data.data?.[0] || null;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
  },

  // Criar cobrança
  async criarCobranca(dadosCobranca) {
    try {
      const response = await asaasApi.post('/payments', {
        customer: dadosCobranca.customerId,
        billingType: dadosCobranca.tipoPagamento.toUpperCase(),
        value: dadosCobranca.valor,
        dueDate: dadosCobranca.vencimento,
        description: `${dadosCobranca.servico} - ${dadosCobranca.unidade}`,
        externalReference: `${dadosCobranca.unidade}_${Date.now()}`,
        installmentCount: dadosCobranca.parcelas || 1,
        totalValue: dadosCobranca.valorTotal || dadosCobranca.valor,
        postalService: false
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cobrança:', error);
      throw error;
    }
  },

  // Criar assinatura (cobrança recorrente)
  async criarAssinatura(dadosAssinatura) {
    try {
      const response = await asaasApi.post('/subscriptions', {
        customer: dadosAssinatura.customerId,
        billingType: dadosAssinatura.tipoPagamento.toUpperCase(),
        value: dadosAssinatura.valor,
        nextDueDate: dadosAssinatura.proximoVencimento,
        cycle: 'MONTHLY',
        description: `${dadosAssinatura.servico} - ${dadosAssinatura.unidade} (Recorrente)`,
        externalReference: `REC_${dadosAssinatura.unidade}_${Date.now()}`
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      throw error;
    }
  },

  // Listar cobranças
  async listarCobrancas(filtros = {}) {
    try {
      const params = {
        limit: filtros.limit || 50,
        offset: filtros.offset || 0
      };

      if (filtros.status) params.status = filtros.status;
      if (filtros.customer) params.customer = filtros.customer;
      if (filtros.dateCreated) params.dateCreated = filtros.dateCreated;
      if (filtros.paymentDate) params.paymentDate = filtros.paymentDate;

      const response = await asaasApi.get('/payments', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar cobranças:', error);
      throw error;
    }
  },

  // Buscar cobrança por ID
  async buscarCobranca(paymentId) {
    try {
      const response = await asaasApi.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar cobrança:', error);
      throw error;
    }
  },

  // Cancelar cobrança
  async cancelarCobranca(paymentId) {
    try {
      const response = await asaasApi.delete(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar cobrança:', error);
      throw error;
    }
  },

  // Estornar cobrança
  async estornarCobranca(paymentId) {
    try {
      const response = await asaasApi.post(`/payments/${paymentId}/refund`);
      return response.data;
    } catch (error) {
      console.error('Erro ao estornar cobrança:', error);
      throw error;
    }
  },

  // Recuperar extrato
  async recuperarExtrato(dataInicial, dataFinal) {
    try {
      const response = await asaasApi.get('/financialTransactions', {
        params: {
          startDate: dataInicial,
          finishDate: dataFinal
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao recuperar extrato:', error);
      throw error;
    }
  },

  // Obter estatísticas
  async obterEstatisticas() {
    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };

      const [cobrancas, transacoes] = await Promise.all([
        this.listarCobrancas({
          dateCreated: `${formatDate(inicioMes)}:${formatDate(fimMes)}`,
          limit: 100
        }),
        this.recuperarExtrato(formatDate(inicioMes), formatDate(fimMes))
      ]);

      const stats = {
        totalCobrancas: cobrancas.totalCount || 0,
        cobrancasPendentes: cobrancas.data?.filter(c => c.status === 'PENDING').length || 0,
        cobrancasPagas: cobrancas.data?.filter(c => c.status === 'RECEIVED').length || 0,
        cobrancasVencidas: cobrancas.data?.filter(c => c.status === 'OVERDUE').length || 0,
        receitaTotal: transacoes.data?.filter(t => t.type === 'CREDIT')
          .reduce((sum, t) => sum + t.value, 0) || 0,
        despesaTotal: transacoes.data?.filter(t => t.type === 'DEBIT')
          .reduce((sum, t) => sum + Math.abs(t.value), 0) || 0
      };

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalCobrancas: 0,
        cobrancasPendentes: 0,
        cobrancasPagas: 0,
        cobrancasVencidas: 0,
        receitaTotal: 0,
        despesaTotal: 0
      };
    }
  }
};

// Função auxiliar para formatar valores monetários
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função auxiliar para formatar datas
export const formatDate = (dateString) => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
};

// Função auxiliar para obter status em português
export const getStatusText = (status) => {
  const statusMap = {
    'PENDING': 'Pendente',
    'RECEIVED': 'Recebido',
    'OVERDUE': 'Vencido',
    'CONFIRMED': 'Confirmado',
    'RECEIVED_IN_CASH': 'Recebido em Dinheiro',
    'REFUNDED': 'Estornado',
    'REFUND_REQUESTED': 'Estorno Solicitado',
    'CHARGEBACK_REQUESTED': 'Chargeback Solicitado',
    'CHARGEBACK_DISPUTE': 'Disputa de Chargeback',
    'AWAITING_CHARGEBACK_REVERSAL': 'Aguardando Reversão',
    'DUNNING_REQUESTED': 'Cobrança Solicitada',
    'DUNNING_RECEIVED': 'Cobrança Recebida',
    'AWAITING_RISK_ANALYSIS': 'Aguardando Análise'
  };
  
  return statusMap[status] || status;
};

export default asaasService; 