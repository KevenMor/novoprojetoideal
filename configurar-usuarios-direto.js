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

// Permissões do sistema
const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_ALL_UNITS: 'dashboard.all_units',
  
  // Mensagens WhatsApp
  MESSAGES_ACCESS: 'messages.access',
  MESSAGES_SEND: 'messages.send',
  MESSAGES_HISTORY: 'messages.history',
  MESSAGES_MANAGE_TEMPLATES: 'messages.manage_templates',
  
  // Contas BTG
  BTG_ACCESS: 'btg.access',
  BTG_CREATE: 'btg.create',
  BTG_EDIT: 'btg.edit',
  BTG_DELETE: 'btg.delete',
  BTG_VIEW_ALL: 'btg.view_all',
  BTG_VIEW_OWN: 'btg.view_own',
  
  // Cobranças/Histórico
  CHARGES_ACCESS: 'charges.access',
  CHARGES_CREATE: 'charges.create',
  CHARGES_EDIT: 'charges.edit',
  CHARGES_DELETE: 'charges.delete',
  CHARGES_MANAGE_PAYMENTS: 'charges.manage_payments',
  CHARGES_VIEW_DELETED: 'charges.view_deleted',
  
  // Extratos/Lançamentos
  EXTRACTS_ACCESS: 'extracts.access',
  EXTRACTS_CREATE: 'extracts.create',
  EXTRACTS_EDIT: 'extracts.edit',
  EXTRACTS_DELETE: 'extracts.delete',
  EXTRACTS_EXPORT: 'extracts.export',
  EXTRACTS_ALL_UNITS: 'extracts.all_units',
  EXTRACTS_VIEW_ALL: 'extracts.view_all',
  EXTRACTS_VIEW_OWN: 'extracts.view_own',
  
  // Folha de Pagamento (ADMIN ONLY)
  PAYROLL_ACCESS: 'payroll.access',
  PAYROLL_CREATE: 'payroll.create',
  PAYROLL_EDIT: 'payroll.edit',
  PAYROLL_DELETE: 'payroll.delete',
  PAYROLL_EXPORT: 'payroll.export',
  
  // Configurações Sistema
  SETTINGS_ACCESS: 'settings.access',
  SETTINGS_SHEETS: 'settings.sheets',
  SETTINGS_SYSTEM: 'settings.system',
  SETTINGS_PROFILE: 'settings.profile',
  
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

// Unidades do sistema
const unidades = [
  'Julio de Mesquita',
  'Aparecidinha', 
  'Coop',
  'Progresso',
  'Vila Haro',
  'Vila Helena'
];

// PERFIS CONFIGURADOS PARA A VERSÃO DE TESTE
const PERFIS_TESTE = {
  // ADMIN - Acesso total
  admin: {
    name: 'Administrador',
    description: 'Acesso completo ao sistema',
    permissions: Object.values(PERMISSIONS),
    adminOnly: true
  },
  
  // PERFIL TESTE - Para as meninas (versão de teste)
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
    ],
    adminOnly: false
  },
  
  // PERFIL OPERADOR - Acesso intermediário
  operator: {
    name: 'Operador',
    description: 'Acesso operacional básico',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.MESSAGES_ACCESS,
      PERMISSIONS.MESSAGES_SEND,
      PERMISSIONS.MESSAGES_HISTORY,
      PERMISSIONS.BTG_ACCESS,
      PERMISSIONS.BTG_CREATE,
      PERMISSIONS.BTG_VIEW_OWN,
      PERMISSIONS.CHARGES_ACCESS,
      PERMISSIONS.CHARGES_CREATE,
      PERMISSIONS.CHARGES_VIEW_OWN,
      PERMISSIONS.EXTRACTS_ACCESS,
      PERMISSIONS.EXTRACTS_VIEW_OWN,
      PERMISSIONS.SETTINGS_ACCESS,
      PERMISSIONS.SETTINGS_PROFILE
    ],
    adminOnly: false
  },
  
  // PERFIL VISUALIZADOR - Apenas visualização
  viewer: {
    name: 'Visualizador',
    description: 'Apenas visualização de dados',
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.MESSAGES_HISTORY,
      PERMISSIONS.BTG_VIEW_OWN,
      PERMISSIONS.CHARGES_VIEW_OWN,
      PERMISSIONS.EXTRACTS_VIEW_OWN,
      PERMISSIONS.SETTINGS_PROFILE
    ],
    adminOnly: false
  }
};

// Função para criar/atualizar usuários com perfis específicos
async function configurarUsuariosTeste() {
  try {
    console.log('🚀 CONFIGURANDO PERFIS PARA VERSÃO DE TESTE');
    console.log('==========================================');
    console.log('⚠️  Usando regras temporárias (acesso total)');
    
    // Lista de usuários para configurar
    const usuariosParaConfigurar = [
      {
        email: 'teste1@autoescolaideal.com',
        nome: 'Usuária Teste 1',
        perfil: 'teste',
        unidades: ['Julio de Mesquita', 'Vila Haro'],
        senha: '123456'
      },
      {
        email: 'teste2@autoescolaideal.com',
        nome: 'Usuária Teste 2',
        perfil: 'teste',
        unidades: ['Aparecidinha', 'Coop'],
        senha: '123456'
      },
      {
        email: 'operador@autoescolaideal.com',
        nome: 'Operador Sistema',
        perfil: 'operator',
        unidades: unidades,
        senha: '123456'
      },
      {
        email: 'visualizador@autoescolaideal.com',
        nome: 'Visualizador Sistema',
        perfil: 'viewer',
        unidades: ['Julio de Mesquita'],
        senha: '123456'
      }
    ];
    
    console.log('\n📋 USUÁRIOS A SEREM CONFIGURADOS:');
    usuariosParaConfigurar.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nome} (${user.email})`);
      console.log(`   Perfil: ${user.perfil}`);
      console.log(`   Unidades: ${user.unidades.join(', ')}`);
    });
    
    // Verificar usuários existentes
    console.log('\n🔍 VERIFICANDO USUÁRIOS EXISTENTES...');
    const usuariosRef = collection(db, 'usuarios');
    const usuariosSnapshot = await getDocs(usuariosRef);
    const usuariosExistentes = usuariosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 Encontrados ${usuariosExistentes.length} usuários no sistema`);
    
    // Processar cada usuário
    for (const userConfig of usuariosParaConfigurar) {
      console.log(`\n👤 PROCESSANDO: ${userConfig.nome}`);
      
      // Verificar se usuário já existe
      const usuarioExistente = usuariosExistentes.find(u => u.email === userConfig.email);
      
      if (usuarioExistente) {
        console.log(`   ✅ Usuário já existe (ID: ${usuarioExistente.id})`);
        console.log(`   🔄 Atualizando perfil para: ${userConfig.perfil}`);
        
        // Atualizar perfil e permissões
        const perfilConfig = PERFIS_TESTE[userConfig.perfil];
        const dadosAtualizados = {
          ...usuarioExistente,
          perfil: userConfig.perfil,
          permissions: perfilConfig.permissions,
          unidades: userConfig.unidades,
          atualizadoEm: new Date(),
          versaoTeste: true
        };
        
        await updateDoc(doc(db, 'usuarios', usuarioExistente.id), dadosAtualizados);
        console.log(`   ✅ Perfil atualizado com ${perfilConfig.permissions.length} permissões`);
        
      } else {
        console.log(`   ➕ Criando novo usuário...`);
        
        // Criar novo usuário
        const perfilConfig = PERFIS_TESTE[userConfig.perfil];
        const novoUsuario = {
          uid: `teste_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: userConfig.email,
          nome: userConfig.nome,
          perfil: userConfig.perfil,
          permissions: perfilConfig.permissions,
          unidades: userConfig.unidades,
          ativo: true,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
          versaoTeste: true,
          isAdmin: userConfig.perfil === 'admin'
        };
        
        await setDoc(doc(db, 'usuarios', novoUsuario.uid), novoUsuario);
        console.log(`   ✅ Usuário criado com ${perfilConfig.permissions.length} permissões`);
      }
    }
    
    // Mostrar resumo dos perfis
    console.log('\n📊 RESUMO DOS PERFIS CONFIGURADOS:');
    console.log('====================================');
    
    Object.entries(PERFIS_TESTE).forEach(([key, perfil]) => {
      console.log(`\n🎭 ${perfil.name.toUpperCase()}:`);
      console.log(`   Descrição: ${perfil.description}`);
      console.log(`   Permissões: ${perfil.permissions.length}`);
      console.log(`   Admin Only: ${perfil.adminOnly ? 'SIM' : 'NÃO'}`);
      
      // Agrupar permissões por categoria
      const categorias = {
        'Dashboard': perfil.permissions.filter(p => p.startsWith('dashboard')),
        'Mensagens': perfil.permissions.filter(p => p.startsWith('messages')),
        'Contas BTG': perfil.permissions.filter(p => p.startsWith('btg')),
        'Cobranças': perfil.permissions.filter(p => p.startsWith('charges')),
        'Extratos': perfil.permissions.filter(p => p.startsWith('extracts')),
        'Configurações': perfil.permissions.filter(p => p.startsWith('settings')),
        'Usuários': perfil.permissions.filter(p => p.startsWith('users')),
        'Outros': perfil.permissions.filter(p => 
          !p.startsWith('dashboard') && 
          !p.startsWith('messages') && 
          !p.startsWith('btg') && 
          !p.startsWith('charges') && 
          !p.startsWith('extracts') && 
          !p.startsWith('settings') && 
          !p.startsWith('users')
        )
      };
      
      Object.entries(categorias).forEach(([categoria, perms]) => {
        if (perms.length > 0) {
          console.log(`   ${categoria}: ${perms.length} permissões`);
        }
      });
    });
    
    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA!');
    console.log('==========================');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Testar login com os usuários criados');
    console.log('2. Verificar se os menus aparecem corretamente');
    console.log('3. Testar funcionalidades específicas de cada perfil');
    console.log('4. Ajustar permissões se necessário');
    
    console.log('\n🔑 CREDENCIAIS DE TESTE:');
    usuariosParaConfigurar.forEach(user => {
      console.log(`   ${user.email} / ${user.senha}`);
    });
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('- As regras temporárias estão ativas (acesso total)');
    console.log('- Após testar, restaure as regras seguras');
    console.log('- Execute: firebase deploy --only firestore:rules');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error);
    return false;
  }
}

// Função para verificar configuração atual
async function verificarConfiguracaoAtual() {
  try {
    console.log('🔍 VERIFICANDO CONFIGURAÇÃO ATUAL');
    console.log('==================================');
    
    const usuariosRef = collection(db, 'usuarios');
    const usuariosSnapshot = await getDocs(usuariosRef);
    const usuarios = usuariosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 Total de usuários: ${usuarios.length}`);
    
    // Agrupar por perfil
    const porPerfil = {};
    usuarios.forEach(user => {
      const perfil = user.perfil || 'sem_perfil';
      if (!porPerfil[perfil]) porPerfil[perfil] = [];
      porPerfil[perfil].push(user);
    });
    
    Object.entries(porPerfil).forEach(([perfil, users]) => {
      console.log(`\n👥 ${perfil.toUpperCase()}: ${users.length} usuários`);
      users.forEach(user => {
        console.log(`   - ${user.nome} (${user.email})`);
        console.log(`     Permissões: ${user.permissions?.length || 0}`);
        console.log(`     Unidades: ${user.unidades?.join(', ') || 'Nenhuma'}`);
      });
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return false;
  }
}

// Executar configuração
async function main() {
  console.log('🎯 SISTEMA DE PERMISSÕES - VERSÃO DE TESTE');
  console.log('==========================================');
  
  // Verificar configuração atual
  await verificarConfiguracaoAtual();
  
  console.log('\n' + '='.repeat(50));
  
  // Configurar usuários
  const sucesso = await configurarUsuariosTeste();
  
  if (sucesso) {
    console.log('\n✅ CONFIGURAÇÃO REALIZADA COM SUCESSO!');
  } else {
    console.log('\n❌ ERRO NA CONFIGURAÇÃO');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  configurarUsuariosTeste,
  verificarConfiguracaoAtual,
  PERFIS_TESTE
}; 