import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Trash2, RefreshCw, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CadastrosCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');

  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      const lista = await adminService.listarCategorias();
      setCategorias(lista);
    } catch (err) {
      setErro('Erro ao carregar categorias');
    }
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setLoading(true);
    try {
      await adminService.criarCategoria({ nome: nome.trim(), descricao: descricao.trim() });
      setNome('');
      setDescricao('');
      toast.success('Categoria criada!');
      carregar();
    } catch (err) {
      setErro('Erro ao criar categoria');
    }
    setLoading(false);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    setLoading(true);
    try {
      await adminService.excluirCategoria(id);
      toast.success('Categoria excluída!');
      carregar();
    } catch (err) {
      setErro('Erro ao excluir categoria');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Categorias</h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-6 items-end">
        <input
          type="text"
          placeholder="Nome da categoria"
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          required
        />
        <input
          type="text"
          placeholder="Descrição"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={16}/>Adicionar</button>
      </form>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Lista de Categorias</h2>
        <button onClick={carregar} className="text-blue-600 hover:text-blue-800 flex items-center gap-1"><RefreshCw size={16}/>Atualizar</button>
      </div>
      {erro && <div className="text-red-600 mb-2">{erro}</div>}
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
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map(cat => (
              <tr key={cat.id} className="border-b last:border-0">
                <td className="py-2">{cat.nome}</td>
                <td className="py-2">{cat.descricao}</td>
                <td className="py-2">
                  <button onClick={() => handleExcluir(cat.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 