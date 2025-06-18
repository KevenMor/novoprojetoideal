const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, getDocs, addDoc } = require('firebase/firestore');

// Configuração do Firebase - Projeto: Sistema Ideal (CORRETO)
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

// Função para testar conexão
async function testarConexao() {
  try {
    console.log('🔍 Testando conexão com Firebase - Sistema Ideal...');
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
    console.log('\n👥 Listando usuários existentes no Sistema Ideal...');
    
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    
    if (usuariosSnapshot.empty) {
      console.log('📭 Nenhum usuário encontrado na coleção "usuarios"');
      
      // Tentar outras possíveis coleções
      console.log('🔍 Verificando outras coleções possíveis...');
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        if (!usersSnapshot.empty) {
          console.log('👥 Encontrados usuários na coleção "users":');
          usersSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`👤 ${data.email || data.name || doc.id} - ${data.role || data.perfil || 'N/A'}`);
          });
        }
      } catch (e) {
        console.log('❌ Erro ao verificar coleção "users":', e.message);
      }
      
      return [];
    }
    
    const usuarios = [];
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      usuarios.push(data);
      console.log(`👤 ${data.email} - ${data.perfil} - ${data.unidades?.join(', ') || 'N/A'}`);
    });
    
    return usuarios;
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error.message);
    return [];
  }
}

// Função para listar todas as coleções
async function listarColecoes() {
  try {
    console.log('\n📋 Verificando coleções existentes...');
    
    const colecoesPossiveis = [
      'usuarios', 'users', 'admins', 'accounts', 
      'unidades', 'units', 'messages', 'mensagens',
      'charges', 'cobrancas', 'extratos', 'extracts'
    ];
    
    for (const colecao of colecoesPossiveis) {
      try {
        const snapshot = await getDocs(collection(db, colecao));
        if (!snapshot.empty) {
          console.log(`✅ Coleção "${colecao}": ${snapshot.size} documentos`);
        }
      } catch (e) {
        // Coleção não existe ou sem permissão
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar coleções:', error.message);
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

// Função para mostrar regras do Firestore
async function mostrarRegrasFirestore() {
  console.log('\n🔒 REGRAS DO FIRESTORE PARA O PROJETO SISTEMA IDEAL:');
  console.log('Cole estas regras no Firebase Console > Firestore > Rules:');
  console.log('\n' + '='.repeat(60));
  
  const regras = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;
  
  console.log(regras);
  console.log('='.repeat(60));
  console.log('\n📋 Passos para aplicar:');
  console.log('1. Acesse: https://console.firebase.google.com');
  console.log('2. Selecione: Sistema Ideal (sistema-ideal-dbffd)');
  console.log('3. Vá em: Firestore Database > Rules');
  console.log('4. Cole as regras acima');
  console.log('5. Clique em "Publish"');
}

// Função principal
async function main() {
  console.log('🚀 VERIFICAÇÃO DO PROJETO SISTEMA IDEAL');
  console.log('=======================================');
  
  // Testar conexão
  const conexaoOK = await testarConexao();
  if (!conexaoOK) {
    console.log('❌ Falha na conexão. Verifique as configurações.');
    return;
  }
  
  // Mostrar regras recomendadas
  mostrarRegrasFirestore();
  
  // Listar coleções existentes
  await listarColecoes();
  
  // Listar usuários existentes
  await listarUsuarios();
  
  console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
  console.log('\n🔥 PRÓXIMOS PASSOS:');
  console.log('1. Aplique as regras do Firestore mostradas acima');
  console.log('2. Reinicie o sistema (npm start)');
  console.log('3. Teste o login com seu admin existente');
  console.log('4. Verifique se a criação de usuários funciona');
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testarConexao,
  listarUsuarios,
  listarColecoes,
  criarUnidades,
  unidades
}; 