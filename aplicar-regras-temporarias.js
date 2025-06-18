const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

async function testarPermissoes() {
  try {
    console.log('🔧 APLICANDO REGRAS TEMPORÁRIAS PARA CRIAÇÃO DE USUÁRIOS');
    console.log('======================================================');
    console.log('Projeto: sistema-ideal-dbffd');
    
    console.log('\n📋 REGRAS TEMPORÁRIAS NECESSÁRIAS:');
    console.log('1. Acesse: https://console.firebase.google.com/project/sistema-ideal-dbffd/firestore/rules');
    console.log('2. Substitua as regras atuais por:');
    console.log('');
    
    const regrasTemporarias = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir operações para usuários autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Permitir criação de usuários por admins
    match /usuarios/{userId} {
      allow create: if request.auth != null && 
        (request.auth.token.email == 'admin@autoescolaideal.com' ||
         request.auth.token.admin == true);
      allow read, update, delete: if request.auth != null;
    }
  }
}`;

    console.log(regrasTemporarias);
    console.log('\n3. Clique em "Publicar"');
    console.log('4. Aguarde 2-3 minutos para propagação');
    
    console.log('\n🧪 Testando criação de documento...');
    
    // Testar criação de um documento
    const testDoc = {
      teste: true,
      timestamp: new Date(),
      motivo: 'Teste de permissões para criação de usuários'
    };
    
    await setDoc(doc(db, 'teste_permissoes', 'teste_admin'), testDoc);
    
    console.log('✅ SUCESSO! Documento de teste criado.');
    console.log('✅ As regras estão funcionando corretamente.');
    console.log('\n🎯 Agora você pode criar usuários normalmente!');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n🔧 SOLUÇÃO RÁPIDA:');
      console.log('1. Aplique regras TOTALMENTE ABERTAS temporariamente:');
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
      console.log('2. Após criar os usuários, volte para regras seguras');
    }
  }
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  testarPermissoes().catch(console.error);
}

module.exports = {
  testarPermissoes
}; 