# 🔒 Configuração das Regras do Firestore

## Problema Identificado
O erro "Missing or insufficient permissions" indica que as regras de segurança do Firestore estão bloqueando o acesso à coleção `usuarios`.

## ⚠️ AÇÃO NECESSÁRIA: Configurar Regras no Firebase Console

### 1. Acesse o Firebase Console
1. Vá para [https://console.firebase.google.com](https://console.firebase.google.com)
2. Selecione o projeto: **sistema-autoescola-ideal-15fc8**
3. No menu lateral, clique em **Firestore Database**
4. Clique na aba **Regras** (Rules)

### 2. Substitua as Regras Atuais

Cole o código abaixo no editor de regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para a coleção de usuários
    match /usuarios/{userId} {
      // Permitir leitura e escrita para usuários autenticados
      allow read, write: if request.auth != null;
    }
    
    // Regras para mensagens
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Regras para cobranças
    match /charges/{chargeId} {
      allow read, write: if request.auth != null;
    }
    
    // Regras para contas BTG
    match /btg_accounts/{accountId} {
      allow read, write: if request.auth != null;
    }
    
    // Regras para logs de auditoria
    match /audit_log/{logId} {
      allow read, write: if request.auth != null;
    }
    
    // Regra padrão para outras coleções
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Publique as Regras
1. Clique no botão **Publicar** (Publish)
2. Confirme a publicação

## 🔧 Regras Mais Seguras (Recomendado para Produção)

Para um ambiente de produção, use regras mais específicas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Função para verificar se é admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil == 'admin';
    }
    
    // Função para verificar se é o próprio usuário
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // Regras para usuários
    match /usuarios/{userId} {
      // Admin pode ler/escrever todos os usuários
      allow read, write: if isAdmin();
      // Usuário pode ler apenas seu próprio perfil
      allow read: if isOwner(userId);
    }
    
    // Regras para mensagens
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Regras para cobranças
    match /charges/{chargeId} {
      allow read, write: if request.auth != null;
    }
    
    // Regras para contas BTG
    match /btg_accounts/{accountId} {
      allow read, write: if request.auth != null;
    }
    
    // Regras para logs de auditoria (apenas admin)
    match /audit_log/{logId} {
      allow read, write: if isAdmin();
    }
  }
}
```

## 🚨 Solução Temporária (Apenas para Desenvolvimento)

Se você precisar de uma solução rápida apenas para desenvolvimento, pode usar regras abertas (NÃO recomendado para produção):

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

## ✅ Verificação

Após configurar as regras:

1. Recarregue a página do sistema
2. Tente acessar "Gerenciar Usuários" novamente
3. Verifique o console do navegador para confirmar que não há mais erros de permissão

## 📋 Status das Correções Implementadas

- ✅ **Logs detalhados**: Sistema agora mostra exatamente onde está falhando
- ✅ **Tratamento de erros**: Mensagens específicas para cada tipo de erro
- ✅ **Fallback gracioso**: Interface não quebra mesmo com erro de permissão
- ✅ **Coleção corrigida**: Sistema usa 'usuarios' consistentemente

## 🔍 Debug

Se ainda houver problemas, verifique no console do navegador:
- Token de autenticação está sendo obtido
- Qual erro específico está ocorrendo
- Se as regras foram aplicadas corretamente

O sistema agora fornece logs detalhados para facilitar o diagnóstico! 