const { db, collections, firestoreUtils, validators } = require('../config/firebase');
const { AuditService, AUDIT_ACTIONS, AUDIT_RESOURCES } = require('../services/auditService');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class MessagesController {
  /**
   * Enviar mensagem via webhook Make.com e salvar no Firestore
   */
  static async sendMessage(req, res) {
    try {
      const { nome, whatsapp, tipoMensagem, unidade, mensagemPersonalizada } = req.body;
      const userId = req.user.uid;
      const userName = req.userProfile?.nome || 'Usuário';

      // Validações
      if (!nome || !whatsapp || !tipoMensagem || !unidade) {
        return res.status(400).json({
          error: 'Campos obrigatórios: nome, whatsapp, tipoMensagem, unidade'
        });
      }

      if (!validators.isValidPhone(whatsapp)) {
        return res.status(400).json({
          error: 'Número de WhatsApp inválido'
        });
      }

      const tiposValidos = ['Boas-vindas', 'Chamar Cliente'];
      if (!tiposValidos.includes(tipoMensagem)) {
        return res.status(400).json({
          error: 'Tipo de mensagem inválido'
        });
      }

      // Preparar dados da mensagem
      const messageId = uuidv4();
      const messageData = {
        id: messageId,
        nome: nome.trim(),
        whatsapp: whatsapp.replace(/\D/g, ''),
        tipoMensagem,
        unidade,
        mensagemPersonalizada: mensagemPersonalizada || null,
        usuario: userName,
        userId,
        status: 'PENDING',
        createdAt: firestoreUtils.now(),
        updatedAt: firestoreUtils.now()
      };

      // Salvar no Firestore primeiro
      await db.collection(collections.messages).doc(messageId).set(messageData);

      // Preparar payload para o webhook
      const webhookPayload = {
        id: messageId,
        nome: nome.trim(),
        whatsapp: whatsapp.replace(/\D/g, ''),
        tipoMensagem,
        unidade,
        usuario: userName,
        mensagemPersonalizada: mensagemPersonalizada || null,
        timestamp: new Date().toISOString()
      };

      try {
        // Enviar para Make.com
        const webhookResponse = await axios.post(
          'https://hook.us2.make.com/vvxwshprzsw06ba5z9kdu490ha47gmcy',
          webhookPayload,
          {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        // Atualizar status para sucesso
        await db.collection(collections.messages).doc(messageId).update({
          status: 'SENT',
          webhookResponse: {
            status: webhookResponse.status,
            data: webhookResponse.data
          },
          sentAt: firestoreUtils.now(),
          updatedAt: firestoreUtils.now()
        });

        // Log de auditoria
        await AuditService.logAction({
          userId,
          userName,
          action: AUDIT_ACTIONS.SEND_MESSAGE,
          resource: AUDIT_RESOURCES.MESSAGES,
          resourceId: messageId,
          data: {
            nome,
            whatsapp: whatsapp.replace(/\D/g, ''),
            tipoMensagem,
            unidade
          },
          ip: req.auditData?.ip,
          userAgent: req.auditData?.userAgent,
          unidade
        });

        res.status(201).json({
          success: true,
          message: 'Mensagem enviada com sucesso',
          data: {
            id: messageId,
            status: 'SENT',
            sentAt: new Date()
          }
        });

      } catch (webhookError) {
        console.error('Erro ao enviar webhook:', webhookError);

        // Atualizar status para erro
        await db.collection(collections.messages).doc(messageId).update({
          status: 'FAILED',
          error: {
            message: webhookError.message,
            code: webhookError.code,
            response: webhookError.response?.data
          },
          updatedAt: firestoreUtils.now()
        });

        // Log de erro na auditoria
        await AuditService.logError({
          userId,
          userName,
          action: AUDIT_ACTIONS.SEND_MESSAGE,
          resource: AUDIT_RESOURCES.MESSAGES,
          resourceId: messageId,
          data: webhookPayload,
          ip: req.auditData?.ip,
          userAgent: req.auditData?.userAgent,
          unidade
        }, webhookError);

        res.status(500).json({
          error: 'Falha ao enviar mensagem via webhook',
          details: webhookError.message,
          messageId
        });
      }

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);

      // Log de erro na auditoria
      if (req.user) {
        await AuditService.logError({
          userId: req.user.uid,
          userName: req.userProfile?.nome || 'Usuário',
          action: AUDIT_ACTIONS.SEND_MESSAGE,
          resource: AUDIT_RESOURCES.MESSAGES,
          data: req.body,
          ip: req.auditData?.ip,
          userAgent: req.auditData?.userAgent,
          unidade: req.body.unidade
        }, error);
      }

      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  /**
   * Listar mensagens com filtros
   */
  static async getMessages(req, res) {
    try {
      const userId = req.user.uid;
      const isAdmin = req.userProfile?.perfil === 'admin';
      const userUnidades = req.userProfile?.unidades || [];

      const {
        page = 1,
        limit = 20,
        unidade,
        status,
        tipoMensagem,
        startDate,
        endDate
      } = req.query;

      let query = db.collection(collections.messages);

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
      if (status) {
        query = query.where('status', '==', status);
      }

      if (tipoMensagem) {
        query = query.where('tipoMensagem', '==', tipoMensagem);
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
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      if (offset > 0) {
        const startAfterQuery = await query.limit(offset).get();
        if (!startAfterQuery.empty) {
          const lastDoc = startAfterQuery.docs[startAfterQuery.docs.length - 1];
          query = query.startAfter(lastDoc);
        }
      }

      query = query.limit(parseInt(limit));

      const snapshot = await query.get();
      const messages = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          ...data,
          createdAt: firestoreUtils.timestampToDate(data.createdAt),
          updatedAt: firestoreUtils.timestampToDate(data.updatedAt),
          sentAt: data.sentAt ? firestoreUtils.timestampToDate(data.sentAt) : null
        });
      });

      // Contar total para paginação
      const countQuery = db.collection(collections.messages);
      // Aplicar os mesmos filtros para contar
      const countSnapshot = await countQuery.get();
      const total = countSnapshot.size;

      res.json({
        success: true,
        data: messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  /**
   * Buscar mensagem por ID
   */
  static async getMessageById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.uid;
      const isAdmin = req.userProfile?.perfil === 'admin';
      const userUnidades = req.userProfile?.unidades || [];

      const doc = await db.collection(collections.messages).doc(id).get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      const messageData = doc.data();

      // Verificar permissões
      if (!isAdmin && !userUnidades.includes(messageData.unidade)) {
        return res.status(403).json({ error: 'Acesso negado a esta mensagem' });
      }

      res.json({
        success: true,
        data: {
          ...messageData,
          createdAt: firestoreUtils.timestampToDate(messageData.createdAt),
          updatedAt: firestoreUtils.timestampToDate(messageData.updatedAt),
          sentAt: messageData.sentAt ? firestoreUtils.timestampToDate(messageData.sentAt) : null
        }
      });

    } catch (error) {
      console.error('Erro ao buscar mensagem:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  /**
   * Estatísticas de mensagens
   */
  static async getStats(req, res) {
    try {
      const userId = req.user.uid;
      const isAdmin = req.userProfile?.perfil === 'admin';
      const userUnidades = req.userProfile?.unidades || [];

      const { startDate, endDate, unidade } = req.query;

      let query = db.collection(collections.messages);

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

      // Filtro por período
      if (startDate) {
        query = query.where('createdAt', '>=', firestoreUtils.dateToTimestamp(startDate));
      }

      if (endDate) {
        query = query.where('createdAt', '<=', firestoreUtils.dateToTimestamp(endDate));
      }

      const snapshot = await query.get();
      const messages = [];

      snapshot.forEach(doc => {
        messages.push(doc.data());
      });

      // Calcular estatísticas
      const stats = {
        total: messages.length,
        byStatus: {},
        byTipo: {},
        byUnidade: {},
        byUser: {},
        timeline: {}
      };

      messages.forEach(msg => {
        // Por status
        stats.byStatus[msg.status] = (stats.byStatus[msg.status] || 0) + 1;
        
        // Por tipo
        stats.byTipo[msg.tipoMensagem] = (stats.byTipo[msg.tipoMensagem] || 0) + 1;
        
        // Por unidade
        stats.byUnidade[msg.unidade] = (stats.byUnidade[msg.unidade] || 0) + 1;
        
        // Por usuário
        stats.byUser[msg.usuario] = (stats.byUser[msg.usuario] || 0) + 1;
        
        // Timeline (por dia)
        const date = firestoreUtils.timestampToDate(msg.createdAt);
        const dateKey = date.toISOString().split('T')[0];
        stats.timeline[dateKey] = (stats.timeline[dateKey] || 0) + 1;
      });

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  /**
   * Reenviar mensagem que falhou
   */
  static async retryMessage(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.uid;
      const userName = req.userProfile?.nome || 'Usuário';

      const doc = await db.collection(collections.messages).doc(id).get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      const messageData = doc.data();

      if (messageData.status === 'SENT') {
        return res.status(400).json({ error: 'Mensagem já foi enviada com sucesso' });
      }

      // Preparar payload para o webhook
      const webhookPayload = {
        id: messageData.id,
        nome: messageData.nome,
        whatsapp: messageData.whatsapp,
        tipoMensagem: messageData.tipoMensagem,
        unidade: messageData.unidade,
        usuario: messageData.usuario,
        mensagemPersonalizada: messageData.mensagemPersonalizada,
        timestamp: new Date().toISOString(),
        retry: true
      };

      try {
        // Reenviar para Make.com
        const webhookResponse = await axios.post(
          'https://hook.us2.make.com/vvxwshprzsw06ba5z9kdu490ha47gmcy',
          webhookPayload,
          {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        // Atualizar status
        await db.collection(collections.messages).doc(id).update({
          status: 'SENT',
          webhookResponse: {
            status: webhookResponse.status,
            data: webhookResponse.data
          },
          sentAt: firestoreUtils.now(),
          updatedAt: firestoreUtils.now(),
          retryCount: firestoreUtils.increment(1)
        });

        // Log de auditoria
        await AuditService.logAction({
          userId,
          userName,
          action: 'RETRY_MESSAGE',
          resource: AUDIT_RESOURCES.MESSAGES,
          resourceId: id,
          data: { originalData: messageData },
          ip: req.auditData?.ip,
          userAgent: req.auditData?.userAgent,
          unidade: messageData.unidade
        });

        res.json({
          success: true,
          message: 'Mensagem reenviada com sucesso'
        });

      } catch (webhookError) {
        // Atualizar com erro novamente
        await db.collection(collections.messages).doc(id).update({
          status: 'FAILED',
          error: {
            message: webhookError.message,
            code: webhookError.code,
            response: webhookError.response?.data
          },
          updatedAt: firestoreUtils.now(),
          retryCount: firestoreUtils.increment(1)
        });

        res.status(500).json({
          error: 'Falha ao reenviar mensagem',
          details: webhookError.message
        });
      }

    } catch (error) {
      console.error('Erro ao reenviar mensagem:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }
}

module.exports = MessagesController; 