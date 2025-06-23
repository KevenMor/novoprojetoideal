import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Plus, RefreshCw } from 'lucide-react';

export default function ClientesFornecedoresAdmin() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    tipo: 'cliente',
    documento: '',
    contato: '',
    telefone: ''
  });

  const carregar = async () => {
    setLoading(true);
    const lista = await adminService.listarClientesFornecedores();
    setRegistros(lista);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    await adminService.criarClienteFornecedor(form);
    setForm({ nome: '', tipo: 'cliente', documento: '', contato: '', telefone: '' });
    carregar();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Clientes / Fornecedores</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome *"
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
            <option value="cliente">Cliente</option>
            <option value="fornecedor">Fornecedor</option>
          </select>
          <input
            type="text"
            placeholder="Documento (CPF/CNPJ)"
            value={form.documento}
            onChange={(e) => handleChange('documento', e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Contato"
            value={form.contato}
            onChange={(e) => handleChange('contato', e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Telefone"
            value={form.telefone}
            onChange={(e) => handleChange('telefone', e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus size={16}/> Salvar
        </button>
      </form>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{loading ? 'Carregando...' : `Registros (${registros.length})`}</h2>
          <button onClick={carregar} className="text-gray-500 hover:text-gray-700">
            <RefreshCw size={18}/>
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Nome</th>
              <th className="py-2">Tipo</th>
              <th className="py-2">Documento</th>
              <th className="py-2">Contato</th>
              <th className="py-2">Telefone</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="py-2">{r.nome}</td>
                <td className="py-2 capitalize">{r.tipo}</td>
                <td className="py-2">{r.documento}</td>
                <td className="py-2">{r.contato}</td>
                <td className="py-2">{r.telefone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 