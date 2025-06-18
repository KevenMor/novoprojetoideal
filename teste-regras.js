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

async function testarRegras() {
  console.log('🧪 TESTANDO REGRAS DO FIRESTORE');
  console.log('==============================');
  console.log('Projeto:', firebaseConfig.projectId);
  console.log('');
  
  try {
    // Tentar escrever um documento de teste
    console.log('📝 Tentando escrever documento de teste...');
    
    const testData = {
      teste: true,
      timestamp: new Date(),
      mensagem: 'Teste de regras do Firestore'
    };
    
    await setDoc(doc(db, 'teste_regras', 'teste1'), testData);
    
    console.log('✅ SUCESSO! As regras estão funcionando!');
    console.log('✅ Conseguimos escrever no Firestore');
    console.log('');
    console.log('🎉 Agora podemos corrigir o admin!');
    
    return true;
    
  } catch (error) {
    console.log('❌ ERRO! As regras ainda não estão funcionando');
    console.log('❌ Erro:', error.message);
    console.log('');
    console.log('🔍 POSSÍVEIS CAUSAS:');
    console.log('1. Regras não foram aplicadas no projeto correto');
    console.log('2. Regras têm erro de sintaxe');
    console.log('3. Aguardar alguns minutos para propagação');
    console.log('');
    console.log('📋 VERIFIQUE:');
    console.log('- Projeto: Sistema Ideal (sistema-ideal-dbffd)');
    console.log('- Firestore Database > Rules');
    console.log('- Status: Published (verde)');
    
    return false;
  }
}

testarRegras().then(() => {
  process.exit(0);
}).catch(console.error); 