import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const lancamentosService = {
  // Criar um novo lançamento (receita ou despesa)
  async criarLancamento(dadosLancamento) {
    try {
      console.log('💰 Criando lançamento:', dadosLancamento);
      
      // Verificar se o usuário está autenticado
      const { auth } = await import('../firebase/config');
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado. Faça login para criar lançamentos.');
      }
      
      const lancamento = {
        ...dadosLancamento,
        dataLancamento: Timestamp.fromDate(new Date(dadosLancamento.data)),
        dataCriacao: Timestamp.now(),
        status: 'ATIVO',
        criadoPor: auth.currentUser.uid, // Adicionar ID do usuário
        emailCriador: auth.currentUser.email // Adicionar email do criador
      };
      
      const docRef = await addDoc(collection(db, 'lancamentos'), lancamento);
      console.log('✅ Lançamento criado com ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...lancamento
      };
    } catch (error) {
      console.error('❌ Erro ao criar lançamento:', error);
      
      if (error.code === 'permission-denied') {
        throw new Error('Sem permissão para criar lançamentos. Verifique as configurações do Firebase.');
      }
      
      throw new Error(`Erro ao salvar lançamento: ${error.message}`);
    }
  },

  // Buscar lançamentos por filtros
  async buscarLancamentos(filtros = {}) {
    try {
      console.log('🔍 Buscando lançamentos com filtros:', filtros);
      
      // Verificar se o usuário está autenticado
      const { auth } = await import('../firebase/config');
      if (!auth.currentUser) {
        console.warn('⚠️ Usuário não autenticado, retornando lista vazia de lançamentos');
        return [];
      }
      
      // BUSCA SIMPLES: Buscar TODOS os lançamentos ativos e filtrar no cliente
      console.log('🔍 Fazendo busca simples de todos os lançamentos ativos...');
      let q = query(collection(db, 'lancamentos'), where('status', '==', 'ATIVO'));
      
      const querySnapshot = await getDocs(q);
      const lancamentos = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        lancamentos.push({
          id: doc.id,
          ...data,
          // Converter Timestamp para Date
          data: data.dataLancamento?.toDate?.() || new Date(),
          dataCriacao: data.dataCriacao?.toDate?.() || new Date()
        });
      });
      
      console.log(`✅ ${lancamentos.length} lançamentos encontrados no total`);
      
      // Aplicar filtros no cliente
      let lancamentosFiltrados = lancamentos;
      
      // Filtro por unidade
      if (filtros.unidade && filtros.unidade !== 'all') {
        lancamentosFiltrados = lancamentosFiltrados.filter(lancamento => 
          lancamento.unidade === filtros.unidade
        );
        console.log(`🏢 ${lancamentosFiltrados.length} lançamentos após filtro de unidade (${filtros.unidade})`);
      }
      
      // Filtro por tipo
      if (filtros.tipo) {
        lancamentosFiltrados = lancamentosFiltrados.filter(lancamento => 
          lancamento.tipo === filtros.tipo
        );
        console.log(`📊 ${lancamentosFiltrados.length} lançamentos após filtro de tipo (${filtros.tipo})`);
      }
      
      if (filtros.dataInicial && filtros.dataFinal) {
        const dataIni = new Date(filtros.dataInicial);
        const dataFim = new Date(filtros.dataFinal);
        dataFim.setHours(23, 59, 59, 999);
        
        lancamentosFiltrados = lancamentos.filter(lancamento => {
          const dataLancamento = new Date(lancamento.data);
          return dataLancamento >= dataIni && dataLancamento <= dataFim;
        });
        
        console.log(`📅 ${lancamentosFiltrados.length} lançamentos após filtro de data`);
      }
      
      return lancamentosFiltrados;
    } catch (error) {
      console.error('❌ Erro ao buscar lançamentos:', error);
      
      // Se for erro de permissão, retornar array vazio em vez de falhar
      if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ Sem permissão para acessar lançamentos, retornando lista vazia');
        return [];
      }
      
      // Para outros erros, retornar array vazio também para não quebrar a aplicação
      console.warn('⚠️ Erro ao buscar lançamentos, retornando lista vazia');
      return [];
    }
  },

  // Atualizar um lançamento
  async atualizarLancamento(id, dadosAtualizacao) {
    try {
      console.log('📝 Atualizando lançamento:', id, dadosAtualizacao);
      
      const lancamentoRef = doc(db, 'lancamentos', id);
      const dadosParaAtualizar = {
        ...dadosAtualizacao,
        dataAtualizacao: Timestamp.now()
      };
      
      // Se a data foi alterada, converter para Timestamp
      if (dadosAtualizacao.data) {
        dadosParaAtualizar.dataLancamento = Timestamp.fromDate(new Date(dadosAtualizacao.data));
        delete dadosParaAtualizar.data; // Remove a data em formato string
      }
      
      await updateDoc(lancamentoRef, dadosParaAtualizar);
      console.log('✅ Lançamento atualizado com sucesso');
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar lançamento:', error);
      throw new Error(`Erro ao atualizar lançamento: ${error.message}`);
    }
  },

  // Excluir um lançamento (soft delete)
  async excluirLancamento(id) {
    try {
      console.log('🗑️ Excluindo lançamento:', id);
      
      const lancamentoRef = doc(db, 'lancamentos', id);
      await updateDoc(lancamentoRef, {
        status: 'EXCLUIDO',
        dataExclusao: Timestamp.now()
      });
      
      console.log('✅ Lançamento excluído com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir lançamento:', error);
      throw new Error(`Erro ao excluir lançamento: ${error.message}`);
    }
  },

  // Atualizar status de lançamento baseado no status da conta BTG
  async atualizarStatusContaBTG(contaBTGId, novoStatus) {
    try {
      console.log('🔄 Atualizando status de lançamentos da conta BTG:', contaBTGId, 'para:', novoStatus);
      
      // Buscar lançamentos relacionados à conta BTG
      const q = query(
        collection(db, 'lancamentos'), 
        where('contaBTGId', '==', contaBTGId),
        where('status', '==', 'ATIVO')
      );
      
      const querySnapshot = await getDocs(q);
      const atualizacoes = [];
      
      querySnapshot.forEach((doc) => {
        const lancamentoRef = doc.ref;
        let novaDescricao = doc.data().descricao;
        
        // Atualizar descrição baseada no status
        if (novoStatus === 'PAGO') {
          novaDescricao = novaDescricao.replace('[AGUARDANDO]', '[PAGO]');
        } else if (novoStatus === 'CANCELADO') {
          novaDescricao = novaDescricao.replace('[AGUARDANDO]', '[CANCELADO]');
        } else if (novoStatus === 'AGUARDANDO') {
          novaDescricao = novaDescricao.replace(/\[(PAGO|CANCELADO)\]/, '[AGUARDANDO]');
        }
        
        const atualizacao = updateDoc(lancamentoRef, {
          descricao: novaDescricao,
          statusContaBTG: novoStatus,
          dataUltimaAlteracao: Timestamp.now()
        });
        
        atualizacoes.push(atualizacao);
      });
      
      await Promise.all(atualizacoes);
      console.log(`✅ ${atualizacoes.length} lançamentos atualizados`);
      
      return atualizacoes.length;
    } catch (error) {
      console.error('❌ Erro ao atualizar status dos lançamentos:', error);
      throw new Error(`Erro ao atualizar status dos lançamentos: ${error.message}`);
    }
  },

  // Buscar estatísticas dos lançamentos
  async buscarEstatisticas(filtros = {}) {
    try {
      console.log('Calculando estatísticas dos lançamentos');
      
      const lancamentos = await this.buscarLancamentos(filtros);
      
      const estatisticas = {
        totalReceitas: 0,
        totalDespesas: 0,
        saldoLancamentos: 0,
        quantidadeReceitas: 0,
        quantidadeDespesas: 0,
        totalTransacoes: 0
      };
      
      lancamentos.forEach(lancamento => {
        const valor = parseFloat(lancamento.valor) || 0;
        
        if (lancamento.tipo === 'RECEITA') {
          estatisticas.totalReceitas += valor;
          estatisticas.quantidadeReceitas++;
        } else if (lancamento.tipo === 'DESPESA') {
          estatisticas.totalDespesas += valor;
          estatisticas.quantidadeDespesas++;
        }
        
        estatisticas.totalTransacoes++;
      });
      
      estatisticas.saldoLancamentos = estatisticas.totalReceitas - estatisticas.totalDespesas;
      
      console.log('Estatísticas calculadas:', estatisticas);
      return estatisticas;
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      throw new Error(`Erro ao calcular estatísticas: ${error.message}`);
    }
  },

  // Formatar lançamento para exibição (compatível com extratos)
  formatarParaExtrato(lancamento) {
    // Determinar status baseado no statusContaBTG ou status padrão
    let statusFinal = 'CONFIRMADO';
    if (lancamento.statusContaBTG) {
      switch (lancamento.statusContaBTG) {
        case 'AGUARDANDO':
          statusFinal = 'AGUARDANDO';
          break;
        case 'PAGO':
          statusFinal = 'CONFIRMADO';
          break;
        case 'CANCELADO':
          statusFinal = 'CANCELADO';
          break;
        default:
          statusFinal = 'CONFIRMADO';
      }
    } else if (lancamento.categoria === 'CONTA_BTG') {
      // Se é conta BTG mas não tem statusContaBTG, assumir AGUARDANDO
      statusFinal = 'AGUARDANDO';
    }

    return {
      id: lancamento.id, // Usar ID original para permitir exclusão
      data: lancamento.data,
      date: lancamento.data,
      descricao: lancamento.descricao,
      description: lancamento.descricao,
      tipo: lancamento.tipo,
      type: lancamento.tipo === 'RECEITA' ? 'CREDIT' : 'DEBIT',
      valor: parseFloat(lancamento.valor) || 0,
      value: parseFloat(lancamento.valor) || 0,
      status: statusFinal,
      origem: 'LANCAMENTO_MANUAL',
      categoria: lancamento.categoria || 'OUTROS',
      unidade: lancamento.unidade,
      cliente: 'Lançamento Manual',
      formaPagamento: lancamento.formaPagamento || 'N/A',
      observacoes: lancamento.observacoes || '',
      fonte: 'firebase' // Marcar como lançamento manual do Firebase
    };
  },

  // Validar dados do lançamento
  validarLancamento(dados) {
    const erros = [];
    
    if (!dados.descricao || dados.descricao.trim() === '') {
      erros.push('Descrição é obrigatória');
    }
    
    if (!dados.valor || parseFloat(dados.valor) <= 0) {
      erros.push('Valor deve ser maior que zero');
    }
    
    if (!dados.data) {
      erros.push('Data é obrigatória');
    }
    
    if (!dados.tipo || !['RECEITA', 'DESPESA'].includes(dados.tipo)) {
      erros.push('Tipo deve ser RECEITA ou DESPESA');
    }
    
    if (!dados.unidade || dados.unidade.trim() === '') {
      erros.push('Unidade é obrigatória');
    }
    
    return erros;
  },

  // Excluir lançamentos relacionados a uma conta BTG
  async excluirLancamentosPorContaBTG(contaBTGId) {
    try {
      console.log('🗑️ Excluindo lançamentos relacionados à conta BTG:', contaBTGId);
      
      // Verificar se o usuário está autenticado
      const { auth } = await import('../firebase/config');
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado.');
      }
      
      // Buscar lançamentos relacionados à conta BTG
      const q = query(
        collection(db, 'lancamentos'), 
        where('contaBTGId', '==', contaBTGId),
        where('status', '==', 'ATIVO')
      );
      
      const querySnapshot = await getDocs(q);
      const exclusoes = [];
      
      querySnapshot.forEach((doc) => {
        const lancamentoRef = doc.ref;
        const exclusao = updateDoc(lancamentoRef, {
          status: 'EXCLUIDO',
          dataExclusao: Timestamp.now(),
          excluidoPor: auth.currentUser.uid,
          emailExclusor: auth.currentUser.email,
          motivoExclusao: 'Conta BTG excluída'
        });
        
        exclusoes.push(exclusao);
      });
      
      await Promise.all(exclusoes);
      console.log(`✅ ${exclusoes.length} lançamentos relacionados excluídos`);
      
      return exclusoes.length;
    } catch (error) {
      console.error('❌ Erro ao excluir lançamentos relacionados:', error);
      throw new Error(`Erro ao excluir lançamentos relacionados: ${error.message}`);
    }
  }
};

export default lancamentosService; 