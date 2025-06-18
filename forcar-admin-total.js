const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, getDocs, updateDoc, deleteDoc } = require('firebase/firestore');

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

async function limparUsuariosAntigos() {
  try {
    console.log('🧹 LIMPANDO USUÁRIOS ANTIGOS...');
    
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    
    for (const docSnapshot of usuariosSnapshot.docs) {
      const data = docSnapshot.data();
      if (data.email === 'admin@autoescolaideal.com') {
        console.log(`🗑️ Removendo usuário antigo: ${docSnapshot.id}`);
        await deleteDoc(doc(db, 'usuarios', docSnapshot.id));
      }
    }
    
    console.log('✅ Limpeza concluída');
    
  } catch (error) {
    console.log('⚠️ Erro na limpeza (normal):', error.message);
  }
}

async function criarAdminTotal() {
  try {
    console.log('👑 CRIANDO ADMIN COM ACESSO TOTAL');
    console.log('=================================');
    
    // Limpar usuários antigos primeiro
    await limparUsuariosAntigos();
    
    // Criar admin com ID específico
    const adminId = 'admin_total';
    
    const dadosAdmin = {
      uid: adminId,
      email: 'admin@autoescolaideal.com',
      nome: 'Administrador Total',
      perfil: 'admin',
      unidades: unidades,
      ativo: true,
      permissoes: todasPermissoes,
      acessoTotal: true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      // Campos extras para garantir compatibilidade
      role: 'admin',
      isAdmin: true,
      superUser: true
    };
    
    // Criar o documento
    await setDoc(doc(db, 'usuarios', adminId), dadosAdmin);
    
    console.log('✅ ADMIN CRIADO COM SUCESSO!');
    console.log('📋 CONFIGURAÇÕES:');
    console.log(`👤 Nome: ${dadosAdmin.nome}`);
    console.log(`📧 Email: ${dadosAdmin.email}`);
    console.log(`🏷️ Perfil: ${dadosAdmin.perfil}`);
    console.log(`🏢 Unidades: ${dadosAdmin.unidades.join(', ')}`);
    console.log(`🔐 Permissões: ${dadosAdmin.permissoes.length} permissões`);
    console.log(`👑 Acesso Total: ${dadosAdmin.acessoTotal}`);
    
    // Criar também com o UID se disponível
    try {
      await setDoc(doc(db, 'usuarios', 'admin_autoescolaideal_com'), dadosAdmin);
      console.log('✅ Backup do admin criado');
    } catch (e) {
      console.log('⚠️ Backup não criado (normal)');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
    return false;
  }
}

async function verificarAdmin() {
  try {
    console.log('\n🔍 VERIFICANDO ADMIN CRIADO...');
    
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
        console.log(`🔐 Permissões: ${data.permissoes?.length || 0}`);
        console.log(`👑 Acesso Total: ${data.acessoTotal || false}`);
        console.log(`🏢 Unidades: ${data.unidades?.length || 0}`);
        
        // Verificar se tem a permissão específica
        if (data.permissoes?.includes('gerenciar_usuarios')) {
          console.log('✅ Permissão "gerenciar_usuarios" ENCONTRADA!');
        } else {
          console.log('❌ Permissão "gerenciar_usuarios" NÃO encontrada!');
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar admin:', error.message);
  }
}

async function main() {
  console.log('👑 FORÇAR ADMIN COM ACESSO TOTAL');
  console.log('===============================');
  
  const sucesso = await criarAdminTotal();
  
  if (sucesso) {
    await verificarAdmin();
    
    console.log('\n🎉 ADMIN COM ACESSO TOTAL CRIADO!');
    console.log('\n🔥 PRÓXIMOS PASSOS:');
    console.log('1. Faça LOGOUT no navegador');
    console.log('2. Faça LOGIN novamente com: admin@autoescolaideal.com');
    console.log('3. O menu "Gerenciar Usuários" DEVE aparecer');
    console.log('4. Se não aparecer, acesse diretamente:');
    console.log('   http://localhost:3000/gerenciar-usuarios');
    console.log('5. Teste criar novos usuários');
    
  } else {
    console.log('\n❌ Falha ao criar admin. Verifique as regras do Firestore.');
  }
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  criarAdminTotal,
  verificarAdmin
}; 