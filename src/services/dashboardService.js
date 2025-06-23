import { collection, query, where, getDocs, Timestamp, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { asaasService } from './asaasService';
import { extratosService } from './extratosService';

export const dashboardService = {
  // Novos métodos para filtro de unidades
  async getMensagensStats(unidades) {
    try {
      console.log('Buscando estatísticas de mensagens para:', unidades);
      
      if (!unidades || unidades.length === 0) {
        return { total: 0, enviadas: 0, pendentes: 0, falharam: 0 };
      }

      let totalMensagens = 0;
      let totalEnviadas = 0;
      let totalPendentes = 0;
      let totalFalharam = 0;

      // Para cada unidade, buscar mensagens
      for (const unidade of unidades) {
        try {
          const q = query(
            collection(db, 'mensagens'),
            where('unidade', '==', unidade)
          );
          
          const snapshot = await getDocs(q);
          const mensagens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          totalMensagens += mensagens.length;
          totalEnviadas += mensagens.filter(m => m.status === 'enviada' || m.status === 'SUCCESS').length;
          totalPendentes += mensagens.filter(m => m.status === 'pendente' || m.status === 'PENDING').length;
          totalFalharam += mensagens.filter(m => m.status === 'erro' || m.status === 'FAILED').length;
          
          console.log(`${unidade}: ${mensagens.length} mensagens`);
        } catch (error) {
          console.error(`Erro ao buscar mensagens da unidade ${unidade}:`, error);
        }
      }

      return {
        total: totalMensagens,
        enviadas: totalEnviadas,
        pendentes: totalPendentes,
        falharam: totalFalharam
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de mensagens:', error);
      return { total: 0, enviadas: 0, pendentes: 0, falharam: 0 };
    }
  },

  async getContasStats(unidades) {
    try {
      console.log('Buscando estatísticas de contas BTG para:', unidades);
      
      if (!unidades || unidades.length === 0) {
        return { total: 0, ativas: 0, inativas: 0 };
      }

      let totalContas = 0;
      let totalAtivas = 0;
      let totalInativas = 0;

      // Para cada unidade, buscar contas BTG
      for (const unidade of unidades) {
        try {
          const q = query(
            collection(db, 'contas_btg'),
            where('unidade', '==', unidade)
          );
          
          const snapshot = await getDocs(q);
          const contas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          totalContas += contas.length;
          totalAtivas += contas.filter(c => c.status === 'ativa' || c.ativo === true).length;
          totalInativas += contas.filter(c => c.status === 'inativa' || c.ativo === false).length;
          
          console.log(`${unidade}: ${contas.length} contas BTG`);
        } catch (error) {
          console.error(`Erro ao buscar contas BTG da unidade ${unidade}:`, error);
        }
      }

      return {
        total: totalContas,
        ativas: totalAtivas,
        inativas: totalInativas
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de contas BTG:', error);
      return { total: 0, ativas: 0, inativas: 0 };
    }
  },

  async getCobrancasStats(unidades) {
    try {
      console.log('Buscando estatísticas de cobranças para:', unidades);
      
      if (!unidades || unidades.length === 0) {
        return { total: 0, ativas: 0, pagas: 0, vencidas: 0 };
      }

      let totalCobrancas = 0;
      let totalAtivas = 0;
      let totalPagas = 0;
      let totalVencidas = 0;

      // Para cada unidade, buscar cobranças
      for (const unidade of unidades) {
        try {
          const q = query(
            collection(db, 'cobrancas'),
            where('unidade', '==', unidade)
          );
          
          const snapshot = await getDocs(q);
          const cobrancas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          totalCobrancas += cobrancas.length;
          totalAtivas += cobrancas.filter(c => c.status === 'PENDING' || c.status === 'ativa').length;
          totalPagas += cobrancas.filter(c => c.status === 'RECEIVED' || c.status === 'paga').length;
          totalVencidas += cobrancas.filter(c => c.status === 'OVERDUE' || c.status === 'vencida').length;
          
          console.log(`${unidade}: ${cobrancas.length} cobranças`);
        } catch (error) {
          console.error(`Erro ao buscar cobranças da unidade ${unidade}:`, error);
        }
      }

      return {
        total: totalCobrancas,
        ativas: totalAtivas,
        pagas: totalPagas,
        vencidas: totalVencidas
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de cobranças:', error);
      return { total: 0, ativas: 0, pagas: 0, vencidas: 0 };
    }
  },

  async getExtratosStats(unidades, mesAno = null) {
    try {
      console.log('🎯 [DASHBOARD] getExtratosStats chamada com:', { unidades, mesAno });
      console.log('🎯 [DASHBOARD] Tipo de mesAno:', typeof mesAno, 'Valor:', mesAno);
      
      if (!unidades || unidades.length === 0) {
        return { saldo: 0, receitas: 0, despesas: 0, registros: 0 };
      }

      // Construir filtros igual à página Extratos
      let filtrosExtrato = {};
      
      // Se for uma unidade específica, usar ela. Se for array com múltiplas, usar 'all'
      if (unidades.length === 1 && unidades[0] !== 'all') {
        filtrosExtrato.unidade = unidades[0];
      } else {
        filtrosExtrato.unidade = 'all'; // Usar 'all' como os Extratos fazem
      }
      
      if (mesAno) {
        const [ano, mes] = mesAno.split('-');
        // Criar datas de início e fim do mês (igual à página Extratos)
        const primeiroDia = new Date(parseInt(ano), parseInt(mes) - 1, 1);
        const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0);
        
        filtrosExtrato.dataInicial = primeiroDia.toISOString().split('T')[0];
        filtrosExtrato.dataFinal = ultimoDia.toISOString().split('T')[0];
        
        console.log(`🗓️ [DASHBOARD] Buscando com filtros de data: ${filtrosExtrato.dataInicial} a ${filtrosExtrato.dataFinal}`);
      }
      
      console.log('🔍 [DASHBOARD] Filtros finais:', filtrosExtrato);
      
      const extratos = await extratosService.buscarExtratos(filtrosExtrato);
      console.log(`📊 [DASHBOARD] ${extratos.length} extratos encontrados com filtros`);
      
      // Filtrar extratos excluídos (mesma lógica da página Extratos)
      const extratosFiltered = extratos.filter(extrato => {
        const status = (extrato.status || '').toLowerCase();
        return status !== 'excluido' && status !== 'deleted';
      });
      console.log(`🗑️ [DASHBOARD] ${extratosFiltered.length} após filtrar excluídos`);
      
      // Calcular estatísticas (mesma lógica da página Extratos)
      const stats = extratosFiltered.reduce((acc, extrato) => {
        const valor = parseFloat(extrato.valor || extrato.value || 0);
        const tipo = (extrato.tipo || extrato.type || '').toLowerCase();
        
        // Verificar se é receita ou despesa usando a mesma lógica da página Extratos
        if (tipo === 'receita' || tipo === 'credit') {
          acc.receitas += valor;
          acc.saldo += valor;
        } else if (tipo === 'despesa' || tipo === 'debit') {
          acc.despesas += valor;
          acc.saldo -= valor;
        }
        return acc;
      }, { saldo: 0, receitas: 0, despesas: 0 });

      const resultado = {
        saldo: stats.saldo,
        receitas: stats.receitas,
        despesas: stats.despesas,
        registros: extratosFiltered.length
      };

      console.log('🎯 [DASHBOARD] RESULTADO FINAL:', resultado);

      return resultado;
    } catch (error) {
      console.error('Erro ao obter estatísticas de extratos:', error);
      return { saldo: 0, receitas: 0, despesas: 0, registros: 0 };
    }
  },

  async getRecentActivities(unidades, limitActivities = 10) {
    try {
      console.log('Buscando atividades recentes para:', unidades);
      
      if (!unidades || unidades.length === 0) {
        return [];
      }

      const atividades = [];

      // Para cada unidade, buscar atividades recentes
      for (const unidade of unidades) {
        try {
          // Buscar mensagens recentes (sem orderBy para evitar índice composto)
          const qMensagens = query(
            collection(db, 'mensagens'),
            where('unidade', '==', unidade),
            limit(10) // Buscar mais para poder ordenar em memória
          );
          
          const mensagensSnapshot = await getDocs(qMensagens);
          
          // Ordenar por data de criação e pegar apenas as 3 mais recentes
          const mensagensRecentes = mensagensSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const dataA = a.createdAt?.toDate() || new Date(0);
              const dataB = b.createdAt?.toDate() || new Date(0);
              return dataB - dataA;
            })
            .slice(0, 3);
          
          mensagensRecentes.forEach(data => {
            atividades.push({
              id: data.id,
              title: 'Mensagem enviada',
              description: `WhatsApp para ${data.destinatario || 'cliente'}`,
              time: this.formatTimeAgo(data.createdAt?.toDate() || new Date()),
              unit: unidade,
              icon: 'MessageSquare',
              color: 'blue'
            });
          });

          // Buscar cobranças recentes (sem orderBy para evitar índice composto)
          const qCobrancas = query(
            collection(db, 'cobrancas'),
            where('unidade', '==', unidade),
            limit(10) // Buscar mais para poder ordenar em memória
          );
          
          const cobrancasSnapshot = await getDocs(qCobrancas);
          
          // Ordenar por data de criação e pegar apenas as 3 mais recentes
          const cobrancasRecentes = cobrancasSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const dataA = a.createdAt?.toDate() || new Date(0);
              const dataB = b.createdAt?.toDate() || new Date(0);
              return dataB - dataA;
            })
            .slice(0, 3);
          
          cobrancasRecentes.forEach(data => {
            atividades.push({
              id: data.id,
              title: 'Cobrança registrada',
              description: `R$ ${(data.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              time: this.formatTimeAgo(data.createdAt?.toDate() || new Date()),
              unit: unidade,
              icon: 'Receipt',
              color: 'purple'
            });
          });

          // Buscar contas BTG recentes (sem orderBy para evitar índice composto)
          const qContas = query(
            collection(db, 'contas_btg'),
            where('unidade', '==', unidade),
            limit(10) // Buscar mais para poder ordenar em memória
          );
          
          const contasSnapshot = await getDocs(qContas);
          
          // Ordenar por data de criação e pegar apenas os 2 mais recentes
          const contasRecentes = contasSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const dataA = a.createdAt?.toDate() || a.dataCriacao || new Date(0);
              const dataB = b.createdAt?.toDate() || b.dataCriacao || new Date(0);
              return dataB - dataA;
            })
            .slice(0, 2);
          
          contasRecentes.forEach(data => {
            atividades.push({
              id: data.id,
              title: 'Conta BTG cadastrada',
              description: `${data.nome || data.favorecido || 'Cliente'} - ${data.tipo || 'Boleto'}`,
              time: this.formatTimeAgo(data.createdAt?.toDate() || data.dataCriacao || new Date()),
              unit: unidade,
              icon: 'CreditCard',
              color: 'green'
            });
          });

        } catch (error) {
          console.error(`Erro ao buscar atividades da unidade ${unidade}:`, error);
        }
      }

      // Ordenar por data e limitar
      return atividades
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, limitActivities);

    } catch (error) {
      console.error('Erro ao obter atividades recentes:', error);
      return [];
    }
  },
  // Obter estatísticas reais do dashboard
  async getDashboardStats(userProfile, isAdmin) {
    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const userUnidades = isAdmin ? null : userProfile?.unidades || [];

      // Coletar dados em paralelo
      const [
        mensagens,
        contas,
        cobrancas,
        saldoExtratos
      ] = await Promise.all([
        this.getMensagensStats(userUnidades, inicioMes, fimMes),
        this.getContasStats(userUnidades, inicioMes, fimMes),
        this.getCobrancasStats(userUnidades, inicioMes, fimMes),
        this.getSaldoExtratosStats(userUnidades)
      ]);

      // Calcular mudanças percentuais (comparar com mês anterior)
      const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

      const [
        mensagensAnterior,
        contasAnterior,
        cobrancasAnterior
      ] = await Promise.all([
        this.getMensagensStats(userUnidades, mesAnterior, fimMesAnterior),
        this.getContasStats(userUnidades, mesAnterior, fimMesAnterior),
        this.getCobrancasStats(userUnidades, mesAnterior, fimMesAnterior)
      ]);

      // Calcular percentuais de mudança
      const calcularMudanca = (atual, anterior) => {
        if (anterior === 0) return atual > 0 ? '+100%' : '0%';
        const percentual = ((atual - anterior) / anterior) * 100;
        return percentual >= 0 ? `+${Math.round(percentual)}%` : `${Math.round(percentual)}%`;
      };

      return {
        stats: [
          {
            name: 'Mensagens Enviadas',
            value: mensagens.total.toLocaleString('pt-BR'),
            icon: 'MessageSquare',
            change: calcularMudanca(mensagens.total, mensagensAnterior.total),
            changeType: mensagens.total >= mensagensAnterior.total ? 'positive' : 'negative',
            color: 'blue'
          },
          {
            name: 'Contas Cadastradas',
            value: contas.total.toLocaleString('pt-BR'),
            icon: 'CreditCard',
            change: calcularMudanca(contas.total, contasAnterior.total),
            changeType: contas.total >= contasAnterior.total ? 'positive' : 'negative',
            color: 'green'
          },
          {
            name: 'Cobranças Ativas',
            value: cobrancas.ativas.toLocaleString('pt-BR'),
            icon: 'Receipt',
            change: calcularMudanca(cobrancas.ativas, cobrancasAnterior.ativas),
            changeType: cobrancas.ativas >= cobrancasAnterior.ativas ? 'positive' : 'negative',
            color: 'purple'
          },
          {
            name: 'Saldo (Extratos)',
            value: `R$ ${saldoExtratos.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: 'TrendingUp',
            change: saldoExtratos.saldo >= 0 ? '+100%' : '-100%', // Placeholder até implementar comparação
            changeType: saldoExtratos.saldo >= 0 ? 'positive' : 'negative',
            color: 'orange'
          }
        ],
        recentActivities: await this.getRecentActivities(userUnidades, 10),
        units: isAdmin ? await this.getUnitsOverview() : []
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do dashboard:', error);
      
      // Retornar dados padrão em caso de erro
      return {
        stats: [
          { name: 'Mensagens Enviadas', value: '0', icon: 'MessageSquare', change: '0%', changeType: 'positive', color: 'blue' },
          { name: 'Contas Cadastradas', value: '0', icon: 'CreditCard', change: '0%', changeType: 'positive', color: 'green' },
          { name: 'Cobranças Ativas', value: '0', icon: 'Receipt', change: '0%', changeType: 'positive', color: 'purple' },
          { name: 'Saldo (Extratos)', value: 'R$ 0,00', icon: 'TrendingUp', change: '0%', changeType: 'positive', color: 'orange' }
        ],
        recentActivities: [],
        units: []
      };
    }
  },

  // Obter saldo dos extratos
  async getSaldoExtratosStats(userUnidades) {
    try {
      console.log('Calculando saldo dos extratos...');
      
      // Se for admin, buscar todas as unidades
      const unidadesParaBuscar = userUnidades || ['Julio de Mesquita', 'Aparecidinha', 'Coop', 'Progresso', 'Vila Haro', 'Vila Helena'];
      
      let saldoTotal = 0;
      let totalRegistros = 0;

      for (const unidade of unidadesParaBuscar) {
        try {
          const extratos = await extratosService.buscarExtratos({ unidade });
          
          // Calcular saldo da unidade
          const saldoUnidade = extratos.reduce((sum, extrato) => {
            const valor = extrato.valor || extrato.value || 0;
            const tipo = extrato.tipo || extrato.type;
            return tipo === 'RECEITA' || tipo === 'CREDIT' ? sum + valor : sum - valor;
          }, 0);

          saldoTotal += saldoUnidade;
          totalRegistros += extratos.length;
          
          console.log(`${unidade}: R$ ${saldoUnidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${extratos.length} registros)`);
        } catch (error) {
          console.error(`Erro ao buscar extratos da unidade ${unidade}:`, error);
        }
      }

      console.log(`✅ Saldo total calculado: R$ ${saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${totalRegistros} registros)`);

      return {
        saldo: saldoTotal,
        registros: totalRegistros
      };
    } catch (error) {
      console.error('Erro ao calcular saldo dos extratos:', error);
      return {
        saldo: 0,
        registros: 0
      };
    }
  },

  // Métodos antigos renomeados para compatibilidade
  async getMensagensStatsOld(userUnidades, startDate, endDate) {
    try {
      let q = collection(db, 'messages');
      
      // Filtrar por data
      q = query(q, 
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );

      // Filtrar por unidades se não for admin
      if (userUnidades && userUnidades.length > 0) {
        if (userUnidades.length === 1) {
          q = query(q, where('unidade', '==', userUnidades[0]));
        }
        // Para múltiplas unidades, precisaríamos fazer múltiplas queries
      }

      const snapshot = await getDocs(q);
      return {
        total: snapshot.size,
        enviadas: snapshot.docs.filter(doc => doc.data().status === 'SUCCESS').length,
        pendentes: snapshot.docs.filter(doc => doc.data().status === 'PENDING').length,
        falharam: snapshot.docs.filter(doc => doc.data().status === 'FAILED').length
      };
    } catch (error) {
      console.error('Erro ao obter stats de mensagens:', error);
      return { total: 0, enviadas: 0, pendentes: 0, falharam: 0 };
    }
  },

  // Obter estatísticas de contas BTG
  async getContasStatsOld(userUnidades, startDate, endDate) {
    try {
      let q = collection(db, 'btg_accounts');
      
      // Filtrar por data
      q = query(q, 
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );

      // Filtrar por unidades se não for admin
      if (userUnidades && userUnidades.length > 0) {
        if (userUnidades.length === 1) {
          q = query(q, where('unidade', '==', userUnidades[0]));
        }
      }

      const snapshot = await getDocs(q);
      return {
        total: snapshot.size,
        ativas: snapshot.docs.filter(doc => doc.data().status === 'ACTIVE').length,
        inativas: snapshot.docs.filter(doc => doc.data().status === 'INACTIVE').length
      };
    } catch (error) {
      console.error('Erro ao obter stats de contas BTG:', error);
      return { total: 0, ativas: 0, inativas: 0 };
    }
  },

  // Obter estatísticas de cobranças
  async getCobrancasStatsOld(userUnidades, startDate, endDate) {
    try {
      let q = collection(db, 'charges');
      
      // Filtrar por data
      q = query(q, 
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );

      // Filtrar por unidades se não for admin
      if (userUnidades && userUnidades.length > 0) {
        if (userUnidades.length === 1) {
          q = query(q, where('unidade', '==', userUnidades[0]));
        }
      }

      const snapshot = await getDocs(q);
      return {
        total: snapshot.size,
        ativas: snapshot.docs.filter(doc => doc.data().status === 'PENDING').length,
        pagas: snapshot.docs.filter(doc => doc.data().status === 'RECEIVED').length,
        vencidas: snapshot.docs.filter(doc => doc.data().status === 'OVERDUE').length
      };
    } catch (error) {
      console.error('Erro ao obter stats de cobranças:', error);
      return { total: 0, ativas: 0, pagas: 0, vencidas: 0 };
    }
  },

  // Buscar cobranças por unidade
  async getCobrancasPorUnidade(unidade) {
    try {
      let q = collection(db, 'charges');
      
      if (unidade) {
        q = query(q, where('unidade', '==', unidade));
      }

      const snapshot = await getDocs(q);
      const cobrancas = [];
      
      snapshot.forEach(doc => {
        cobrancas.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return cobrancas;
    } catch (error) {
      console.error(`Erro ao buscar cobranças da unidade ${unidade}:`, error);
      return [];
    }
  },

  // Obter estatísticas do Asaas
  async getAsaasStats() {
    try {
      return await asaasService.obterEstatisticas();
    } catch (error) {
      console.error('Erro ao obter stats do Asaas:', error);
      return {
        totalCobrancas: 0,
        cobrancasPendentes: 0,
        cobrancasPagas: 0,
        cobrancasVencidas: 0,
        receitaTotal: 0,
        despesaTotal: 0
      };
    }
  },

  // Obter visão geral das unidades (Admin) - ATUALIZADA com dados reais
  async getUnitsOverview() {
    try {
      // NOMES CORRETOS das unidades conforme as planilhas
      const unidades = ['Julio de Mesquita', 'Aparecidinha', 'Coop', 'Progresso', 'Vila Haro', 'Vila Helena'];
      const overview = [];

      for (const unidade of unidades) {
        try {
          console.log(`🔍 Processando unidade: ${unidade}`);
          
          // Buscar dados reais em paralelo
          const [mensagens, cobrancas, extratos] = await Promise.all([
            this.getMensagensStats([unidade], new Date(2024, 0, 1), new Date()),
            this.getCobrancasPorUnidade(unidade),
            extratosService.buscarExtratos({ unidade })
          ]);

          console.log(`📊 ${unidade}: ${extratos.length} extratos, ${cobrancas.length} cobranças, ${mensagens.total} mensagens`);

          // Calcular saldo real dos extratos
          const saldoReal = extratos.reduce((sum, extrato) => {
            const valor = extrato.valor || extrato.value || 0;
            const tipo = extrato.tipo || extrato.type;
            return tipo === 'RECEITA' || tipo === 'CREDIT' ? sum + valor : sum - valor;
          }, 0);

          console.log(`💵 ${unidade}: Saldo calculado R$ ${saldoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

          overview.push({
            name: unidade,
            cobrancas: cobrancas.length,
            messages: mensagens.total,
            saldo: saldoReal,
            extratos: extratos.length
          });
        } catch (error) {
          console.error(`Erro ao obter dados da unidade ${unidade}:`, error);
          overview.push({
            name: unidade,
            cobrancas: 0,
            messages: 0,
            saldo: 0,
            extratos: 0
          });
        }
      }

      console.log('✅ Overview das unidades processado:', overview);
      return overview;
    } catch (error) {
      console.error('Erro ao obter visão das unidades:', error);
      return [];
    }
  },

  // Formatar tempo relativo
  formatTimeAgo(date) {
    if (!date) return 'Agora';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  }
};

export default dashboardService; 