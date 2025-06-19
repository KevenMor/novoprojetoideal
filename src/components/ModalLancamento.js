import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, CreditCard, Tag } from 'lucide-react';
import { useUnitFilter } from '../contexts/UnitFilterContext';
import toast from 'react-hot-toast';
import { lancamentosService } from '../services/lancamentosService';

export default function ModalLancamento({ 
  isOpen, 
  onClose, 
  tipo, // 'CREDIT' ou 'DEBIT'
  onSucesso,
  lancamentoParaEditar = null,
  modoEdicao = false
}) {
  const { selectedUnit, availableUnits } = useUnitFilter();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(() => {
    if (modoEdicao && lancamentoParaEditar) {
      // Converter data para formato YYYY-MM-DD se necessário
      let dataFormatada = lancamentoParaEditar.data;
      if (dataFormatada instanceof Date) {
        dataFormatada = dataFormatada.toISOString().split('T')[0];
      } else if (typeof dataFormatada === 'string' && dataFormatada.includes('/')) {
        // Converter DD/MM/YYYY para YYYY-MM-DD
        const [dia, mes, ano] = dataFormatada.split('/');
        dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }

      return {
        descricao: lancamentoParaEditar.descricao || lancamentoParaEditar.description || '',
        valor: (lancamentoParaEditar.valor || lancamentoParaEditar.value || '').toString(),
        data: dataFormatada || new Date().toISOString().split('T')[0],
        unidade: lancamentoParaEditar.unidade || selectedUnit === 'all' ? (availableUnits[0] || '') : selectedUnit,
        cliente: lancamentoParaEditar.cliente || '',
        formaPagamento: lancamentoParaEditar.formaPagamento || '',
        status: lancamentoParaEditar.status || 'CONFIRMED',
        origem: lancamentoParaEditar.origem || 'MANUAL'
      };
    }
    
    return {
      descricao: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      unidade: selectedUnit === 'all' ? (availableUnits[0] || '') : selectedUnit,
      cliente: '',
      formaPagamento: '',
      status: 'CONFIRMED',
      origem: 'MANUAL'
    };
  });

  const categorias = {
    RECEITA: [
      { value: 'MENSALIDADE', label: 'Mensalidade' },
      { value: 'MATRICULA', label: 'Matrícula' },
      { value: 'AULA_EXTRA', label: 'Aula Extra' },
      { value: 'EXAME', label: 'Exame' },
      { value: 'OUTROS', label: 'Outros' }
    ],
    DESPESA: [
      { value: 'COMBUSTIVEL', label: 'Combustível' },
      { value: 'MANUTENCAO', label: 'Manutenção' },
      { value: 'SALARIO', label: 'Salário' },
      { value: 'ALUGUEL', label: 'Aluguel' },
      { value: 'CONTA', label: 'Contas (Luz, Água, etc.)' },
      { value: 'CONTA_BTG', label: 'Conta BTG' },
      { value: 'OUTROS', label: 'Outros' }
    ]
  };

  const formasPagamento = [
    { value: 'DINHEIRO', label: 'Dinheiro' },
    { value: 'PIX', label: 'PIX' },
    { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
    { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
    { value: 'TRANSFERENCIA', label: 'Transferência' },
    { value: 'BOLETO', label: 'Boleto' },
    { value: 'OUTROS', label: 'Outros' }
  ];

  const statusOptions = [
    { value: 'CONFIRMED', label: 'Confirmado' },
    { value: 'PENDING', label: 'Aguardando' },
    { value: 'CANCELLED', label: 'Cancelado' }
  ];

  // Atualizar formulário quando o lançamento para editar mudar
  useEffect(() => {
    if (modoEdicao && lancamentoParaEditar) {
      // Converter data para formato YYYY-MM-DD se necessário
      let dataFormatada = lancamentoParaEditar.data;
      if (dataFormatada instanceof Date) {
        dataFormatada = dataFormatada.toISOString().split('T')[0];
      } else if (typeof dataFormatada === 'string' && dataFormatada.includes('/')) {
        // Converter DD/MM/YYYY para YYYY-MM-DD
        const [dia, mes, ano] = dataFormatada.split('/');
        dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }

      setFormData({
        descricao: lancamentoParaEditar.descricao || lancamentoParaEditar.description || '',
        valor: (lancamentoParaEditar.valor || lancamentoParaEditar.value || '').toString(),
        data: dataFormatada || new Date().toISOString().split('T')[0],
        unidade: lancamentoParaEditar.unidade || selectedUnit === 'all' ? (availableUnits[0] || '') : selectedUnit,
        cliente: lancamentoParaEditar.cliente || '',
        formaPagamento: lancamentoParaEditar.formaPagamento || '',
        status: lancamentoParaEditar.status || 'CONFIRMED',
        origem: lancamentoParaEditar.origem || 'MANUAL'
      });
    } else if (!modoEdicao) {
      // Resetar para novo lançamento
      setFormData({
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        unidade: selectedUnit === 'all' ? (availableUnits[0] || '') : selectedUnit,
        cliente: '',
        formaPagamento: '',
        status: 'CONFIRMED',
        origem: 'MANUAL'
      });
    }
  }, [modoEdicao, lancamentoParaEditar, selectedUnit, availableUnits]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Formatar dados antes de salvar
      const dadosFormatados = {
        ...formData,
        valor: parseFloat(formData.valor.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        data: formData.data ? new Date(formData.data) : new Date(),
        cliente: formData.cliente.trim(),
        descricao: formData.descricao.trim(),
        unidade: formData.unidade || selectedUnit
      };

      if (lancamentoParaEditar) {
        await lancamentosService.atualizarLancamento(lancamentoParaEditar.id, dadosFormatados);
        toast.success('Lançamento atualizado com sucesso!');
      } else {
        await lancamentosService.criarLancamento(dadosFormatados);
        toast.success('Lançamento criado com sucesso!');
      }

      onClose();
      if (onSucesso) onSucesso();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      toast.error('Erro ao salvar lançamento. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tituloModal = modoEdicao 
    ? (tipo === 'RECEITA' ? 'Editar Receita' : 'Editar Despesa')
    : (tipo === 'RECEITA' ? 'Cadastrar Receita' : 'Cadastrar Despesa');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${tipo === 'RECEITA' ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${tipo === 'RECEITA' ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-6 h-6 ${tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {modoEdicao ? 'Editar Lançamento' : (tipo === 'RECEITA' ? 'Nova Receita' : 'Nova Despesa')}
              </h2>
              <p className="text-sm text-gray-600">
                {modoEdicao 
                  ? `Edite os dados do lançamento`
                  : `Registre ${tipo === 'RECEITA' ? 'uma entrada' : 'uma saída'} de dinheiro`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Descrição *
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Ex: Mensalidade de Julho"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Cliente
            </label>
            <input
              type="text"
              value={formData.cliente}
              onChange={(e) => handleInputChange('cliente', e.target.value)}
              placeholder="Nome do cliente"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => handleInputChange('valor', e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data *
              </label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange('data', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Unidade e Forma de Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Unidade *
              </label>
              <select
                value={formData.unidade}
                onChange={(e) => handleInputChange('unidade', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione uma unidade</option>
                {availableUnits.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-1" />
                Forma de Pagamento
              </label>
              <select
                value={formData.formaPagamento}
                onChange={(e) => handleInputChange('formaPagamento', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione a forma de pagamento</option>
                {formasPagamento.map((forma) => (
                  <option key={forma.value} value={forma.value}>{forma.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-lg ${
                tipo === 'RECEITA'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Salvando...' : (modoEdicao ? 'Salvar Alterações' : 'Salvar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 