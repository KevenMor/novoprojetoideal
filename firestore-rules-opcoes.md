# 🔒 Opções de Regras do Firestore (Sem Limitação de Tempo)

## 1. 🚀 Regra Simples - Acesso Total para Usuários Autenticados

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Vantagens:**
- Simples e funcional
- Qualquer usuário logado pode acessar tudo
- Ideal para desenvolvimento e sistemas internos

**Desvantagens:**
- Todos os usuários têm acesso total
- Menos seguro para dados sensíveis

---

## 2. 🛡️ Regra com Controle de Perfis (Recomendada)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função para verificar se é admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil == 'admin';
    }
    
    // Função para verificar se é manager ou admin
    function isManagerOrAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil in ['admin', 'manager'];
    }
    
    // Regras para usuários
    match /usuarios/{userId} {
      // Admin pode criar/editar todos os usuários
      allow read, write: if isAdmin();
      // Usuários podem ler apenas seu próprio perfil
      allow read: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regras para outras coleções (mensagens, cobranças, etc.)
    match /{collection}/{document} {
      // Manager e Admin têm acesso total
      allow read, write: if isManagerOrAdmin();
      // Outros usuários autenticados têm acesso de leitura
      allow read: if request.auth != null;
    }
    
    // Regras para logs de auditoria (apenas admin)
    match /audit_log/{logId} {
      allow read, write: if isAdmin();
    }
  }
}
```

**Vantagens:**
- Controle granular por perfil
- Admins podem gerenciar usuários
- Managers têm acesso operacional
- Usuários comuns têm acesso limitado

---

## 3. 🔓 Regra Totalmente Aberta (Apenas para Desenvolvimento)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ CUIDADO:** Esta regra permite acesso total sem autenticação. Use apenas em desenvolvimento!

---

## 4. 🏢 Regra com Controle de Unidades (Mais Avançada)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função para verificar se é admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil == 'admin';
    }
    
    // Função para verificar se tem acesso à unidade
    function hasUnitAccess(unitName) {
      return request.auth != null && 
             unitName in get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.unidades;
    }
    
    // Regras para usuários
    match /usuarios/{userId} {
      allow read, write: if isAdmin();
      allow read: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regras para dados com controle de unidade
    match /charges/{chargeId} {
      allow read, write: if isAdmin() || hasUnitAccess(resource.data.unidade);
    }
    
    match /btg_accounts/{accountId} {
      allow read, write: if isAdmin() || hasUnitAccess(resource.data.unidade);
    }
    
    // Outras coleções
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📋 Recomendação

Para o seu sistema, recomendo começar com a **Opção 1** (usuários autenticados) e depois evoluir para a **Opção 2** (controle de perfis) quando quiser mais segurança.

## 🔄 Como Trocar as Regras

1. Acesse o Firebase Console
2. Vá em Firestore Database → Regras
3. Cole a nova regra
4. Clique em "Publicar"

As mudanças são aplicadas imediatamente! 