import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Plus, RefreshCw } from 'lucide-react';

export default function FormasPagamentoAdmin() {
  const [formas, setFormas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '' });

  const carregar = async () => {
    setLoading(true);
    const lista = await adminService.listarFormasPagamento();
    setFormas(lista);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    await adminService.criarFormaPagamento(form);
    setForm({ nome: '', descricao: '' });
    carregar();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Formas de Pagamento</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome *"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="text"
            placeholder="Descrição"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus size={16}/> Salvar
        </button>
      </form>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{loading ? 'Carregando...' : `Lista de Formas (${formas.length})`}</h2>
          <button onClick={carregar} className="text-gray-500 hover:text-gray-700">
            <RefreshCw size={18}/>
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Nome</th>
              <th className="py-2">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {formas.map((f) => (
              <tr key={f.id} className="border-b hover:bg-gray-50">
                <td className="py-2">{f.nome}</td>
                <td className="py-2">{f.descricao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 