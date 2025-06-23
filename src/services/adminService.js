import axios from 'axios';
import toast from 'react-hot-toast';

function resolveBaseUrl() {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  // Se não estiver em localhost, usa mesma origem + /api
  if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost') {
    return `${window.location.origin}/api`;
  }
  // Desenvolvimento local
  return 'http://localhost:3001/api';
}

const api = axios.create({
  baseURL: resolveBaseUrl()
});

function handleError(error, context) {
  console.error(`❌ [${context}]`, error);
  const message = error.response?.data?.error || error.message || 'Erro inesperado';
  toast.error(message);
  throw new Error(message);
}

export const adminService = {
  // ----- Categorias -----
  async listarCategorias() {
    try {
      const res = await api.get('/categorias');
      return res.data;
    } catch (err) {
      handleError(err, 'Listar Categorias');
      return [];
    }
  },
  async criarCategoria(dados) {
    try {
      const res = await api.post('/categorias', dados);
      toast.success('Categoria criada!');
      return res.data;
    } catch (err) {
      handleError(err, 'Criar Categoria');
    }
  },

  // ----- Contas -----
  async listarContas() {
    try {
      const res = await api.get('/contas');
      return res.data;
    } catch (err) {
      handleError(err, 'Listar Contas');
      return [];
    }
  },
  async criarConta(dados) {
    try {
      const res = await api.post('/contas', dados);
      toast.success('Conta criada!');
      return res.data;
    } catch (err) {
      handleError(err, 'Criar Conta');
    }
  },

  // ----- Formas de Pagamento -----
  async listarFormasPagamento() {
    try {
      const res = await api.get('/formas-pagamento');
      return res.data;
    } catch (err) {
      handleError(err, 'Listar Formas');
      return [];
    }
  },
  async criarFormaPagamento(dados) {
    try {
      const res = await api.post('/formas-pagamento', dados);
      toast.success('Forma de pagamento criada!');
      return res.data;
    } catch (err) {
      handleError(err, 'Criar Forma');
    }
  },

  // ----- Clientes / Fornecedores -----
  async listarClientesFornecedores() {
    try {
      const res = await api.get('/clientes-fornecedores');
      return res.data;
    } catch (err) {
      handleError(err, 'Listar Clientes/Fornecedores');
      return [];
    }
  },
  async criarClienteFornecedor(dados) {
    try {
      const res = await api.post('/clientes-fornecedores', dados);
      toast.success('Registro criado!');
      return res.data;
    } catch (err) {
      handleError(err, 'Criar Cliente/Fornecedor');
    }
  }
}; 