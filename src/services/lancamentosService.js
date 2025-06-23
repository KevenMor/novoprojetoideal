import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLECAO_LANCAMENTOS = 'lancamentos';

export const lancamentosService = {
  // Criar um novo lançamento (receita ou despesa)
  // Função auxiliar para remover campos undefined
  _removerCamposUndefined(obj) {
    const resultado = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        resultado[key] = value;
      }
    }
    return resultado;
  },

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

      // Remover campos undefined antes de enviar para o Firebase
      const lancamentoLimpo = this._removerCamposUndefined(lancamento);
      
      console.log('📤 Enviando para Firebase:', lancamentoLimpo);
      
      const docRef = await addDoc(collection(db, COLECAO_LANCAMENTOS), lancamentoLimpo);
      console.log('✅ Lançamento criado com ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...lancamentoLimpo
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
      let q = query(collection(db, COLECAO_LANCAMENTOS), where('status', '==', 'ATIVO'));
      
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
      
      // Para lançamentos vindos do BTG ou Sheets que não têm ID no Firebase, não criar duplicata
      if (!id || typeof id !== 'string' || id.startsWith('btg_') || id.includes('sheets_')) {
        console.log('📊 Lançamento externo (BTG/Sheets), não pode ser editado no Firebase');
        throw new Error('Este lançamento não pode ser editado diretamente. É originário de fonte externa.');
      }
      
      // Verificar se o documento existe
      const lancamentoRef = doc(db, COLECAO_LANCAMENTOS, id);
      const docSnap = await getDoc(lancamentoRef);
      
      if (!docSnap.exists()) {
        console.log('❌ Documento não existe no Firebase');
        throw new Error('Lançamento não encontrado no sistema.');
      }
      
      // Obter dados atuais do documento
      const dadosAtuais = docSnap.data();
      
      // Preparar dados para atualização - mantendo campos existentes e atualizando apenas os necessários
      const dadosParaAtualizar = {
        descricao: dadosAtualizacao.descricao || dadosAtuais.descricao,
        valor: parseFloat(dadosAtualizacao.valor) || dadosAtuais.valor || 0,
        cliente: dadosAtualizacao.cliente || dadosAtuais.cliente || '',
        unidade: dadosAtualizacao.unidade || dadosAtuais.unidade,
        formaPagamento: dadosAtualizacao.formaPagamento || dadosAtuais.formaPagamento || '',
        status: dadosAtualizacao.status || dadosAtuais.status || 'CONFIRMED',
        // MANTER O TIPO ORIGINAL - não converter
        tipo: dadosAtuais.tipo, // Manter o tipo original do documento
        dataAtualizacao: Timestamp.now()
      };
      
      // Tratar data de forma mais robusta - manter data original se não especificada
      if (dadosAtualizacao.data) {
        let dataParaConverter;
        
        if (dadosAtualizacao.data instanceof Date) {
          dataParaConverter = dadosAtualizacao.data;
        } else if (typeof dadosAtualizacao.data === 'string') {
          // Limpar timestamp inválido e usar formato correto
          const dataString = dadosAtualizacao.data.replace(/[@]/g, '');
          if (dataString.includes('-')) {
            dataParaConverter = new Date(dataString);
          } else {
            // Se for um timestamp numérico
            const timestamp = parseFloat(dataString);
            if (!isNaN(timestamp)) {
              dataParaConverter = new Date(timestamp);
            } else {
              dataParaConverter = new Date();
            }
          }
        } else {
          dataParaConverter = new Date();
        }
        
        // Validar se a data é válida
        if (isNaN(dataParaConverter.getTime())) {
          console.warn('Data inválida, mantendo data original');
          // Manter a data original se a nova for inválida
        } else {
          dadosParaAtualizar.dataLancamento = Timestamp.fromDate(dataParaConverter);
          dadosParaAtualizar.data = Timestamp.fromDate(dataParaConverter);
        }
      }

      console.log('📤 Dados finais para atualização:', dadosParaAtualizar);
      console.log('📤 Tipo mantido:', dadosParaAtualizar.tipo);
      
      await updateDoc(lancamentoRef, dadosParaAtualizar);
      console.log('✅ Lançamento atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar lançamento:', error);
      throw new Error('Erro ao atualizar lançamento: ' + error.message);
    }
  },

  // Excluir um lançamento (soft delete)
  async excluirLancamento(id) {
    try {
      console.log('🗑️ Excluindo lançamento:', id);
      
      if (!id) {
        throw new Error('ID do lançamento não fornecido');
      }

      const lancamentoRef = doc(db, COLECAO_LANCAMENTOS, id);
      
      // Marcar como excluído em vez de deletar fisicamente
      await updateDoc(lancamentoRef, {
        status: 'EXCLUIDO',
        dataExclusao: Timestamp.now()
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir lançamento:', error);
      throw new Error('Erro ao excluir lançamento: ' + error.message);
    }
  },

  async restaurarLancamento(id) {
    try {
      console.log('🔄 Restaurando lançamento:', id);
      
      if (!id) {
        throw new Error('ID do lançamento não fornecido');
      }

      const lancamentoRef = doc(db, COLECAO_LANCAMENTOS, id);
      
      // Restaurar para status CONFIRMED
      await updateDoc(lancamentoRef, {
        status: 'CONFIRMED',
        dataRestauracao: Timestamp.now()
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao restaurar lançamento:', error);
      throw new Error('Erro ao restaurar lançamento: ' + error.message);
    }
  },

  // Atualizar status de lançamento baseado no status da conta BTG
  async atualizarStatusContaBTG(contaBTGId, novoStatus) {
    try {
      console.log('🔄 Atualizando status de lançamentos da conta BTG:', contaBTGId, 'para:', novoStatus);
      
      // Buscar lançamentos relacionados à conta BTG
      const q = query(
        collection(db, COLECAO_LANCAMENTOS), 
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

  // Função para capitalizar a primeira letra de cada palavra
  capitalizarPalavras(texto) {
    if (!texto) return '';
    return texto
      .toLowerCase()
      .split(' ')
      .map(palavra => {
        if (palavra.length === 0) return palavra;
        return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
      })
      .join(' ');
  },

  // Formatar lançamento para o formato de extrato
  formatarParaExtrato(lancamento) {
    return {
      id: lancamento.id,
      descricao: this.capitalizarPalavras(lancamento.descricao || lancamento.description || ''),
      valor: parseFloat(lancamento.valor || lancamento.value || 0),
      data: lancamento.dataLancamento?.toDate() || new Date(lancamento.data || lancamento.date),
      tipo: lancamento.tipo || lancamento.type || 'CREDIT',
      cliente: this.capitalizarPalavras(lancamento.cliente || ''),
      unidade: lancamento.unidade || '',
      formaPagamento: lancamento.formaPagamento || '',
      status: lancamento.status || 'CONFIRMED',
      origem: lancamento.origem || 'MANUAL',
      fonte: lancamento.fonte || 'firebase'
    };
  },

  // Criar lançamento automaticamente a partir de cobrança paga
  async criarLancamentoDeCobranca(dadosCobranca, numeroParcela, valorParcela) {
    try {
      // Validar dados obrigatórios
      if (!dadosCobranca.id) {
        throw new Error('ID da cobrança é obrigatório');
      }
      if (!dadosCobranca.unidade) {
        throw new Error('Unidade da cobrança é obrigatória');
      }
      if (!numeroParcela) {
        throw new Error('Número da parcela é obrigatório');
      }
      if (!valorParcela || valorParcela <= 0) {
        throw new Error('Valor da parcela deve ser maior que zero');
      }

      console.log('💰 Criando lançamento automático de cobrança paga:', {
        cobrancaId: dadosCobranca.id,
        parcela: numeroParcela,
        valor: valorParcela,
        cliente: dadosCobranca.nome || 'Cliente',
        unidade: `"${dadosCobranca.unidade}" (${dadosCobranca.unidade?.length} chars)`
      });

      // 🧹 Limpar lançamentos duplicados desta parcela antes de criar um novo
      console.log('🧹 Verificando lançamentos duplicados desta parcela...');
      await this.removerLancamentoDeCobranca(dadosCobranca.id, numeroParcela);

      const dadosLancamento = {
        descricao: `Cobrança paga - ${dadosCobranca.nome || 'Cliente'} - Parcela ${numeroParcela}/${dadosCobranca.parcelas || 1}`,
        valor: Number(valorParcela),
        data: new Date(),
        unidade: dadosCobranca.unidade,
        cliente: dadosCobranca.nome || 'Cliente',
        tipo: 'RECEITA',
        categoria: 'COBRANCA_PAGA',
        formaPagamento: dadosCobranca.tipoPagamento || 'NÃO_INFORMADO',
        status: 'ATIVO', // Mudança: usar ATIVO para ser compatível com a busca de extratos
        origem: 'COBRANCA_AUTOMATICA',
        observacoes: `Gerado automaticamente pela cobrança ${dadosCobranca.id} - ${dadosCobranca.servico || 'Serviço'}`,
        cobrancaId: dadosCobranca.id,
        parcelaNumero: Number(numeroParcela)
      };

      // Validar se todos os campos obrigatórios estão presentes
      const erros = this.validarLancamento(dadosLancamento);
      if (erros.length > 0) {
        throw new Error(`Dados inválidos para lançamento: ${erros.join(', ')}`);
      }

      return await this.criarLancamento(dadosLancamento);
    } catch (error) {
      console.error('❌ Erro ao criar lançamento de cobrança:', error);
      throw new Error(`Erro ao criar lançamento de cobrança: ${error.message}`);
    }
  },

  // Remover lançamento automático de cobrança
  async removerLancamentoDeCobranca(cobrancaId, numeroParcela) {
    try {
      console.log('🗑️ Removendo lançamento automático de cobrança:', {
        cobrancaId,
        parcela: numeroParcela
      });

      // Buscar lançamentos relacionados a esta parcela (ATIVO ou CONFIRMED)
      const lancamentos = await this.buscarLancamentos({});
      const lancamentosRelacionados = lancamentos.filter(l => 
        l.cobrancaId === cobrancaId && 
        l.parcelaNumero === numeroParcela &&
        l.origem === 'COBRANCA_AUTOMATICA' &&
        (l.status === 'ATIVO' || l.status === 'CONFIRMED')
      );

      console.log(`🔍 Encontrados ${lancamentosRelacionados.length} lançamentos relacionados para exclusão`);

      let removidos = 0;
      for (const lancamento of lancamentosRelacionados) {
        await this.excluirLancamento(lancamento.id);
        console.log('✅ Lançamento de receita removido:', lancamento.id);
        removidos++;
      }

      if (removidos > 0) {
        console.log(`✅ ${removidos} lançamentos removidos com sucesso`);
        return true;
      } else {
        console.log('⚠️ Nenhum lançamento relacionado encontrado para exclusão');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao remover lançamento de cobrança:', error);
      throw new Error(`Erro ao remover lançamento de cobrança: ${error.message}`);
    }
  },

  // Validar dados do lançamento
  validarLancamento(dados) {
    const erros = [];

    if (!dados.descricao?.trim()) {
      erros.push('Descrição é obrigatória');
    }

    if (!dados.valor || isNaN(dados.valor) || parseFloat(dados.valor) <= 0) {
      erros.push('Valor deve ser maior que zero');
    }

    if (!dados.data) {
      erros.push('Data é obrigatória');
    }

    if (!dados.unidade?.trim()) {
      erros.push('Unidade é obrigatória');
    }

    if (!dados.tipo || !['CREDIT', 'DEBIT', 'RECEITA', 'DESPESA'].includes(dados.tipo)) {
      erros.push('Tipo de lançamento inválido');
    }

    // Validações específicas para lançamentos automáticos de cobrança
    if (dados.origem === 'COBRANCA_AUTOMATICA') {
      if (!dados.cobrancaId?.trim()) {
        erros.push('ID da cobrança é obrigatório para lançamentos automáticos');
      }
      
      if (!dados.parcelaNumero || isNaN(dados.parcelaNumero) || dados.parcelaNumero <= 0) {
        erros.push('Número da parcela deve ser um número válido maior que zero');
      }
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
        collection(db, COLECAO_LANCAMENTOS), 
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
  },

  async deleteDoc(id) {
    try {
      const docRef = doc(db, COLECAO_LANCAMENTOS, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir documento:', error);
      throw error;
    }
  },

  async programarPagamentos(funcionario, dados) {
    try {
      console.log('Programando pagamentos para funcionário:', {
        funcionario,
        dados
      });

      const lancamentosRef = collection(db, COLECAO_LANCAMENTOS);
      const lancamentos = [];

      // Criar lançamento para adiantamento
      if (dados.adiantamento && dados.dataAdiantamento) {
        const adiantamento = {
          tipo: 'DESPESA',
          categoria: 'ADIANTAMENTO',
          funcionarioId: funcionario.id,
          funcionarioNome: funcionario.nome,
          funcionarioCPF: funcionario.cpf,
          unidade: funcionario.unidade,
          valor: parseFloat(dados.adiantamento),
          vencimento: new Date(dados.dataAdiantamento),
          tipoPix: funcionario.tipoPix || 'CPF',
          chavePix: funcionario.chavePix,
          status: 'AGUARDANDO',
          dataCriacao: new Date(),
          dataAtualizacao: new Date(),
          ativo: true
        };

        const adiantamentoRef = await addDoc(lancamentosRef, adiantamento);
        lancamentos.push({ id: adiantamentoRef.id, ...adiantamento });
      }

      // Criar lançamento para salário
      if (dados.salario && dados.dataSalario) {
        const salario = {
          tipo: 'DESPESA',
          categoria: 'SALARIO',
          funcionarioId: funcionario.id,
          funcionarioNome: funcionario.nome,
          funcionarioCPF: funcionario.cpf,
          unidade: funcionario.unidade,
          valor: parseFloat(dados.salario),
          vencimento: new Date(dados.dataSalario),
          tipoPix: funcionario.tipoPix || 'CPF',
          chavePix: funcionario.chavePix,
          status: 'AGUARDANDO',
          dataCriacao: new Date(),
          dataAtualizacao: new Date(),
          ativo: true
        };

        const salarioRef = await addDoc(lancamentosRef, salario);
        lancamentos.push({ id: salarioRef.id, ...salario });
      }

      console.log('Lançamentos criados:', lancamentos);
      return lancamentos;
    } catch (error) {
      console.error('Erro ao programar pagamentos:', error);
      throw error;
    }
  },

  async listarLancamentos(filtros = {}) {
    try {
      console.log('Listando lançamentos com filtros:', filtros);
      
      // Iniciar com uma query básica
      let q = collection(db, COLECAO_LANCAMENTOS);
      
      // Construir a query com os filtros disponíveis
      if (filtros.unidade && filtros.unidade !== 'Geral') {
        if (filtros.status) {
          // Usar o índice composto com status
          q = query(q, 
            where('funcionarioUnidade', '==', filtros.unidade),
            where('status', '==', filtros.status),
            orderBy('dataAgendada', 'desc')
          );
        } else {
          // Usar o índice básico
          q = query(q, 
            where('funcionarioUnidade', '==', filtros.unidade),
            orderBy('dataAgendada', 'desc')
          );
        }
      } else {
        // Caso contrário, apenas ordenar por data
        q = query(q, orderBy('dataAgendada', 'desc'));
      }
      
      // Executar a query
      const snapshot = await getDocs(q);
      
      // Mapear os resultados
      let lancamentos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataAgendada: doc.data().dataAgendada?.toDate(),
        dataCriacao: doc.data().dataCriacao?.toDate(),
        dataAtualizacao: doc.data().dataAtualizacao?.toDate(),
        dataPagamento: doc.data().dataPagamento?.toDate()
      }));

      // Aplicar filtros adicionais em memória
      if (filtros.tipo) {
        lancamentos = lancamentos.filter(l => l.tipo === filtros.tipo);
      }
      
      if (filtros.dataInicial) {
        const dataInicial = new Date(filtros.dataInicial);
        lancamentos = lancamentos.filter(l => l.dataAgendada >= dataInicial);
      }
      
      if (filtros.dataFinal) {
        const dataFinal = new Date(filtros.dataFinal);
        lancamentos = lancamentos.filter(l => l.dataAgendada <= dataFinal);
      }

      console.log('Lançamentos encontrados:', lancamentos.length);
      return lancamentos;
    } catch (error) {
      console.error('Erro ao listar lançamentos:', error);
      throw error;
    }
  },

  async atualizarStatusLancamento(id, novoStatus, dadosAdicionais = {}) {
    try {
      console.log('Atualizando status do lançamento:', { id, novoStatus, dadosAdicionais });
      
      const docRef = doc(db, COLECAO_LANCAMENTOS, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Lançamento não encontrado');
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
      console.error('Erro ao atualizar status do lançamento:', error);
      throw error;
    }
  }
};

export default lancamentosService; 