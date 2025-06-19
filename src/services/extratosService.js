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

// Função para processar extratos APENAS com dados reais (sem fallback para dados de teste)
async function processarExtratosComFallback(filtros = {}) {
  try {
    console.log('🔄 Processando extratos com dados reais para filtros:', filtros);
    
    // Normalizar datas do filtro
    const dataInicialNormalizada = normalizarData(filtros.dataInicial);
    const dataFinalNormalizada = normalizarData(filtros.dataFinal);
    
    console.log('📅 Datas normalizadas:', {
      dataInicial: dataInicialNormalizada,
      dataFinal: dataFinalNormalizada
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
      
      // Filtro por data específica
      if (dataInicialNormalizada && dataFinalNormalizada) {
        console.log('📅 Aplicando filtro por data específica:', {
          de: dataInicialNormalizada,
          ate: dataFinalNormalizada
        });
        
        extratosFiltrados = extratosFiltrados.filter(extrato => {
          // Normalizar data do extrato
          const dataExtratoNormalizada = normalizarData(extrato.data || extrato.date);
          if (!dataExtratoNormalizada) {
            console.log('⚠️ Data inválida no extrato:', extrato);
            return false;
          }
          
          // Comparar as datas normalizadas (YYYY-MM-DD)
          const dentroDoPeriodo = dataExtratoNormalizada >= dataInicialNormalizada && 
                                 dataExtratoNormalizada <= dataFinalNormalizada;
          
          if (!dentroDoPeriodo) {
            console.log(`❌ Extrato fora do período: ${dataExtratoNormalizada} não está entre ${dataInicialNormalizada} e ${dataFinalNormalizada}`);
          }
          
          return dentroDoPeriodo;
        });
        
        console.log(`📅 ${extratosFiltrados.length} extratos após filtro de data`);
        
        if (extratosFiltrados.length > 0) {
          console.log('📅 Datas encontradas após filtro:', 
            [...new Set(extratosFiltrados.map(e => normalizarData(e.data || e.date)))].sort()
          );
        }
      }
      
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
            data: normalizarData(e.data || e.date)
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
      const dataIni = new Date(dataInicial);
      const dataFim = new Date(dataFinal);
      dataFim.setHours(23, 59, 59, 999); // Incluir todo o dia final
      
      console.log(`📅 Filtrando por período: ${dataIni.toLocaleDateString()} até ${dataFim.toLocaleDateString()}`);
      console.log(`📅 Período em timestamp: ${dataIni.getTime()} até ${dataFim.getTime()}`);
      
      extratosQuery = query(
        collection(db, 'extratos'),
        where('data', '>=', dataIni),
        where('data', '<=', dataFim),
        orderBy('data', 'desc')
      );
    }
    
    const extratosSnapshot = await getDocs(extratosQuery);
    let extratos = extratosSnapshot.docs.map(doc => {
      const data = doc.data();
      // Converter o campo 'data' para Date se for string
      if (typeof data.data === 'string') {
        try {
          data.data = new Date(data.data);
          if (isNaN(data.data.getTime())) {
            console.error(`❌ Data inválida no documento ${doc.id}: "${data.data}"`);
            return null;
          }
        } catch (error) {
          console.error(`❌ Erro ao converter data no documento ${doc.id}: "${data.data}"`, error);
          return null;
        }
      }
      return { id: doc.id, ...data, origem: 'FIREBASE' };
    }).filter(Boolean); // Remover documentos com data inválida
    
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
  buscarExtratos: async (filtros) => {
    try {
      console.log('🔄 Buscando extratos com filtros:', filtros);
      
      // Se a unidade for 'all', buscar de todas as unidades
      if (filtros.unidade === 'all') {
        console.log('🔄 Buscando extratos de todas as unidades...');
        let todosExtratos = [];
        
        // Buscar extratos do Google Sheets para todas as unidades
        for (const unidade of Object.keys(SHEETS_CONFIG.UNIDADES_PLANILHAS)) {
          try {
            const extratosUnidade = await googleSheetsService.buscarExtratosFiltrados({
              ...filtros,
              unidade
            });
            todosExtratos = [...todosExtratos, ...extratosUnidade];
          } catch (error) {
            console.error(`❌ Erro ao buscar extratos da unidade ${unidade}:`, error);
          }
        }

        // Buscar lançamentos do Firestore sem filtro de unidade
        let lancamentosFirestore = [];
        try {
          const lancamentosRef = collection(db, 'lancamentos');
          let q = query(lancamentosRef);

          // Buscar todos os lançamentos e filtrar no código
          const snapshot = await getDocs(q);
          
          lancamentosFirestore = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              origem: 'LANCAMENTO_MANUAL'
            }))
            .filter(lancamento => {
              // Filtrar por data
              if (filtros.dataInicial && filtros.dataFinal) {
                const dataLancamento = lancamento.data;
                if (!dataLancamento) return false;
                return dataLancamento >= filtros.dataInicial && dataLancamento <= filtros.dataFinal;
              }
              return true;
            })
            .filter(lancamento => {
              // Filtrar por tipo
              if (filtros.tipo) {
                return lancamento.tipo === filtros.tipo;
              }
              return true;
            });
        } catch (error) {
          console.error('❌ Erro ao buscar do Firestore:', error);
        }

        // Combinar todos os extratos
        const todosExtratosUnificados = [...todosExtratos, ...lancamentosFirestore];

        // Ordenar por data
        return todosExtratosUnificados.sort((a, b) => {
          const dataA = a.data || '';
          const dataB = b.data || '';
          return dataB.localeCompare(dataA);
        });
      }

      // Se não for 'all', continuar com a lógica existente
      // Buscar extratos do Google Sheets primeiro
      let extratosSheets = [];
      try {
        extratosSheets = await googleSheetsService.buscarExtratosFiltrados(filtros);
        console.log(`📊 ${extratosSheets.length} extratos encontrados no Google Sheets`);
      } catch (error) {
        console.error('❌ Erro ao buscar do Google Sheets:', error);
      }

      // Buscar lançamentos do Firestore com query simplificada
      let lancamentosFirestore = [];
      try {
        const lancamentosRef = collection(db, 'lancamentos');
        
        // Construir query básica primeiro
        let q = query(lancamentosRef);
        
        // Adicionar filtro de unidade se especificado
        if (filtros.unidade && filtros.unidade !== 'all') {
          q = query(q, where('unidade', '==', filtros.unidade));
        }

        // Buscar todos os lançamentos e filtrar no código
        const snapshot = await getDocs(q);
        
        lancamentosFirestore = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            origem: 'LANCAMENTO_MANUAL'
          }))
          .filter(lancamento => {
            // Filtrar por data
            if (filtros.dataInicial && filtros.dataFinal) {
              const dataLancamento = lancamento.data;
              if (!dataLancamento) return false;
              return dataLancamento >= filtros.dataInicial && dataLancamento <= filtros.dataFinal;
            }
            return true;
          })
          .filter(lancamento => {
            // Filtrar por tipo
            if (filtros.tipo) {
              return lancamento.tipo === filtros.tipo;
            }
            return true;
          });

        console.log(`🔥 ${lancamentosFirestore.length} lançamentos encontrados no Firestore`);
      } catch (error) {
        console.error('❌ Erro ao buscar do Firestore:', error);
        // Não lançar o erro, apenas logar e continuar com os dados do Google Sheets
      }

      // Combinar todos os extratos
      const todosExtratos = [...extratosSheets, ...lancamentosFirestore];

      // Ordenar por data
      const extratosOrdenados = todosExtratos.sort((a, b) => {
        const dataA = a.data || '';
        const dataB = b.data || '';
        return dataB.localeCompare(dataA);
      });

      console.log(`✅ Total de ${extratosOrdenados.length} extratos combinados`);
      
      if (extratosOrdenados.length === 0) {
        console.log('⚠️ Nenhum extrato encontrado com os filtros:', filtros);
      }

      return extratosOrdenados;
    } catch (error) {
      console.error('❌ Erro geral ao buscar extratos:', error);
      return []; // Retornar array vazio em caso de erro
    }
  }
}; 