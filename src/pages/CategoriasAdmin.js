import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Plus, RefreshCw } from 'lucide-react';

export default function CategoriasAdmin() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const carregar = async () => {
    setLoading(true);
    const lista = await adminService.listarCategorias();
    setCategorias(lista);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    await adminService.criarCategoria({ nome: nome.trim(), descricao: descricao.trim() });
    setNome('');
    setDescricao('');
    carregar();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Categorias</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1 w-full border rounded p-2" required />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="mt-1 w-full border rounded p-2" />
        </div>
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus size={16} /> Adicionar
        </button>
      </form>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Lista de Categorias</h2>
          <button onClick={carregar} className="text-blue-600 hover:text-blue-800 flex items-center gap-1"><RefreshCw size={16}/>Atualizar</button>
        </div>
        {loading ? (
          <p>Carregando...</p>
        ) : categorias.length === 0 ? (
          <p>Nenhuma categoria cadastrada.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Nome</th>
                <th className="py-2">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map(cat => (
                <tr key={cat.id} className="border-b last:border-0">
                  <td className="py-2">{cat.nome}</td>
                  <td className="py-2">{cat.descricao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 