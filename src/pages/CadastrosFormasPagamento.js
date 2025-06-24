import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Trash2, RefreshCw, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CadastrosFormasPagamento() {
  const [formas, setFormas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');
  const [adicionando, setAdicionando] = useState(false);

  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      const lista = await adminService.listarFormasPagamento();
      setFormas(lista);
    } catch (err) {
      setErro('Erro ao carregar formas de pagamento. Verifique sua conexão ou tente novamente.');
    }
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('O nome da forma de pagamento é obrigatório.');
      return;
    }
    setAdicionando(true);
    setErro('');
    try {
      await adminService.criarFormaPagamento({ nome: nome.trim(), descricao: descricao.trim() });
      setNome('');
      setDescricao('');
      toast.success('Forma de pagamento criada!');
      carregar();
    } catch (err) {
      setErro('Erro ao criar forma de pagamento. Verifique os dados e tente novamente.');
    }
    setAdicionando(false);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta forma de pagamento?')) return;
    setLoading(true);
    setErro('');
    try {
      await adminService.excluirFormaPagamento(id);
      toast.success('Forma de pagamento excluída!');
      carregar();
    } catch (err) {
      setErro('Erro ao excluir forma de pagamento. Tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-start min-h-[70vh] w-full bg-gray-50 py-10">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-8 text-gray-900 tracking-tight text-center">Formas de Pagamento</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 mb-10">
          <div className="relative">
            <input
              type="text"
              id="nome-forma"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="peer w-full border border-gray-300 rounded-xl px-4 pt-5 pb-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none shadow-sm bg-transparent"
              required
              disabled={adicionando}
              autoComplete="off"
            />
            <label htmlFor="nome-forma" className="absolute left-4 top-2 text-gray-500 text-sm transition-all duration-200 peer-focus:-translate-y-2 peer-focus:scale-90 peer-focus:text-blue-600 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 pointer-events-none bg-white px-1">Nome da forma de pagamento</label>
          </div>
          <div className="relative">
            <input
              type="text"
              id="descricao-forma"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="peer w-full border border-gray-300 rounded-xl px-4 pt-5 pb-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none shadow-sm bg-transparent"
              disabled={adicionando}
              autoComplete="off"
            />
            <label htmlFor="descricao-forma" className="absolute left-4 top-2 text-gray-500 text-sm transition-all duration-200 peer-focus:-translate-y-2 peer-focus:scale-90 peer-focus:text-blue-600 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 pointer-events-none bg-white px-1">Descrição</label>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-md transition disabled:opacity-60 text-lg"
            disabled={adicionando}
          >
            {adicionando ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus size={20} />}
            Adicionar
          </button>
        </form>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Lista de Formas de Pagamento</h2>
          <button
            onClick={carregar}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium px-2 py-1 rounded-lg transition"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />Atualizar
          </button>
        </div>
        {erro && <div className="text-red-600 mb-2 font-medium text-center">{erro}</div>}
        <div className="overflow-x-auto rounded-xl">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="animate-spin w-6 h-6 mr-2" /> Carregando...
            </div>
          ) : formas.length === 0 ? (
            <p className="text-gray-500 py-6 text-center">Nenhuma forma de pagamento cadastrada.</p>
          ) : (
            <table className="w-full text-left rounded-xl overflow-hidden shadow-sm bg-gray-50">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="py-3 px-4 text-gray-700 font-semibold">Nome</th>
                  <th className="py-3 px-4 text-gray-700 font-semibold">Descrição</th>
                  <th className="py-3 px-4 text-gray-700 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {formas.map((forma, idx) => (
                  <tr key={forma.id} className={`border-b last:border-0 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'} hover:bg-blue-100/60`}>
                    <td className="py-2 px-4 text-gray-900 font-medium">{forma.nome}</td>
                    <td className="py-2 px-4 text-gray-700">{forma.descricao}</td>
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => handleExcluir(forma.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-full transition"
                        title="Excluir forma de pagamento"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
} 