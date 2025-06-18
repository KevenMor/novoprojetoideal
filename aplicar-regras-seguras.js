const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const fs = require('fs');

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

async function main() {
  console.log('🔒 REGRAS DE SEGURANÇA PARA FIRESTORE');
  console.log('====================================');
  
  console.log('📋 REGRAS CRIADAS NO ARQUIVO: firestore-rules-seguras.rules');
  console.log('');
  
  console.log('🔥 COMO APLICAR AS REGRAS:');
  console.log('');
  console.log('1. Acesse o Firebase Console:');
  console.log('   https://console.firebase.google.com/project/sistema-ideal-dbffd');
  console.log('');
  console.log('2. Vá em "Firestore Database" → "Regras"');
  console.log('');
  console.log('3. Copie e cole o conteúdo do arquivo "firestore-rules-seguras.rules"');
  console.log('');
  console.log('4. Clique em "Publicar"');
  console.log('');
  
  console.log('🛡️ CARACTERÍSTICAS DAS REGRAS:');
  console.log('');
  console.log('✅ Usuários só podem ler dados se estiverem autenticados');
  console.log('✅ Apenas admins podem criar/editar/excluir usuários');
  console.log('✅ Permissões granulares por funcionalidade');
  console.log('✅ Validação de estrutura de dados');
  console.log('✅ Logs imutáveis (não podem ser editados)');
  console.log('✅ Usuários podem editar apenas dados básicos do próprio perfil');
  console.log('✅ Regra padrão: NEGAR tudo que não foi especificado');
  console.log('');
  
  console.log('🔐 PERMISSÕES VERIFICADAS:');
  console.log('');
  console.log('• messages.view, messages.send');
  console.log('• btg_accounts.view, btg_accounts.create, btg_accounts.edit, btg_accounts.delete');
  console.log('• charges.view, charges.create, charges.edit, charges.delete');
  console.log('• extracts.view');
  console.log('• settings.view');
  console.log('• Perfil admin para operações sensíveis');
  console.log('');
  
  console.log('⚠️ IMPORTANTE:');
  console.log('');
  console.log('• Teste as regras em ambiente de desenvolvimento primeiro');
  console.log('• Mantenha backup das regras atuais');
  console.log('• Monitore logs de erro após aplicar');
  console.log('• As regras podem levar alguns minutos para propagar');
  console.log('');
  
  console.log('🚀 APÓS APLICAR AS REGRAS:');
  console.log('');
  console.log('1. Teste o login do admin');
  console.log('2. Teste criação de usuários');
  console.log('3. Teste acesso às diferentes funcionalidades');
  console.log('4. Verifique se usuários não-admin têm acesso limitado');
  console.log('');
  
  // Ler e exibir as regras
  try {
    const rules = fs.readFileSync('firestore-rules-seguras.rules', 'utf8');
    console.log('📄 CONTEÚDO DAS REGRAS:');
    console.log('======================');
    console.log(rules);
  } catch (error) {
    console.log('⚠️ Não foi possível ler o arquivo de regras');
  }
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main
}; 