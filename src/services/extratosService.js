import { db } from '../firebase/config';
import { collection, getDocs, query, where, orderBy, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { googleSheetsService } from './googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

// Função auxiliar para normalizar data (retorna string no formato YYYY-MM-DD)
const normalizarData = (data) => {
  if (!data) return null;
  
  let dataObj;
  if (data instanceof Date) {
    dataObj = data;
  } else if (typeof data === 'string') {
    if (data.includes('T')) {
      // Formato ISO
      dataObj = new Date(data);
    } else if (data.includes('/')) {
      // Formato dd/mm/yyyy
      const [dia, mes, ano] = data.split('/');
      dataObj = new Date(ano, mes - 1, dia);
    } else {
      // Formato yyyy-mm-dd
      dataObj = new Date(data);
    }
  }
  
  if (!dataObj || isNaN(dataObj.getTime())) return null;
  
  // Retorna data no formato YYYY-MM-DD
  return dataObj.toISOString().split('T')[0];
};

async function buscarLancamentosFirebase(filtros) {
  try {
    let q = query(collection(db, 'lancamentos'), orderBy('data', 'desc'));
    const snapshot = await getDocs(q);
    
    let lancamentos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      origem: 'LANCAMENTO_MANUAL'
    }));

    return lancamentos;
  } catch (error) {
    console.error('❌ Erro ao buscar lançamentos do Firebase:', error);
    return [];
  }
}

async function buscarExtratos(filtros = {}) {
  try {
    console.log('🔄 Buscando extratos com filtros:', filtros);
    const { unidade, dataInicial, dataFinal, tipo } = filtros;
    
    let extratosSheets = [];
    let extratosFirebase = [];

    // 1. Coletar dados brutos
    if (unidade === 'all') {
      const sheetsPromises = Object.keys(SHEETS_CONFIG.UNIDADES_PLANILHAS).map(unidadeKey =>
        googleSheetsService.buscarExtratosFiltrados({ ...filtros, unidade: unidadeKey, dataInicial: null, dataFinal: null, tipo: null })
      );
      const sheetsResults = await Promise.all(sheetsPromises);
      extratosSheets = sheetsResults.flat();
      
      extratosFirebase = await buscarLancamentosFirebase(filtros);
    } else {
      extratosSheets = await googleSheetsService.buscarExtratosFiltrados({ ...filtros, dataInicial: null, dataFinal: null, tipo: null });
      extratosFirebase = await buscarLancamentosFirebase(filtros);
    }

    // 2. Combinar e filtrar
    let todosExtratos = [...extratosSheets, ...extratosFirebase];

    // Aplicar filtro de unidade (se não for 'all')
    if (unidade && unidade !== 'all') {
      todosExtratos = todosExtratos.filter(ext => ext.unidade === unidade);
    }

    // Aplicar filtro de data
    if (dataInicial && dataFinal) {
      const inicio = new Date(dataInicial);
      const fim = new Date(dataFinal);
      fim.setHours(23, 59, 59, 999);

      todosExtratos = todosExtratos.filter(ext => {
        const dataExtrato = ext.data?.toDate ? ext.data.toDate() : new Date(ext.data);
        return dataExtrato >= inicio && dataExtrato <= fim;
      });
    }

    // Aplicar filtro de tipo
    if (tipo) {
      todosExtratos = todosExtratos.filter(ext => (ext.tipo || ext.type) === tipo);
    }

    // 3. Ordenar
    return todosExtratos.sort((a, b) => {
      const dataA = a.data?.toDate ? a.data.toDate() : new Date(a.data);
      const dataB = b.data?.toDate ? b.data.toDate() : new Date(b.data);
      return dataB - dataA;
    });

  } catch (error) {
    console.error('❌ Erro geral ao buscar extratos:', error);
    return [];
  }
}

// Funções de CRUD
export async function adicionarExtrato(extrato) {
  try {
    const docRef = await addDoc(collection(db, 'lancamentos'), {
      ...extrato,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar lançamento:', error);
    throw error;
  }
}

export async function atualizarExtrato(id, extrato) {
  try {
    const docRef = doc(db, 'lancamentos', id);
    await updateDoc(docRef, { ...extrato, updatedAt: new Date() });
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error);
    throw error;
  }
}

export async function removerExtrato(id) {
  try {
    const docRef = doc(db, 'lancamentos', id);
    await updateDoc(docRef, { status: 'DELETED', deletedAt: new Date() });
  } catch (error) {
    console.error('Erro ao excluir lançamento:', error);
    throw error;
  }
}

// Service object
export const extratosService = {
  buscarExtratos,
  adicionarExtrato,
  atualizarExtrato,
  removerExtrato,

  excluirEmLote: async (ids) => {
    const batch = ids.map(id => {
      const docRef = doc(db, 'lancamentos', id);
      return updateDoc(docRef, { status: 'DELETED', deletedAt: new Date() });
    });
    await Promise.all(batch);
  },

  alterarStatusEmLote: async (ids, novoStatus) => {
    const batch = ids.map(id => {
      const docRef = doc(db, 'lancamentos', id);
      return updateDoc(docRef, { status: novoStatus });
    });
    await Promise.all(batch);
  },

  alterarUnidadeEmLote: async (ids, novaUnidade) => {
    const batch = ids.map(id => {
      const docRef = doc(db, 'lancamentos', id);
      return updateDoc(docRef, { unidade: novaUnidade });
    });
    await Promise.all(batch);
  }
}; 