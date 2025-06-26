// Sistema de Permissões Granular - EXPANSÃO COMPLETA
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_ALL_UNITS: 'dashboard.all_units',
  
  // Mensagens WhatsApp
  MESSAGES_ACCESS: 'messages.access',
  MESSAGES_SEND: 'messages.send',
  MESSAGES_HISTORY: 'messages.history',
  MESSAGES_MANAGE_TEMPLATES: 'messages.manage_templates', // ADMIN ONLY
  
  // Contas BTG
  BTG_ACCESS: 'btg.access',
  BTG_CREATE: 'btg.create',
  BTG_EDIT: 'btg.edit',
  BTG_DELETE: 'btg.delete',
  BTG_VIEW_ALL: 'btg.view_all', // Ver contas de outros usuários
  BTG_VIEW_OWN: 'btg.view_own', // Ver apenas próprias contas
  
  // Cobranças/Histórico
  CHARGES_ACCESS: 'charges.access',
  CHARGES_CREATE: 'charges.create',
  CHARGES_EDIT: 'charges.edit',
  CHARGES_DELETE: 'charges.delete', // ADMIN ONLY
  CHARGES_MANAGE_PAYMENTS: 'charges.manage_payments',
  CHARGES_VIEW_DELETED: 'charges.view_deleted',
  
  // Extratos/Lançamentos
  EXTRACTS_ACCESS: 'extracts.access',
  EXTRACTS_CREATE: 'extracts.create',
  EXTRACTS_EDIT: 'extracts.edit',
  EXTRACTS_DELETE: 'extracts.delete',
  EXTRACTS_EXPORT: 'extracts.export',
  EXTRACTS_ALL_UNITS: 'extracts.all_units',
  EXTRACTS_VIEW_ALL: 'extracts.view_all', // Ver lançamentos de todos
  EXTRACTS_VIEW_OWN: 'extracts.view_own', // Ver apenas próprios lançamentos
  
  // Folha de Pagamento (ADMIN ONLY)
  PAYROLL_ACCESS: 'payroll.access',
  PAYROLL_CREATE: 'payroll.create',
  PAYROLL_EDIT: 'payroll.edit',
  PAYROLL_DELETE: 'payroll.delete',
  PAYROLL_EXPORT: 'payroll.export',
  
  // Configurações Sistema
  SETTINGS_ACCESS: 'settings.access',
  SETTINGS_SHEETS: 'settings.sheets', // ADMIN ONLY
  SETTINGS_SYSTEM: 'settings.system', // ADMIN ONLY
  SETTINGS_PROFILE: 'settings.profile', // Próprio perfil
  
  // Gerenciamento de Usuários (ADMIN ONLY)
  USERS_ACCESS: 'users.access',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE_PERMISSIONS: 'users.manage_permissions',
  
  // Gestão de Contas Geral (ADMIN ONLY)
  ACCOUNTS_MANAGEMENT_ACCESS: 'accounts.management.access',
  ACCOUNTS_MANAGEMENT_ALL: 'accounts.management.all',
  
  // Cadastros Rápidos
  QUICK_REGISTRATION_ACCESS: 'quick_registration.access',
  QUICK_REGISTRATION_EMPLOYEES: 'quick_registration.employees',
  QUICK_REGISTRATION_VILA_PROGRESSO: 'quick_registration.vila_progresso'
};

// Grupos de permissões organizados por módulo
export const PERMISSION_GROUPS = {
  dashboard: {
    name: '📊 Dashboard',
    description: 'Visão geral e métricas do sistema',
    adminOnly: false,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.DASHBOARD_ALL_UNITS
    ]
  },
  messages: {
    name: '💬 Mensagens WhatsApp',
    description: 'Envio e histórico de mensagens automáticas',
    adminOnly: false,
    permissions: [
      PERMISSIONS.MESSAGES_ACCESS,
      PERMISSIONS.MESSAGES_SEND,
      PERMISSIONS.MESSAGES_HISTORY,
      PERMISSIONS.MESSAGES_MANAGE_TEMPLATES
    ]
  },
  btg_accounts: {
    name: '🏦 Contas BTG',
    description: 'Cadastro e gestão de contas BTG (Boleto/PIX)',
    adminOnly: false,
    permissions: [
      PERMISSIONS.BTG_ACCESS,
      PERMISSIONS.BTG_CREATE,
      PERMISSIONS.BTG_EDIT,
      PERMISSIONS.BTG_DELETE,
      PERMISSIONS.BTG_VIEW_ALL,
      PERMISSIONS.BTG_VIEW_OWN
    ]
  },
  charges: {
    name: '💰 Histórico de Cobranças',
    description: 'Gestão completa de pagamentos e cobranças',
    adminOnly: false,
    permissions: [
      PERMISSIONS.CHARGES_ACCESS,
      PERMISSIONS.CHARGES_CREATE,
      PERMISSIONS.CHARGES_EDIT,
      PERMISSIONS.CHARGES_DELETE,
      PERMISSIONS.CHARGES_MANAGE_PAYMENTS,
      PERMISSIONS.CHARGES_VIEW_DELETED
    ]
  },
  extracts: {
    name: '📈 Extratos e Lançamentos',
    description: 'Relatórios financeiros e lançamentos contábeis',
    adminOnly: false,
    permissions: [
      PERMISSIONS.EXTRACTS_ACCESS,
      PERMISSIONS.EXTRACTS_CREATE,
      PERMISSIONS.EXTRACTS_EDIT,
      PERMISSIONS.EXTRACTS_DELETE,
      PERMISSIONS.EXTRACTS_EXPORT,
      PERMISSIONS.EXTRACTS_ALL_UNITS,
      PERMISSIONS.EXTRACTS_VIEW_ALL,
      PERMISSIONS.EXTRACTS_VIEW_OWN
    ]
  },
  payroll: {
    name: '💼 Folha de Pagamento',
    description: 'Gestão completa da folha de pagamento',
    adminOnly: true,
    permissions: [
      PERMISSIONS.PAYROLL_ACCESS,
      PERMISSIONS.PAYROLL_CREATE,
      PERMISSIONS.PAYROLL_EDIT,
      PERMISSIONS.PAYROLL_DELETE,
      PERMISSIONS.PAYROLL_EXPORT
    ]
  },
  quick_registration: {
    name: '⚡ Cadastros Rápidos',
    description: 'Cadastros rápidos de funcionários e alunos',
    adminOnly: false,
    permissions: [
      PERMISSIONS.QUICK_REGISTRATION_ACCESS,
      PERMISSIONS.QUICK_REGISTRATION_EMPLOYEES,
      PERMISSIONS.QUICK_REGISTRATION_VILA_PROGRESSO
    ]
  },
  accounts_management: {
    name: '🏛️ Gestão de Contas Geral',
    description: 'Visão administrativa de todas as contas financeiras',
    adminOnly: true,
    permissions: [
      PERMISSIONS.ACCOUNTS_MANAGEMENT_ACCESS,
      PERMISSIONS.ACCOUNTS_MANAGEMENT_ALL
    ]
  },
  settings: {
    name: '⚙️ Configurações',
    description: 'Configurações do sistema e integrações',
    adminOnly: false,
    permissions: [
      PERMISSIONS.SETTINGS_ACCESS,
      PERMISSIONS.SETTINGS_SHEETS,
      PERMISSIONS.SETTINGS_SYSTEM,
      PERMISSIONS.SETTINGS_PROFILE
    ]
  },
  users: {
    name: '👥 Gerenciar Usuários',
    description: 'Criação e gestão de usuários do sistema',
    adminOnly: true,
    permissions: [
      PERMISSIONS.USERS_ACCESS,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_EDIT,
      PERMISSIONS.USERS_DELETE,
      PERMISSIONS.USERS_MANAGE_PERMISSIONS
    ]
  }
};

// Perfis padrão com permissões baseados nos requisitos
export const DEFAULT_PROFILES = {
  admin: {
    name: 'Administrador',
    permissions: Object.values(PERMISSIONS) // Todas as permissões
  },
  
  // NOVO PERFIL TESTE - Para as meninas (versão de teste)
  teste: {
    name: 'Usuário Teste',
    description: 'Perfil para versão de teste - acesso limitado conforme solicitado',
    permissions: [
      // Dashboard básico
      PERMISSIONS.DASHBOARD_VIEW,
      
      // Mensagens (enviar mensagem e histórico)
      PERMISSIONS.MESSAGES_ACCESS,
      PERMISSIONS.MESSAGES_SEND,
      PERMISSIONS.MESSAGES_HISTORY,
      
      // Contas BTG (apenas cadastrar e gestão das próprias contas)
      PERMISSIONS.BTG_ACCESS,
      PERMISSIONS.BTG_CREATE,
      PERMISSIONS.BTG_VIEW_OWN, // Apenas contas registradas por ela
      
      // Cobranças (apenas registrar e histórico dos próprios registros)
      PERMISSIONS.CHARGES_ACCESS,
      PERMISSIONS.CHARGES_CREATE,
      PERMISSIONS.CHARGES_VIEW_OWN, // Apenas cobranças registradas por ela
      
      // Extratos (apenas visualizar)
      PERMISSIONS.EXTRACTS_ACCESS,
      PERMISSIONS.EXTRACTS_VIEW_OWN, // Apenas próprios lançamentos
      
      // Configurações básicas (apenas perfil próprio)
      PERMISSIONS.SETTINGS_ACCESS,
      PERMISSIONS.SETTINGS_PROFILE
    ]
  },
  
  manager: {
    name: 'Gerente',
    permissions: [
      // Dashboard completo
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.DASHBOARD_ALL_UNITS,
      
      // Mensagens (sem gerenciar templates)
      PERMISSIONS.MESSAGES_ACCESS,
      PERMISSIONS.MESSAGES_SEND,
      PERMISSIONS.MESSAGES_HISTORY,
      
      // Contas BTG (ver todas)
      PERMISSIONS.BTG_ACCESS,
      PERMISSIONS.BTG_CREATE,
      PERMISSIONS.BTG_EDIT,
      PERMISSIONS.BTG_VIEW_ALL,
      
      // Cobranças (sem excluir)
      PERMISSIONS.CHARGES_ACCESS,
      PERMISSIONS.CHARGES_CREATE,
      PERMISSIONS.CHARGES_EDIT,
      PERMISSIONS.CHARGES_MANAGE_PAYMENTS,
      
      // Extratos (ver todos)
      PERMISSIONS.EXTRACTS_ACCESS,
      PERMISSIONS.EXTRACTS_CREATE,
      PERMISSIONS.EXTRACTS_EDIT,
      PERMISSIONS.EXTRACTS_EXPORT,
      PERMISSIONS.EXTRACTS_ALL_UNITS,
      PERMISSIONS.EXTRACTS_VIEW_ALL,
      
      // Cadastros rápidos
      PERMISSIONS.QUICK_REGISTRATION_ACCESS,
      PERMISSIONS.QUICK_REGISTRATION_EMPLOYEES,
      PERMISSIONS.QUICK_REGISTRATION_VILA_PROGRESSO,
      
      // Configurações básicas
      PERMISSIONS.SETTINGS_ACCESS,
      PERMISSIONS.SETTINGS_PROFILE
    ]
  },
  
  operator: {
    name: 'Operador',
    permissions: [
      // Dashboard básico
      PERMISSIONS.DASHBOARD_VIEW,
      
      // Mensagens básicas
      PERMISSIONS.MESSAGES_ACCESS,
      PERMISSIONS.MESSAGES_SEND,
      PERMISSIONS.MESSAGES_HISTORY,
      
      // Contas BTG (apenas próprias)
      PERMISSIONS.BTG_ACCESS,
      PERMISSIONS.BTG_CREATE,
      PERMISSIONS.BTG_VIEW_OWN,
      
      // Cobranças (apenas próprias)
      PERMISSIONS.CHARGES_ACCESS,
      PERMISSIONS.CHARGES_CREATE,
      PERMISSIONS.CHARGES_VIEW_OWN,
      
      // Extratos (apenas próprios)
      PERMISSIONS.EXTRACTS_ACCESS,
      PERMISSIONS.EXTRACTS_VIEW_OWN,
      
      // Configurações básicas
      PERMISSIONS.SETTINGS_ACCESS,
      PERMISSIONS.SETTINGS_PROFILE
    ]
  },
  
  viewer: {
    name: 'Visualizador',
    permissions: [
      // Apenas visualização
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.MESSAGES_HISTORY,
      PERMISSIONS.BTG_VIEW_OWN,
      PERMISSIONS.CHARGES_VIEW_OWN,
      PERMISSIONS.EXTRACTS_VIEW_OWN,
      PERMISSIONS.SETTINGS_PROFILE
    ]
  }
};

// Descrições detalhadas de cada permissão
export const PERMISSION_DESCRIPTIONS = {
  // Dashboard
  [PERMISSIONS.DASHBOARD_VIEW]: 'Visualizar dashboard básico',
  [PERMISSIONS.DASHBOARD_ALL_UNITS]: 'Ver dados de todas as unidades (não apenas as próprias)',
  
  // Mensagens WhatsApp
  [PERMISSIONS.MESSAGES_ACCESS]: 'Acessar módulo de mensagens',
  [PERMISSIONS.MESSAGES_SEND]: 'Enviar mensagens WhatsApp',
  [PERMISSIONS.MESSAGES_HISTORY]: 'Ver histórico de mensagens enviadas',
  [PERMISSIONS.MESSAGES_MANAGE_TEMPLATES]: '🔒 ADMIN: Gerenciar modelos de mensagem',
  
  // Contas BTG
  [PERMISSIONS.BTG_ACCESS]: 'Acessar módulo de contas BTG',
  [PERMISSIONS.BTG_CREATE]: 'Cadastrar novas contas BTG',
  [PERMISSIONS.BTG_EDIT]: 'Editar contas BTG existentes',
  [PERMISSIONS.BTG_DELETE]: 'Excluir contas BTG',
  [PERMISSIONS.BTG_VIEW_ALL]: 'Ver contas BTG de todos os usuários',
  [PERMISSIONS.BTG_VIEW_OWN]: 'Ver apenas as próprias contas BTG cadastradas',
  
  // Cobranças
  [PERMISSIONS.CHARGES_ACCESS]: 'Acessar histórico de cobranças',
  [PERMISSIONS.CHARGES_CREATE]: 'Gerar novas cobranças',
  [PERMISSIONS.CHARGES_EDIT]: 'Editar cobranças existentes',
  [PERMISSIONS.CHARGES_DELETE]: '🔒 ADMIN: Excluir/cancelar cobranças',
  [PERMISSIONS.CHARGES_MANAGE_PAYMENTS]: 'Gerenciar status de pagamentos',
  [PERMISSIONS.CHARGES_VIEW_DELETED]: 'Visualizar cobranças excluídas',
  
  // Extratos
  [PERMISSIONS.EXTRACTS_ACCESS]: 'Acessar módulo de extratos',
  [PERMISSIONS.EXTRACTS_CREATE]: 'Criar novos lançamentos',
  [PERMISSIONS.EXTRACTS_EDIT]: 'Editar lançamentos existentes',
  [PERMISSIONS.EXTRACTS_DELETE]: 'Excluir lançamentos',
  [PERMISSIONS.EXTRACTS_EXPORT]: 'Exportar relatórios financeiros',
  [PERMISSIONS.EXTRACTS_ALL_UNITS]: 'Ver extratos de todas as unidades',
  [PERMISSIONS.EXTRACTS_VIEW_ALL]: 'Ver lançamentos de todos os usuários',
  [PERMISSIONS.EXTRACTS_VIEW_OWN]: 'Ver apenas os próprios lançamentos criados',
  
  // Folha de Pagamento
  [PERMISSIONS.PAYROLL_ACCESS]: '🔒 ADMIN: Acessar folha de pagamento',
  [PERMISSIONS.PAYROLL_CREATE]: '🔒 ADMIN: Criar folhas de pagamento',
  [PERMISSIONS.PAYROLL_EDIT]: '🔒 ADMIN: Editar folhas de pagamento',
  [PERMISSIONS.PAYROLL_DELETE]: '🔒 ADMIN: Excluir folhas de pagamento',
  [PERMISSIONS.PAYROLL_EXPORT]: '🔒 ADMIN: Exportar relatórios de folha',
  
  // Cadastros Rápidos
  [PERMISSIONS.QUICK_REGISTRATION_ACCESS]: 'Acessar cadastros rápidos',
  [PERMISSIONS.QUICK_REGISTRATION_EMPLOYEES]: 'Cadastro rápido de funcionários',
  [PERMISSIONS.QUICK_REGISTRATION_VILA_PROGRESSO]: 'Cadastro rápido Vila Progresso',
  
  // Gestão de Contas
  [PERMISSIONS.ACCOUNTS_MANAGEMENT_ACCESS]: '🔒 ADMIN: Acessar gestão de contas geral',
  [PERMISSIONS.ACCOUNTS_MANAGEMENT_ALL]: '🔒 ADMIN: Ver todos os lançamentos financeiros',
  
  // Configurações
  [PERMISSIONS.SETTINGS_ACCESS]: 'Acessar configurações básicas',
  [PERMISSIONS.SETTINGS_SHEETS]: '🔒 ADMIN: Configurar integração Google Sheets',
  [PERMISSIONS.SETTINGS_SYSTEM]: '🔒 ADMIN: Configurações avançadas do sistema',
  [PERMISSIONS.SETTINGS_PROFILE]: 'Editar próprio perfil',
  
  // Usuários
  [PERMISSIONS.USERS_ACCESS]: '🔒 ADMIN: Acessar gerenciamento de usuários',
  [PERMISSIONS.USERS_CREATE]: '🔒 ADMIN: Criar novos usuários',
  [PERMISSIONS.USERS_EDIT]: '🔒 ADMIN: Editar usuários existentes',
  [PERMISSIONS.USERS_DELETE]: '🔒 ADMIN: Excluir usuários',
  [PERMISSIONS.USERS_MANAGE_PERMISSIONS]: '🔒 ADMIN: Gerenciar permissões de usuários'
};

// Função para verificar se o usuário tem uma permissão específica
export const hasPermission = (userPermissions, permission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return userPermissions.includes(permission);
};

// Função para verificar se o usuário tem todas as permissões de um grupo
export const hasAllPermissions = (userPermissions, permissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return permissions.every(permission => userPermissions.includes(permission));
};

// Função para verificar se o usuário tem pelo menos uma permissão de um grupo
export const hasAnyPermission = (userPermissions, permissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return permissions.some(permission => userPermissions.includes(permission));
};

// Função para obter permissões por perfil
export const getPermissionsByProfile = (profile) => {
  return DEFAULT_PROFILES[profile]?.permissions || [];
};

// Função para verificar acesso a menu baseado nas novas permissões
export const canAccessMenu = (userPermissions, menuKey) => {
  const menuPermissions = {
    dashboard: [PERMISSIONS.DASHBOARD_VIEW],
    messages: [PERMISSIONS.MESSAGES_ACCESS],
    btg_accounts: [PERMISSIONS.BTG_ACCESS],
    charges: [PERMISSIONS.CHARGES_ACCESS],
    extracts: [PERMISSIONS.EXTRACTS_ACCESS],
    payroll: [PERMISSIONS.PAYROLL_ACCESS],
    quick_registration: [PERMISSIONS.QUICK_REGISTRATION_ACCESS],
    accounts_management: [PERMISSIONS.ACCOUNTS_MANAGEMENT_ACCESS],
    settings: [PERMISSIONS.SETTINGS_ACCESS],
    users: [PERMISSIONS.USERS_ACCESS]
  };
  
  const requiredPermissions = menuPermissions[menuKey];
  if (!requiredPermissions) return true;
  
  return hasAnyPermission(userPermissions, requiredPermissions);
}; 