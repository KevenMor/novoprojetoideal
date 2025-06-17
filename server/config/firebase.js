const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Para produção, use a chave de serviço do Firebase
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : require('./serviceAccountKey.json'); // Para desenvolvimento local

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://autoescola-ideal-default-rtdb.firebaseio.com",
      projectId: process.env.FIREBASE_PROJECT_ID || "autoescola-ideal"
    });

    console.log('✅ Firebase Admin SDK inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin SDK:', error);
    process.exit(1);
  }
}

// Instâncias do Firestore e Auth
const db = admin.firestore();
const auth = admin.auth();

// Configurações do Firestore
db.settings({
  timestampsInSnapshots: true,
  ignoreUndefinedProperties: true
});

// Coleções do sistema
const collections = {
  users: 'users',
  messages: 'messages',
  btgAccounts: 'btg_accounts',
  charges: 'charges',
  extracts: 'extracts',
  auditLog: 'audit_log',
  systemConfig: 'system_config',
  notifications: 'notifications',
  units: 'units'
};

// Funções utilitárias para Firestore
const firestoreUtils = {
  // Converter timestamp do Firestore para Date
  timestampToDate: (timestamp) => {
    return timestamp && timestamp.toDate ? timestamp.toDate() : timestamp;
  },

  // Converter Date para timestamp do Firestore
  dateToTimestamp: (date) => {
    return admin.firestore.Timestamp.fromDate(new Date(date));
  },

  // Obter timestamp atual
  now: () => admin.firestore.FieldValue.serverTimestamp(),

  // Incrementar campo numérico
  increment: (value = 1) => admin.firestore.FieldValue.increment(value),

  // Array union
  arrayUnion: (...elements) => admin.firestore.FieldValue.arrayUnion(...elements),

  // Array remove
  arrayRemove: (...elements) => admin.firestore.FieldValue.arrayRemove(...elements),

  // Batch write helper
  createBatch: () => db.batch(),

  // Transaction helper
  runTransaction: (updateFunction) => db.runTransaction(updateFunction)
};

// Funções de validação
const validators = {
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidCPF: (cpf) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.length === 11;
  },

  isValidCNPJ: (cnpj) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.length === 14;
  },

  isValidPhone: (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  },

  isValidBoletoLine: (line) => {
    const cleanLine = line.replace(/\D/g, '');
    return cleanLine.length === 44;
  }
};

// Middleware para autenticação
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token de autenticação requerido' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    
    // Buscar dados completos do usuário
    const userDoc = await db.collection(collections.users).doc(decodedToken.uid).get();
    if (userDoc.exists) {
      req.userProfile = userDoc.data();
    }

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar se é admin
const adminMiddleware = (req, res, next) => {
  if (!req.userProfile || req.userProfile.perfil !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Permissão de administrador requerida.' });
  }
  next();
};

// Middleware para verificar unidade
const unitAccessMiddleware = (req, res, next) => {
  const { unidade } = req.body;
  
  if (!req.userProfile) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  // Admin tem acesso a todas as unidades
  if (req.userProfile.perfil === 'admin') {
    return next();
  }

  // Verificar se o usuário tem acesso à unidade
  if (!req.userProfile.unidades || !req.userProfile.unidades.includes(unidade)) {
    return res.status(403).json({ error: 'Acesso negado para esta unidade' });
  }

  next();
};

module.exports = {
  admin,
  db,
  auth,
  collections,
  firestoreUtils,
  validators,
  authMiddleware,
  adminMiddleware,
  unitAccessMiddleware
}; 