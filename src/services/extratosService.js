import { db } from '../firebase/config';
import { collection, getDocs, query, where, orderBy, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { googleSheetsService } from './googleSheetsService';
import { SHEETS_CONFIG } from '../config/sheetsConfig';

async function buscarLancamentosFirebase(filtros) {
  try {
    console.log('🔍 Buscando lançamentos do Firebase...');
    
    // Tentar buscar por data primeiro, depois por dataLancamento se fallar
    let q;
    let snapshot;
    
    try {
      q = query(
        collection(db, 'lancamentos'), 
        where('status', 'in', ['ATIVO', 'CONFIRMED']),
        orderBy('data', 'desc')
      );
      snapshot = await getDocs(q);
    } catch (error) {
      console.log('📅 Tentando buscar por dataLancamento...');
      try {
        q = query(
          collection(db, 'lancamentos'), 
          where('status', 'in', ['ATIVO', 'CONFIRMED']),
          orderBy('dataLancamento', 'desc')
        );
        snapshot = await getDocs(q);
      } catch (error2) {
        console.log('⚠️ Buscando sem ordenação...');
        q = query(collection(db, 'lancamentos'), where('status', 'in', ['ATIVO', 'CONFIRMED']));
        snapshot = await getDocs(q);
      }
    }
    
    let lancamentos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Garantir que tenha uma data válida
        data: data.data || data.dataLancamento,
        // Preservar a origem original ou definir como manual se não especificada
        origem: data.origem || 'LANCAMENTO_MANUAL',
        // Converter tipos de lançamento para compatibilidade com extratos
        tipo: data.tipo === 'RECEITA' ? 'CREDIT' : data.tipo === 'DESPESA' ? 'DEBIT' : data.tipo
      };
    });

    console.log(`✅ ${lancamentos.length} lançamentos encontrados no Firebase`);
    
    // Log detalhado de todos os lançamentos (apenas os primeiros 5)
    if (lancamentos.length > 0) {
      console.log('📋 Amostra de lançamentos encontrados:');
      lancamentos.slice(0, 5).forEach(l => {
        console.log(`  - ID: ${l.id} | Status: ${l.status} | Origem: ${l.origem} | Tipo: ${l.tipo} | Descrição: ${l.descricao} | Valor: ${l.valor} | Unidade: ${l.unidade} | Data: ${l.data}`);
      });
    }
    
    // Log dos lançamentos automáticos encontrados
    const automaticos = lancamentos.filter(l => l.origem === 'COBRANCA_AUTOMATICA');
    if (automaticos.length > 0) {
      console.log(`🤖 ${automaticos.length} lançamentos automáticos de cobrança encontrados:`);
      automaticos.forEach(l => {
        console.log(`  - ID: ${l.id} | Status: ${l.status} | Tipo: ${l.tipo} | Descrição: ${l.descricao} | Valor: R$ ${l.valor} | Unidade: "${l.unidade}" (${l.unidade?.length} chars) | Data: ${l.data}`);
      });
    } else {
      console.log('⚠️ Nenhum lançamento automático de cobrança encontrado');
    }

    return lancamentos;
  } catch (error) {
    console.error('❌ Erro ao buscar lançamentos do Firebase:', error);
    return [];
  }
}

async function buscarContasBTGPagas(filtros) {
  try {
    console.log('🔄 Buscando contas BTG pagas...');
    
    // Buscar contas BTG com status PAGO (sem orderBy para evitar índice composto)
    let q = query(
      collection(db, 'contas_btg'), 
      where('status', '==', 'PAGO')
    );
    
    const snapshot = await getDocs(q);
    
    let contasBTG = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Aplicar filtros de data no lado do cliente
      const dataPagamento = data.dataPagamento ? new Date(data.dataPagamento) : null;
      const dataVencimento = data.vencimento ? new Date(data.vencimento) : null;
      const dataCriacao = data.dataCriacao ? new Date(data.dataCriacao) : null;
      const dataReferencia = dataPagamento || dataVencimento || dataCriacao;
      
      // Filtro de data inicial
      if (filtros.dataInicial && dataReferencia) {
        const dataIni = new Date(filtros.dataInicial);
        if (dataReferencia < dataIni) return;
      }
      
      // Filtro de data final
      if (filtros.dataFinal && dataReferencia) {
        const dataFim = new Date(filtros.dataFinal);
        dataFim.setHours(23, 59, 59, 999);
        if (dataReferencia > dataFim) return;
      }
      
      console.log('📄 Conta BTG paga encontrada:', data);
      
      // Converter para formato de extrato
      const extrato = {
        id: `btg_${doc.id}`,
        descricao: data.descricao || `BTG - ${data.favorecido || 'Pagamento'}`,
        valor: Math.abs(data.valor || 0), // Garantir que seja positivo
        data: data.dataPagamento || data.vencimento || data.dataCriacao,
        tipo: 'DEBIT', // Contas BTG são sempre despesas
        type: 'DEBIT',
        status: 'PAGO',
        unidade: data.unidade || '',
        origem: 'CONTA_BTG',
        tipoConta: data.tipo || '', // boleto ou pix
        favorecido: data.favorecido || '',
        chavePix: data.chavePix || '',
        linhaDigitavel: data.linhaDigitavel || ''
      };
      
      contasBTG.push(extrato);
    });

    console.log(`✅ ${contasBTG.length} contas BTG pagas encontradas`);
    return contasBTG;
  } catch (error) {
    console.error('❌ Erro ao buscar contas BTG pagas:', error);
    // Não falhar se não conseguir buscar contas BTG
    return [];
  }
}

async function buscarExtratos(filtros = {}) {
  try {
    console.log('🔄 Buscando extratos com filtros:', filtros);
    const { unidade, dataInicial, dataFinal, tipo } = filtros;
    
    let extratosSheets = [];
    let extratosFirebase = [];
    let contasBTGPagas = [];

    // 1. Coletar dados brutos
    if (unidade === 'all') {
      const sheetsPromises = Object.keys(SHEETS_CONFIG.UNIDADES_PLANILHAS).map(unidadeKey =>
        googleSheetsService.buscarExtratosFiltrados({ ...filtros, unidade: unidadeKey, dataInicial: null, dataFinal: null, tipo: null })
      );
      const sheetsResults = await Promise.all(sheetsPromises);
      extratosSheets = sheetsResults.flat();
      
      extratosFirebase = await buscarLancamentosFirebase(filtros);
      contasBTGPagas = await buscarContasBTGPagas(filtros);
    } else {
      extratosSheets = await googleSheetsService.buscarExtratosFiltrados({ ...filtros, dataInicial: null, dataFinal: null, tipo: null });
      extratosFirebase = await buscarLancamentosFirebase(filtros);
      contasBTGPagas = await buscarContasBTGPagas(filtros);
    }

    // 2. Combinar e filtrar
    let todosExtratos = [...extratosSheets, ...extratosFirebase, ...contasBTGPagas];

    console.log(`📊 Total de extratos antes dos filtros: ${todosExtratos.length}`);
    console.log(`  - Sheets: ${extratosSheets.length}`);
    console.log(`  - Firebase: ${extratosFirebase.length}`);
    console.log(`  - BTG: ${contasBTGPagas.length}`);
    
    // Verificar se há lançamentos automáticos no total
    const totalAutomaticos = todosExtratos.filter(ext => ext.origem === 'COBRANCA_AUTOMATICA');
    console.log(`🤖 Lançamentos automáticos no total: ${totalAutomaticos.length}`);

    // Aplicar filtro de unidade (se não for 'all') - CASE INSENSITIVE
    if (unidade && unidade !== 'all') {
      const antesDoFiltro = todosExtratos.length;
      
      // Log das unidades encontradas nos extratos para debug
      const unidadesEncontradas = [...new Set(todosExtratos.map(ext => ext.unidade))];
      console.log(`🏢 Unidades encontradas nos extratos:`, unidadesEncontradas);
      console.log(`🔍 Filtrando por unidade: "${unidade}"`);
      
      // Filtro case-insensitive
      todosExtratos = todosExtratos.filter(ext => {
        const unidadeExtrato = (ext.unidade || '').toString().toLowerCase().trim();
        const unidadeFiltro = (unidade || '').toString().toLowerCase().trim();
        const match = unidadeExtrato === unidadeFiltro;
        
        // Log detalhado para lançamentos automáticos
        if (ext.origem === 'COBRANCA_AUTOMATICA') {
          console.log(`🤖 Lançamento automático - Unidade: "${ext.unidade}" vs Filtro: "${unidade}" | Match: ${match}`);
        }
        
        return match;
      });
      
      console.log(`🏢 Filtro de unidade "${unidade}": ${antesDoFiltro} → ${todosExtratos.length}`);
      
      // Verificar se ainda há lançamentos automáticos após filtro de unidade
      const automaticosAposFiltro = todosExtratos.filter(ext => ext.origem === 'COBRANCA_AUTOMATICA');
      console.log(`🤖 Lançamentos automáticos após filtro de unidade: ${automaticosAposFiltro.length}`);
      
      if (automaticosAposFiltro.length > 0) {
        console.log('✅ Lançamentos automáticos que passaram pelo filtro:');
        automaticosAposFiltro.forEach(l => {
          console.log(`  - ${l.descricao} | Unidade: "${l.unidade}" | Valor: R$ ${l.valor}`);
        });
      }
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