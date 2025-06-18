const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, getDocs } = require('firebase/firestore');

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

async function debugAuthContext() {
  try {
    console.log('🔍 DEBUG DO CONTEXTO DE AUTENTICAÇÃO');
    console.log('====================================');
    
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    
    console.log(`📊 Total de usuários: ${usuariosSnapshot.size}`);
    
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === 'admin@autoescolaideal.com') {
        console.log('\n🔍 ADMIN ENCONTRADO:');
        console.log(`🆔 ID: ${doc.id}`);
        console.log(`📧 Email: ${data.email}`);
        console.log(`👤 Nome: ${data.nome}`);
        console.log(`🏷️ Perfil: ${data.perfil}`);
        console.log(`🔐 Campo permissions: ${data.permissions ? 'EXISTE' : 'NÃO EXISTE'}`);
        console.log(`🔐 Campo permissoes: ${data.permissoes ? 'EXISTE' : 'NÃO EXISTE'}`);
        console.log(`👑 Acesso Total: ${data.acessoTotal || false}`);
        console.log(`🏢 Unidades: ${data.unidades?.length || 0}`);
        console.log(`✅ Ativo: ${data.ativo}`);
        
        // Verificar ambos os campos de permissões
        if (data.permissions) {
          console.log('\n🔐 PERMISSÕES (campo "permissions"):');
          console.log(`📊 Total: ${data.permissions.length}`);
          data.permissions.forEach((perm, index) => {
            console.log(`${index + 1}. ${perm}`);
          });
          
          // Verificar permissão específica
          if (data.permissions.includes('users.view')) {
            console.log('✅ Permissão "users.view" ENCONTRADA!');
          } else {
            console.log('❌ Permissão "users.view" NÃO encontrada!');
          }
        }
        
        if (data.permissoes) {
          console.log('\n🔐 PERMISSÕES (campo "permissoes"):');
          console.log(`📊 Total: ${data.permissoes.length}`);
          data.permissoes.forEach((perm, index) => {
            console.log(`${index + 1}. ${perm}`);
          });
        }
        
        // Verificar estrutura completa
        console.log('\n📋 ESTRUTURA COMPLETA DO DOCUMENTO:');
        console.log(JSON.stringify(data, null, 2));
      }
    });
    
    // Simular o que o AuthContext faz
    console.log('\n🔧 SIMULANDO AUTHCONTEXT...');
    
    const adminData = usuariosSnapshot.docs.find(doc => 
      doc.data().email === 'admin@autoescolaideal.com'
    )?.data();
    
    if (adminData) {
      // Simular a função getPermissionsByProfile
      const getPermissionsByProfile = (profile) => {
        const profiles = {
          admin: [
            'dashboard.view', 'dashboard.all_units',
            'messages.view', 'messages.send', 'messages.history',
            'btg_accounts.view', 'btg_accounts.create', 'btg_accounts.edit', 'btg_accounts.delete',
            'charges.view', 'charges.create', 'charges.edit', 'charges.delete',
            'extracts.view', 'extracts.export', 'extracts.all_units',
            'settings.view', 'settings.sheets', 'settings.system',
            'users.view', 'users.create', 'users.edit', 'users.delete', 'users.permissions'
          ]
        };
        return profiles[profile] || [];
      };
      
      // Simular o que o AuthContext faz
      const userWithPermissions = {
        ...adminData,
        permissions: adminData.permissions || getPermissionsByProfile(adminData.perfil)
      };
      
      console.log('🔧 DADOS PROCESSADOS PELO AUTHCONTEXT:');
      console.log(`📧 Email: ${userWithPermissions.email}`);
      console.log(`🏷️ Perfil: ${userWithPermissions.perfil}`);
      console.log(`🔐 Permissões finais: ${userWithPermissions.permissions?.length || 0}`);
      
      // Simular hasPermission
      const hasPermission = (userPermissions, permission) => {
        if (!userPermissions || !Array.isArray(userPermissions)) {
          return false;
        }
        return userPermissions.includes(permission);
      };
      
      const temPermissaoUsuarios = hasPermission(userWithPermissions.permissions, 'users.view');
      console.log(`🔍 hasPermission('users.view'): ${temPermissaoUsuarios}`);
      
      if (temPermissaoUsuarios) {
        console.log('✅ O MENU "GERENCIAR USUÁRIOS" DEVE APARECER!');
      } else {
        console.log('❌ O MENU "GERENCIAR USUÁRIOS" NÃO VAI APARECER!');
        console.log('🔧 PROBLEMA: Permissão "users.view" não encontrada');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
  }
}

async function main() {
  console.log('🔍 DEBUG DO CONTEXTO DE AUTENTICAÇÃO');
  console.log('====================================');
  
  await debugAuthContext();
  
  console.log('\n🎯 CONCLUSÃO:');
  console.log('Se o admin tem a permissão "users.view", o problema pode ser:');
  console.log('1. Cache do navegador');
  console.log('2. AuthContext não está recarregando após mudanças');
  console.log('3. Problema na função hasPermission');
  console.log('4. Problema no filtro do menu');
  
  console.log('\n🔥 SOLUÇÕES:');
  console.log('1. Faça LOGOUT completo');
  console.log('2. Limpe cache (Ctrl+Shift+R)');
  console.log('3. Faça LOGIN novamente');
  console.log('4. Se não funcionar, reinicie o servidor React');
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  debugAuthContext
}; 