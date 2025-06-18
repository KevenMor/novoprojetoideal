import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const contasBTGService = {
  // Criar uma nova conta BTG
  async criarConta(dadosConta) {
    try {
      console.log('💳 Criando conta BTG:', dadosConta);
      
      // Verificar se o usuário está autenticado
      const { auth } = await import('../firebase/config');
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado. Faça login para criar contas BTG.');
      }
      
      // Converter data do formato DD/MM/YYYY para Date
      let dataVencimento;
      if (dadosConta.vencimento) {
        if (dadosConta.vencimento.includes('/')) {
          // Formato DD/MM/YYYY
          const [dia, mes, ano] = dadosConta.vencimento.split('/');
          dataVencimento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        } else {
          // Formato YYYY-MM-DD ou outro formato válido
          dataVencimento = new Date(dadosConta.vencimento);
        }
        
        // Verificar se a data é válida
        if (isNaN(dataVencimento.getTime())) {
          throw new Error(`Data de vencimento inválida: ${dadosConta.vencimento}`);
        }
      } else {
        throw new Error('Data de vencimento é obrigatória');
      }

      const conta = {
        ...dadosConta,
        status: 'AGUARDANDO', // Status inicial sempre AGUARDANDO
        dataCriacao: Timestamp.now(),
        dataVencimento: Timestamp.fromDate(dataVencimento),
        criadoPor: auth.currentUser.uid,
        emailCriador: auth.currentUser.email,
        ativo: true
      };
      
      const docRef = await addDoc(collection(db, 'contas_btg'), conta);
      console.log('✅ Conta BTG criada com ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...conta
      };
    } catch (error) {
      console.error('❌ Erro ao criar conta BTG:', error);
      
      if (error.code === 'permission-denied') {
        throw new Error('Sem permissão para criar contas BTG. Verifique as configurações do Firebase.');
      }
      
      throw new Error(`Erro ao salvar conta BTG: ${error.message}`);
    }
  },

  // Buscar contas BTG por filtros
  async buscarContas(filtros = {}) {
    try {
      console.log('🔍 Buscando contas BTG com filtros:', filtros);
      
      // Verificar se o usuário está autenticado
      const { auth } = await import('../firebase/config');
      if (!auth.currentUser) {
        console.warn('⚠️ Usuário não autenticado, retornando lista vazia de contas');
        return [];
      }
      
      // BUSCA SIMPLES: Buscar TODAS as contas ativas e filtrar no cliente
      console.log('🔍 Fazendo busca simples de todas as contas ativas...');
      let q = query(collection(db, 'contas_btg'), where('ativo', '==', true));
      
      const querySnapshot = await getDocs(q);
      const contas = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        contas.push({
          id: doc.id,
          ...data,
          // Converter Timestamps para Date
          vencimento: data.dataVencimento?.toDate?.() || new Date(data.vencimento),
          dataCriacao: data.dataCriacao?.toDate?.() || new Date()
        });
      });
      
      console.log(`✅ ${contas.length} contas encontradas no total`);
      
      // Aplicar filtros no cliente
      let contasFiltradas = contas;
      
      // Filtro por unidade
      if (filtros.unidade && filtros.unidade !== 'all') {
        contasFiltradas = contasFiltradas.filter(conta => 
          conta.unidade === filtros.unidade
        );
        console.log(`🏢 ${contasFiltradas.length} contas após filtro de unidade (${filtros.unidade})`);
      }
      
      // Filtro por status
      if (filtros.status) {
        contasFiltradas = contasFiltradas.filter(conta => 
          conta.status === filtros.status
        );
        console.log(`📊 ${contasFiltradas.length} contas após filtro de status (${filtros.status})`);
      }
      
      // Filtro por tipo
      if (filtros.tipo) {
        contasFiltradas = contasFiltradas.filter(conta => 
          conta.tipo === filtros.tipo
        );
        console.log(`💳 ${contasFiltradas.length} contas após filtro de tipo (${filtros.tipo})`);
      }
      
      // Filtro por data
      if (filtros.dataInicial && filtros.dataFinal) {
        const dataIni = new Date(filtros.dataInicial);
        const dataFim = new Date(filtros.dataFinal);
        dataFim.setHours(23, 59, 59, 999);
        
        contasFiltradas = contasFiltradas.filter(conta => {
          const dataVencimento = new Date(conta.vencimento);
          return dataVencimento >= dataIni && dataVencimento <= dataFim;
        });
        
        console.log(`📅 ${contasFiltradas.length} contas após filtro de data`);
      }
      
      // Ordenar por data de criação (mais recente primeiro)
      contasFiltradas.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
      
      return contasFiltradas;
    } catch (error) {
      console.error('❌ Erro ao buscar contas BTG:', error);
      
      // Se for erro de permissão, retornar array vazio em vez de falhar
      if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ Sem permissão para acessar contas BTG, retornando lista vazia');
        return [];
      }
      
      // Para outros erros, retornar array vazio também para não quebrar a aplicação
      console.warn('⚠️ Erro ao buscar contas BTG, retornando lista vazia');
      return [];
    }
  },

  // Alterar status de uma conta
  async alterarStatus(contaId, novoStatus) {
    try {
      console.log('📝 Alterando status da conta:', contaId, 'para:', novoStatus);
      
      // Verificar se o usuário está autenticado
      const { auth } = await import('../firebase/config');
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado.');
      }
      
      const contaRef = doc(db, 'contas_btg', contaId);
      const dadosParaAtualizar = {
        status: novoStatus,
        dataUltimaAlteracao: Timestamp.now(),
        alteradoPor: auth.currentUser.uid,
        emailAlterador: auth.currentUser.email
      };
      
      // Adicionar timestamp específico baseado no status
      if (novoStatus === 'PAGO') {
        dadosParaAtualizar.dataPagamento = Timestamp.now();
      } else if (novoStatus === 'CANCELADO') {
        dadosParaAtualizar.dataCancelamento = Timestamp.now();
      }
      
      await updateDoc(contaRef, dadosParaAtualizar);
      console.log('✅ Status da conta alterado com sucesso');
      
      // Sincronizar com os lançamentos nos extratos
      try {
        const { lancamentosService } = await import('./lancamentosService');
        const lancamentosAtualizados = await lancamentosService.atualizarStatusContaBTG(contaId, novoStatus);
        console.log(`✅ ${lancamentosAtualizados} lançamentos sincronizados`);
      } catch (syncError) {
        console.error('⚠️ Erro ao sincronizar lançamentos:', syncError);
        // Não falhar a operação principal por causa da sincronização
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao alterar status da conta:', error);
      throw new Error(`Erro ao alterar status: ${error.message}`);
    }
  },

  // Excluir uma conta (soft delete)
  async excluirConta(contaId) {
    try {
      console.log('🗑️ Excluindo conta BTG:', contaId);
      
      // Verificar se o usuário está autenticado
      const { auth } = await import('../firebase/config');
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado.');
      }
      
      // 1. Primeiro, excluir os lançamentos relacionados no extrato
      try {
        const { lancamentosService } = await import('./lancamentosService');
        const lancamentosExcluidos = await lancamentosService.excluirLancamentosPorContaBTG(contaId);
        console.log(`✅ ${lancamentosExcluidos} lançamentos relacionados excluídos do extrato`);
      } catch (lancamentoError) {
        console.error('⚠️ Erro ao excluir lançamentos relacionados:', lancamentoError);
        // Continuar com a exclusão da conta mesmo se houver erro nos lançamentos
      }
      
      // 2. Depois, excluir a conta BTG (soft delete)
      const contaRef = doc(db, 'contas_btg', contaId);
      await updateDoc(contaRef, {
        ativo: false,
        dataExclusao: Timestamp.now(),
        excluidoPor: auth.currentUser.uid,
        emailExclusor: auth.currentUser.email
      });
      
      console.log('✅ Conta BTG excluída com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir conta BTG:', error);
      throw new Error(`Erro ao excluir conta: ${error.message}`);
    }
  },

  // Buscar estatísticas das contas BTG
  async buscarEstatisticas(filtros = {}) {
    try {
      console.log('📊 Calculando estatísticas das contas BTG');
      
      const contas = await this.buscarContas(filtros);
      
      const estatisticas = {
        totalContas: contas.length,
        aguardando: contas.filter(c => c.status === 'AGUARDANDO').length,
        pagas: contas.filter(c => c.status === 'PAGO').length,
        canceladas: contas.filter(c => c.status === 'CANCELADO').length,
        valorTotal: 0,
        valorAguardando: 0,
        valorPago: 0
      };
      
      contas.forEach(conta => {
        const valor = parseFloat(conta.valor) || 0;
        estatisticas.valorTotal += valor;
        
        if (conta.status === 'AGUARDANDO') {
          estatisticas.valorAguardando += valor;
        } else if (conta.status === 'PAGO') {
          estatisticas.valorPago += valor;
        }
      });
      
      console.log('📊 Estatísticas calculadas:', estatisticas);
      return estatisticas;
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      throw new Error(`Erro ao calcular estatísticas: ${error.message}`);
    }
  },

  // Validar dados da conta BTG
  validarConta(dados) {
    const erros = [];
    
    if (!dados.descricao || dados.descricao.trim() === '') {
      erros.push('Descrição é obrigatória');
    }
    
    if (!dados.valor || parseFloat(dados.valor) <= 0) {
      erros.push('Valor deve ser maior que zero');
    }
    
    if (!dados.vencimento) {
      erros.push('Data de vencimento é obrigatória');
    }
    
    if (!dados.tipo || !['boleto', 'pix'].includes(dados.tipo)) {
      erros.push('Tipo deve ser boleto ou pix');
    }
    
    if (!dados.unidade || dados.unidade.trim() === '') {
      erros.push('Unidade é obrigatória');
    }
    
    // Validações específicas por tipo
    if (dados.tipo === 'boleto') {
      if (!dados.linhaDigitavel || dados.linhaDigitavel.replace(/\D/g, '').length !== 44) {
        erros.push('Linha digitável deve ter exatamente 44 dígitos');
      }
    }
    
    if (dados.tipo === 'pix') {
      if (!dados.tipoChave || !dados.chavePix) {
        erros.push('Tipo de chave e chave PIX são obrigatórios');
      }
      if (!dados.favorecido) {
        erros.push('Nome do favorecido é obrigatório');
      }
    }
    
    return erros;
  },

  // Baixa em lote (marcar várias contas como pagas) - Firestore direto
  async baixaEmLote(ids) {
    try {
      const { auth } = await import('../firebase/config');
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado.');
      }
      const results = [];
      for (const contaId of ids) {
        try {
          const contaRef = doc(db, 'contas_btg', contaId);
          await updateDoc(contaRef, {
            status: 'PAGO',
            dataPagamento: Timestamp.now(),
            dataUltimaAlteracao: Timestamp.now(),
            alteradoPor: auth.currentUser.uid,
            emailAlterador: auth.currentUser.email
          });
          results.push({ contaId, success: true });
        } catch (err) {
          results.push({ contaId, success: false, error: err.message });
        }
      }
      return results;
    } catch (error) {
      console.error('❌ Erro ao dar baixa em lote:', error);
      throw new Error('Erro ao dar baixa em lote: ' + error.message);
    }
  },
};

export default contasBTGService; 