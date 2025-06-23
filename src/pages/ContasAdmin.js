import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Plus, RefreshCw } from 'lucide-react';

export default function ContasAdmin() {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    tipo: 'conta_corrente',
    banco: '',
    agencia: '',
    numero: ''
  });

  const carregar = async () => {
    setLoading(true);
    const lista = await adminService.listarContas();
    setContas(lista);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    await adminService.criarConta(form);
    setForm({ nome: '', tipo: 'conta_corrente', banco: '', agencia: '', numero: '' });
    carregar();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Contas Bancárias / Cartões</h1>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome da conta *"
            value={form.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <select
            value={form.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="conta_corrente">Conta Corrente</option>
            <option value="poupanca">Poupança</option>
            <option value="cartao_credito">Cartão de Crédito</option>
          </select>
          <input
            type="text"
            placeholder="Banco"
            value={form.banco}
            onChange={(e) => handleChange('banco', e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Agência"
            value={form.agencia}
            onChange={(e) => handleChange('agencia', e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Número da conta"
            value={form.numero}
            onChange={(e) => handleChange('numero', e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus size={16}/> Salvar
        </button>
      </form>

      {/* Lista */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{loading ? 'Carregando...' : `Lista de Contas (${contas.length})`}</h2>
          <button onClick={carregar} className="text-gray-500 hover:text-gray-700">
            <RefreshCw size={18} />
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Nome</th>
              <th className="py-2">Tipo</th>
              <th className="py-2">Banco</th>
              <th className="py-2">Agência</th>
              <th className="py-2">Número</th>
            </tr>
          </thead>
          <tbody>
            {contas.map((conta) => (
              <tr key={conta.id} className="border-b hover:bg-gray-50">
                <td className="py-2">{conta.nome}</td>
                <td className="py-2 capitalize">{conta.tipo.replace('_', ' ')}</td>
                <td className="py-2">{conta.banco}</td>
                <td className="py-2">{conta.agencia}</td>
                <td className="py-2">{conta.numero}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 