const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

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
const db = getFirestore(app);

async function testarRegrasAbertas() {
  console.log('🧪 TESTE COM REGRAS TOTALMENTE ABERTAS');
  console.log('=====================================');
  console.log('Projeto:', firebaseConfig.projectId);
  console.log('');
  console.log('💡 PROBLEMA IDENTIFICADO:');
  console.log('As regras atuais exigem usuário autenticado:');
  console.log('allow read, write: if request.auth != null;');
  console.log('');
  console.log('🔧 SOLUÇÃO TEMPORÁRIA:');
  console.log('Aplique estas regras TEMPORÁRIAS no Firebase Console:');
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
  console.log('⚠️ ATENÇÃO: Essas regras são APENAS para configuração inicial!');
  console.log('Depois voltaremos para regras seguras.');
  console.log('');
  
  try {
    // Tentar escrever um documento de teste
    console.log('📝 Tentando escrever documento de teste...');
    
    const testData = {
      teste: true,
      timestamp: new Date(),
      mensagem: 'Teste com regras abertas'
    };
    
    await setDoc(doc(db, 'teste_regras', 'teste_aberto'), testData);
    
    console.log('✅ SUCESSO! Regras abertas funcionando!');
    console.log('✅ Agora podemos configurar o admin!');
    
    return true;
    
  } catch (error) {
    console.log('❌ AINDA COM ERRO:', error.message);
    console.log('');
    console.log('🔍 POSSÍVEIS CAUSAS:');
    console.log('1. Regras não foram aplicadas ainda');
    console.log('2. Cache do Firebase (aguarde 5-10 minutos)');
    console.log('3. Projeto incorreto');
    
    return false;
  }
}

testarRegrasAbertas().then(() => {
  process.exit(0);
}).catch(console.error); 