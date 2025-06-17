const { db, collections, firestoreUtils, validators } = require('../config/firebase');
const { AuditService, AUDIT_ACTIONS, AUDIT_RESOURCES } = require('../services/auditService');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class BTGAccountsController {
  /**
   * Cadastrar conta BTG (boleto ou PIX)
   */
  static async createAccount(req, res) {
    try {
      const { unidade, tipo, ...accountData } = req.body;
      const userId = req.user.uid;
      const userName = req.userProfile?.nome || 'Usuário';

      // Validações básicas
      if (!unidade || !tipo) {
        return res.status(400).json({
          error: 'Campos obrigatórios: unidade, tipo'
        });
      }

      const tiposValidos = ['boleto', 'pix'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({
          error: 'Tipo deve ser "boleto" ou "pix"'
        });
      }

      let validatedData = {};

      if (tipo === 'boleto') {
        // Validações específicas para boleto
        const { linhaDigitavel, valor, vencimento, descricao } = accountData;
        
        if (!linhaDigitavel || !valor || !vencimento || !descricao) {
          return res.status(400).json({
            error: 'Campos obrigatórios para boleto: linhaDigitavel, valor, vencimento, descricao'
          });
        }

        if (!validators.isValidBoletoLine(linhaDigitavel)) {
          return res.status(400).json({
            error: 'Linha digitável deve ter 44 dígitos'
          });
        }

        validatedData = {
          linhaDigitavel: linhaDigitavel.replace(/\D/g, ''),
          valor: parseFloat(valor),
          vencimento,
          descricao: descricao.trim()
        };

      } else if (tipo === 'pix') {
        // Validações específicas para PIX
        const { tipoChave, chavePix, favorecido, cpfCnpj, valor, vencimento, descricao } = accountData;
        
        if (!tipoChave || !chavePix || !favorecido || !valor || !vencimento || !descricao) {
          return res.status(400).json({
            error: 'Campos obrigatórios para PIX: tipoChave, chavePix, favorecido, valor, vencimento, descricao'
          });
        }

        const tiposChaveValidos = ['Copia e Cola', 'CPF', 'CNPJ', 'Email', 'Celular'];
        if (!tiposChaveValidos.includes(tipoChave)) {
          return res.status(400).json({
            error: 'Tipo de chave PIX inválido'
          });
        }

        validatedData = {
          tipoChave,
          chavePix: (tipoChave === 'CPF' || tipoChave === 'CNPJ') 
            ? chavePix.replace(/\D/g, '') 
            : chavePix.trim(),
          favorecido: favorecido.trim(),
          cpfCnpj: cpfCnpj ? cpfCnpj.replace(/\D/g, '') : null,
          valor: parseFloat(valor),
          vencimento,
          descricao: descricao.trim()
        };
      }

      // Preparar dados da conta
      const accountId = uuidv4();
      const btgAccountData = {
        id: accountId,
        unidade,
        tipo,
        ...validatedData,
        usuario: userName,
        userId,
        status: 'PENDING',
        createdAt: firestoreUtils.now(),
        updatedAt: firestoreUtils.now()
      };

      // Salvar no Firestore primeiro
      await db.collection(collections.btgAccounts).doc(accountId).set(btgAccountData);

      // Log de auditoria
      await AuditService.logAction({
        userId,
        userName,
        action: AUDIT_ACTIONS.CREATE,
        resource: AUDIT_RESOURCES.BTG_ACCOUNTS,
        resourceId: accountId,
        data: {
          unidade,
          tipo,
          valor: validatedData.valor
        },
        ip: req.auditData?.ip,
        userAgent: req.auditData?.userAgent,
        unidade
      });

      res.status(201).json({
        success: true,
        message: 'Conta BTG cadastrada com sucesso',
        data: {
          id: accountId,
          status: 'CREATED',
          processedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Erro ao cadastrar conta BTG:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  /**
   * Listar contas BTG com filtros
   */
  static async getAccounts(req, res) {
    try {
      const isAdmin = req.userProfile?.perfil === 'admin';
      const userUnidades = req.userProfile?.unidades || [];

      const {
        page = 1,
        limit = 20,
        unidade,
        tipo,
        status,
        startDate,
        endDate
      } = req.query;

      let query = db.collection(collections.btgAccounts);

      // Filtro por unidade (baseado nas permissões do usuário)
      if (!isAdmin) {
        if (userUnidades.length === 1) {
          query = query.where('unidade', '==', userUnidades[0]);
        } else if (userUnidades.length > 1) {
          query = query.where('unidade', 'in', userUnidades);
        } else {
          return res.status(403).json({ error: 'Usuário sem acesso a unidades' });
        }
      } else if (unidade) {
        query = query.where('unidade', '==', unidade);
      }

      // Outros filtros
      if (tipo) {
        query = query.where('tipo', '==', tipo);
      }

      if (status) {
        query = query.where('status', '==', status);
      }

      // Filtro por período
      if (startDate) {
        query = query.where('createdAt', '>=', firestoreUtils.dateToTimestamp(startDate));
      }

      if (endDate) {
        query = query.where('createdAt', '<=', firestoreUtils.dateToTimestamp(endDate));
      }

      // Ordenação e paginação
      query = query.orderBy('createdAt', 'desc');
      query = query.limit(parseInt(limit));

      const snapshot = await query.get();
      const accounts = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        accounts.push({
          ...data,
          createdAt: firestoreUtils.timestampToDate(data.createdAt),
          updatedAt: firestoreUtils.timestampToDate(data.updatedAt),
          processedAt: data.processedAt ? firestoreUtils.timestampToDate(data.processedAt) : null
        });
      });

      res.json({
        success: true,
        data: accounts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: accounts.length
        }
      });

    } catch (error) {
      console.error('Erro ao buscar contas BTG:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  /**
   * Estatísticas de contas BTG
   */
  static async getStats(req, res) {
    try {
      const isAdmin = req.userProfile?.perfil === 'admin';
      const userUnidades = req.userProfile?.unidades || [];

      const { startDate, endDate, unidade } = req.query;

      let query = db.collection(collections.btgAccounts);

      // Filtros de permissão
      if (!isAdmin) {
        if (userUnidades.length === 1) {
          query = query.where('unidade', '==', userUnidades[0]);
        } else if (userUnidades.length > 1) {
          query = query.where('unidade', 'in', userUnidades);
        }
      } else if (unidade) {
        query = query.where('unidade', '==', unidade);
      }

      // Filtrar apenas contas ativas
      query = query.where('ativo', '==', true);

      // Filtro por período
      if (startDate) {
        query = query.where('createdAt', '>=', firestoreUtils.dateToTimestamp(startDate));
      }

      if (endDate) {
        query = query.where('createdAt', '<=', firestoreUtils.dateToTimestamp(endDate));
      }

      const snapshot = await query.get();
      const accounts = [];

      snapshot.forEach(doc => {
        accounts.push(doc.data());
      });

      // Calcular estatísticas
      const stats = {
        total: accounts.length,
        byStatus: {},
        byTipo: {},
        byUnidade: {},
        byUser: {},
        valorTotal: {
          boleto: 0,
          pix: 0,
          total: 0
        }
      };

      accounts.forEach(account => {
        // Por status
        stats.byStatus[account.status] = (stats.byStatus[account.status] || 0) + 1;
        
        // Por tipo
        stats.byTipo[account.tipo] = (stats.byTipo[account.tipo] || 0) + 1;
        
        // Por unidade
        stats.byUnidade[account.unidade] = (stats.byUnidade[account.unidade] || 0) + 1;
        
        // Por usuário
        stats.byUser[account.usuario] = (stats.byUser[account.usuario] || 0) + 1;
        
        // Valores
        if (account.valor) {
          stats.valorTotal[account.tipo] += account.valor;
          stats.valorTotal.total += account.valor;
        }
      });

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas de contas BTG:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  /**
   * Dar baixa em lote (marcar várias contas como pagas)
   * Body: { ids: [array de IDs] }
   */
  static async batchPay(req, res) {
    try {
      const { ids } = req.body;
      const userId = req.user.uid;
      const userName = req.userProfile?.nome || 'Usuário';
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Envie um array de IDs para dar baixa em lote.' });
      }
      const { db, collections, firestoreUtils } = require('../config/firebase');
      const batch = db.batch();
      const now = firestoreUtils.now();
      ids.forEach(id => {
        const ref = db.collection(collections.btgAccounts).doc(id);
        batch.update(ref, {
          status: 'PAGO',
          processedAt: now,
          updatedAt: now
        });
      });
      await batch.commit();
      // Log de auditoria
      await AuditService.logAction({
        userId,
        userName,
        action: AUDIT_ACTIONS.UPDATE,
        resource: AUDIT_RESOURCES.BTG_ACCOUNTS,
        resourceId: ids.join(','),
        data: { ids, status: 'PAGO' },
        ip: req.auditData?.ip,
        userAgent: req.auditData?.userAgent
      });
      res.json({ success: true, message: 'Baixa em lote realizada com sucesso', ids });
    } catch (error) {
      console.error('Erro ao dar baixa em lote:', error);
      res.status(500).json({ error: 'Erro ao dar baixa em lote', details: error.message });
    }
  }
}

module.exports = BTGAccountsController; 