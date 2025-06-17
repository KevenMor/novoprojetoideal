const { db, collections, firestoreUtils } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

class AuditService {
  /**
   * Registra uma ação no log de auditoria
   * @param {Object} auditData - Dados da auditoria
   * @param {string} auditData.userId - ID do usuário que executou a ação
   * @param {string} auditData.userName - Nome do usuário
   * @param {string} auditData.action - Ação executada (CREATE, UPDATE, DELETE, etc.)
   * @param {string} auditData.resource - Recurso afetado (messages, charges, users, etc.)
   * @param {string} auditData.resourceId - ID do recurso
   * @param {Object} auditData.data - Dados da ação
   * @param {string} auditData.ip - IP do usuário
   * @param {string} auditData.userAgent - User agent do navegador
   * @param {string} auditData.unidade - Unidade relacionada (se aplicável)
   */
  static async logAction(auditData) {
    try {
      const auditId = uuidv4();
      const auditLog = {
        id: auditId,
        userId: auditData.userId,
        userName: auditData.userName,
        action: auditData.action,
        resource: auditData.resource,
        resourceId: auditData.resourceId || null,
        data: auditData.data || {},
        metadata: {
          ip: auditData.ip,
          userAgent: auditData.userAgent,
          unidade: auditData.unidade || null
        },
        timestamp: firestoreUtils.now(),
        createdAt: firestoreUtils.now(),
        status: 'SUCCESS'
      };

      await db.collection(collections.auditLog).doc(auditId).set(auditLog);
      
      console.log(`📝 Auditoria registrada: ${auditData.action} em ${auditData.resource} por ${auditData.userName}`);
      return auditId;
    } catch (error) {
      console.error('❌ Erro ao registrar auditoria:', error);
      // Não interromper o fluxo principal se a auditoria falhar
      return null;
    }
  }

  /**
   * Registra erro na auditoria
   */
  static async logError(auditData, error) {
    try {
      const auditId = uuidv4();
      const auditLog = {
        id: auditId,
        userId: auditData.userId,
        userName: auditData.userName,
        action: auditData.action,
        resource: auditData.resource,
        resourceId: auditData.resourceId || null,
        data: auditData.data || {},
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code || 'UNKNOWN'
        },
        metadata: {
          ip: auditData.ip,
          userAgent: auditData.userAgent,
          unidade: auditData.unidade || null
        },
        timestamp: firestoreUtils.now(),
        createdAt: firestoreUtils.now(),
        status: 'ERROR'
      };

      await db.collection(collections.auditLog).doc(auditId).set(auditLog);
      
      console.log(`🚨 Erro registrado na auditoria: ${auditData.action} em ${auditData.resource} por ${auditData.userName}`);
      return auditId;
    } catch (auditError) {
      console.error('❌ Erro crítico ao registrar auditoria de erro:', auditError);
      return null;
    }
  }

  /**
   * Busca logs de auditoria com filtros
   */
  static async getLogs(filters = {}) {
    try {
      let query = db.collection(collections.auditLog);

      // Filtros
      if (filters.userId) {
        query = query.where('userId', '==', filters.userId);
      }

      if (filters.action) {
        query = query.where('action', '==', filters.action);
      }

      if (filters.resource) {
        query = query.where('resource', '==', filters.resource);
      }

      if (filters.unidade) {
        query = query.where('metadata.unidade', '==', filters.unidade);
      }

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      // Período
      if (filters.startDate) {
        query = query.where('timestamp', '>=', firestoreUtils.dateToTimestamp(filters.startDate));
      }

      if (filters.endDate) {
        query = query.where('timestamp', '<=', firestoreUtils.dateToTimestamp(filters.endDate));
      }

      // Ordenação e limite
      query = query.orderBy('timestamp', 'desc');
      
      if (filters.limit) {
        query = query.limit(parseInt(filters.limit));
      }

      const snapshot = await query.get();
      const logs = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        logs.push({
          ...data,
          timestamp: firestoreUtils.timestampToDate(data.timestamp),
          createdAt: firestoreUtils.timestampToDate(data.createdAt)
        });
      });

      return logs;
    } catch (error) {
      console.error('❌ Erro ao buscar logs de auditoria:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de auditoria
   */
  static async getStats(filters = {}) {
    try {
      const logs = await this.getLogs(filters);
      
      const stats = {
        total: logs.length,
        byAction: {},
        byResource: {},
        byUser: {},
        byStatus: {},
        byUnidade: {},
        timeline: {}
      };

      logs.forEach(log => {
        // Por ação
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
        
        // Por recurso
        stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;
        
        // Por usuário
        stats.byUser[log.userName] = (stats.byUser[log.userName] || 0) + 1;
        
        // Por status
        stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
        
        // Por unidade
        if (log.metadata?.unidade) {
          stats.byUnidade[log.metadata.unidade] = (stats.byUnidade[log.metadata.unidade] || 0) + 1;
        }
        
        // Timeline (por dia)
        const dateKey = log.timestamp.toISOString().split('T')[0];
        stats.timeline[dateKey] = (stats.timeline[dateKey] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de auditoria:', error);
      throw error;
    }
  }

  /**
   * Limpa logs antigos (manutenção)
   */
  static async cleanOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const query = db.collection(collections.auditLog)
        .where('timestamp', '<', firestoreUtils.dateToTimestamp(cutoffDate));
      
      const snapshot = await query.get();
      const batch = firestoreUtils.createBatch();
      
      let deleteCount = 0;
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        deleteCount++;
      });
      
      if (deleteCount > 0) {
        await batch.commit();
        console.log(`🧹 ${deleteCount} logs antigos removidos da auditoria`);
      }
      
      return deleteCount;
    } catch (error) {
      console.error('❌ Erro ao limpar logs antigos:', error);
      throw error;
    }
  }

  /**
   * Middleware para capturar dados da requisição
   */
  static captureMiddleware(req, res, next) {
    // Capturar dados da requisição para auditoria
    req.auditData = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query
    };
    
    next();
  }
}

// Ações padrão para auditoria
const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  READ: 'READ',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SEND_MESSAGE: 'SEND_MESSAGE',
  CREATE_CHARGE: 'CREATE_CHARGE',
  CANCEL_CHARGE: 'CANCEL_CHARGE',
  EXPORT_DATA: 'EXPORT_DATA',
  IMPORT_DATA: 'IMPORT_DATA',
  CHANGE_PASSWORD: 'CHANGE_PASSWORD',
  RESET_PASSWORD: 'RESET_PASSWORD',
  GRANT_PERMISSION: 'GRANT_PERMISSION',
  REVOKE_PERMISSION: 'REVOKE_PERMISSION'
};

// Recursos do sistema
const AUDIT_RESOURCES = {
  USERS: 'users',
  MESSAGES: 'messages',
  BTG_ACCOUNTS: 'btg_accounts',
  CHARGES: 'charges',
  EXTRACTS: 'extracts',
  SYSTEM_CONFIG: 'system_config',
  NOTIFICATIONS: 'notifications',
  UNITS: 'units'
};

module.exports = {
  AuditService,
  AUDIT_ACTIONS,
  AUDIT_RESOURCES
}; 