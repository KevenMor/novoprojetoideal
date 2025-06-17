import React, { useState, useEffect } from 'react';
import { useUnitSelection } from '../hooks/useUnitSelection';
import UnitSelector from '../components/UnitSelector';
import { Receipt, User, Mail, Phone, CreditCard, Calendar, DollarSign, FileText, Plus, Search, Eye, X } from 'lucide-react';
import InputMask from 'react-input-mask';
import { asaasService, formatCurrency, formatDate, getStatusText } from '../services/asaasService';
import toast from 'react-hot-toast';

export default function RegistrarCobrancas() {
  const { 
    selectedUnit, 
    availableUnits, 
    handleUnitChange, 
    getUnitDisplayName, 
    shouldShowUnitSelector 
  } = useUnitSelection();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('nova');
  const [cobrancas, setCobrancas] = useState([]);
  const [loadingCobrancas, setLoadingCobrancas] = useState(false);
  const [selectedCobranca, setSelectedCobranca] = useState(null);
  
  const [formData, setFormData] = useState({
    unidade: selectedUnit || '',
    nome: '',
    cpf: '',
    email: '',
    whatsapp: '',
    servico: '',
    tipoPagamento: '',
    valorTotal: '',
    parcelas: 1,
    dataVencimento: ''
  });

  // Atualizar unidade no form quando selectedUnit mudar
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      unidade: selectedUnit || ''
    }));
  }, [selectedUnit]);

  const servicos = [
    '1º CNH A',
    '1º CNH B COM SIMULADOR',
    '1º CNH A/B COM SIMULADOR',
    '1º CNH B SEM SIMULADOR',
    '1º CNH A/B SEM SIMULADOR',
    'ADIÇÃO A',
    'ADIÇÃO B',
    'MUDANÇA CATEGORIA D',
    'ADIÇÃO A/D',
    'AULA EXTRA',
    'CURSO CFC'
  ];

  const tiposPagamento = [
    { value: 'boleto', label: 'Boleto' },
    { value: 'pix', label: 'PIX' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'recorrente', label: 'Recorrente' }
  ];

  useEffect(() => {
    if (activeTab === 'historico') {
      carregarCobrancas();
    }
  }, [activeTab]);

  const carregarCobrancas = async () => {
    setLoadingCobrancas(true);
    try {
      const resultado = await asaasService.listarCobrancas({ limit: 100 });
      setCobrancas(resultado.data || []);
    } catch (error) {
      toast.error('Erro ao carregar cobranças');
    } finally {
      setLoadingCobrancas(false);
    }
  };

  const formatCPF = (cpf) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const calcularValorParcela = () => {
    if (!formData.valorTotal || !formData.parcelas) return 0;
    return (parseFloat(formData.valorTotal) / parseInt(formData.parcelas)).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.cpf || !formData.email || !formData.whatsapp || 
        !formData.servico || !formData.tipoPagamento || !formData.valorTotal || 
        !formData.dataVencimento || !formData.unidade) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validação de CPF
    const cpfLimpo = formData.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email inválido');
      return;
    }

    // Validação de WhatsApp
    const whatsappLimpo = formData.whatsapp.replace(/\D/g, '');
    if (whatsappLimpo.length !== 11) {
      toast.error('WhatsApp deve ter 11 dígitos');
      return;
    }

    setLoading(true);
    
    try {
      // Verificar se cliente já existe
      let cliente = await asaasService.buscarClientePorCpf(formData.cpf);
      
      // Criar cliente se não existir
      if (!cliente) {
        cliente = await asaasService.criarCliente({
          nome: formData.nome,
          cpf: formData.cpf,
          email: formData.email,
          whatsapp: formData.whatsapp,
          unidade: formData.unidade
        });
      }

      // Criar cobrança ou assinatura
      if (formData.tipoPagamento === 'recorrente') {
        await asaasService.criarAssinatura({
          customerId: cliente.id,
          tipoPagamento: 'boleto',
          valor: parseFloat(formData.valorTotal),
          proximoVencimento: formData.dataVencimento,
          servico: formData.servico,
          unidade: formData.unidade
        });
        toast.success('Assinatura recorrente criada com sucesso!');
      } else {
        const dadosCobranca = {
          customerId: cliente.id,
          tipoPagamento: formData.tipoPagamento,
          valor: parseFloat(formData.valorTotal),
          vencimento: formData.dataVencimento,
          servico: formData.servico,
          unidade: formData.unidade,
          parcelas: parseInt(formData.parcelas),
          valorTotal: parseFloat(formData.valorTotal)
        };

        await asaasService.criarCobranca(dadosCobranca);
        toast.success('Cobrança criada com sucesso!');
      }
      
      // Reset form
      setFormData({
        unidade: selectedUnit || '',
        nome: '',
        cpf: '',
        email: '',
        whatsapp: '',
        servico: '',
        tipoPagamento: '',
        valorTotal: '',
        parcelas: 1,
        dataVencimento: ''
      });
      
    } catch (error) {
      console.error('Erro ao criar cobrança:', error);
      toast.error('Erro ao criar cobrança. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCobranca = async (cobranca) => {
    try {
      const detalhes = await asaasService.buscarCobranca(cobranca.id);
      setSelectedCobranca(detalhes);
    } catch (error) {
      toast.error('Erro ao carregar detalhes da cobrança');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Receipt className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registrar Cobranças</h1>
            <p className="text-gray-600">Gerencie cobranças e pagamentos dos alunos</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('nova')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'nova'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Nova Cobrança
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'historico'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Histórico
            </button>
          </nav>
        </div>

        {/* Nova Cobrança */}
        {activeTab === 'nova' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Unidade */}
            <div>
              <UnitSelector
                selectedUnit={formData.unidade}
                availableUnits={availableUnits}
                onUnitChange={(unit) => {
                  setFormData({...formData, unidade: unit});
                  handleUnitChange(unit);
                }}
                shouldShowSelector={shouldShowUnitSelector}
                displayName={getUnitDisplayName()}
                label="Unidade *"
                className="w-full"
              />
              {!shouldShowUnitSelector && !formData.unidade && (
                <p className="mt-1 text-sm text-red-600">
                  ⚠️ Nenhuma unidade atribuída. Entre em contato com o administrador.
                </p>
              )}
            </div>

            {/* Dados do Aluno */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Dados do Aluno
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Digite o nome completo do aluno"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF *
                  </label>
                  <InputMask
                    mask="999.999.999-99"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                    className="input-field"
                    placeholder="Digite o CPF (000.000.000-00)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      className="input-field pl-10"
                      placeholder="Digite o email do aluno"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="input-field pl-10"
                      placeholder="Digite o WhatsApp (11) 99999-9999"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Serviço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serviço *
              </label>
              <select
                required
                className="select-field"
                value={formData.servico}
                onChange={(e) => setFormData({...formData, servico: e.target.value})}
              >
                <option value="">📋 Selecione o serviço</option>
                {servicos.map((servico) => (
                  <option key={servico} value={servico}>{servico}</option>
                ))}
              </select>
            </div>

            {/* Pagamento */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                Dados do Pagamento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Pagamento *
                  </label>
                  <select
                    required
                    className="select-field"
                    value={formData.tipoPagamento}
                    onChange={(e) => {
                      setFormData({
                        ...formData, 
                        tipoPagamento: e.target.value,
                        parcelas: e.target.value === 'a_vista' ? 1 : formData.parcelas
                      });
                    }}
                  >
                    <option value="">💳 Selecione o tipo de pagamento</option>
                    {tiposPagamento.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Total *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="input-field pl-10"
                      placeholder="Digite o valor total (ex: 1500,00)"
                      value={formData.valorTotal}
                      onChange={(e) => setFormData({...formData, valorTotal: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nº de Parcelas *
                  </label>
                  <select
                    required
                    className="select-field"
                    value={formData.parcelas}
                    onChange={(e) => setFormData({...formData, parcelas: e.target.value})}
                    disabled={formData.tipoPagamento === 'a_vista'}
                  >
                    {[1,2,3,4,5,6].map(num => (
                      <option key={num} value={num}>{num}x</option>
                    ))}
                  </select>
                  {formData.valorTotal && formData.parcelas > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.parcelas}x de R$ {calcularValorParcela()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data 1º Vencimento *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      required
                      className="input-field pl-10"
                      value={formData.dataVencimento}
                      onChange={(e) => setFormData({...formData, dataVencimento: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Criando Cobrança...</span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span>Criar Cobrança</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Histórico de Cobranças */}
        {activeTab === 'historico' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Digite nome ou CPF para buscar..."
                    className="input-field pl-10 w-64"
                  />
                </div>
              </div>
              <button
                onClick={carregarCobrancas}
                className="btn-secondary"
                disabled={loadingCobrancas}
              >
                {loadingCobrancas ? 'Carregando...' : 'Atualizar'}
              </button>
            </div>

            {loadingCobrancas ? (
              <div className="flex justify-center py-8">
                <div className="loading-spinner w-8 h-8"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cobrancas.map((cobranca) => (
                      <tr key={cobranca.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {cobranca.customer?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {cobranca.customer?.cpfCnpj ? formatCPF(cobranca.customer.cpfCnpj) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(cobranca.value)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(cobranca.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            cobranca.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                            cobranca.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            cobranca.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getStatusText(cobranca.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewCobranca(cobranca)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {cobrancas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma cobrança encontrada
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Cobrança */}
      {selectedCobranca && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full m-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalhes da Cobrança
                </h3>
                <button
                  onClick={() => setSelectedCobranca(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID</label>
                    <p className="text-sm text-gray-900">{selectedCobranca.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="text-sm text-gray-900">{getStatusText(selectedCobranca.status)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedCobranca.value)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vencimento</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedCobranca.dueDate)}</p>
                  </div>
                </div>
                
                {selectedCobranca.invoiceUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link de Pagamento</label>
                    <a
                      href={selectedCobranca.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm break-all"
                    >
                      {selectedCobranca.invoiceUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}