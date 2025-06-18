const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, getDocs, addDoc } = require('firebase/firestore');

// Configuração do Firebase (mesma do frontend)
const firebaseConfig = {
  apiKey: "AIzaSyCH-7WbtdO9ISZ1QqfUe7FVu5fNP9aOC7U",
  authDomain: "sistema-autoescola-ideal-15fc8.firebaseapp.com",
  projectId: "sistema-autoescola-ideal-15fc8",
  storageBucket: "sistema-autoescola-ideal-15fc8.firebasestorage.app",
  messagingSenderId: "981089777010",
  appId: "1:981089777010:web:2896fcd1c92600aced99eb",
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

// Dados de usuários de teste
const usuariosIniciais = [
  {
    email: 'admin@autoescola.com',
    senha: 'admin123',
    nome: 'Administrador',
    perfil: 'admin',
    unidades: unidades,
    ativo: true,
    permissoes: [
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
  },
  {
    email: 'manager@autoescola.com',
    senha: 'manager123',
    nome: 'Gerente',
    perfil: 'manager',
    unidades: ['Julio de Mesquita', 'Aparecidinha', 'Coop'],
    ativo: true,
    permissoes: [
      'enviar_mensagens', 'cadastrar_contas_btg', 'registrar_cobrancas',
      'visualizar_extratos', 'visualizar_relatorios', 'visualizar_logs',
      'exportar_dados', 'visualizar_dashboard', 'visualizar_metricas',
      'visualizar_auditoria', 'visualizar_estatisticas'
    ]
  },
  {
    email: 'operator@autoescola.com',
    senha: 'operator123',
    nome: 'Operador',
    perfil: 'operator',
    unidades: ['Aparecidinha'],
    ativo: true,
    permissoes: [
      'enviar_mensagens', 'cadastrar_contas_btg', 'registrar_cobrancas',
      'visualizar_extratos', 'visualizar_dashboard'
    ]
  }
];

// Função para criar usuário e dados
async function criarUsuario(dadosUsuario) {
  try {
    console.log(`\n🔄 Criando usuário: ${dadosUsuario.email}`);
    
    // Criar usuário no Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      dadosUsuario.email, 
      dadosUsuario.senha
    );
    
    const user = userCredential.user;
    console.log(`✅ Usuário criado no Auth: ${user.uid}`);
    
    // Criar documento no Firestore
    const userData = {
      uid: user.uid,
      email: dadosUsuario.email,
      nome: dadosUsuario.nome,
      perfil: dadosUsuario.perfil,
      unidades: dadosUsuario.unidades,
      ativo: dadosUsuario.ativo,
      permissoes: dadosUsuario.permissoes,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };
    
    await setDoc(doc(db, 'usuarios', user.uid), userData);
    console.log(`✅ Dados salvos no Firestore para: ${dadosUsuario.email}`);
    
    return { success: true, uid: user.uid };
    
  } catch (error) {
    console.error(`❌ Erro ao criar usuário ${dadosUsuario.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Função para criar dados das unidades
async function criarUnidades() {
  try {
    console.log('\n🏢 Criando dados das unidades...');
    
    for (const unidade of unidades) {
      const unidadeData = {
        nome: unidade,
        ativo: true,
        endereco: `Endereço da ${unidade}`,
        telefone: '(11) 99999-9999',
        email: `${unidade.toLowerCase().replace(/\s+/g, '')}@autoescola.com`,
        criadoEm: new Date()
      };
      
      await setDoc(doc(db, 'unidades', unidade), unidadeData);
      console.log(`✅ Unidade criada: ${unidade}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar unidades:', error.message);
  }
}

// Função para testar conexão
async function testarConexao() {
  try {
    console.log('🔍 Testando conexão com Firebase...');
    console.log(`📍 Projeto: ${firebaseConfig.projectId}`);
    console.log(`🌐 Auth Domain: ${firebaseConfig.authDomain}`);
    
    // Testar Firestore
    const testCollection = collection(db, 'test');
    console.log('✅ Conexão com Firestore OK');
    
    // Testar Auth
    console.log('✅ Conexão com Auth OK');
    
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    return false;
  }
}

// Função para listar usuários existentes
async function listarUsuarios() {
  try {
    console.log('\n👥 Listando usuários existentes...');
    
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    
    if (usuariosSnapshot.empty) {
      console.log('📭 Nenhum usuário encontrado');
      return [];
    }
    
    const usuarios = [];
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      usuarios.push(data);
      console.log(`👤 ${data.email} - ${data.perfil} - ${data.unidades?.join(', ')}`);
    });
    
    return usuarios;
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error.message);
    return [];
  }
}

// Função para aplicar regras do Firestore
async function mostrarRegrasFirestore() {
  console.log('\n🔒 REGRAS DO FIRESTORE RECOMENDADAS:');
  console.log('Cole estas regras no Firebase Console > Firestore > Rules:');
  console.log('\n' + '='.repeat(50));
  
  const regras = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;
  
  console.log(regras);
  console.log('='.repeat(50));
  console.log('\n📋 Passos para aplicar:');
  console.log('1. Acesse: https://console.firebase.google.com');
  console.log('2. Selecione: sistema-autoescola-ideal-15fc8');
  console.log('3. Vá em: Firestore Database > Rules');
  console.log('4. Cole as regras acima');
  console.log('5. Clique em "Publish"');
}

// Função principal
async function main() {
  console.log('🚀 CONFIGURAÇÃO INICIAL DO FIREBASE');
  console.log('=====================================');
  
  // Testar conexão
  const conexaoOK = await testarConexao();
  if (!conexaoOK) {
    console.log('❌ Falha na conexão. Verifique as configurações.');
    return;
  }
  
  // Mostrar regras recomendadas
  mostrarRegrasFirestore();
  
  // Listar usuários existentes
  await listarUsuarios();
  
  // Criar unidades
  await criarUnidades();
  
  // Criar usuários iniciais
  console.log('\n👥 Criando usuários iniciais...');
  for (const usuario of usuariosIniciais) {
    await criarUsuario(usuario);
  }
  
  console.log('\n✅ CONFIGURAÇÃO CONCLUÍDA!');
  console.log('\n📋 CREDENCIAIS DE ACESSO:');
  console.log('Admin: admin@autoescola.com / admin123');
  console.log('Manager: manager@autoescola.com / manager123');
  console.log('Operator: operator@autoescola.com / operator123');
  
  console.log('\n🔥 PRÓXIMOS PASSOS:');
  console.log('1. Aplique as regras do Firestore mostradas acima');
  console.log('2. Teste o login no sistema');
  console.log('3. Verifique se a criação de usuários funciona');
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  criarUsuario,
  criarUnidades,
  testarConexao,
  listarUsuarios,
  unidades,
  usuariosIniciais
}; 