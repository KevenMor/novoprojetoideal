// Sistema de Permissões Granular
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'visualizar_dashboard',
  DASHBOARD_ALL_UNITS: 'dashboard.all_units',
  
  // Mensagens
  MESSAGES_VIEW: 'enviar_mensagens',
  MESSAGES_SEND: 'messages.send',
  MESSAGES_HISTORY: 'messages.history',
  
  // Contas BTG
  BTG_ACCOUNTS_VIEW: 'cadastrar_contas_btg',
  BTG_ACCOUNTS_CREATE: 'btg_accounts.create',
  BTG_ACCOUNTS_EDIT: 'btg_accounts.edit',
  BTG_ACCOUNTS_DELETE: 'btg_accounts.delete',
  
  // Cobranças
  CHARGES_VIEW: 'registrar_cobrancas',
  CHARGES_CREATE: 'charges.create',
  CHARGES_EDIT: 'charges.edit',
  CHARGES_DELETE: 'charges.delete',
  
  // Extratos
  EXTRACTS_VIEW: 'visualizar_extratos',
  EXTRACTS_EXPORT: 'extracts.export',
  EXTRACTS_ALL_UNITS: 'extracts.all_units',
  
  // Configurações
  SETTINGS_VIEW: 'configurar_sistema',
  SETTINGS_SHEETS: 'settings.sheets',
  SETTINGS_SYSTEM: 'settings.system',
  
  // Usuários (Admin)
  USERS_VIEW: 'gerenciar_usuarios',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_PERMISSIONS: 'users.permissions'
};

// Grupos de permissões por funcionalidade
export const PERMISSION_GROUPS = {
  dashboard: {
    name: 'Dashboard',
    description: 'Visão geral do sistema',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.DASHBOARD_ALL_UNITS
    ]
  },
  messages: {
    name: 'Mensagens',
    description: 'WhatsApp automático',
    permissions: [
      PERMISSIONS.MESSAGES_VIEW,
      PERMISSIONS.MESSAGES_SEND,
      PERMISSIONS.MESSAGES_HISTORY
    ]
  },
  btg_accounts: {
    name: 'Contas BTG',
    description: 'Boleto e PIX',
    permissions: [
      PERMISSIONS.BTG_ACCOUNTS_VIEW,
      PERMISSIONS.BTG_ACCOUNTS_CREATE,
      PERMISSIONS.BTG_ACCOUNTS_EDIT,
      PERMISSIONS.BTG_ACCOUNTS_DELETE
    ]
  },
  charges: {
    name: 'Cobranças',
    description: 'Gestão de pagamentos',
    permissions: [
      PERMISSIONS.CHARGES_VIEW,
      PERMISSIONS.CHARGES_CREATE,
      PERMISSIONS.CHARGES_EDIT,
      PERMISSIONS.CHARGES_DELETE
    ]
  },
  extracts: {
    name: 'Extratos',
    description: 'Relatórios financeiros',
    permissions: [
      PERMISSIONS.EXTRACTS_VIEW,
      PERMISSIONS.EXTRACTS_EXPORT,
      PERMISSIONS.EXTRACTS_ALL_UNITS
    ]
  },
  settings: {
    name: 'Configurações',
    description: 'Configurações do sistema',
    permissions: [
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_SHEETS,
      PERMISSIONS.SETTINGS_SYSTEM
    ]
  },
  users: {
    name: 'Usuários',
    description: 'Gerenciamento de usuários',
    permissions: [
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_EDIT,
      PERMISSIONS.USERS_DELETE,
      PERMISSIONS.USERS_PERMISSIONS
    ]
  }
};

// Perfis padrão com permissões
export const DEFAULT_PROFILES = {
  admin: {
    name: 'Administrador',
    permissions: Object.values(PERMISSIONS) // Todas as permissões
  },
  manager: {
    name: 'Gerente',
    permissions: [
      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.DASHBOARD_ALL_UNITS,
      
      // Mensagens
      PERMISSIONS.MESSAGES_VIEW,
      PERMISSIONS.MESSAGES_SEND,
      PERMISSIONS.MESSAGES_HISTORY,
      
      // Contas BTG
      PERMISSIONS.BTG_ACCOUNTS_VIEW,
      PERMISSIONS.BTG_ACCOUNTS_CREATE,
      PERMISSIONS.BTG_ACCOUNTS_EDIT,
      
      // Cobranças
      PERMISSIONS.CHARGES_VIEW,
      PERMISSIONS.CHARGES_CREATE,
      PERMISSIONS.CHARGES_EDIT,
      
      // Extratos
      PERMISSIONS.EXTRACTS_VIEW,
      PERMISSIONS.EXTRACTS_EXPORT,
      PERMISSIONS.EXTRACTS_ALL_UNITS,
      
      // Configurações básicas
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_SHEETS
    ]
  },
  operator: {
    name: 'Operador',
    permissions: [
      // Dashboard básico
      PERMISSIONS.DASHBOARD_VIEW,
      
      // Mensagens
      PERMISSIONS.MESSAGES_VIEW,
      PERMISSIONS.MESSAGES_SEND,
      
      // Contas BTG
      PERMISSIONS.BTG_ACCOUNTS_VIEW,
      PERMISSIONS.BTG_ACCOUNTS_CREATE,
      
      // Cobranças
      PERMISSIONS.CHARGES_VIEW,
      PERMISSIONS.CHARGES_CREATE,
      
      // Extratos básicos
      PERMISSIONS.EXTRACTS_VIEW
    ]
  },
  viewer: {
    name: 'Visualizador',
    permissions: [
      // Apenas visualização
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.MESSAGES_VIEW,
      PERMISSIONS.BTG_ACCOUNTS_VIEW,
      PERMISSIONS.CHARGES_VIEW,
      PERMISSIONS.EXTRACTS_VIEW
    ]
  }
};

// Descrições das permissões
export const PERMISSION_DESCRIPTIONS = {
  [PERMISSIONS.DASHBOARD_VIEW]: 'Visualizar dashboard',
  [PERMISSIONS.DASHBOARD_ALL_UNITS]: 'Ver dados de todas as unidades',
  
  [PERMISSIONS.MESSAGES_VIEW]: 'Visualizar mensagens',
  [PERMISSIONS.MESSAGES_SEND]: 'Enviar mensagens',
  [PERMISSIONS.MESSAGES_HISTORY]: 'Ver histórico completo',
  
  [PERMISSIONS.BTG_ACCOUNTS_VIEW]: 'Visualizar contas BTG',
  [PERMISSIONS.BTG_ACCOUNTS_CREATE]: 'Criar contas BTG',
  [PERMISSIONS.BTG_ACCOUNTS_EDIT]: 'Editar contas BTG',
  [PERMISSIONS.BTG_ACCOUNTS_DELETE]: 'Excluir contas BTG',
  
  [PERMISSIONS.CHARGES_VIEW]: 'Visualizar cobranças',
  [PERMISSIONS.CHARGES_CREATE]: 'Criar cobranças',
  [PERMISSIONS.CHARGES_EDIT]: 'Editar cobranças',
  [PERMISSIONS.CHARGES_DELETE]: 'Excluir cobranças',
  
  [PERMISSIONS.EXTRACTS_VIEW]: 'Visualizar extratos',
  [PERMISSIONS.EXTRACTS_EXPORT]: 'Exportar extratos',
  [PERMISSIONS.EXTRACTS_ALL_UNITS]: 'Ver extratos de todas as unidades',
  
  [PERMISSIONS.SETTINGS_VIEW]: 'Acessar configurações',
  [PERMISSIONS.SETTINGS_SHEETS]: 'Configurar Google Sheets',
  [PERMISSIONS.SETTINGS_SYSTEM]: 'Configurações do sistema',
  
  [PERMISSIONS.USERS_VIEW]: 'Visualizar usuários',
  [PERMISSIONS.USERS_CREATE]: 'Criar usuários',
  [PERMISSIONS.USERS_EDIT]: 'Editar usuários',
  [PERMISSIONS.USERS_DELETE]: 'Excluir usuários',
  [PERMISSIONS.USERS_PERMISSIONS]: 'Gerenciar permissões'
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

// Função para verificar acesso a menu
export const canAccessMenu = (userPermissions, menuKey) => {
  const menuPermissions = {
    dashboard: [PERMISSIONS.DASHBOARD_VIEW],
    messages: [PERMISSIONS.MESSAGES_VIEW],
    btg_accounts: [PERMISSIONS.BTG_ACCOUNTS_VIEW],
    charges: [PERMISSIONS.CHARGES_VIEW],
    extracts: [PERMISSIONS.EXTRACTS_VIEW],
    settings: [PERMISSIONS.SETTINGS_VIEW],
    users: [PERMISSIONS.USERS_VIEW]
  };
  
  const requiredPermissions = menuPermissions[menuKey];
  if (!requiredPermissions) return true;
  
  return hasAnyPermission(userPermissions, requiredPermissions);
}; 