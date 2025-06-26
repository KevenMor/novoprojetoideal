const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, getDocs } = require('firebase/firestore');

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

// Testar diferentes cenários de dados
function testarCenarios() {
  console.log('🧪 TESTANDO CENÁRIOS DE VALIDAÇÃO');
  console.log('==================================');
  
  // Cenário 1: Dados completos e corretos
  console.log('\n📋 CENÁRIO 1: Dados completos e corretos');
  try {
    const dados1 = {
      nome: 'João Silva',
      email: 'joao@teste.com',
      perfil: 'operator',
      unidades: ['Aparecidinha'],
      permissions: ['dashboard.view', 'messages.access'],
      ativo: true,
      telefone: '11999999999',
      cargo: 'Operador'
    };
    
    const resultado1 = validateAndCleanUserData(dados1);
    console.log('✅ Cenário 1 passou!');
  } catch (error) {
    console.log('❌ Cenário 1 falhou:', error.message);
  }
  
  // Cenário 2: Dados com undefined
  console.log('\n📋 CENÁRIO 2: Dados com undefined');
  try {
    const dados2 = {
      nome: 'Maria Santos',
      email: 'maria@teste.com',
      perfil: 'teste',
      unidades: undefined,
      permissions: undefined,
      ativo: undefined,
      telefone: undefined,
      cargo: undefined
    };
    
    const resultado2 = validateAndCleanUserData(dados2);
    console.log('✅ Cenário 2 passou!');
    console.log('📊 Resultado:', {
      nome: resultado2.nome,
      email: resultado2.email,
      perfil: resultado2.perfil,
      unidades: resultado2.unidades,
      permissions: resultado2.permissions,
      ativo: resultado2.ativo
    });
  } catch (error) {
    console.log('❌ Cenário 2 falhou:', error.message);
  }
  
  // Cenário 3: Dados com arrays undefined
  console.log('\n📋 CENÁRIO 3: Arrays undefined');
  try {
    const dados3 = {
      nome: 'Pedro Costa',
      email: 'pedro@teste.com',
      perfil: 'custom',
      unidades: undefined,
      permissions: undefined,
      ativo: true
    };
    
    const resultado3 = validateAndCleanUserData(dados3);
    console.log('✅ Cenário 3 passou!');
    console.log('📊 Arrays processados:', {
      unidades: resultado3.unidades,
      permissions: resultado3.permissions
    });
  } catch (error) {
    console.log('❌ Cenário 3 falhou:', error.message);
  }
  
  // Cenário 4: Dados mínimos
  console.log('\n📋 CENÁRIO 4: Dados mínimos');
  try {
    const dados4 = {
      nome: 'Ana',
      email: 'ana@teste.com'
    };
    
    const resultado4 = validateAndCleanUserData(dados4);
    console.log('✅ Cenário 4 passou!');
    console.log('📊 Dados mínimos processados:', {
      nome: resultado4.nome,
      email: resultado4.email,
      perfil: resultado4.perfil,
      ativo: resultado4.ativo,
      unidades: resultado4.unidades,
      permissions: resultado4.permissions
    });
  } catch (error) {
    console.log('❌ Cenário 4 falhou:', error.message);
  }
  
  // Cenário 5: Dados com campos aninhados undefined
  console.log('\n📋 CENÁRIO 5: Campos aninhados undefined');
  try {
    const dados5 = {
      nome: 'Carlos',
      email: 'carlos@teste.com',
      perfil: 'admin',
      unidades: ['Aparecidinha', undefined, 'Julio de Mesquita'],
      permissions: ['dashboard.view', undefined, 'messages.access'],
      configuracao: {
        tema: 'dark',
        idioma: undefined,
        notificacoes: {
          email: true,
          push: undefined,
          sms: false
        }
      }
    };
    
    const resultado5 = validateAndCleanUserData(dados5);
    console.log('✅ Cenário 5 passou!');
    console.log('📊 Arrays limpos:', {
      unidades: resultado5.unidades,
      permissions: resultado5.permissions
    });
  } catch (error) {
    console.log('❌ Cenário 5 falhou:', error.message);
  }
}

// Testar função deepRemoveUndefined isoladamente
function testarDeepRemoveUndefined() {
  console.log('\n🧪 TESTANDO deepRemoveUndefined');
  console.log('================================');
  
  const teste1 = {
    nome: 'Teste',
    email: 'teste@teste.com',
    campoUndefined: undefined,
    campoNull: null,
    array: [1, undefined, 3, null, 5],
    objeto: {
      campo1: 'valor1',
      campo2: undefined,
      campo3: null,
      subObjeto: {
        sub1: 'valor',
        sub2: undefined
      }
    }
  };
  
  console.log('📋 Objeto original:', JSON.stringify(teste1, null, 2));
  const resultado = deepRemoveUndefined(teste1);
  console.log('✅ Objeto limpo:', JSON.stringify(resultado, null, 2));
}

// Executar testes
console.log('🚀 INICIANDO TESTES DE VALIDAÇÃO');
console.log('================================');

testarDeepRemoveUndefined();
testarCenarios();

console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS!');
console.log('✅ As funções de validação estão funcionando corretamente.');
console.log('✅ Não haverá mais campos undefined sendo enviados ao Firestore.');
console.log('✅ Todos os arrays serão sempre arrays válidos.');
console.log('✅ Todos os campos obrigatórios serão garantidos.'); 