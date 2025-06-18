const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
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
const auth = getAuth(app);
const db = getFirestore(app);

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

// Unidades
const unidades = [
  'Julio de Mesquita',
  'Aparecidinha', 
  'Coop',
  'Progresso',
  'Vila Haro',
  'Vila Helena'
];

// ✅ VERSÃO SEGURA - NÃO DELETA ADMINS EXISTENTES
async function garantirAdminSeguro() {
  try {
    console.log('👑 GARANTINDO ADMIN SEGURO (SEM DELETAR)');
    console.log('==========================================');
    
    // 1. Verificar admins existentes
    console.log('🔍 Verificando admins existentes...');
    
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    let adminsEncontrados = [];
    
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === 'admin@autoescolaideal.com') {
        adminsEncontrados.push({
          id: doc.id,
          data: data
        });
      }
    });
    
    console.log(`📊 Admins encontrados: ${adminsEncontrados.length}`);
    
    if (adminsEncontrados.length > 0) {
      console.log('✅ Admins existentes encontrados - ATUALIZANDO em vez de deletar');
      
      // Atualizar admins existentes
      for (const admin of adminsEncontrados) {
        const dadosAtualizados = {
          ...admin.data,
          nome: admin.data.nome || 'Administrador Total',
          perfil: 'admin',
          unidades: unidades,
          permissoes: todasPermissoes,
          permissions: todasPermissoes,
          ativo: true,
          acessoTotal: true,
          atualizadoEm: new Date(),
          role: 'admin',
          isAdmin: true,
          superUser: true
        };
        
        await updateDoc(doc(db, 'usuarios', admin.id), dadosAtualizados);
        console.log(`✅ Admin ${admin.id} atualizado (não deletado)`);
      }
      
    } else {
      console.log('📝 Nenhum admin encontrado - criando novo...');
      
      // Criar admin apenas se não existir
      const dadosAdmin = {
        email: 'admin@autoescolaideal.com',
        nome: 'Administrador Total',
        perfil: 'admin',
        unidades: unidades,
        ativo: true,
        permissoes: todasPermissoes,
        permissions: todasPermissoes,
        acessoTotal: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        role: 'admin',
        isAdmin: true,
        superUser: true
      };
      
      await setDoc(doc(db, 'usuarios', 'admin_total'), dadosAdmin);
      console.log('✅ Novo admin criado');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao garantir admin:', error.message);
    return false;
  }
}

async function verificarAdmin() {
  try {
    console.log('\n🔍 VERIFICANDO ADMIN...');
    
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    
    console.log(`📊 Total de usuários: ${usuariosSnapshot.size}`);
    
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === 'admin@autoescolaideal.com') {
        console.log('\n✅ ADMIN ENCONTRADO:');
        console.log(`🆔 ID: ${doc.id}`);
        console.log(`📧 Email: ${data.email}`);
        console.log(`👤 Nome: ${data.nome}`);
        console.log(`🏷️ Perfil: ${data.perfil}`);
        console.log(`🔐 Permissões: ${data.permissoes?.length || data.permissions?.length || 0}`);
        console.log(`👑 Acesso Total: ${data.acessoTotal || false}`);
        console.log(`🏢 Unidades: ${data.unidades?.length || 0}`);
        
        if (data.permissoes?.includes('gerenciar_usuarios') || data.permissions?.includes('gerenciar_usuarios')) {
          console.log('✅ Permissão "gerenciar_usuarios" ENCONTRADA!');
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar admin:', error.message);
  }
}

async function main() {
  console.log('👑 ADMIN SEGURO - VERSÃO QUE NÃO DELETA');
  console.log('=======================================');
  console.log('✅ Esta versão PRESERVA admins existentes');
  console.log('🔄 Apenas atualiza ou cria se necessário\n');
  
  const sucesso = await garantirAdminSeguro();
  
  if (sucesso) {
    await verificarAdmin();
    
    console.log('\n🎉 ADMIN GARANTIDO COM SEGURANÇA!');
    console.log('\n🔑 CREDENCIAIS:');
    console.log('📧 Email: admin@autoescolaideal.com');
    console.log('🔑 Senha: (use sua senha existente)');
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Faça login no sistema');
    console.log('2. Teste "Gerenciar Usuários"');
    console.log('3. Crie novos usuários normalmente');
    
  } else {
    console.log('\n❌ Falha. Verifique as regras do Firestore.');
  }
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  garantirAdminSeguro,
  verificarAdmin
}; 