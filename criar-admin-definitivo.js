const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, getDocs, query, where } = require('firebase/firestore');

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
const auth = getAuth(app);
const db = getFirestore(app);

// Unidades do sistema
const unidades = [
  'Julio de Mesquita',
  'Aparecidinha', 
  'Coop',
  'Progresso',
  'Vila Haro',
  'Vila Helena'
];

// Todas as permissões do sistema
const todasPermissoes = [
  'gerenciar_usuarios', 'enviar_mensagens', 'cadastrar_contas_btg',
  'registrar_cobrancas', 'visualizar_extratos', 'configurar_sistema',
  'visualizar_relatorios', 'gerenciar_permissoes', 'visualizar_logs',
  'exportar_dados', 'importar_dados', 'backup_sistema',
  'gerenciar_unidades', 'configurar_integracao', 'visualizar_dashboard',
  'gerenciar_notificacoes', 'configurar_alertas', 'visualizar_metricas',
  'gerenciar_templates', 'configurar_webhooks', 'visualizar_auditoria',
  'gerenciar_categorias', 'configurar_automacao', 'visualizar_estatisticas',
  'gerenciar_tags', 'configurar_backup'
];

async function garantirAdminExiste() {
  try {
    console.log('👑 GARANTINDO ADMIN DEFINITIVO NO SISTEMA');
    console.log('==========================================');
    
    // 1. Verificar se já existe admin
    console.log('🔍 Verificando se admin já existe...');
    
    const adminQuery = query(
      collection(db, 'usuarios'), 
      where('email', '==', 'admin@autoescolaideal.com')
    );
    
    const adminSnapshot = await getDocs(adminQuery);
    
    if (!adminSnapshot.empty) {
      console.log('✅ Admin já existe no sistema!');
      
      adminSnapshot.forEach((doc) => {
        const adminData = doc.data();
        console.log(`👤 Admin encontrado: ${adminData.nome}`);
        console.log(`📧 Email: ${adminData.email}`);
        console.log(`🏷️ Perfil: ${adminData.perfil}`);
        console.log(`🆔 ID: ${doc.id}`);
        console.log(`🔐 Permissões: ${adminData.permissions?.length || 0}`);
        console.log(`🏢 Unidades: ${adminData.unidades?.length || 0}`);
      });
      
      return true;
    }
    
    // 2. Se não existe, criar admin
    console.log('📝 Admin não encontrado. Criando admin definitivo...');
    
    const adminData = {
      nome: 'Administrador Geral',
      email: 'admin@autoescolaideal.com',
      perfil: 'admin',
      unidades: unidades,
      permissions: todasPermissoes,
      ativo: true,
      acessoTotal: true,
      criadoEm: new Date(),
      updatedAt: new Date(),
      versao: '2.0',
      // Campos extras para compatibilidade
      role: 'admin',
      isAdmin: true,
      superUser: true,
      sistemaAdmin: true
    };
    
    // Tentar criar com vários IDs possíveis
    const possiveisIds = [
      'admin_geral',
      'admin_autoescolaideal_com',
      'admin_sistema',
      'administrador_geral'
    ];
    
    let adminCriado = false;
    
    for (const adminId of possiveisIds) {
      try {
        console.log(`📝 Tentando criar admin com ID: ${adminId}`);
        await setDoc(doc(db, 'usuarios', adminId), adminData);
        console.log(`✅ Admin criado com sucesso! ID: ${adminId}`);
        adminCriado = true;
        break;
      } catch (error) {
        console.log(`⚠️ Erro ao criar com ID ${adminId}:`, error.message);
      }
    }
    
    if (!adminCriado) {
      throw new Error('Não foi possível criar o admin com nenhum ID');
    }
    
    console.log('\n🎉 ADMIN DEFINITIVO CRIADO COM SUCESSO!');
    console.log('📋 Dados do Admin:');
    console.log(`👤 Nome: ${adminData.nome}`);
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🏷️ Perfil: ${adminData.perfil}`);
    console.log(`🏢 Unidades: ${adminData.unidades.length} (${adminData.unidades.join(', ')})`);
    console.log(`🔐 Permissões: ${adminData.permissions.length} (todas)`);
    console.log(`👑 Acesso Total: ${adminData.acessoTotal}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao garantir admin:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n🔧 SOLUÇÃO NECESSÁRIA:');
      console.log('As regras do Firestore precisam ser aplicadas primeiro.');
      console.log('Execute: node aplicar-regras-temporarias.js');
      console.log('E siga as instruções para aplicar as regras.');
    }
    
    return false;
  }
}

async function main() {
  console.log('🚀 INICIANDO VERIFICAÇÃO DE ADMIN...\n');
  
  const sucesso = await garantirAdminExiste();
  
  if (sucesso) {
    console.log('\n✅ SISTEMA PRONTO!');
    console.log('🔐 Credenciais do Admin:');
    console.log('📧 Email: admin@autoescolaideal.com');
    console.log('🔑 Senha: (defina uma senha segura no Authentication)');
    console.log('\n🎯 Próximos passos:');
    console.log('1. Aplique as regras definitivas do Firestore');
    console.log('2. Faça login com as credenciais do admin');
    console.log('3. Crie outros usuários normalmente');
  } else {
    console.log('\n❌ FALHA NA CONFIGURAÇÃO');
    console.log('🔧 Verifique as regras do Firestore e tente novamente');
  }
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  garantirAdminExiste
}; 