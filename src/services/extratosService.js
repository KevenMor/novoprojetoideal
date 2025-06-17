import { db } from '../firebase/config';
import { collection, getDocs, query, where, orderBy, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { googleSheetsService } from './googleSheetsService';

// Função para processar extratos APENAS com dados reais (sem fallback para dados de teste)
async function processarExtratosComFallback(filtros = {}) {
  try {
    console.log('🔄 Processando extratos com dados reais para filtros:', filtros);
    console.log('📋 Detalhes dos filtros:', {
      dataInicial: filtros.dataInicial,
      dataFinal: filtros.dataFinal,
      unidade: filtros.unidade,
      tipo: filtros.tipo
    });
    
    // PRIMEIRO: Tentar buscar do Google Sheets (dados reais das planilhas)
    console.log('📊 Iniciando busca no Google Sheets...');
    const extratosSheets = await googleSheetsService.buscarExtratosFiltrados(filtros);
    
    if (extratosSheets && extratosSheets.length > 0) {
      console.log(`✅ ${extratosSheets.length} extratos REAIS encontrados no Google Sheets`);
      
      // Log das unidades encontradas
      const unidadesEncontradas = [...new Set(extratosSheets.map(e => e.unidade))];
      console.log('🏢 Unidades com dados no Sheets:', unidadesEncontradas);
      
      // Aplicar filtros adicionais se necessário
      let extratosFiltrados = extratosSheets;
      
      // Filtro por tipo
      if (filtros.tipo) {
        console.log(`🔍 Aplicando filtro por tipo: ${filtros.tipo}`);
        extratosFiltrados = extratosFiltrados.filter(extrato => {
          const tipoExtrato = extrato.tipo || extrato.type;
          return tipoExtrato === filtros.tipo;
        });
      }
      
      console.log(`📊 ${extratosFiltrados.length} extratos após aplicar filtros adicionais`);
      
      // Log dos primeiros extratos para debug
      if (extratosFiltrados.length > 0) {
        console.log('🎯 Primeiros 3 extratos encontrados:', 
          extratosFiltrados.slice(0, 3).map(e => ({
            unidade: e.unidade,
            cliente: e.cliente,
            valor: e.valor,
            data: e.data
          }))
        );
      }
      
      return extratosFiltrados;
    }
    
    // SEGUNDO: Se não encontrar no Sheets, buscar no Firebase (dados salvos)
    console.log('⚠️ Sheets sem dados, buscando no Firebase...');
    const extratosFirebase = await buscarExtratosFirebase(filtros);
    
    if (extratosFirebase && extratosFirebase.length > 0) {
      console.log(`✅ ${extratosFirebase.length} extratos encontrados no Firebase`);
      return extratosFirebase;
    }
    
    // TERCEIRO: Se não encontrar em nenhum lugar, retornar array vazio (SEM dados de teste)
    console.log('⚠️ Nenhum dado encontrado - retornando array vazio (sem dados de teste)');
    return [];
    
  } catch (error) {
    console.error('❌ Erro ao processar extratos:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Em caso de erro, tentar buscar do Firebase como último recurso
    try {
      console.log('🔄 Tentando fallback para Firebase...');
      const extratosFirebase = await buscarExtratosFirebase(filtros);
      if (extratosFirebase && extratosFirebase.length > 0) {
        console.log(`🔄 Fallback: ${extratosFirebase.length} extratos do Firebase`);
        return extratosFirebase;
      }
    } catch (firebaseError) {
      console.error('❌ Erro também no Firebase:', firebaseError);
    }
    
    // Retornar array vazio em vez de dados de teste
    return [];
  }
}

// Buscar extratos do Firebase
async function buscarExtratosFirebase(filtros = {}) {
  try {
    const { dataInicial, dataFinal, unidade } = filtros;
    
    let extratosQuery = query(
      collection(db, 'extratos'),
      orderBy('data', 'desc')
    );
    
    if (dataInicial && dataFinal) {
      extratosQuery = query(
        collection(db, 'extratos'),
        where('data', '>=', new Date(dataInicial)),
        where('data', '<=', new Date(dataFinal)),
        orderBy('data', 'desc')
      );
    }
    
    const extratosSnapshot = await getDocs(extratosQuery);
    let extratos = extratosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      origem: 'FIREBASE'
    }));
    
    // Filtrar por unidade se especificada
    if (unidade) {
      extratos = extratos.filter(extrato => extrato.unidade === unidade);
    }
    
    return extratos;
  } catch (error) {
    console.error('❌ Erro ao buscar extratos do Firebase:', error);
    return [];
  }
}

// Função principal para buscar extratos (SEM dados de teste)
export async function buscarExtratos(filtros = {}) {
  return await processarExtratosComFallback(filtros);
}

// Funções de CRUD para extratos
export async function adicionarExtrato(extrato) {
  try {
    const docRef = await addDoc(collection(db, 'extratos'), {
      ...extrato,
      data: new Date(extrato.data),
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar extrato:', error);
    throw error;
  }
}

export async function atualizarExtrato(id, extrato) {
  try {
    const docRef = doc(db, 'extratos', id);
    await updateDoc(docRef, {
      ...extrato,
      data: new Date(extrato.data),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao atualizar extrato:', error);
    throw error;
  }
}

export async function removerExtrato(id) {
  try {
    await deleteDoc(doc(db, 'extratos', id));
  } catch (error) {
    console.error('Erro ao remover extrato:', error);
    throw error;
  }
}

// Service object para compatibilidade
export const extratosService = {
  buscarExtratos
}; 