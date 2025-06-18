const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, getDocs, updateDoc, query, where } = require('firebase/firestore');

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

async function recuperarAdminSeguro() {
  try {
    console.log('🔧 RECUPERAÇÃO SEGURA DO ADMIN');
    console.log('==============================');
    console.log('⚠️ ESTE SCRIPT NÃO DELETA NADA - APENAS ADICIONA/ATUALIZA');
    
    // 1. Verificar se existem usuários com o email do admin
    console.log('\n🔍 Verificando admins existentes...');
    
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
      console.log('\n✅ ADMINS EXISTENTES ENCONTRADOS:');
      
      for (let i = 0; i < adminsEncontrados.length; i++) {
        const admin = adminsEncontrados[i];
        console.log(`\n👤 Admin ${i + 1}:`);
        console.log(`🆔 ID: ${admin.id}`);
        console.log(`👤 Nome: ${admin.data.nome || 'N/A'}`);
        console.log(`📧 Email: ${admin.data.email}`);
        console.log(`🏷️ Perfil: ${admin.data.perfil || 'N/A'}`);
        console.log(`🔐 Permissões: ${admin.data.permissoes?.length || admin.data.permissions?.length || 0}`);
        console.log(`🏢 Unidades: ${admin.data.unidades?.length || 0}`);
        
        // Verificar se precisa de atualização
        const precisaAtualizacao = 
          !admin.data.permissoes || admin.data.permissoes.length < todasPermissoes.length ||
          !admin.data.unidades || admin.data.unidades.length < unidades.length ||
          admin.data.perfil !== 'admin';
          
        if (precisaAtualizacao) {
          console.log('🔄 Este admin precisa de atualização...');
          
          // Atualizar com todos os dados necessários
          const dadosAtualizados = {
            ...admin.data, // Manter dados existentes
            nome: admin.data.nome || 'Administrador Total',
            perfil: 'admin',
            unidades: unidades,
            permissoes: todasPermissoes,
            permissions: todasPermissoes, // Compatibilidade
            ativo: true,
            acessoTotal: true,
            atualizadoEm: new Date(),
            // Campos extras para garantir compatibilidade
            role: 'admin',
            isAdmin: true,
            superUser: true,
            versaoAtualizada: '2.0'
          };
          
          await updateDoc(doc(db, 'usuarios', admin.id), dadosAtualizados);
          console.log(`✅ Admin ${admin.id} atualizado com sucesso!`);
          
        } else {
          console.log('✅ Este admin já está completo!');
        }
      }
      
    } else {
      console.log('\n❌ NENHUM ADMIN ENCONTRADO');
      console.log('🔧 Isso significa que o admin foi deletado pelo script anterior.');
      console.log('💡 SOLUÇÃO: Vamos procurar qualquer admin no Authentication...');
      
      // Se não tem admin no Firestore, criar um básico
      console.log('\n📝 Criando admin básico no Firestore...');
      
      const dadosAdmin = {
        email: 'admin@autoescolaideal.com',
        nome: 'Administrador Total',
        perfil: 'admin',
        unidades: unidades,
        ativo: true,
        permissoes: todasPermissoes,
        permissions: todasPermissoes, // Compatibilidade
        acessoTotal: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        // Campos extras para garantir compatibilidade
        role: 'admin',
        isAdmin: true,
        superUser: true,
        versao: '2.0',
        observacao: 'Criado pelo script de recuperação'
      };
      
      // Tentar vários IDs possíveis
      const possiveisIds = [
        'admin_total',
        'admin_autoescolaideal_com',
        'admin_sistema',
        'admin_recuperado'
      ];
      
      for (const adminId of possiveisIds) {
        try {
          await setDoc(doc(db, 'usuarios', adminId), dadosAdmin);
          console.log(`✅ Admin criado com ID: ${adminId}`);
        } catch (error) {
          console.log(`⚠️ Erro ao criar com ID ${adminId}:`, error.message);
        }
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro na recuperação:', error.message);
    return false;
  }
}

async function verificarStatusFinal() {
  try {
    console.log('\n🔍 VERIFICAÇÃO FINAL...');
    
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    let adminsCompletos = 0;
    
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === 'admin@autoescolaideal.com') {
        console.log(`\n✅ Admin verificado: ${doc.id}`);
        console.log(`📧 Email: ${data.email}`);
        console.log(`🏷️ Perfil: ${data.perfil}`);
        console.log(`🔐 Permissões: ${data.permissoes?.length || data.permissions?.length || 0}`);
        console.log(`🏢 Unidades: ${data.unidades?.length || 0}`);
        
        if (data.permissoes?.includes('gerenciar_usuarios') || data.permissions?.includes('gerenciar_usuarios')) {
          console.log('✅ Permissão "gerenciar_usuarios" CONFIRMADA!');
          adminsCompletos++;
        }
      }
    });
    
    console.log(`\n📊 Total de admins completos: ${adminsCompletos}`);
    
    return adminsCompletos > 0;
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 RECUPERAÇÃO SEGURA DO ADMIN');
  console.log('===============================');
  console.log('⚠️ IMPORTANTE: Este script NÃO deleta admins existentes');
  console.log('✅ Apenas adiciona ou atualiza dados necessários\n');
  
  const sucesso = await recuperarAdminSeguro();
  
  if (sucesso) {
    const adminCompleto = await verificarStatusFinal();
    
    if (adminCompleto) {
      console.log('\n🎉 ADMIN RECUPERADO/ATUALIZADO COM SUCESSO!');
      console.log('\n🔑 CREDENCIAIS DO ADMIN:');
      console.log('📧 Email: admin@autoescolaideal.com');
      console.log('🔑 Senha: (use a senha que você já tinha configurado)');
      
      console.log('\n🎯 PRÓXIMOS PASSOS:');
      console.log('1. Faça login no sistema com as credenciais do admin');
      console.log('2. Teste se consegue acessar "Gerenciar Usuários"');
      console.log('3. Se não conseguir, verifique se o usuário existe no Authentication do Firebase');
      
    } else {
      console.log('\n⚠️ Admin criado no Firestore, mas pode não existir no Authentication');
      console.log('🔧 Verifique: https://console.firebase.google.com/project/sistema-ideal-dbffd/authentication/users');
    }
    
  } else {
    console.log('\n❌ Falha na recuperação. Verifique as regras do Firestore.');
  }
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  recuperarAdminSeguro,
  verificarStatusFinal
}; 