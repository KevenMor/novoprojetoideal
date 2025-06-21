import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  doc,
  updateDoc,
  getDoc,
  orderBy,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLECAO_CONTAS_BTG = 'contas_btg';

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
        if (typeof dadosConta.vencimento === 'string') {
          if (dadosConta.vencimento.includes('/')) {
            // Formato DD/MM/YYYY
            const [dia, mes, ano] = dadosConta.vencimento.split('/');
            dataVencimento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
          } else {
            // Formato YYYY-MM-DD ou outro formato válido
            dataVencimento = new Date(dadosConta.vencimento);
          }
        } else if (dadosConta.vencimento instanceof Date) {
          dataVencimento = dadosConta.vencimento;
        }
        
        // Verificar se a data é válida
        if (isNaN(dataVencimento?.getTime())) {
          console.error('Data inválida:', dadosConta.vencimento);
          throw new Error(`Data de vencimento inválida: ${dadosConta.vencimento}`);
        }
      } else {
        throw new Error('Data de vencimento é obrigatória');
      }

      const conta = {
        descricao: dadosConta.descricao,
        valor: typeof dadosConta.valor === 'string' ? parseFloat(dadosConta.valor.replace(',', '.')) : dadosConta.valor,
        vencimento: Timestamp.fromDate(dataVencimento),
        status: 'AGUARDANDO',
        tipo: dadosConta.tipo,
        unidade: dadosConta.unidade,
        criadoPor: auth.currentUser.uid,
        emailCriador: auth.currentUser.email,
        dataCriacao: Timestamp.now(),
        ativo: true,
        ...(dadosConta.tipo === 'boleto' && { linhaDigitavel: dadosConta.linhaDigitavel }),
        ...(dadosConta.tipo === 'pix' && { 
            chavePix: dadosConta.chavePix, 
            tipoChave: dadosConta.tipoChave,
            favorecido: dadosConta.favorecido,
            cpfCnpjFavorecido: dadosConta.cpfCnpjFavorecido
        }),
      };
      
      console.log('Dados formatados para salvar:', conta);
      
      const docRef = await addDoc(collection(db, COLECAO_CONTAS_BTG), conta);
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
      console.log('🔍 Buscando todas as contas BTG...');
      
      // Buscar todos os documentos
      const querySnapshot = await getDocs(collection(db, COLECAO_CONTAS_BTG));
      console.log('📊 Total de documentos encontrados:', querySnapshot.size);

      // Mapear documentos para o formato esperado
      const contas = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Documento original:', data);

        // Extrair os campos do documento
        const {
          descricao = '',
          valor = 0,
          status = 'AGUARDANDO',
          tipo = 'boleto',
          unidade = '',
          vencimento,
          dataCriacao,
          dataPagamento,
          linhaDigitavel = '',
          chavePix = '',
          tipoChave = '',
          emailCriador = '',
          favorecido = '',
          cpfCnpjFavorecido = '',
          ...resto
        } = data;

        // Converter timestamps para datas
        const converterTimestamp = (campo) => {
          if (!campo) return null;
          if (campo instanceof Timestamp) {
            return new Date(campo.seconds * 1000);
          }
          if (typeof campo === 'object' && campo.seconds) {
            return new Date(campo.seconds * 1000);
          }
          if (typeof campo === 'string') {
            return new Date(campo);
          }
          return null;
        };

        const contaConvertida = {
          id: doc.id,
          descricao,
          valor: Number(valor),
          status,
          tipo,
          unidade,
          vencimento: converterTimestamp(vencimento),
          dataCriacao: converterTimestamp(dataCriacao),
          dataPagamento: converterTimestamp(dataPagamento),
          linhaDigitavel,
          chavePix,
          tipoChave,
          emailCriador,
          favorecido,
          cpfCnpjFavorecido
        };

        console.log('✅ Conta convertida:', contaConvertida);
        return contaConvertida;
      });

      console.log('✅ Total de contas convertidas:', contas.length);
      return contas;
    } catch (error) {
      console.error('❌ Erro ao buscar contas:', error);
      throw error;
    }
  },

  // Alterar status de uma conta
  async alterarStatus(id, novoStatus, dadosAdicionais = {}) {
    try {
      console.log('Atualizando status da conta:', { id, novoStatus, dadosAdicionais });
      
      const docRef = doc(db, COLECAO_CONTAS_BTG, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Conta não encontrada');
      }
      
      const dadosParaAtualizar = {
        status: novoStatus,
        dataAtualizacao: new Date(),
        ...dadosAdicionais
      };
      
      if (novoStatus === 'PAGO') {
        dadosParaAtualizar.dataPagamento = new Date();
      }
      
      await updateDoc(docRef, dadosParaAtualizar);
      console.log('✅ Status atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      throw error;
    }
  },

  // Excluir uma conta (soft delete)
  async excluirConta(contaId) {
    try {
      console.log('🗑️ Excluindo conta:', contaId);
      await deleteDoc(doc(db, COLECAO_CONTAS_BTG, contaId));
      console.log('✅ Conta excluída com sucesso');
    } catch (error) {
      console.error('❌ Erro ao excluir conta:', error);
      throw error;
    }
  },

  // Buscar estatísticas das contas BTG
  async buscarEstatisticas(filtros = {}) {
    try {
      const contas = await this.buscarContas(filtros);
      
      const estatisticas = {
        total: contas.length,
        totalAguardando: contas.filter(c => c.status === 'AGUARDANDO').length,
        totalPago: contas.filter(c => c.status === 'PAGO').length,
        totalCancelado: contas.filter(c => c.status === 'CANCELADO').length,
        valorAguardando: contas
          .filter(c => c.status === 'AGUARDANDO')
          .reduce((acc, curr) => acc + (curr.valor || 0), 0),
        valorPago: contas
          .filter(c => c.status === 'PAGO')
          .reduce((acc, curr) => acc + (curr.valor || 0), 0)
      };

      console.log('📊 Estatísticas calculadas:', estatisticas);
      return estatisticas;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
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

  // Função interna para atualizar o lançamento correspondente
  async _atualizarLancamentoAssociado(contaBtgId) {
    try {
      console.log(`Buscando lançamento associado à conta BTG ID: ${contaBtgId}`);
      const lancamentosRef = collection(db, 'lancamentos');
      const q = query(lancamentosRef, where('contaBTGId', '==', contaBtgId));
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.warn(`Nenhum lançamento encontrado para a conta BTG ID: ${contaBtgId}`);
        return;
      }
      
      querySnapshot.forEach(async (docSnapshot) => {
        console.log(`Lançamento encontrado: ${docSnapshot.id}. Atualizando para 'Confirmado'.`);
        const lancamentoRef = doc(db, 'lancamentos', docSnapshot.id);
        const lancamentoData = docSnapshot.data();
        
        // Remover o prefixo [AGUARDANDO] da descrição
        let novaDescricao = lancamentoData.descricao || '';
        if (novaDescricao.startsWith('[AGUARDANDO] ')) {
          novaDescricao = novaDescricao.replace('[AGUARDANDO] ', '');
        }
        
        await updateDoc(lancamentoRef, {
          status: 'Confirmado',
          descricao: novaDescricao,
          data: Timestamp.now() // Atualiza a data do lançamento para a data do pagamento
        });
        console.log(`Lançamento ${docSnapshot.id} atualizado com sucesso. Descrição: "${novaDescricao}"`);
      });

    } catch (error) {
      console.error(`Erro ao atualizar lançamento associado para a conta ${contaBtgId}:`, error);
      // Não joga o erro para não impedir a operação principal de baixa
    }
  },

  // Baixa em lote (marcar várias contas como pagas) - Firestore direto
  async darBaixaEmLote(contaIds) {
    try {
      console.log('💰 Dando baixa nas contas:', contaIds);
      
      const promises = contaIds.map(async (contaId) => {
        const contaRef = doc(db, COLECAO_CONTAS_BTG, contaId);
        await updateDoc(contaRef, {
          status: 'PAGO',
          dataPagamento: serverTimestamp(),
          dataAtualizacao: serverTimestamp()
        });
        // Atualiza o lançamento correspondente
        await this._atualizarLancamentoAssociado(contaId);
      });

      await Promise.all(promises);
      console.log('✅ Baixa em lote realizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao dar baixa em lote:', error);
      throw error;
    }
  },

  async darBaixaIndividual(contaId) {
    try {
      console.log('💰 Dando baixa na conta:', contaId);
      
      const contaRef = doc(db, COLECAO_CONTAS_BTG, contaId);
      await updateDoc(contaRef, {
        status: 'PAGO',
        dataPagamento: serverTimestamp(),
        dataAtualizacao: serverTimestamp()
      });

      // Atualiza o lançamento correspondente
      await this._atualizarLancamentoAssociado(contaId);

      console.log('✅ Baixa realizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao dar baixa:', error);
      throw error;
    }
  },

  async cadastrarConta(dados) {
    try {
      console.log('Cadastrando conta BTG:', dados);

      const contasRef = collection(db, COLECAO_CONTAS_BTG);
      const novaConta = {
        ...dados,
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        status: 'AGUARDANDO',
        ativo: true
      };

      const docRef = await addDoc(contasRef, novaConta);
      console.log('✅ Conta BTG criada com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao cadastrar conta BTG:', error);
      throw error;
    }
  },

  async listarContasBTG(filtros = {}) {
    try {
      // Buscar todos os documentos
      const querySnapshot = await getDocs(collection(db, COLECAO_CONTAS_BTG));
      
      // Mapear os resultados
      let contas = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          vencimento: data.vencimento?.toDate ? data.vencimento.toDate() : data.vencimento,
          dataCriacao: data.dataCriacao?.toDate ? data.dataCriacao.toDate() : data.dataCriacao,
          dataAtualizacao: data.dataAtualizacao?.toDate ? data.dataAtualizacao.toDate() : data.dataAtualizacao,
          dataPagamento: data.dataPagamento?.toDate ? data.dataPagamento.toDate() : data.dataPagamento
        };
      });

      // Aplicar filtros em memória
      if (filtros.status && filtros.status !== '') {
        contas = contas.filter(c => c.status === filtros.status);
      }
      
      if (filtros.unidade && filtros.unidade !== 'Geral' && filtros.unidade !== '' && filtros.unidade !== 'all' && filtros.unidade !== undefined) {
        contas = contas.filter(c => c.unidade === filtros.unidade);
      }
      
      if (filtros.tipo && filtros.tipo !== '') {
        contas = contas.filter(c => c.tipo === filtros.tipo);
      }
      
      if (filtros.dataInicial) {
        const dataInicial = new Date(filtros.dataInicial);
        contas = contas.filter(c => {
          const vencimento = c.vencimento ? new Date(c.vencimento) : null;
          return vencimento && vencimento >= dataInicial;
        });
      }
      
      if (filtros.dataFinal) {
        const dataFinal = new Date(filtros.dataFinal);
        contas = contas.filter(c => {
          const vencimento = c.vencimento ? new Date(c.vencimento) : null;
          return vencimento && vencimento <= dataFinal;
        });
      }

      // Ordenar por vencimento (mais recente primeiro)
      contas.sort((a, b) => {
        const dataA = a.vencimento ? new Date(a.vencimento) : new Date(0);
        const dataB = b.vencimento ? new Date(b.vencimento) : new Date(0);
        return dataB - dataA;
      });
      
      return contas;
    } catch (error) {
      console.error('Erro ao listar contas BTG:', error);
      throw error;
    }
  },

  async atualizarStatusConta(id, novoStatus, dadosAdicionais = {}) {
    try {
      console.log('Atualizando status da conta:', { id, novoStatus, dadosAdicionais });
      
      const docRef = doc(db, COLECAO_CONTAS_BTG, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Conta não encontrada');
      }
      
      const atualizacao = {
        status: novoStatus,
        dataAtualizacao: new Date(),
        ...dadosAdicionais
      };
      
      if (novoStatus === 'PAGO') {
        atualizacao.dataPagamento = new Date();
      }
      
      await updateDoc(docRef, atualizacao);
      
      console.log('Status atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status da conta:', error);
      throw error;
    }
  },

  async excluirEmLote(contaIds) {
    try {
      console.log('🗑️ Excluindo contas em lote:', contaIds);
      
      const promises = contaIds.map(contaId => {
        const contaRef = doc(db, COLECAO_CONTAS_BTG, contaId);
        return deleteDoc(contaRef);
      });

      await Promise.all(promises);
      console.log('✅ Contas excluídas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao excluir contas:', error);
      throw error;
    }
  },

  // Atualizar uma conta existente
  async atualizarConta(id, dadosParaAtualizar) {
    try {
      console.log('🔄 Atualizando conta:', { id, dadosParaAtualizar });
      const docRef = doc(db, COLECAO_CONTAS_BTG, id);

      // Prepara os dados, convertendo a data de vencimento de volta para Timestamp
      const dados = { ...dadosParaAtualizar };
      if (dados.vencimento && typeof dados.vencimento === 'string') {
        dados.vencimento = Timestamp.fromDate(new Date(dados.vencimento));
      }

      delete dados.id; // Não salvar o ID dentro do documento

      await updateDoc(docRef, dados);
      console.log('✅ Conta atualizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar conta:', error);
      throw error;
    }
  }
};

export default contasBTGService; 