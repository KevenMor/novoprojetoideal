const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, getDocs, getDoc } = require('firebase/firestore');

// Configuração do Firebase
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

// Função para remover undefined de forma profunda (igual ao frontend)
function deepRemoveUndefined(obj) {
  if (obj === undefined || obj === null) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(deepRemoveUndefined).filter(item => item !== null);
  } else if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        const cleanedValue = deepRemoveUndefined(value);
        if (cleanedValue !== null) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }
  return obj;
}

// Função para validar e limpar dados do usuário (igual ao frontend)
function validateAndCleanUserData(userData) {
  console.log('🔍 Validando dados do usuário antes de salvar...');
  console.log('📋 Dados originais:', JSON.stringify(userData, null, 2));
  
  // Garantir campos obrigatórios
  const cleanedData = {
    // Campos obrigatórios
    nome: userData.nome || '',
    email: userData.email || '',
    perfil: userData.perfil || 'operator',
    ativo: typeof userData.ativo === 'boolean' ? userData.ativo : true,
    
    // Arrays sempre definidos
    unidades: Array.isArray(userData.unidades) ? userData.unidades : [],
    permissions: Array.isArray(userData.permissions) ? userData.permissions : [],
    
    // Timestamps
    criadoEm: userData.criadoEm || new Date(),
    updatedAt: new Date(),
    
    // Campos opcionais
    ...(userData.criadoPor && { criadoPor: userData.criadoPor }),
    ...(userData.criadoPorEmail && { criadoPorEmail: userData.criadoPorEmail }),
    ...(userData.versao && { versao: userData.versao }),
    ...(userData.uid && { uid: userData.uid }),
    
    // Campos de controle
    telefone: userData.telefone || '',
    cargo: userData.cargo || '',
    role: userData.role || userData.perfil,
    isAdmin: userData.perfil === 'admin',
    superUser: userData.perfil === 'admin',
    acessoTotal: userData.perfil === 'admin'
  };
  
  // Remover undefined de forma profunda
  const finalData = deepRemoveUndefined(cleanedData);
  
  console.log('✅ Dados validados e limpos:', JSON.stringify(finalData, null, 2));
  
  // Validações finais
  if (!finalData.nome || !finalData.email) {
    throw new Error('Nome e email são obrigatórios');
  }
  
  if (!Array.isArray(finalData.unidades)) {
    throw new Error('Unidades deve ser um array');
  }
  
  if (!Array.isArray(finalData.permissions)) {
    throw new Error('Permissions deve ser um array');
  }
  
  return finalData;
}

// Permissões para teste
const PERMISSIONS_TESTE = [
  'dashboard.view',
  'messages.access',
  'messages.send',
  'btg.access',
  'btg.create',
  'charges.access',
  'charges.create',
  'extracts.access',
  'extracts.view_all'
];

async function testarCriacaoUsuario() {
  try {
    console.log('🧪 TESTE COMPLETO DE CRIAÇÃO DE USUÁRIO');
    console.log('=====================================');
    
    // 1. Fazer login como admin
    console.log('\n🔐 Fazendo login como admin...');
    const adminCredential = await signInWithEmailAndPassword(
      auth, 
      'admin@autoescolaideal.com', 
      '123456'
    );
    console.log('✅ Login realizado:', adminCredential.user.email);
    
    // 2. Dados do usuário de teste
    const emailTeste = `teste.${Date.now()}@autoescola.com`;
    const dadosUsuario = {
      nome: 'Usuário Teste Completo',
      email: emailTeste,
      senha: '123456',
      perfil: 'teste',
      unidades: ['Aparecidinha', 'Julio de Mesquita'],
      permissions: PERMISSIONS_TESTE,
      ativo: true
    };
    
    console.log('\n📋 Dados do usuário de teste:', dadosUsuario);
    
    // 3. Criar usuário no Authentication
    console.log('\n🔐 Criando usuário no Firebase Authentication...');
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      dadosUsuario.email, 
      dadosUsuario.senha
    );
    
    console.log('✅ Usuário criado no Auth:', userCredential.user.uid);
    
    // 4. Preparar dados para Firestore
    const userData = {
      nome: dadosUsuario.nome,
      email: dadosUsuario.email,
      perfil: dadosUsuario.perfil,
      unidades: dadosUsuario.unidades,
      permissions: dadosUsuario.permissions,
      ativo: dadosUsuario.ativo,
      criadoEm: new Date(),
      updatedAt: new Date(),
      criadoPor: adminCredential.user.uid,
      criadoPorEmail: adminCredential.user.email,
      versao: '1.0',
      uid: userCredential.user.uid
    };
    
    // 5. Validar e limpar dados
    console.log('\n🔍 Validando dados antes de salvar...');
    const dadosValidados = validateAndCleanUserData(userData);
    
    // 6. Salvar no Firestore
    console.log('\n💾 Salvando no Firestore...');
    await setDoc(doc(db, 'usuarios', userCredential.user.uid), dadosValidados);
    console.log('✅ Dados salvos no Firestore!');
    
    // 7. Verificar se foi salvo corretamente
    console.log('\n🔍 Verificando dados salvos...');
    const docSalvo = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
    
    if (docSalvo.exists()) {
      const dadosSalvos = docSalvo.data();
      console.log('✅ Documento encontrado no Firestore!');
      console.log('📋 Dados salvos:', {
        nome: dadosSalvos.nome,
        email: dadosSalvos.email,
        perfil: dadosSalvos.perfil,
        ativo: dadosSalvos.ativo,
        unidades: dadosSalvos.unidades,
        permissions: dadosSalvos.permissions,
        criadoEm: dadosSalvos.criadoEm,
        updatedAt: dadosSalvos.updatedAt
      });
    } else {
      console.log('❌ Documento não encontrado no Firestore!');
    }
    
    // 8. Listar todos os usuários
    console.log('\n📊 Listando todos os usuários...');
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    console.log(`✅ Total de usuários no sistema: ${usuariosSnapshot.docs.length}`);
    
    usuariosSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.nome} (${data.email}) - ${data.perfil} - ${data.ativo ? 'Ativo' : 'Inativo'}`);
    });
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('📧 Email do usuário criado:', emailTeste);
    console.log('🔑 Senha:', dadosUsuario.senha);
    
    return {
      success: true,
      uid: userCredential.user.uid,
      email: emailTeste
    };
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    console.error('🔍 Detalhes:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar teste
testarCriacaoUsuario()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Teste passou! Usuário criado com sucesso.');
      console.log('🆔 UID:', result.uid);
      console.log('📧 Email:', result.email);
    } else {
      console.log('\n❌ Teste falhou:', result.error);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  }); 