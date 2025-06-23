import React, { useState } from 'react';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useUnitFilter } from '../contexts/UnitFilterContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegistrarCobranca() {
  const { availableUnits } = useUnitFilter();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    dataVencimento: '',
    servico: '',
    unidade: '',
    observacoes: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'cobrancas'), {
        ...formData,
        valor: Number(formData.valor),
        status: 'AGUARDANDO',
        dataCriacao: serverTimestamp()
      });
      setSuccess(true);
      setFormData({
        nome: '',
        valor: '',
        dataVencimento: '',
        servico: '',
        unidade: '',
        observacoes: ''
      });
      setTimeout(() => {
        setSuccess(false);
        navigate('/cobrancas/historico');
      }, 2000);
    } catch (error) {
      console.error('Erro ao registrar cobrança:', error);
      alert('Erro ao registrar cobrança. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Registrar Cobrança</h1>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input
              type="number"
              name="valor"
              value={formData.valor}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
            <input
              type="date"
              name="dataVencimento"
              value={formData.dataVencimento}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
            <input
              type="text"
              name="servico"
              value={formData.servico}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
            <select
              name="unidade"
              value={formData.unidade}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Selecione uma unidade</option>
              {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              className="input-field"
              rows="3"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar Cobrança'}
          </button>
        </form>
        {success && (
          <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Cobrança registrada com sucesso!
          </div>
        )}
      </div>
    </div>
  );
} 