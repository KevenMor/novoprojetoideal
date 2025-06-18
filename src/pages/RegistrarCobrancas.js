import React, { useState, useEffect } from 'react';
import { useUnitSelection } from '../hooks/useUnitSelection';
import UnitSelector from '../components/UnitSelector';
import { Receipt, User, Mail, Phone, CreditCard, Calendar, DollarSign, FileText, Plus, Search, Eye, X } from 'lucide-react';
import InputMask from 'react-input-mask';
import { asaasService, formatCurrency, formatDate, getStatusText } from '../services/asaasService';
import toast from 'react-hot-toast';
import axios from 'axios';
import { db } from '../firebase/config';
import { collection, addDoc, Timestamp, getDocs, query, orderBy } from 'firebase/firestore';

export default function RegistrarCobrancas() {
  const { 
    selectedUnit, 
    availableUnits, 
    handleUnitChange, 
    getUnitDisplayName, 
    shouldShowUnitSelector 
  } = useUnitSelection();
  
  const [loading, setLoading] = useState(false);
  const [cobrancas, setCobrancas] = useState([]);
  const [loadingCobrancas, setLoadingCobrancas] = useState(false);
  const [selectedCobranca, setSelectedCobranca] = useState(null);
  
  const [formData, setFormData] = useState({
    unidade: '',
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
  useEffect(() => {
    if (selectedUnit && formData.unidade !== selectedUnit) {
      setFormData(prev => ({
        ...prev,
        unidade: selectedUnit
      }));
    }
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

  const carregarCobrancas = async () => {
    setLoadingCobrancas(true);
    try {
      const q = query(collection(db, 'cobrancas'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setCobrancas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  const enviarParaWebhookCobranca = async (dados) => {
    try {
      await axios.post('https://hook.us2.make.com/ihg35mjrciqihgiu4hm8jj4ej4ft5nca', dados, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      console.log('✅ Dados enviados para o webhook de cobrança');
    } catch (error) {
      console.error('❌ Erro ao enviar para o webhook de cobrança:', error);
    }
  };

  // Função para formatar valor monetário
  const formatarValorMonetario = (valor) => {
    if (!valor) return '';
    const num = Number(valor.toString().replace(/[^\d]/g, '')) / 100;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleValorChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setFormData(prev => ({ ...prev, valorTotal: raw }));
  };

  // Função para capitalizar o nome
  function capitalizeName(name) {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Função para formatar valor com casas decimais e ponto
  function formatValor(valor) {
    const num = Number(valor);
    return num.toFixed(2).replace(',', '.');
  }

  // Função robusta para formatar datas de vários formatos
  function formatDateBR(date) {
    if (!date) return '';
    // Firestore Timestamp
    if (typeof date === 'object' && date.seconds) {
      const d = new Date(date.seconds * 1000);
      return d.toLocaleDateString('pt-BR');
    }
    // String ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
      const [ano, mes, dia] = date.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    // String BR
    if (/^\d{2}\/\d{2}\/\d{4}/.test(date)) {
      return date;
    }
    // Tenta converter
    const d = new Date(date);
    if (!isNaN(d)) return d.toLocaleDateString('pt-BR');
    return '';
  }

  function formatDateISO(date) {
    if (!date) return '';
    // Se já estiver no formato ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date;
    // Se vier como dd/mm/aaaa
    if (/^\d{2}\/\d{2}\/\d{4}/.test(date)) {
      const [dia, mes, ano] = date.split('/');
      return `${ano}-${mes}-${dia}`;
    }
    // Tenta converter
    const d = new Date(date);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return '';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Formulário enviado:', formData);
    const unidadeParaValidar = formData.unidade || '';
    console.log('Unidade para validação:', JSON.stringify(unidadeParaValidar));
    const unidadeInvalida = !unidadeParaValidar || unidadeParaValidar.trim().length === 0;
    const valorTotalNumerico = Number(formData.valorTotal) / 100;
    const valorTotalInvalido = !valorTotalNumerico || valorTotalNumerico <= 0;
    if (!formData.nome || !formData.cpf || !formData.email || !formData.whatsapp || 
        !formData.servico || !formData.tipoPagamento || valorTotalInvalido || 
        !formData.dataVencimento || unidadeInvalida) {
      toast.error('Por favor, preencha todos os campos obrigatórios e selecione uma unidade válida.');
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
      // Enviar apenas para o webhook do Make
      await enviarParaWebhookCobranca({
        nome: capitalizeName(formData.nome),
        cpf: formData.cpf,
        email: formData.email,
        whatsapp: formData.whatsapp,
        servico: formData.servico,
        tipoPagamento: formData.tipoPagamento,
        valorTotal: formatValor(formData.valorTotal / 100),
        parcelas: formData.parcelas,
        valorParcela: formatValor((formData.valorTotal / 100) / Number(formData.parcelas)),
        dataVencimento: formatDateISO(formData.dataVencimento),
        unidade: unidadeParaValidar
      });
      // Salvar no Firestore
      await addDoc(collection(db, 'cobrancas'), {
        nome: capitalizeName(formData.nome),
        cpf: formData.cpf,
        email: formData.email,
        whatsapp: formData.whatsapp,
        servico: formData.servico,
        tipoPagamento: formData.tipoPagamento,
        valorTotal: formatValor(formData.valorTotal / 100),
        parcelas: formData.parcelas,
        valorParcela: formatValor((formData.valorTotal / 100) / Number(formData.parcelas)),
        dataVencimento: formatDateISO(formData.dataVencimento),
        unidade: unidadeParaValidar,
        status: 'ENVIADO',
        createdAt: Timestamp.now()
      });
      toast.success('Cobrança enviada para o webhook com sucesso!');
      
    } catch (error) {
      console.error('Erro ao criar cobrança:', error);
      toast.error('Erro ao criar cobrança. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCobranca = async (cobranca) => {
    setSelectedCobranca(cobranca);
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Unidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unidade *
            </label>
            <select
              className="input-field"
              value={formData.unidade}
              onChange={e => setFormData({ ...formData, unidade: e.target.value })}
              required
            >
              <option value="">Selecione a unidade</option>
              {availableUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
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
              <option value="">Selecione o serviço</option>
              {servicos.map((servico) => (
                <option key={servico} value={servico}>{servico}</option>
              ))}
            </select>
          </div>

          {/* Pagamento */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
            <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Dados do Pagamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Pagamento *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><CreditCard className="w-4 h-4" /></span>
                  <select
                    className="input-field pl-10"
                    value={formData.tipoPagamento}
                    required
                    onChange={(e) => {
                      setFormData({
                        ...formData, 
                        tipoPagamento: e.target.value,
                        parcelas: e.target.value === 'a_vista' ? 1 : formData.parcelas
                      });
                    }}
                  >
                    <option value="">Selecione o tipo de pagamento</option>
                    {tiposPagamento.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Valor Total *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">R$</span>
                  <input
                    type="text"
                    required
                    className="input-field pl-10 text-right font-semibold"
                    placeholder="0,00"
                    value={formatarValorMonetario(formData.valorTotal).replace('R$', '').trim()}
                    onChange={handleValorChange}
                    maxLength={12}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nº de Parcelas *</label>
                <select
                  className="input-field"
                  value={formData.parcelas}
                  required
                  onChange={(e) => setFormData({...formData, parcelas: e.target.value})}
                  disabled={formData.tipoPagamento === 'a_vista'}
                >
                  {[1,2,3,4,5,6].map(num => (
                    <option key={num} value={num}>{num}x</option>
                  ))}
                </select>
                {formData.valorTotal && formData.parcelas > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.parcelas}x de R$ {formatValor((Number(formData.valorTotal) / 100) / Number(formData.parcelas))}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Data 1º Vencimento *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Calendar className="w-4 h-4" /></span>
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
                    <p className="text-sm text-gray-900">{formatDateBR(selectedCobranca.dataVencimento)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Criado em</label>
                    <p className="text-sm text-gray-900">{formatDateBR(selectedCobranca.createdAt)}</p>
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