// Script para verificar permissões do usuário atual
console.log('🔍 VERIFICANDO PERMISSÕES DO USUÁRIO ATUAL');
console.log('==========================================');

// Simular dados do usuário (você pode ajustar conforme necessário)
const usuariosTeste = [
  {
    nome: 'Admin',
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
  },
  {
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
  },
  {
    nome: 'Operador',
    perfil: 'operator',
    permissions: [
      'dashboard.view',
      'messages.access',
      'btg.access',
      'charges.access'
      // NÃO inclui: extracts.access, payroll.access, settings.access, users.access
    ]
  }
];

// Permissões do sistema
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

// Função hasPermission (igual ao frontend)
function hasPermission(userPermissions, permission) {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    console.log(`❌ Permissões inválidas:`, userPermissions);
    return false;
  }
  return userPermissions.includes(permission);
}

// Função canAccessMenu (igual ao frontend)
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

// Testar cada usuário
usuariosTeste.forEach(usuario => {
  console.log(`\n👤 TESTANDO USUÁRIO: ${usuario.nome} (${usuario.perfil})`);
  console.log(`📋 Permissões: ${usuario.permissions.join(', ')}`);
  
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
  
  console.log('🍽️ Acesso aos menus:');
  menus.forEach(menu => {
    const temAcesso = canAccessMenu(usuario.permissions, menu.key);
    console.log(`   ${temAcesso ? '✅' : '❌'} ${menu.name}: ${temAcesso ? 'PODE ACESSAR' : 'NÃO PODE ACESSAR'}`);
  });
  
  // Verificar especificamente a folha de pagamento
  const temAcessoFolha = canAccessMenu(usuario.permissions, 'payroll');
  if (usuario.perfil !== 'admin' && temAcessoFolha) {
    console.log(`   ⚠️ PROBLEMA: ${usuario.nome} tem acesso à folha de pagamento mas não deveria!`);
  } else if (usuario.perfil !== 'admin' && !temAcessoFolha) {
    console.log(`   ✅ SUCESSO: ${usuario.nome} NÃO tem acesso à folha de pagamento (correto)`);
  }
});

// Testar casos específicos que podem estar causando problemas
console.log('\n🔍 TESTANDO CASOS ESPECÍFICOS:');

// 1. Verificar se a função hasPermission está funcionando
console.log('\n📋 Teste 1: Função hasPermission');
const permissoesTeste = ['dashboard.view', 'messages.access', 'btg.access'];
console.log('Permissões:', permissoesTeste);
console.log('Tem payroll.access?', hasPermission(permissoesTeste, 'payroll.access'));
console.log('Tem dashboard.view?', hasPermission(permissoesTeste, 'dashboard.view'));

// 2. Verificar se o submenu está sendo filtrado
console.log('\n📋 Teste 2: Filtragem de submenu');
const submenuContasBTG = [
  {
    name: 'Cadastrar Conta',
    href: '/cadastrar-contas-btg',
    description: 'Boleto e PIX'
  },
  {
    name: 'Gestão de Contas',
    href: '/gestao-contas-btg',
    description: 'Gerenciar todas as contas'
  },
  {
    name: 'Folha de Pagamento',
    href: '/folha-pagamento',
    description: 'Gestão de funcionários',
    permission: PERMISSIONS.PAYROLL_ACCESS
  }
];

const usuarioTeste = usuariosTeste[1]; // Usuário teste (sem payroll.access)
console.log('Submenu original:', submenuContasBTG.map(s => s.name));
console.log('Permissões do usuário:', usuarioTeste.permissions);

const submenuFiltrado = submenuContasBTG.filter(subItem => {
  if (!subItem.permission) return true;
  const hasAccess = hasPermission(usuarioTeste.permissions, subItem.permission);
  console.log(`  Submenu "${subItem.name}": ${hasAccess ? '✅ VISÍVEL' : '❌ OCULTO'} (permissão: ${subItem.permission})`);
  return hasAccess;
});

console.log('Submenu filtrado:', submenuFiltrado.map(s => s.name));

// 3. Verificar se o problema pode estar no formato das permissões
console.log('\n📋 Teste 3: Formato das permissões');
console.log('Tipo das permissões:', typeof usuarioTeste.permissions);
console.log('É array?', Array.isArray(usuarioTeste.permissions));
console.log('Inclui payroll.access?', usuarioTeste.permissions.includes('payroll.access'));
console.log('Inclui dashboard.view?', usuarioTeste.permissions.includes('dashboard.view'));

console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA!');
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. Verifique se o usuário no sistema tem as permissões corretas');
console.log('2. Abra o console do navegador (F12) e veja os logs de permissões');
console.log('3. Confirme se a função hasPermission está sendo chamada');
console.log('4. Verifique se o AuthContext está carregando as permissões corretamente'); 