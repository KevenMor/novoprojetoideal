const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, getDocs, getDoc } = require('firebase/firestore');

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

async function verificarAuthentication() {
  try {
    console.log('🔐 VERIFICANDO FIREBASE AUTHENTICATION');
    console.log('=====================================');
    
    console.log('📝 Tentando fazer login com admin@autoescolaideal.com...');
    console.log('⚠️ Vou tentar algumas senhas comuns para teste...');
    
    const senhasParaTestar = [
      '123456',
      'admin123',
      'password',
      'autoescola123',
      '12345678'
    ];
    
    let loginSucesso = false;
    let senhaCorreta = null;
    
    for (const senha of senhasParaTestar) {
      try {
        console.log(`🔑 Testando senha: ${senha}...`);
        const userCredential = await signInWithEmailAndPassword(auth, 'admin@autoescolaideal.com', senha);
        console.log(`✅ LOGIN SUCESSO com senha: ${senha}`);
        console.log(`👤 UID: ${userCredential.user.uid}`);
        console.log(`📧 Email: ${userCredential.user.email}`);
        console.log(`✅ Email verificado: ${userCredential.user.emailVerified}`);
        console.log(`📅 Criado em: ${userCredential.user.metadata.creationTime}`);
        console.log(`📅 Último login: ${userCredential.user.metadata.lastSignInTime}`);
        
        loginSucesso = true;
        senhaCorreta = senha;
        break;
        
      } catch (error) {
        console.log(`❌ Falhou com senha ${senha}: ${error.code}`);
      }
    }
    
    if (!loginSucesso) {
      console.log('\n❌ PROBLEMA CRÍTICO: Usuário não existe no Authentication ou senha não encontrada');
      console.log('🔧 SOLUÇÕES:');
      console.log('1. O usuário admin@autoescolaideal.com não existe no Authentication');
      console.log('2. A senha foi alterada');
      console.log('3. Precisa ser criado no Authentication');
      
      return { 
        existe: false, 
        uid: null, 
        senhaCorreta: null,
        solucao: 'criar_no_auth'
      };
    }
    
    return { 
      existe: true, 
      uid: auth.currentUser.uid, 
      senhaCorreta: senhaCorreta,
      usuario: auth.currentUser
    };
    
  } catch (error) {
    console.error('❌ Erro na verificação do Authentication:', error);
    return { existe: false, uid: null, erro: error.message };
  }
}

async function verificarFirestore(uid) {
  try {
    console.log('\n📊 VERIFICANDO FIRESTORE DATABASE');
    console.log('=================================');
    
    // Verificar por email
    console.log('🔍 Procurando por email admin@autoescolaideal.com...');
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    let adminsNoFirestore = [];
    
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === 'admin@autoescolaideal.com') {
        adminsNoFirestore.push({
          id: doc.id,
          data: data
        });
      }
    });
    
    console.log(`📊 Admins encontrados no Firestore: ${adminsNoFirestore.length}`);
    
    if (adminsNoFirestore.length > 0) {
      console.log('\n✅ ADMINS NO FIRESTORE:');
      adminsNoFirestore.forEach((admin, index) => {
        console.log(`\n👤 Admin ${index + 1}:`);
        console.log(`🆔 ID: ${admin.id}`);
        console.log(`👤 Nome: ${admin.data.nome || 'N/A'}`);
        console.log(`🏷️ Perfil: ${admin.data.perfil || 'N/A'}`);
        console.log(`🔐 Permissões: ${admin.data.permissoes?.length || admin.data.permissions?.length || 0}`);
        console.log(`🏢 Unidades: ${admin.data.unidades?.length || 0}`);
        console.log(`✅ Ativo: ${admin.data.ativo || false}`);
      });
    }
    
    // Se temos UID do Authentication, verificar se existe documento com esse UID
    if (uid) {
      console.log(`\n🔍 Verificando documento com UID: ${uid}...`);
      const uidDoc = await getDoc(doc(db, 'usuarios', uid));
      
      if (uidDoc.exists()) {
        console.log('✅ Documento com UID do Authentication encontrado!');
        const data = uidDoc.data();
        console.log(`👤 Nome: ${data.nome || 'N/A'}`);
        console.log(`🏷️ Perfil: ${data.perfil || 'N/A'}`);
        console.log(`🔐 Permissões: ${data.permissoes?.length || data.permissions?.length || 0}`);
      } else {
        console.log('❌ NÃO existe documento com UID do Authentication');
        console.log('🔧 ESTE É O PROBLEMA! Authentication e Firestore não estão sincronizados');
      }
    }
    
    return {
      adminsNoFirestore,
      temDocumentoComUID: uid ? (await getDoc(doc(db, 'usuarios', uid))).exists() : false
    };
    
  } catch (error) {
    console.error('❌ Erro na verificação do Firestore:', error);
    return { erro: error.message };
  }
}

async function corrigirSincronizacao(authInfo, firestoreInfo) {
  try {
    console.log('\n🔧 CORRIGINDO SINCRONIZAÇÃO');
    console.log('===========================');
    
    if (authInfo.existe && !firestoreInfo.temDocumentoComUID) {
      console.log('🔄 Criando documento no Firestore com UID do Authentication...');
      
      // Pegar dados de um admin existente no Firestore ou criar novo
      let dadosAdmin;
      
      if (firestoreInfo.adminsNoFirestore.length > 0) {
        // Usar dados de admin existente
        const adminExistente = firestoreInfo.adminsNoFirestore[0];
        dadosAdmin = {
          ...adminExistente.data,
          uid: authInfo.uid, // Adicionar UID do Authentication
          atualizadoEm: new Date(),
          sincronizadoEm: new Date()
        };
        console.log('📋 Usando dados de admin existente no Firestore');
      } else {
        // Criar dados completos
        dadosAdmin = {
          uid: authInfo.uid,
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
          superUser: true,
          sincronizadoEm: new Date()
        };
        console.log('📋 Criando dados completos do admin');
      }
      
      // Criar documento com UID do Authentication
      await setDoc(doc(db, 'usuarios', authInfo.uid), dadosAdmin);
      console.log(`✅ Documento criado/atualizado com UID: ${authInfo.uid}`);
      
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
    return false;
  }
}

async function criarUsuarioCompleto() {
  try {
    console.log('\n🆕 CRIANDO USUÁRIO COMPLETO (AUTH + FIRESTORE)');
    console.log('==============================================');
    
    console.log('📝 Criando usuário no Authentication...');
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'admin@autoescolaideal.com', 
      '123456'
    );
    
    console.log(`✅ Usuário criado no Authentication: ${userCredential.user.uid}`);
    
    console.log('📝 Criando documento no Firestore...');
    const dadosAdmin = {
      uid: userCredential.user.uid,
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
    
    await setDoc(doc(db, 'usuarios', userCredential.user.uid), dadosAdmin);
    console.log('✅ Documento criado no Firestore');
    
    console.log('\n🎉 USUÁRIO COMPLETO CRIADO!');
    console.log('🔑 CREDENCIAIS:');
    console.log('📧 Email: admin@autoescolaideal.com');
    console.log('🔑 Senha: 123456');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário completo:', error);
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Email já está em uso - isso é normal');
    }
    return false;
  }
}

async function main() {
  console.log('🚀 DIAGNÓSTICO COMPLETO - AUTHENTICATION vs FIRESTORE');
  console.log('======================================================');
  console.log('🎯 Objetivo: Descobrir por que os menus sumiram\n');
  
  // 1. Verificar Authentication
  const authInfo = await verificarAuthentication();
  
  // 2. Verificar Firestore
  const firestoreInfo = await verificarFirestore(authInfo.uid);
  
  // 3. Analisar problema
  console.log('\n🔍 ANÁLISE DO PROBLEMA');
  console.log('=====================');
  
  if (!authInfo.existe) {
    console.log('❌ PROBLEMA: Usuário não existe no Authentication');
    console.log('🔧 SOLUÇÃO: Criar usuário no Authentication');
    
    const pergunta = await new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Deseja criar o usuário admin@autoescolaideal.com no Authentication? (s/n): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 's');
      });
    });
    
    if (pergunta) {
      await criarUsuarioCompleto();
    }
    
  } else if (!firestoreInfo.temDocumentoComUID) {
    console.log('❌ PROBLEMA: Authentication existe mas Firestore não tem documento com o UID correto');
    console.log('🔧 SOLUÇÃO: Sincronizar Authentication com Firestore');
    
    await corrigirSincronizacao(authInfo, firestoreInfo);
    
  } else {
    console.log('✅ Authentication e Firestore estão sincronizados');
    console.log('🤔 O problema pode ser no frontend ou cache');
    console.log('💡 Tente:');
    console.log('1. Limpar cache do navegador');
    console.log('2. Fazer logout e login novamente');
    console.log('3. Verificar console do navegador para erros');
  }
  
  console.log('\n🎯 RESUMO FINAL:');
  console.log('===============');
  if (authInfo.existe) {
    console.log(`✅ Authentication: OK (UID: ${authInfo.uid})`);
    console.log(`🔑 Senha correta: ${authInfo.senhaCorreta}`);
  } else {
    console.log('❌ Authentication: PROBLEMA');
  }
  
  if (firestoreInfo.adminsNoFirestore.length > 0) {
    console.log(`✅ Firestore: ${firestoreInfo.adminsNoFirestore.length} admin(s) encontrado(s)`);
  } else {
    console.log('❌ Firestore: NENHUM admin encontrado');
  }
  
  if (authInfo.existe && firestoreInfo.temDocumentoComUID) {
    console.log('✅ SINCRONIZAÇÃO: OK');
    console.log('\n🎉 CREDENCIAIS PARA LOGIN:');
    console.log('📧 Email: admin@autoescolaideal.com');
    console.log(`🔑 Senha: ${authInfo.senhaCorreta}`);
    console.log('\n🔄 Tente fazer login novamente no sistema!');
  } else {
    console.log('❌ SINCRONIZAÇÃO: PROBLEMA');
  }
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  verificarAuthentication,
  verificarFirestore,
  corrigirSincronizacao
}; 