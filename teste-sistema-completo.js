const { initializeApp } = require('firebase/app');
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

async function criarDadosIniciais() {
  try {
    console.log('🏗️ CRIANDO DADOS INICIAIS DO SISTEMA');
    console.log('===================================');
    
    // 1. Criar unidades
    console.log('\n🏢 Criando unidades...');
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
    
    // 2. Criar algumas mensagens de exemplo
    console.log('\n📱 Criando mensagens de exemplo...');
    const mensagensExemplo = [
      {
        unidade: 'Aparecidinha',
        destinatario: '11999999999',
        mensagem: 'Olá! Sua aula está agendada para amanhã às 14h.',
        status: 'enviada',
        createdAt: new Date(),
        tipo: 'agendamento'
      },
      {
        unidade: 'Julio de Mesquita',
        destinatario: '11888888888',
        mensagem: 'Lembrete: Pagamento da mensalidade vence hoje.',
        status: 'enviada',
        createdAt: new Date(),
        tipo: 'cobranca'
      },
      {
        unidade: 'Coop',
        destinatario: '11777777777',
        mensagem: 'Parabéns! Você foi aprovado no exame.',
        status: 'enviada',
        createdAt: new Date(),
        tipo: 'aprovacao'
      }
    ];
    
    for (let i = 0; i < mensagensExemplo.length; i++) {
      await setDoc(doc(db, 'messages', `msg_${i + 1}`), mensagensExemplo[i]);
      console.log(`✅ Mensagem criada: ${mensagensExemplo[i].tipo}`);
    }
    
    // 3. Criar algumas cobranças de exemplo
    console.log('\n💰 Criando cobranças de exemplo...');
    const cobrancasExemplo = [
      {
        unidade: 'Aparecidinha',
        cliente: 'João Silva',
        valor: 350.00,
        vencimento: new Date('2025-01-15'),
        status: 'pendente',
        createdAt: new Date(),
        tipo: 'mensalidade'
      },
      {
        unidade: 'Julio de Mesquita',
        cliente: 'Maria Santos',
        valor: 150.00,
        vencimento: new Date('2025-01-20'),
        status: 'pago',
        createdAt: new Date(),
        tipo: 'taxa_exame'
      }
    ];
    
    for (let i = 0; i < cobrancasExemplo.length; i++) {
      await setDoc(doc(db, 'charges', `charge_${i + 1}`), cobrancasExemplo[i]);
      console.log(`✅ Cobrança criada: ${cobrancasExemplo[i].tipo}`);
    }
    
    // 4. Criar algumas contas BTG de exemplo
    console.log('\n🏦 Criando contas BTG de exemplo...');
    const contasBTGExemplo = [
      {
        unidade: 'Aparecidinha',
        cliente: 'João Silva',
        numeroConta: '12345-6',
        agencia: '0001',
        banco: 'BTG Pactual',
        status: 'ativa',
        createdAt: new Date()
      },
      {
        unidade: 'Julio de Mesquita',
        cliente: 'Maria Santos',
        numeroConta: '78901-2',
        agencia: '0001',
        banco: 'BTG Pactual',
        status: 'ativa',
        createdAt: new Date()
      }
    ];
    
    for (let i = 0; i < contasBTGExemplo.length; i++) {
      await setDoc(doc(db, 'btg_accounts', `btg_${i + 1}`), contasBTGExemplo[i]);
      console.log(`✅ Conta BTG criada: ${contasBTGExemplo[i].cliente}`);
    }
    
    console.log('\n🎉 DADOS INICIAIS CRIADOS COM SUCESSO!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao criar dados iniciais:', error.message);
    return false;
  }
}

async function testarConsultas() {
  try {
    console.log('\n🧪 TESTANDO CONSULTAS COM ÍNDICES');
    console.log('=================================');
    
    // Testar consulta de mensagens por unidade
    console.log('\n📱 Testando consulta de mensagens...');
    const mensagensQuery = query(
      collection(db, 'messages'),
      where('unidade', '==', 'Aparecidinha')
    );
    const mensagensSnapshot = await getDocs(mensagensQuery);
    console.log(`✅ Encontradas ${mensagensSnapshot.size} mensagens para Aparecidinha`);
    
    // Testar consulta de cobranças por unidade
    console.log('\n💰 Testando consulta de cobranças...');
    const cobrancasQuery = query(
      collection(db, 'charges'),
      where('unidade', '==', 'Aparecidinha')
    );
    const cobrancasSnapshot = await getDocs(cobrancasQuery);
    console.log(`✅ Encontradas ${cobrancasSnapshot.size} cobranças para Aparecidinha`);
    
    // Listar usuários
    console.log('\n👥 Testando consulta de usuários...');
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    console.log(`✅ Encontrados ${usuariosSnapshot.size} usuários`);
    
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`👤 ${data.email} - ${data.perfil} - ${data.unidades?.join(', ') || 'N/A'}`);
    });
    
    console.log('\n🎉 TODAS AS CONSULTAS FUNCIONANDO!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro nas consultas:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 TESTE COMPLETO DO SISTEMA');
  console.log('============================');
  
  // Criar dados iniciais
  const dadosOK = await criarDadosIniciais();
  if (!dadosOK) {
    console.log('❌ Falha ao criar dados iniciais');
    return;
  }
  
  // Testar consultas
  const consultasOK = await testarConsultas();
  if (!consultasOK) {
    console.log('❌ Falha nas consultas');
    return;
  }
  
  console.log('\n✅ SISTEMA TOTALMENTE FUNCIONAL!');
  console.log('\n🔥 PRÓXIMOS PASSOS:');
  console.log('1. Recarregue o navegador (F5)');
  console.log('2. Acesse o Dashboard - deve carregar sem erros');
  console.log('3. Teste "Gerenciar Usuários" - deve funcionar');
  console.log('4. Teste todas as outras páginas');
  console.log('5. Volte para regras seguras do Firestore');
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  criarDadosIniciais,
  testarConsultas
}; 