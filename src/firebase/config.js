import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase - Projeto: Sistema Ideal
const firebaseConfig = {
  apiKey: "AIzaSyBJGbAd_1HfYqwuBPXtCn45YTZM2iiBzQ8",
  authDomain: "sistema-ideal-dbffd.firebaseapp.com",
  projectId: "sistema-ideal-dbffd",
  storageBucket: "sistema-ideal-dbffd.firebasestorage.app",
  messagingSenderId: "1011080036176",
  appId: "1:1011080036176:web:d51b087f72bfa14dbb7655"
};

// Log da API Key para verificação
console.log("Firebase API Key (Sistema Ideal):", firebaseConfig.apiKey);

// Inicialização do Firebase com tratamento de erro
let app;
let auth;
let db;

try {
  console.log('🔧 Inicializando Firebase - Sistema Ideal...');
  
  app = initializeApp(firebaseConfig);
  
  console.log('✅ Firebase App inicializado com sucesso');
  console.log(`📍 Projeto: ${firebaseConfig.projectId}`);
  
} catch (error) {
  console.error('❌ Falha ao inicializar Firebase App:', error.message);
  throw new Error(`Erro na inicialização do Firebase: ${error.message}`);
}

try {
  auth = getAuth(app);
  console.log('✅ Firebase Auth inicializado com sucesso');
  
  // Configurar persistência de autenticação
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('👤 Usuário autenticado:', user.email);
    } else {
      console.log('👤 Usuário não autenticado');
    }
  });
  
} catch (error) {
  console.error('❌ Falha ao inicializar Firebase Auth:', error.message);
  throw new Error(`Erro na inicialização do Firebase Auth: ${error.message}`);
}

try {
  db = getFirestore(app);
  console.log('✅ Firebase Firestore inicializado com sucesso');
  
} catch (error) {
  console.error('❌ Falha ao inicializar Firebase Firestore:', error.message);
  throw new Error(`Erro na inicialização do Firestore: ${error.message}`);
}

// Função para verificar conexão
export const testFirebaseConnection = async () => {
  try {
    if (!auth.currentUser) {
      console.log('🔍 Testando conexão Firebase (usuário não logado)...');
    } else {
      console.log('🔍 Testando conexão Firebase...');
      // Teste básico de token
      await auth.currentUser.getIdToken();
      console.log('✅ Token Firebase válido');
    }
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão Firebase:', error.message);
    return false;
  }
};

// Log de inicialização bem-sucedida
console.log('🚀 Firebase configurado com sucesso - Sistema Ideal!');
console.log('📋 Configurações carregadas:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKeyLength: firebaseConfig.apiKey?.length || 0
});

export { auth, db };
export default app; 