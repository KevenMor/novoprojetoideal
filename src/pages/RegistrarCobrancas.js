import React, { useState, useEffect } from 'react';
import { useUnitSelection } from '../hooks/useUnitSelection';
import { Receipt, CreditCard, Plus } from 'lucide-react';
import InputMask from 'react-input-mask';
import toast from 'react-hot-toast';
import axios from 'axios';
import { db } from '../firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function RegistrarCobrancas() {
  const { selectedUnit, availableUnits } = useUnitSelection();
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (selectedUnit && formData.unidade !== selectedUnit) {
      setFormData(prev => ({
        ...prev,
        unidade: selectedUnit
      }));
    }
  }, [selectedUnit, formData.unidade]);

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

  function capitalizeName(name) {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  function formatValor(valor) {
    const num = Number(valor);
    return num.toFixed(2).replace(',', '.');
  }

  function formatDateISO(date) {
    if (!date) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date;
    if (/^\d{2}\/\d{2}\/\d{4}/.test(date)) {
      const [dia, mes, ano] = date.split('/');
      return `${ano}-${mes}-${dia}`;
    }
    const d = new Date(date);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return '';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const unidadeParaValidar = formData.unidade || '';
    const valorTotalNumerico = Number(formData.valorTotal) / 100;
    const valorTotalInvalido = !valorTotalNumerico || valorTotalNumerico <= 0;
    if (!formData.nome || !formData.cpf || !formData.email || !formData.whatsapp || 
        !formData.servico || !formData.tipoPagamento || valorTotalInvalido || 
        !formData.dataVencimento || !unidadeParaValidar || unidadeParaValidar.trim().length === 0) {
      toast.error('Por favor, preencha todos os campos obrigatórios e selecione uma unidade válida.');
      return;
    }
    const cpfLimpo = formData.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email inválido');
      return;
    }
    const whatsappLimpo = formData.whatsapp.replace(/\D/g, '');
    if (whatsappLimpo.length !== 11) {
      toast.error('WhatsApp deve ter 11 dígitos');
      return;
    }
    setLoading(true);
    try {
      // Enviar para o webhook do Make
      await axios.post('https://hook.us2.make.com/ihg35mjrciqihgiu4hm8jj4ej4ft5nca', {
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
      }, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Unidade *</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
            <input
              type="text"
              className="input-field"
              value={formData.nome}
              onChange={e => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CPF *</label>
            <InputMask
              mask="999.999.999-99"
              className="input-field"
              value={formData.cpf}
              onChange={e => setFormData({ ...formData, cpf: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
            <input
              type="email"
              className="input-field"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp *</label>
            <InputMask
              mask="(99) 99999-9999"
              className="input-field"
              value={formData.whatsapp}
              onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Serviço *</label>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Pagamento *</label>
                <select
                  className="input-field"
                  value={formData.tipoPagamento}
                  onChange={e => setFormData({ ...formData, tipoPagamento: e.target.value })}
                  required
                >
                  <option value="">Selecione</option>
                  {tiposPagamento.map(tp => (
                    <option key={tp.value} value={tp.value}>{tp.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Valor Total *</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.valorTotal}
                  onChange={e => setFormData({ ...formData, valorTotal: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nº de Parcelas *</label>
                <select
                  className="input-field"
                  value={formData.parcelas}
                  required
                  onChange={(e) => setFormData({...formData, parcelas: e.target.value})}
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
                  <input
                    type="date"
                    required
                    className="input-field"
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
    </div>
  );
}