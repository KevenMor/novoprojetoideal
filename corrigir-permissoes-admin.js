const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, updateDoc } = require('firebase/firestore');

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

// PERMISSÕES NO FORMATO CORRETO DO SISTEMA
const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_ALL_UNITS: 'dashboard.all_units',
  
  // Mensagens
  MESSAGES_VIEW: 'messages.view',
  MESSAGES_SEND: 'messages.send',
  MESSAGES_HISTORY: 'messages.history',
  
  // Contas BTG
  BTG_ACCOUNTS_VIEW: 'btg_accounts.view',
  BTG_ACCOUNTS_CREATE: 'btg_accounts.create',
  BTG_ACCOUNTS_EDIT: 'btg_accounts.edit',
  BTG_ACCOUNTS_DELETE: 'btg_accounts.delete',
  
  // Cobranças
  CHARGES_VIEW: 'charges.view',
  CHARGES_CREATE: 'charges.create',
  CHARGES_EDIT: 'charges.edit',
  CHARGES_DELETE: 'charges.delete',
  
  // Extratos
  EXTRACTS_VIEW: 'extracts.view',
  EXTRACTS_EXPORT: 'extracts.export',
  EXTRACTS_ALL_UNITS: 'extracts.all_units',
  
  // Configurações
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_SHEETS: 'settings.sheets',
  SETTINGS_SYSTEM: 'settings.system',
  
  // Usuários (Admin)
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_PERMISSIONS: 'users.permissions'
};

// Todas as permissões do admin
const ADMIN_PERMISSIONS = Object.values(PERMISSIONS);

// Unidades
const unidades = [
  'Julio de Mesquita',
  'Aparecidinha', 
  'Coop',
  'Progresso',
  'Vila Haro',
  'Vila Helena'
];

async function corrigirPermissoesAdmin() {
  try {
    console.log('🔧 CORRIGINDO PERMISSÕES DO ADMIN');
    console.log('=================================');
    
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    let adminEncontrado = false;
    
    for (const docSnapshot of usuariosSnapshot.docs) {
      const data = docSnapshot.data();
      
      if (data.email === 'admin@autoescolaideal.com') {
        adminEncontrado = true;
        console.log(`🔍 Admin encontrado: ${docSnapshot.id}`);
        
        // Dados corrigidos do admin
        const dadosCorrigidos = {
          uid: docSnapshot.id,
          email: 'admin@autoescolaideal.com',
          nome: 'Administrador Total',
          perfil: 'admin',
          unidades: unidades,
          ativo: true,
          permissions: ADMIN_PERMISSIONS, // FORMATO CORRETO!
          acessoTotal: true,
          criadoEm: data.criadoEm || new Date(),
          atualizadoEm: new Date(),
          // Campos extras para garantir compatibilidade
          role: 'admin',
          isAdmin: true,
          superUser: true
        };
        
        // Atualizar o documento
        await setDoc(doc(db, 'usuarios', docSnapshot.id), dadosCorrigidos);
        
        console.log('✅ ADMIN CORRIGIDO COM SUCESSO!');
        console.log('📋 CONFIGURAÇÕES:');
        console.log(`👤 Nome: ${dadosCorrigidos.nome}`);
        console.log(`📧 Email: ${dadosCorrigidos.email}`);
        console.log(`🏷️ Perfil: ${dadosCorrigidos.perfil}`);
        console.log(`🏢 Unidades: ${dadosCorrigidos.unidades.join(', ')}`);
        console.log(`🔐 Permissões: ${dadosCorrigidos.permissions.length} permissões`);
        console.log(`👑 Acesso Total: ${dadosCorrigidos.acessoTotal}`);
        
        // Verificar se tem a permissão específica
        if (dadosCorrigidos.permissions.includes('users.view')) {
          console.log('✅ Permissão "users.view" ENCONTRADA!');
        } else {
          console.log('❌ Permissão "users.view" NÃO encontrada!');
        }
        
        console.log('\n🔐 TODAS AS PERMISSÕES:');
        dadosCorrigidos.permissions.forEach((perm, index) => {
          console.log(`${index + 1}. ${perm}`);
        });
      }
    }
    
    if (!adminEncontrado) {
      console.log('❌ Admin não encontrado!');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao corrigir admin:', error.message);
    return false;
  }
}

async function verificarPermissoes() {
  try {
    console.log('\n🔍 VERIFICANDO PERMISSÕES CORRIGIDAS...');
    
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === 'admin@autoescolaideal.com') {
        console.log('\n✅ ADMIN VERIFICADO:');
        console.log(`🆔 ID: ${doc.id}`);
        console.log(`📧 Email: ${data.email}`);
        console.log(`👤 Nome: ${data.nome}`);
        console.log(`🏷️ Perfil: ${data.perfil}`);
        console.log(`🔐 Permissões: ${data.permissions?.length || 0}`);
        console.log(`👑 Acesso Total: ${data.acessoTotal || false}`);
        console.log(`🏢 Unidades: ${data.unidades?.length || 0}`);
        
        // Verificar permissões específicas para menu de usuários
        const permissoesUsuarios = [
          'users.view',
          'users.create', 
          'users.edit',
          'users.delete',
          'users.permissions'
        ];
        
        console.log('\n🔍 VERIFICANDO PERMISSÕES DE USUÁRIOS:');
        permissoesUsuarios.forEach(perm => {
          const tem = data.permissions?.includes(perm);
          console.log(`${tem ? '✅' : '❌'} ${perm}: ${tem ? 'SIM' : 'NÃO'}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error.message);
  }
}

async function main() {
  console.log('🔧 CORRIGIR PERMISSÕES DO ADMIN');
  console.log('===============================');
  
  const sucesso = await corrigirPermissoesAdmin();
  
  if (sucesso) {
    await verificarPermissoes();
    
    console.log('\n🎉 PERMISSÕES CORRIGIDAS!');
    console.log('\n🔥 PRÓXIMOS PASSOS:');
    console.log('1. Faça LOGOUT no navegador (Ctrl+Shift+R)');
    console.log('2. Limpe o cache do navegador');
    console.log('3. Faça LOGIN novamente com: admin@autoescolaideal.com');
    console.log('4. O menu "Gerenciar Usuários" DEVE aparecer agora');
    console.log('5. Se não aparecer, acesse diretamente:');
    console.log('   http://localhost:3000/gerenciar-usuarios');
    
  } else {
    console.log('\n❌ Falha ao corrigir permissões.');
  }
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  corrigirPermissoesAdmin,
  verificarPermissoes
}; 