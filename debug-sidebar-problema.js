// Script para debugar problema específico do Sidebar
console.log('🔍 DEBUGANDO PROBLEMA DO SIDEBAR - MENUS NÃO APARECEM');
console.log('====================================================');

// Simular exatamente o que acontece no Sidebar.js
const PERMISSIONS = {
  DASHBOARD_VIEW: 'visualizar_dashboard',
  MESSAGES_VIEW: 'enviar_mensagens', 
  BTG_ACCOUNTS_VIEW: 'cadastrar_contas_btg',
  CHARGES_VIEW: 'registrar_cobrancas',
  EXTRACTS_VIEW: 'visualizar_extratos',
  SETTINGS_VIEW: 'configurar_sistema',
  USERS_VIEW: 'gerenciar_usuarios'
};

// Simular dados do usuário (baseado no debug anterior)
const mockUserProfile = {
  nome: 'admin',
  perfil: 'admin',
  ativo: true,
  unidades: ['Julio de Mesquita', 'Aparecidinha', 'Coop', 'Progresso', 'Vila Haro', 'Vila Helena'],
  permissions: [
    'gerenciar_usuarios', 'enviar_mensagens', 'cadastrar_contas_btg',
    'registrar_cobrancas', 'visualizar_extratos', 'configurar_sistema',
    'visualizar_relatorios', 'gerenciar_permissoes', 'visualizar_logs',
    'exportar_dados', 'importar_dados', 'backup_sistema',
    'gerenciar_unidades', 'configurar_integracao', 'visualizar_dashboard',
    'gerenciar_notificacoes', 'configurar_alertas', 'visualizar_metricas',
    'gerenciar_templates', 'configurar_webhooks', 'visualizar_auditoria',
    'gerenciar_categorias', 'configurar_automacao', 'visualizar_estatisticas',
    'gerenciar_tags', 'configurar_backup'
  ]
};

// Simular função hasPermission do AuthContext
function mockHasPermission(requiredPermission) {
  if (!mockUserProfile.permissions || !Array.isArray(mockUserProfile.permissions)) {
    console.log(`❌ hasPermission(${requiredPermission}): permissions não é array válido`);
    return false;
  }
  
  const result = mockUserProfile.permissions.includes(requiredPermission);
  console.log(`🔍 hasPermission(${requiredPermission}): ${result}`);
  return result;
}

// Simular exatamente os menuItems do Sidebar.js
const menuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    permission: PERMISSIONS.DASHBOARD_VIEW,
    description: 'Visão geral do sistema'
  },
  {
    name: 'Enviar Mensagem',
    href: '/mensagem',
    permission: PERMISSIONS.MESSAGES_VIEW,
    description: 'WhatsApp automático'
  },
  {
    name: 'Cadastrar Contas BTG',
    href: '/contas-btg',
    permission: PERMISSIONS.BTG_ACCOUNTS_VIEW,
    description: 'Boleto e PIX'
  },
  {
    name: 'Registrar Cobranças',
    href: '/cobrancas',
    permission: PERMISSIONS.CHARGES_VIEW,
    description: 'Gestão de pagamentos'
  },
  {
    name: 'Extratos',
    href: '/extratos',
    permission: PERMISSIONS.EXTRACTS_VIEW,
    description: 'Relatórios financeiros'
  },
  {
    name: 'Configuração Sheets',
    href: '/configuracao-sheets',
    permission: PERMISSIONS.SETTINGS_VIEW,
    description: 'Configurar Google Sheets'
  },
  {
    name: 'Gerenciar Usuários',
    href: '/usuarios',
    permission: PERMISSIONS.USERS_VIEW,
    description: 'Controle de acesso'
  }
];

console.log('\n📊 DADOS DO USUÁRIO SIMULADOS:');
console.log(`Nome: ${mockUserProfile.nome}`);
console.log(`Perfil: ${mockUserProfile.perfil}`);
console.log(`Ativo: ${mockUserProfile.ativo}`);
console.log(`Permissions (tipo): ${typeof mockUserProfile.permissions}`);
console.log(`Permissions (é array): ${Array.isArray(mockUserProfile.permissions)}`);
console.log(`Permissions (quantidade): ${mockUserProfile.permissions?.length || 0}`);

console.log('\n🔍 TESTANDO CADA PERMISSÃO:');
Object.entries(PERMISSIONS).forEach(([key, value]) => {
  const temPermissao = mockHasPermission(value);
  console.log(`${key}: ${value} → ${temPermissao ? '✅' : '❌'}`);
});

console.log('\n🍽️ SIMULANDO FILTRO DOS MENUS:');
console.log('Código: menuItems.filter(item => !item.permission || hasPermission(item.permission))');

const filteredMenuItems = menuItems.filter(item => {
  const shouldShow = !item.permission || mockHasPermission(item.permission);
  console.log(`📋 ${item.name}: ${shouldShow ? '✅ INCLUÍDO' : '❌ FILTRADO'}`);
  console.log(`   Permissão: ${item.permission || 'NENHUMA'}`);
  console.log(`   Lógica: ${!item.permission ? 'SEM PERMISSÃO NECESSÁRIA' : `hasPermission(${item.permission}) = ${mockHasPermission(item.permission)}`}`);
  return shouldShow;
});

console.log(`\n📊 RESULTADO FINAL: ${filteredMenuItems.length}/${menuItems.length} menus filtrados`);

if (filteredMenuItems.length === 0) {
  console.log('\n❌ PROBLEMA CRÍTICO: NENHUM MENU PASSOU NO FILTRO!');
  console.log('🔍 POSSÍVEIS CAUSAS:');
  console.log('1. Função hasPermission retornando sempre false');
  console.log('2. userProfile.permissions está undefined/null');
  console.log('3. Permissões em formato incorreto');
  console.log('4. AuthContext não está carregando as permissões');
} else {
  console.log('\n✅ MENUS DEVERIAM APARECER!');
  console.log('🔍 Se não aparecem, pode ser:');
  console.log('1. Problema de renderização do React');
  console.log('2. CSS ocultando os menus');
  console.log('3. Erro JavaScript no console');
  console.log('4. AuthContext retornando dados diferentes');
}

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('1. Verificar console do navegador (F12)');
console.log('2. Verificar se AuthContext está retornando userProfile correto');
console.log('3. Verificar se hasPermission está funcionando no frontend');
console.log('4. Verificar se o componente Sidebar está sendo renderizado');

console.log('\n🔧 COMANDOS PARA TESTAR NO CONSOLE DO NAVEGADOR:');
console.log('// Verificar AuthContext');
console.log('console.log("AuthContext:", window.React?.useContext?.());');
console.log('');
console.log('// Verificar se Sidebar está montado');
console.log('console.log("Sidebar elements:", document.querySelectorAll("[class*=sidebar]"));');
console.log('');
console.log('// Verificar erros');
console.log('console.log("Errors:", window.errors || "Nenhum erro capturado");'); 