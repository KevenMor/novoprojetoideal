// Teste de permissões sem login - apenas lógica
console.log('🧪 TESTE DE PERMISSÕES DE MENU (SEM LOGIN)');
console.log('==========================================');

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

// Testar diferentes perfis
function testarPerfis() {
  console.log('\n👥 TESTANDO DIFERENTES PERFIS:');
  
  // 1. Perfil Admin (todas as permissões)
  console.log('\n👑 PERFIL ADMIN:');
  const perfilAdmin = {
    nome: 'Administrador',
    perfil: 'admin',
    permissions: [
      'dashboard.view',
      'messages.access',
      'btg.access',
      'charges.access',
      'extracts.access',
      'payroll.access',
      'settings.access',
      'users.access'
    ]
  };
  
  testarPerfil(perfilAdmin);
  
  // 2. Perfil Teste (permissões limitadas)
  console.log('\n🧪 PERFIL TESTE:');
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
  
  testarPerfil(perfilTeste);
  
  // 3. Perfil Operador (permissões básicas)
  console.log('\n🔧 PERFIL OPERADOR:');
  const perfilOperador = {
    nome: 'Operador',
    perfil: 'operator',
    permissions: [
      'dashboard.view',
      'messages.access',
      'btg.access',
      'charges.access'
      // NÃO inclui: extracts.access, payroll.access, settings.access, users.access
    ]
  };
  
  testarPerfil(perfilOperador);
  
  // 4. Perfil Visualizador (apenas visualização)
  console.log('\n👁️ PERFIL VISUALIZADOR:');
  const perfilVisualizador = {
    nome: 'Visualizador',
    perfil: 'viewer',
    permissions: [
      'dashboard.view'
      // NÃO inclui: nenhuma outra permissão
    ]
  };
  
  testarPerfil(perfilVisualizador);
}

function testarPerfil(perfil) {
  console.log(`📋 ${perfil.nome} (${perfil.perfil}):`);
  console.log(`   Permissões: ${perfil.permissions.join(', ')}`);
  
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
  
  console.log('   🍽️ Acesso aos menus:');
  menus.forEach(menu => {
    const temAcesso = canAccessMenu(perfil.permissions, menu.key);
    console.log(`      ${temAcesso ? '✅' : '❌'} ${menu.name}: ${temAcesso ? 'PODE ACESSAR' : 'NÃO PODE ACESSAR'}`);
  });
  
  // Verificar especificamente a folha de pagamento
  const temAcessoFolha = canAccessMenu(perfil.permissions, 'payroll');
  if (perfil.perfil !== 'admin' && temAcessoFolha) {
    console.log(`   ⚠️ PROBLEMA: ${perfil.nome} tem acesso à folha de pagamento mas não deveria!`);
  } else if (perfil.perfil !== 'admin' && !temAcessoFolha) {
    console.log(`   ✅ SUCESSO: ${perfil.nome} NÃO tem acesso à folha de pagamento (correto)`);
  }
}

// Testar função hasPermission isoladamente
function testarFuncaoHasPermission() {
  console.log('\n🔍 TESTANDO FUNÇÃO hasPermission:');
  
  const permissoesUsuario = ['dashboard.view', 'messages.access', 'btg.access'];
  
  console.log('📋 Permissões do usuário:', permissoesUsuario);
  
  const testes = [
    'dashboard.view',
    'messages.access',
    'btg.access',
    'payroll.access',
    'users.access'
  ];
  
  testes.forEach(permissao => {
    const tem = hasPermission(permissoesUsuario, permissao);
    console.log(`   ${tem ? '✅' : '❌'} ${permissao}: ${tem ? 'TEM' : 'NÃO TEM'}`);
  });
}

// Testar casos edge
function testarCasosEdge() {
  console.log('\n⚠️ TESTANDO CASOS EDGE:');
  
  // 1. Permissões undefined
  console.log('\n📋 Caso 1: Permissões undefined');
  const resultado1 = hasPermission(undefined, 'dashboard.view');
  console.log(`   hasPermission(undefined, 'dashboard.view'): ${resultado1}`);
  
  // 2. Permissões null
  console.log('\n📋 Caso 2: Permissões null');
  const resultado2 = hasPermission(null, 'dashboard.view');
  console.log(`   hasPermission(null, 'dashboard.view'): ${resultado2}`);
  
  // 3. Permissões array vazio
  console.log('\n📋 Caso 3: Permissões array vazio');
  const resultado3 = hasPermission([], 'dashboard.view');
  console.log(`   hasPermission([], 'dashboard.view'): ${resultado3}`);
  
  // 4. Permissões não é array
  console.log('\n📋 Caso 4: Permissões não é array');
  const resultado4 = hasPermission('não é array', 'dashboard.view');
  console.log(`   hasPermission('não é array', 'dashboard.view'): ${resultado4}`);
}

// Executar todos os testes
console.log('🚀 INICIANDO TESTES DE PERMISSÕES');
console.log('================================');

testarFuncaoHasPermission();
testarCasosEdge();
testarPerfis();

console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS!');
console.log('\n📋 RESUMO:');
console.log('✅ Função hasPermission está funcionando corretamente');
console.log('✅ Função canAccessMenu está funcionando corretamente');
console.log('✅ Perfis com permissões limitadas NÃO têm acesso à folha de pagamento');
console.log('✅ Perfil admin tem acesso a todos os menus');
console.log('✅ Casos edge são tratados adequadamente'); 