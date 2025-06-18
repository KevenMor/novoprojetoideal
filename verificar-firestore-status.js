const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc, connectFirestoreEmulator } = require('firebase/firestore');

// Configuração do Firebase - Projeto: Sistema Ideal
const firebaseConfig = {
  apiKey: "AIzaSyBJGbAd_1HfYqwuBPXtCn45YTZM2iiBzQ8",
  authDomain: "sistema-ideal-dbffd.firebaseapp.com",
  projectId: "sistema-ideal-dbffd",
  storageBucket: "sistema-ideal-dbffd.firebasestorage.app",
  messagingSenderId: "1011080036176",
  appId: "1:1011080036176:web:d51b087f72bfa14dbb7655"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function verificarStatusFirestore() {
  try {
    console.log('🔍 VERIFICANDO STATUS DO FIRESTORE');
    console.log('==================================');
    console.log('Projeto:', firebaseConfig.projectId);
    console.log('Auth Domain:', firebaseConfig.authDomain);
    
    console.log('\n📋 Tentativa 1: Teste sem autenticação...');
    
    // Tentar criar um documento de teste sem auth
    try {
      await setDoc(doc(db, 'teste_status', 'verificacao'), {
        timestamp: new Date(),
        teste: 'sem_auth'
      });
      console.log('✅ SUCESSO: Regras permitem escrita sem autenticação');
      return 'aberto';
    } catch (error) {
      console.log('❌ Falhou sem auth:', error.code);
    }
    
    console.log('\n📋 Tentativa 2: Teste com autenticação anônima...');
    
    // Tentar com autenticação anônima
    try {
      await signInAnonymously(auth);
      console.log('✅ Autenticação anônima realizada');
      
      await setDoc(doc(db, 'teste_status', 'verificacao_auth'), {
        timestamp: new Date(),
        teste: 'com_auth',
        user: auth.currentUser.uid
      });
      console.log('✅ SUCESSO: Regras permitem escrita com autenticação');
      return 'auth_requerida';
    } catch (error) {
      console.log('❌ Falhou com auth:', error.code);
    }
    
    console.log('\n📋 Tentativa 3: Verificar se o banco está funcionando...');
    
    // Tentar apenas ler
    try {
      const testDoc = await getDoc(doc(db, 'teste_status', 'verificacao'));
      console.log('✅ Leitura funcionando, documento existe:', testDoc.exists());
    } catch (error) {
      console.log('❌ Leitura também falhou:', error.code);
    }
    
    return 'bloqueado';
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return 'erro';
  }
}

async function darInstrucoesPrecisas(status) {
  console.log('\n🎯 DIAGNÓSTICO E SOLUÇÕES:');
  console.log('========================');
  
  switch (status) {
    case 'aberto':
      console.log('✅ O Firestore está funcionando (regras abertas)');
      console.log('🔧 Agora execute: node forcar-admin-total.js');
      break;
      
    case 'auth_requerida':
      console.log('✅ O Firestore exige autenticação (configuração correta)');
      console.log('🔧 Você precisa estar logado para criar o admin');
      console.log('📝 Soluções:');
      console.log('1. Faça login no sistema web como admin@autoescolaideal.com');
      console.log('2. Ou aplique regras temporárias mais permissivas');
      break;
      
    case 'bloqueado':
      console.log('❌ O Firestore está completamente bloqueado');
      console.log('🔧 SOLUÇÃO URGENTE:');
      console.log('1. Vá para: https://console.firebase.google.com/project/sistema-ideal-dbffd/firestore/rules');
      console.log('2. Aplique estas regras TEMPORÁRIAS:');
      console.log('');
      console.log('rules_version = \'2\';');
      console.log('service cloud.firestore {');
      console.log('  match /databases/{database}/documents {');
      console.log('    match /{document=**} {');
      console.log('      allow read, write: if true;');
      console.log('    }');
      console.log('  }');
      console.log('}');
      console.log('');
      console.log('3. Clique em "Publicar"');
      console.log('4. Execute: node forcar-admin-total.js');
      console.log('5. Depois volte para as regras seguras');
      break;
      
    case 'erro':
      console.log('❌ Erro de conectividade ou configuração');
      console.log('🔧 Verifique:');
      console.log('1. Conexão com internet');
      console.log('2. Configuração do projeto Firebase');
      console.log('3. Se o projeto existe e está ativo');
      break;
  }
}

async function main() {
  console.log('🚀 DIAGNÓSTICO COMPLETO DO FIRESTORE\n');
  
  const status = await verificarStatusFirestore();
  await darInstrucoesPrecisas(status);
  
  console.log('\n🔗 Links úteis:');
  console.log('📊 Console Firebase: https://console.firebase.google.com/project/sistema-ideal-dbffd');
  console.log('🔐 Regras Firestore: https://console.firebase.google.com/project/sistema-ideal-dbffd/firestore/rules');
  console.log('👥 Authentication: https://console.firebase.google.com/project/sistema-ideal-dbffd/authentication/users');
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  verificarStatusFirestore
}; 