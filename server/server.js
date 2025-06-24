require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Importar configurações e serviços
const { authMiddleware, adminMiddleware, unitAccessMiddleware } = require('./config/firebase');
const { AuditService } = require('./services/auditService');

// Importar controladores
const MessagesController = require('./controllers/messagesController');
const BTGAccountsController = require('./controllers/btgAccountsController');
const CategoriasController = require('./controllers/categoriasController');
const ContasController = require('./controllers/contasController');
const FormasPagamentoController = require('./controllers/formasPagamentoController');
const ClientesFornecedoresController = require('./controllers/clientesFornecedoresController');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de segurança
app.use(helmet({
  contentSecurityPolicy: false // Desabilitado para desenvolvimento
}));

app.use(compression());

// CORS configurado para o frontend
const allowedOrigins = [
  'http://localhost:3000',
  'https://app.autoescolaidealsorocaba.com.br',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS bloqueado para origin:', origin);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Para suportar browsers legados
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Middleware para capturar dados de auditoria
app.use(AuditService.captureMiddleware);

// Middleware para adicionar IP real
app.use((req, res, next) => {
  req.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// =================== ROTAS AUTENTICADAS ===================

// ============= MENSAGENS =============
app.post('/api/messages', authMiddleware, unitAccessMiddleware, MessagesController.sendMessage);
app.get('/api/messages', authMiddleware, MessagesController.getMessages);
app.get('/api/messages/stats', authMiddleware, MessagesController.getStats);
app.get('/api/messages/:id', authMiddleware, MessagesController.getMessageById);
app.post('/api/messages/:id/retry', authMiddleware, MessagesController.retryMessage);

// ============= CONTAS BTG =============
app.post('/api/btg-accounts', authMiddleware, unitAccessMiddleware, BTGAccountsController.createAccount);
app.post('/api/btg-accounts/batch-pay', authMiddleware, unitAccessMiddleware, BTGAccountsController.batchPay);
app.get('/api/btg-accounts', authMiddleware, BTGAccountsController.getAccounts);
app.get('/api/btg-accounts/stats', authMiddleware, BTGAccountsController.getStats);

// ============= COBRANÇAS =============
app.post('/api/charges', authMiddleware, unitAccessMiddleware, async (req, res) => {
  try {
    const { 
      // Dados do cliente
      nome, email, cpfCnpj, telefone, endereco,
      // Dados da cobrança
      valor, vencimento, descricao, servico, observacoes,
      // Dados da unidade
      unidade,
      // Tipo de pagamento
      tipoPagamento, parcelas
    } = req.body;

    const userId = req.user.uid;
    const userName = req.userProfile?.nome || 'Usuário';

    // Validações básicas
    if (!nome || !email || !cpfCnpj || !valor || !vencimento || !unidade || !tipoPagamento) {
      return res.status(400).json({
        error: 'Campos obrigatórios: nome, email, cpfCnpj, valor, vencimento, unidade, tipoPagamento'
      });
    }

    // Importar dependências aqui para evitar circular dependency
    const { db, collections, firestoreUtils } = require('./config/firebase');
    const { v4: uuidv4 } = require('uuid');
    const { AUDIT_ACTIONS, AUDIT_RESOURCES } = require('./services/auditService');

    // Preparar dados da cobrança
    const chargeId = uuidv4();
    const chargeData = {
      id: chargeId,
      // Dados do cliente
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      cpfCnpj: cpfCnpj.replace(/\D/g, ''),
      telefone: telefone?.replace(/\D/g, '') || null,
      endereco: endereco || null,
      // Dados da cobrança
      valor: parseFloat(valor),
      vencimento,
      descricao: descricao.trim(),
      servico: servico || null,
      observacoes: observacoes || null,
      tipoPagamento,
      parcelas: parcelas ? parseInt(parcelas) : 1,
      // Dados do sistema
      unidade,
      usuario: userName,
      userId,
      status: 'PENDING',
      createdAt: firestoreUtils.now(),
      updatedAt: firestoreUtils.now()
    };

    // Salvar no Firestore
    await db.collection(collections.charges).doc(chargeId).set(chargeData);

    // Log de auditoria
    await AuditService.logAction({
      userId,
      userName,
      action: AUDIT_ACTIONS.CREATE_CHARGE,
      resource: AUDIT_RESOURCES.CHARGES,
      resourceId: chargeId,
      data: {
        nome,
        valor: parseFloat(valor),
        tipoPagamento,
        unidade
      },
      ip: req.auditData?.ip,
      userAgent: req.auditData?.userAgent,
      unidade
    });

    res.status(201).json({
      success: true,
      message: 'Cobrança registrada com sucesso',
      data: {
        id: chargeId,
        status: 'PENDING',
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Erro ao registrar cobrança:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

app.get('/api/charges', authMiddleware, async (req, res) => {
  try {
    const { db, collections, firestoreUtils } = require('./config/firebase');
    const isAdmin = req.userProfile?.perfil === 'admin';
    const userUnidades = req.userProfile?.unidades || [];

    const {
      page = 1,
      limit = 20,
      unidade,
      status,
      tipoPagamento,
      startDate,
      endDate
    } = req.query;

    let query = db.collection(collections.charges);

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

    if (tipoPagamento) {
      query = query.where('tipoPagamento', '==', tipoPagamento);
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
    const charges = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      charges.push({
        ...data,
        createdAt: firestoreUtils.timestampToDate(data.createdAt),
        updatedAt: firestoreUtils.timestampToDate(data.updatedAt)
      });
    });

    res.json({
      success: true,
      data: charges,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: charges.length
      }
    });

  } catch (error) {
    console.error('Erro ao buscar cobranças:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// ============= EXTRATOS =============
app.get('/api/extracts', authMiddleware, async (req, res) => {
  try {
    const { db, collections, firestoreUtils } = require('./config/firebase');
    const isAdmin = req.userProfile?.perfil === 'admin';
    const userUnidades = req.userProfile?.unidades || [];

    const {
      startDate,
      endDate,
      unidade,
      tipo
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Período obrigatório (startDate e endDate)' });
    }

    // Buscar dados das cobranças para simular extratos
    let query = db.collection(collections.charges);

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
    query = query.where('createdAt', '>=', firestoreUtils.dateToTimestamp(startDate));
    query = query.where('createdAt', '<=', firestoreUtils.dateToTimestamp(endDate));

    const snapshot = await query.get();
    const extracts = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Converter cobranças para formato de extrato
      const extract = {
        id: data.id,
        date: firestoreUtils.timestampToDate(data.createdAt),
        description: `${data.descricao} - ${data.nome}`,
        type: 'CREDIT', // Cobrança = receita
        value: data.valor,
        status: data.status,
        unidade: data.unidade,
        tipoPagamento: data.tipoPagamento
      };

      // Filtrar por tipo se especificado
      if (!tipo || extract.type === tipo) {
        extracts.push(extract);
      }
    });

    // Calcular estatísticas
    const stats = {
      receitas: extracts.filter(e => e.type === 'CREDIT').reduce((sum, e) => sum + e.value, 0),
      despesas: extracts.filter(e => e.type === 'DEBIT').reduce((sum, e) => sum + Math.abs(e.value), 0),
      transacoes: extracts.length
    };
    stats.saldo = stats.receitas - stats.despesas;

    res.json({
      success: true,
      data: extracts,
      statistics: stats
    });

  } catch (error) {
    console.error('Erro ao buscar extratos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// ============= USUÁRIOS (ADMIN ONLY) =============
app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { db, collections, firestoreUtils } = require('./config/firebase');

    const snapshot = await db.collection(collections.users).get();
    const users = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      users.push({
        id: doc.id,
        ...data,
        createdAt: firestoreUtils.timestampToDate(data.createdAt),
        updatedAt: firestoreUtils.timestampToDate(data.updatedAt)
      });
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// ============= AUDITORIA (ADMIN ONLY) =============
app.get('/api/audit/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const logs = await AuditService.getLogs(req.query);
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

app.get('/api/audit/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await AuditService.getStats(req.query);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de auditoria:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// ============= CATEGORIAS =============
app.post('/api/categorias', authMiddleware, adminMiddleware, CategoriasController.createCategoria);
app.get('/api/categorias', authMiddleware, CategoriasController.listCategorias);
app.delete('/api/categorias/:id', authMiddleware, adminMiddleware, CategoriasController.deleteCategoria);

// Rotas sem prefixo /api para compatibilidade
app.post('/categorias', authMiddleware, adminMiddleware, CategoriasController.createCategoria);
app.get('/categorias', authMiddleware, CategoriasController.listCategorias);
app.delete('/categorias/:id', authMiddleware, adminMiddleware, CategoriasController.deleteCategoria);

// ============= CONTAS =============
app.post('/api/contas', authMiddleware, adminMiddleware, ContasController.createConta);
app.get('/api/contas', authMiddleware, ContasController.listContas);

// ============= FORMAS DE PAGAMENTO =============
app.post('/api/formas-pagamento', authMiddleware, adminMiddleware, FormasPagamentoController.createFormaPagamento);
app.get('/api/formas-pagamento', authMiddleware, FormasPagamentoController.listFormasPagamento);
app.delete('/api/formas-pagamento/:id', authMiddleware, adminMiddleware, FormasPagamentoController.deleteFormaPagamento);

// Rotas sem prefixo /api para compatibilidade
app.post('/formas-pagamento', authMiddleware, adminMiddleware, FormasPagamentoController.createFormaPagamento);
app.get('/formas-pagamento', authMiddleware, FormasPagamentoController.listFormasPagamento);
app.delete('/formas-pagamento/:id', authMiddleware, adminMiddleware, FormasPagamentoController.deleteFormaPagamento);

// ============= CLIENTES/FORNECEDORES =============
app.post('/api/clientes-fornecedores', authMiddleware, adminMiddleware, ClientesFornecedoresController.createClienteFornecedor);
app.get('/api/clientes-fornecedores', authMiddleware, ClientesFornecedoresController.listClientesFornecedores);

// =================== MIDDLEWARE DE ERRO ===================
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// =================== INICIALIZAÇÃO DO SERVIDOR ===================
const server = app.listen(PORT, () => {
  console.log(`
🚀 Servidor da Autoescola Ideal iniciado!
📍 Porta: ${PORT}
🌍 Ambiente: ${process.env.NODE_ENV || 'development'}
🔗 URL: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/health

✅ Funcionalidades disponíveis:
   📱 Mensagens WhatsApp com persistência
   💳 Contas BTG com validação
   💰 Cobranças com Firestore
   📈 Extratos financeiros
   👥 Gestão de usuários
   🕵️ Auditoria completa
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM recebido. Fechando servidor graciosamente...');
  server.close(() => {
    console.log('✅ Servidor fechado com sucesso');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT recebido. Fechando servidor graciosamente...');
  server.close(() => {
    console.log('✅ Servidor fechado com sucesso');
    process.exit(0);
  });
});

module.exports = app; 