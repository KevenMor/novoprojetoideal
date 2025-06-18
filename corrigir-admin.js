const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc } = require('firebase/firestore');

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

// Dados das unidades
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

// Função para buscar usuário por email
async function buscarUsuarioPorEmail(email) {
  try {
    console.log(`🔍 Buscando usuário: ${email}`);
    
    // Tentar na coleção 'usuarios'
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    let usuarioEncontrado = null;
    let docId = null;
    
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === email) {
        usuarioEncontrado = data;
        docId = doc.id;
      }
    });
    
    if (usuarioEncontrado) {
      console.log(`✅ Usuário encontrado na coleção 'usuarios'`);
      return { usuario: usuarioEncontrado, docId, colecao: 'usuarios' };
    }
    
    // Tentar na coleção 'users'
    const usersSnapshot = await getDocs(collection(db, 'users'));
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === email) {
        usuarioEncontrado = data;
        docId = doc.id;
      }
    });
    
    if (usuarioEncontrado) {
      console.log(`✅ Usuário encontrado na coleção 'users'`);
      return { usuario: usuarioEncontrado, docId, colecao: 'users' };
    }
    
    console.log(`❌ Usuário não encontrado: ${email}`);
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error.message);
    return null;
  }
}

// Função para corrigir permissões do admin
async function corrigirAdmin(email) {
  try {
    const resultado = await buscarUsuarioPorEmail(email);
    
    if (!resultado) {
      console.log(`❌ Usuário ${email} não encontrado no Firestore`);
      console.log('💡 Vamos criar o usuário no Firestore...');
      
      // Tentar fazer login para obter o UID
      try {
        console.log('🔐 Digite a senha do admin para continuar...');
        // Por enquanto, vamos criar sem login
        return await criarAdminNoFirestore(email);
      } catch (e) {
        console.log('❌ Não foi possível fazer login. Criando usuário básico...');
        return await criarAdminNoFirestore(email);
      }
    }
    
    const { usuario, docId, colecao } = resultado;
    
    console.log('\n📋 DADOS ATUAIS DO USUÁRIO:');
    console.log(`📧 Email: ${usuario.email}`);
    console.log(`👤 Nome: ${usuario.nome || usuario.name || 'N/A'}`);
    console.log(`🏷️ Perfil: ${usuario.perfil || usuario.role || 'N/A'}`);
    console.log(`🏢 Unidades: ${usuario.unidades?.join(', ') || 'N/A'}`);
    console.log(`🔐 Permissões: ${usuario.permissoes?.length || 0} permissões`);
    
    // Dados corrigidos para admin
    const dadosCorrigidos = {
      ...usuario,
      nome: usuario.nome || usuario.name || 'Administrador',
      perfil: 'admin',
      unidades: unidades,
      ativo: true,
      permissoes: todasPermissoes,
      atualizadoEm: new Date()
    };
    
    // Atualizar no Firestore
    await updateDoc(doc(db, colecao, docId), dadosCorrigidos);
    
    console.log('\n✅ USUÁRIO CORRIGIDO COM SUCESSO!');
    console.log('📋 NOVAS CONFIGURAÇÕES:');
    console.log(`👤 Nome: ${dadosCorrigidos.nome}`);
    console.log(`🏷️ Perfil: ${dadosCorrigidos.perfil}`);
    console.log(`🏢 Unidades: ${dadosCorrigidos.unidades.join(', ')}`);
    console.log(`🔐 Permissões: ${dadosCorrigidos.permissoes.length} permissões`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao corrigir admin:', error.message);
    return false;
  }
}

// Função para criar admin no Firestore
async function criarAdminNoFirestore(email) {
  try {
    console.log(`🔄 Criando usuário admin no Firestore: ${email}`);
    
    // Gerar um ID único (pode ser o UID do Authentication se disponível)
    const adminId = email.replace('@', '_').replace('.', '_');
    
    const dadosAdmin = {
      email: email,
      nome: 'Administrador',
      perfil: 'admin',
      unidades: unidades,
      ativo: true,
      permissoes: todasPermissoes,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };
    
    await setDoc(doc(db, 'usuarios', adminId), dadosAdmin);
    
    console.log('✅ Admin criado no Firestore com sucesso!');
    console.log('📋 CONFIGURAÇÕES:');
    console.log(`👤 Nome: ${dadosAdmin.nome}`);
    console.log(`🏷️ Perfil: ${dadosAdmin.perfil}`);
    console.log(`🏢 Unidades: ${dadosAdmin.unidades.join(', ')}`);
    console.log(`🔐 Permissões: ${dadosAdmin.permissoes.length} permissões`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
    return false;
  }
}

// Função para listar todos os usuários
async function listarTodosUsuarios() {
  try {
    console.log('\n👥 LISTANDO TODOS OS USUÁRIOS:');
    
    const colecoes = ['usuarios', 'users'];
    
    for (const colecao of colecoes) {
      try {
        const snapshot = await getDocs(collection(db, colecao));
        if (!snapshot.empty) {
          console.log(`\n📁 Coleção: ${colecao} (${snapshot.size} usuários)`);
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`👤 ${data.email || 'N/A'} - ${data.perfil || data.role || 'N/A'} - ${data.unidades?.join(', ') || 'N/A'}`);
          });
        }
      } catch (e) {
        console.log(`❌ Erro ao acessar coleção ${colecao}:`, e.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error.message);
  }
}

// Função principal
async function main() {
  console.log('🔧 CORREÇÃO DE PERMISSÕES DO ADMIN');
  console.log('==================================');
  
  const emailAdmin = 'admin@autoescolaideal.com';
  
  // Listar usuários existentes
  await listarTodosUsuarios();
  
  // Corrigir admin
  const sucesso = await corrigirAdmin(emailAdmin);
  
  if (sucesso) {
    console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n🔥 PRÓXIMOS PASSOS:');
    console.log('1. Reinicie o sistema (npm start)');
    console.log('2. Faça login com: admin@autoescolaideal.com');
    console.log('3. Acesse "Gerenciar Usuários" - deve funcionar!');
    console.log('4. Teste a criação de novos usuários');
  } else {
    console.log('\n❌ Falha na correção. Verifique os logs acima.');
  }
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  buscarUsuarioPorEmail,
  corrigirAdmin,
  listarTodosUsuarios
}; 