const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, updateDoc } = require('firebase/firestore');

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

// Regras temporárias para configuração
const REGRAS_TEMPORARIAS = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acesso total durante configuração
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

// Regras seguras para produção
const REGRAS_SEGURAS = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função para verificar se o usuário é admin
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/usuarios/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil == 'admin' &&
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.ativo == true;
    }
    
    // Função para verificar se o usuário está ativo
    function isActiveUser() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/usuarios/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.ativo == true;
    }
    
    // Função para verificar se o usuário tem uma permissão específica
    function hasPermission(permission) {
      return request.auth != null && 
             exists(/databases/$(database)/documents/usuarios/$(request.auth.uid)) &&
             permission in get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.permissions;
    }
    
    // Função para verificar se é o próprio usuário
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // ========================================
    // COLEÇÃO: usuarios
    // ========================================
    match /usuarios/{userId} {
      // LEITURA: Admin pode ler todos, usuário pode ler apenas o próprio
      allow read: if isAdmin() || isOwner(userId);
      
      // CRIAÇÃO: Apenas admin pode criar novos usuários
      allow create: if isAdmin() && 
                       request.resource.data.keys().hasAll(['nome', 'email', 'perfil', 'ativo', 'permissions']) &&
                       request.resource.data.nome is string &&
                       request.resource.data.email is string &&
                       request.resource.data.perfil in ['admin', 'manager', 'operator', 'viewer', 'teste', 'custom'] &&
                       request.resource.data.ativo is bool &&
                       request.resource.data.permissions is list;
      
      // ATUALIZAÇÃO: Admin pode atualizar todos, usuário pode atualizar apenas dados básicos próprios
      allow update: if (isAdmin()) || 
                       (isOwner(userId) && 
                        !('perfil' in request.resource.data.diff(resource.data).affectedKeys()) &&
                        !('permissions' in request.resource.data.diff(resource.data).affectedKeys()) &&
                        !('ativo' in request.resource.data.diff(resource.data).affectedKeys()));
      
      // EXCLUSÃO: Apenas admin pode excluir usuários
      allow delete: if isAdmin();
    }
    
    // ========================================
    // COLEÇÃO: mensagens
    // ========================================
    match /mensagens/{messageId} {
      allow read: if isActiveUser() && hasPermission('messages.access');
      allow create: if isActiveUser() && hasPermission('messages.send');
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // ========================================
    // COLEÇÃO: contas_btg
    // ========================================
    match /contas_btg/{accountId} {
      allow read: if isActiveUser() && 
                     (hasPermission('btg.view_all') || 
                      (hasPermission('btg.view_own') && resource.data.criadoPor == request.auth.uid));
      allow create: if isActiveUser() && hasPermission('btg.create');
      allow update: if isActiveUser() && 
                       (hasPermission('btg.edit') && 
                        (hasPermission('btg.view_all') || resource.data.criadoPor == request.auth.uid));
      allow delete: if isAdmin() && hasPermission('btg.delete');
    }
    
    // ========================================
    // COLEÇÃO: cobrancas
    // ========================================
    match /cobrancas/{chargeId} {
      allow read: if isActiveUser() && 
                     (hasPermission('charges.view_all') || 
                      (hasPermission('charges.view_own') && resource.data.criadoPor == request.auth.uid));
      allow create: if isActiveUser() && hasPermission('charges.create');
      allow update: if isActiveUser() && 
                       (hasPermission('charges.edit') && 
                        (hasPermission('charges.view_all') || resource.data.criadoPor == request.auth.uid));
      allow delete: if isAdmin() && hasPermission('charges.delete');
    }
    
    // ========================================
    // COLEÇÃO: lancamentos
    // ========================================
    match /lancamentos/{lancamentoId} {
      allow read: if isActiveUser() && 
                     (hasPermission('extracts.view_all') || 
                      (hasPermission('extracts.view_own') && resource.data.criadoPor == request.auth.uid));
      allow create: if isActiveUser() && hasPermission('extracts.create');
      allow update: if isActiveUser() && 
                       (hasPermission('extracts.edit') && 
                        (hasPermission('extracts.view_all') || resource.data.criadoPor == request.auth.uid));
      allow delete: if isAdmin() && hasPermission('extracts.delete');
    }
    
    // ========================================
    // OUTRAS COLEÇÕES
    // ========================================
    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}`;

async function aplicarRegrasTemporarias() {
  try {
    console.log('🔧 APLICANDO REGRAS TEMPORÁRIAS PARA CONFIGURAÇÃO');
    console.log('==================================================');
    
    // Aqui você precisaria usar o Firebase CLI para aplicar as regras
    // Por enquanto, vou criar um arquivo com as regras
    const fs = require('fs');
    
    // Salvar regras temporárias
    fs.writeFileSync('firestore-rules-temporarias.rules', REGRAS_TEMPORARIAS);
    console.log('✅ Regras temporárias salvas em: firestore-rules-temporarias.rules');
    
    // Salvar regras seguras
    fs.writeFileSync('firestore-rules-seguras.rules', REGRAS_SEGURAS);
    console.log('✅ Regras seguras salvas em: firestore-rules-seguras.rules');
    
    console.log('\n📝 INSTRUÇÕES PARA APLICAR AS REGRAS:');
    console.log('1. Execute: firebase deploy --only firestore:rules');
    console.log('2. Ou copie o conteúdo de firestore-rules-temporarias.rules para firestore.rules');
    console.log('3. Depois da configuração, restaure as regras seguras');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao aplicar regras:', error);
    return false;
  }
}

async function configurarUsuariosComRegrasTemporarias() {
  try {
    console.log('🚀 CONFIGURANDO USUÁRIOS COM REGRAS TEMPORÁRIAS');
    console.log('===============================================');
    
    // Primeiro, aplicar regras temporárias
    await aplicarRegrasTemporarias();
    
    // Agora executar a configuração dos usuários
    const { configurarUsuariosTeste } = require('./configurar-perfis-teste.js');
    const sucesso = await configurarUsuariosTeste();
    
    if (sucesso) {
      console.log('\n✅ CONFIGURAÇÃO CONCLUÍDA!');
      console.log('\n⚠️  IMPORTANTE: Restaure as regras seguras após a configuração!');
      console.log('   Execute: firebase deploy --only firestore:rules');
    }
    
    return sucesso;
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error);
    return false;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  configurarUsuariosComRegrasTemporarias().catch(console.error);
}

module.exports = {
  aplicarRegrasTemporarias,
  configurarUsuariosComRegrasTemporarias,
  REGRAS_TEMPORARIAS,
  REGRAS_SEGURAS
}; 