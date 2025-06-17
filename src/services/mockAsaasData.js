// Dados de teste para simular transações do Asaas
export const mockAsaasTransactions = [
  {
    id: "test_1",
    date: new Date().toISOString().split('T')[0],
    description: "Pagamento Aulas Práticas - João Silva",
    type: "CREDIT",
    value: 150.00,
    status: "RECEIVED"
  },
  {
    id: "test_2",
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Ontem
    description: "Taxa de Habilitação - Maria Santos",
    type: "CREDIT",
    value: 850.00,
    status: "RECEIVED"
  },
  {
    id: "test_3",
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 dias atrás
    description: "Simulador de Direção - Pedro Costa",
    type: "CREDIT",
    value: 80.00,
    status: "RECEIVED"
  },
  {
    id: "test_4",
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 dias atrás
    description: "Taxa de Cancelamento",
    type: "DEBIT",
    value: 25.00,
    status: "PROCESSED"
  },
  {
    id: "test_5",
    date: new Date(Date.now() - 345600000).toISOString().split('T')[0], // 4 dias atrás
    description: "Exame Teórico - Ana Oliveira",
    type: "CREDIT",
    value: 45.00,
    status: "RECEIVED"
  },
  {
    id: "test_6",
    date: new Date(Date.now() - 432000000).toISOString().split('T')[0], // 5 dias atrás
    description: "Aulas Teóricas - Carlos Lima",
    type: "CREDIT",
    value: 200.00,
    status: "RECEIVED"
  }
];

// Função para simular resposta da API do Asaas
export const getMockAsaasResponse = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const filteredTransactions = mockAsaasTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= start && transactionDate <= end;
  });
  
  return {
    data: filteredTransactions,
    totalCount: filteredTransactions.length,
    hasMore: false
  };
}; 