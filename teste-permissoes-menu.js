const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCH-7WbtdO9ISZ1QqfUe7FVu5fNP9aOC7U",
  authDomain: "sistema-autoescola-ideal-15fc8.firebaseapp.com",
  projectId: "sistema-autoescola-ideal-15fc8",
  storageBucket: "sistema-autoescola-ideal-15fc8.firebasestorage.app",
  messagingSenderId: "981089777010",
  appId: "1:981089777010:web:2896fcd1c92600aced99eb",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Permissões do sistema (igual ao frontend)
const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  MESSAGES_ACCESS: 'messages.access',
  BTG_ACCESS: 'btg.access',
  CHARGES_ACCESS: 'charges.access',
  EXTRACTS_ACCESS: 'extracts.access',
  PAYROLL_ACCESS: 'payroll.access',
  SETTINGS_ACCESS: 'settings.access',
  USERS_ACCESS: 'users.access'
};

// Função para verificar permissões (igual ao frontend)
function hasPermission(userPermissions, permission) {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return userPermissions.includes(permission);
}

// Função para verificar acesso a menu
function canAccessMenu(userPermissions, menuKey) {
  const menuPermissions = {
    dashboard: [PERMISSIONS.DASHBOARD_VIEW],
    messages: [PERMISSIONS.MESSAGES_ACCESS],
    btg_accounts: [PERMISSIONS.BTG_ACCESS],
    charges: [PERMISSIONS.CHARGES_ACCESS],
    extracts: [PERMISSIONS.EXTRACTS_ACCESS],
    payroll: [PERMISSIONS.PAYROLL_ACCESS],
    settings: [PERMISSIONS.SETTINGS_ACCESS],
    users: [PERMISSIONS.USERS_ACCESS]
  };
  
  const requiredPermissions = menuPermissions[menuKey];
  if (!requiredPermissions) return true;
  
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

async function testarPermissoesMenu() {
  try {
    console.log('🧪 TESTE DE PERMISSÕES DE MENU');
    console.log('==============================');
    
    // 1. Fazer login como admin
    console.log('\n🔐 Fazendo login como admin...');
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      'admin@autoescolaideal.com', 
      '123456'
    );
    console.log('✅ Login realizado:', userCredential.user.email);
    
    // 2. Buscar dados do usuário
    console.log('\n📊 Buscando dados do usuário...');
    const userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      console.log('❌ Usuário não encontrado no Firestore!');
      return;
    }
    
    const userData = userDoc.data();
    console.log('✅ Dados do usuário:');
    console.log(`   👤 Nome: ${userData.nome}`);
    console.log(`   🏷️ Perfil: ${userData.perfil}`);
    console.log(`   🔐 Permissões: ${userData.permissions?.length || 0}`);
    
    // 3. Testar permissões de menu
    console.log('\n🍽️ TESTANDO PERMISSÕES DE MENU:');
    
    const menus = [
      { key: 'dashboard', name: 'Dashboard' },
      { key: 'messages', name: 'Mensagens' },
      { key: 'btg_accounts', name: 'Contas BTG' },
      { key: 'charges', name: 'Cobranças' },
      { key: 'extracts', name: 'Extratos' },
      { key: 'payroll', name: 'Folha de Pagamento' },
      { key: 'settings', name: 'Configurações' },
      { key: 'users', name: 'Gerenciar Usuários' }
    ];
    
    menus.forEach(menu => {
      const temAcesso = canAccessMenu(userData.permissions, menu.key);
      console.log(`   ${temAcesso ? '✅' : '❌'} ${menu.name}: ${temAcesso ? 'PODE ACESSAR' : 'NÃO PODE ACESSAR'}`);
    });
    
    // 4. Testar permissões específicas
    console.log('\n🔍 TESTANDO PERMISSÕES ESPECÍFICAS:');
    
    const permissoesTeste = [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.MESSAGES_ACCESS,
      PERMISSIONS.BTG_ACCESS,
      PERMISSIONS.CHARGES_ACCESS,
      PERMISSIONS.EXTRACTS_ACCESS,
      PERMISSIONS.PAYROLL_ACCESS,
      PERMISSIONS.SETTINGS_ACCESS,
      PERMISSIONS.USERS_ACCESS
    ];
    
    permissoesTeste.forEach(permissao => {
      const temPermissao = hasPermission(userData.permissions, permissao);
      console.log(`   ${temPermissao ? '✅' : '❌'} ${permissao}: ${temPermissao ? 'TEM' : 'NÃO TEM'}`);
    });
    
    // 5. Testar perfil específico (teste)
    console.log('\n🧪 TESTANDO PERFIL "TESTE":');
    
    const perfilTeste = {
      nome: 'Usuário Teste',
      perfil: 'teste',
      permissions: [
        'dashboard.view',
        'messages.access',
        'btg.access',
        'charges.access',
        'extracts.access'
        // NÃO inclui: payroll.access, settings.access, users.access
      ]
    };
    
    console.log('📋 Permissões do perfil teste:', perfilTeste.permissions);
    
    menus.forEach(menu => {
      const temAcesso = canAccessMenu(perfilTeste.permissions, menu.key);
      console.log(`   ${temAcesso ? '✅' : '❌'} ${menu.name}: ${temAcesso ? 'PODE ACESSAR' : 'NÃO PODE ACESSAR'}`);
    });
    
    // 6. Verificar se folha de pagamento está bloqueada
    console.log('\n🔒 VERIFICANDO BLOQUEIO DA FOLHA DE PAGAMENTO:');
    const temAcessoFolha = canAccessMenu(perfilTeste.permissions, 'payroll');
    console.log(`   Folha de Pagamento: ${temAcessoFolha ? '❌ DEVERIA ESTAR BLOQUEADA' : '✅ CORRETAMENTE BLOQUEADA'}`);
    
    if (temAcessoFolha) {
      console.log('   ⚠️ PROBLEMA: Usuário teste tem acesso à folha de pagamento!');
    } else {
      console.log('   ✅ SUCESSO: Usuário teste NÃO tem acesso à folha de pagamento');
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    console.error('🔍 Detalhes:', {
      code: error.code,
      message: error.message
    });
  }
}

// Executar teste
testarPermissoesMenu()
  .then(() => {
    console.log('\n✅ Teste finalizado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  }); 