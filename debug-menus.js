const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Configuração do Firebase
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
const auth = getAuth(app);
const db = getFirestore(app);

// Permissões do sistema (mesmo que no frontend)
const PERMISSIONS = {
  DASHBOARD_VIEW: 'visualizar_dashboard',
  MESSAGES_VIEW: 'enviar_mensagens',
  BTG_ACCOUNTS_VIEW: 'cadastrar_contas_btg',
  CHARGES_VIEW: 'registrar_cobrancas',
  EXTRACTS_VIEW: 'visualizar_extratos',
  SETTINGS_VIEW: 'configurar_sistema',
  USERS_VIEW: 'gerenciar_usuarios'
};

// Função para verificar permissões (igual ao frontend)
function hasPermission(userPermissions, requiredPermission) {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return userPermissions.includes(requiredPermission);
}

// Função para obter permissões por perfil (igual ao frontend)
function getPermissionsByProfile(profile) {
  const profiles = {
    admin: [
      'gerenciar_usuarios', 'enviar_mensagens', 'cadastrar_contas_btg',
      'registrar_cobrancas', 'visualizar_extratos', 'configurar_sistema',
      'visualizar_relatorios', 'gerenciar_permissoes', 'visualizar_logs',
      'exportar_dados', 'importar_dados', 'backup_sistema',
      'gerenciar_unidades', 'configurar_integracao', 'visualizar_dashboard',
      'gerenciar_notificacoes', 'configurar_alertas', 'visualizar_metricas',
      'gerenciar_templates', 'configurar_webhooks', 'visualizar_auditoria',
      'gerenciar_categorias', 'configurar_automacao', 'visualizar_estatisticas',
      'gerenciar_tags', 'configurar_backup'
    ],
    manager: ['visualizar_dashboard', 'enviar_mensagens', 'visualizar_extratos', 'registrar_cobrancas'],
    operator: ['visualizar_dashboard', 'enviar_mensagens'],
    viewer: ['visualizar_dashboard']
  };
  
  return profiles[profile] || [];
}

async function debugMenus() {
  try {
    console.log('🔍 DEBUG: PROBLEMA DOS MENUS DESAPARECIDOS');
    console.log('==========================================');
    
    // 1. Fazer login
    console.log('🔐 Fazendo login com admin@autoescolaideal.com...');
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@autoescolaideal.com', 'admin123');
    console.log(`✅ Login bem-sucedido! UID: ${userCredential.user.uid}`);
    
    // 2. Buscar dados do usuário no Firestore
    console.log('\n📊 Buscando dados no Firestore...');
    const userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      console.log('❌ PROBLEMA CRÍTICO: Documento do usuário não existe no Firestore!');
      console.log('🔧 SOLUÇÃO: O UID do Authentication não tem documento correspondente');
      return;
    }
    
    const userData = userDoc.data();
    console.log('✅ Dados do usuário encontrados:');
    console.log(`   👤 Nome: ${userData.nome}`);
    console.log(`   🏷️ Perfil: ${userData.perfil}`);
    console.log(`   ✅ Ativo: ${userData.ativo}`);
    console.log(`   🏢 Unidades: ${userData.unidades?.length || 0}`);
    console.log(`   🔐 Permissões: ${userData.permissoes?.length || userData.permissions?.length || 0}`);
    
    // 3. Processar permissões (simular o que o AuthContext faz)
    console.log('\n🔧 Simulando processamento do AuthContext...');
    
    const userWithPermissions = {
      ...userData,
      permissions: userData.permissions || userData.permissoes || getPermissionsByProfile(userData.perfil)
    };
    
    console.log(`✅ Permissões processadas: ${userWithPermissions.permissions?.length || 0}`);
    console.log('📋 Lista de permissões:');
    userWithPermissions.permissions?.forEach((perm, index) => {
      console.log(`   ${index + 1}. ${perm}`);
    });
    
    // 4. Testar cada menu item (simular o que o Sidebar faz)
    console.log('\n🍽️ TESTANDO MENUS (simulando Sidebar.js)...');
    
    const menuItems = [
      {
        name: 'Dashboard',
        permission: PERMISSIONS.DASHBOARD_VIEW,
        description: 'Visão geral do sistema'
      },
      {
        name: 'Enviar Mensagem',
        permission: PERMISSIONS.MESSAGES_VIEW,
        description: 'WhatsApp automático'
      },
      {
        name: 'Cadastrar Contas BTG',
        permission: PERMISSIONS.BTG_ACCOUNTS_VIEW,
        description: 'Boleto e PIX'
      },
      {
        name: 'Registrar Cobranças',
        permission: PERMISSIONS.CHARGES_VIEW,
        description: 'Gestão de pagamentos'
      },
      {
        name: 'Extratos',
        permission: PERMISSIONS.EXTRACTS_VIEW,
        description: 'Relatórios financeiros'
      },
      {
        name: 'Configuração Sheets',
        permission: PERMISSIONS.SETTINGS_VIEW,
        description: 'Configurar Google Sheets'
      },
      {
        name: 'Gerenciar Usuários',
        permission: PERMISSIONS.USERS_VIEW,
        description: 'Controle de acesso'
      }
    ];
    
    let menusVisiveis = 0;
    
    menuItems.forEach((item, index) => {
      const temPermissao = !item.permission || hasPermission(userWithPermissions.permissions, item.permission);
      const status = temPermissao ? '✅ VISÍVEL' : '❌ OCULTO';
      
      console.log(`   ${index + 1}. ${item.name}: ${status}`);
      console.log(`      Permissão necessária: ${item.permission || 'NENHUMA'}`);
      console.log(`      Tem permissão: ${temPermissao}`);
      
      if (temPermissao) menusVisiveis++;
    });
    
    console.log(`\n📊 RESUMO: ${menusVisiveis}/${menuItems.length} menus visíveis`);
    
    if (menusVisiveis === 0) {
      console.log('\n❌ PROBLEMA IDENTIFICADO: NENHUM MENU VISÍVEL!');
      console.log('🔍 POSSÍVEIS CAUSAS:');
      console.log('1. Permissões não estão sendo carregadas corretamente');
      console.log('2. Função hasPermission não está funcionando');
      console.log('3. Array de permissões está vazio ou em formato incorreto');
      console.log('4. Frontend não está reconhecendo as permissões');
      
      // Debug das permissões
      console.log('\n🔍 DEBUG DETALHADO DAS PERMISSÕES:');
      console.log(`Tipo das permissões: ${typeof userWithPermissions.permissions}`);
      console.log(`É array: ${Array.isArray(userWithPermissions.permissions)}`);
      console.log(`Quantidade: ${userWithPermissions.permissions?.length || 0}`);
      
      if (userWithPermissions.permissions?.length > 0) {
        console.log('Primeira permissão:', userWithPermissions.permissions[0]);
        console.log('Inclui "visualizar_dashboard":', userWithPermissions.permissions.includes('visualizar_dashboard'));
      }
    } else {
      console.log(`\n✅ ${menusVisiveis} menus deveriam estar visíveis`);
      console.log('🤔 Se os menus não aparecem no frontend, pode ser:');
      console.log('1. Problema de cache do navegador');
      console.log('2. JavaScript com erro no console');
      console.log('3. Componente Sidebar não está re-renderizando');
      console.log('4. AuthContext não está atualizando o estado');
    }
    
    // 5. Verificar se o usuário é admin
    console.log('\n👑 VERIFICAÇÃO DE ADMIN:');
    const isAdmin = userWithPermissions.perfil === 'admin';
    console.log(`É admin: ${isAdmin}`);
    
    if (isAdmin) {
      console.log('✅ Usuário é admin - deveria ter acesso a todos os menus');
    }
    
    console.log('\n🎯 AÇÕES RECOMENDADAS:');
    console.log('1. Limpar cache do navegador (Ctrl+Shift+R)');
    console.log('2. Verificar console do navegador para erros JavaScript');
    console.log('3. Fazer logout e login novamente');
    console.log('4. Verificar se o build do React está atualizado');
    console.log('\n🔑 CREDENCIAIS CONFIRMADAS:');
    console.log('📧 Email: admin@autoescolaideal.com');
    console.log('🔑 Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
  
  process.exit(0);
}

debugMenus(); 