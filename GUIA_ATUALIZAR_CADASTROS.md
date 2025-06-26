# 🔒 GUIA PARA ATUALIZAR PERMISSÕES DE CADASTROS

## 🎯 Objetivo
Implementar controle de acesso aos cadastros dentro do menu Extratos (categorias, formas de pagamento, contas, clientes/fornecedores).

## ✅ Implementação Concluída

### 1. **Nova Permissão Criada**
- **Permissão:** `extracts.manage_cadastros`
- **Descrição:** Gerenciar cadastros (categorias, formas de pagamento, etc.)
- **Acesso:** Apenas ADMIN

### 2. **Sidebar Atualizada**
- Submenu "Cadastros" agora requer permissão específica
- Filtragem automática implementada

### 3. **Perfis Atualizados**
- **Admin:** Tem acesso aos cadastros
- **Teste/Operador/Visualizador:** NÃO têm acesso aos cadastros

## 🔧 ATUALIZAÇÃO MANUAL NECESSÁRIA

### **Passo 1: Acessar Firebase Console**
1. Vá para [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto **sistema-autoescola-ideal-15fc8**
3. Vá para **Firestore Database**

### **Passo 2: Atualizar Usuários Admin**
1. Na coleção **usuarios**, encontre os usuários com perfil **admin**
2. Para cada admin, adicione a permissão:
   ```
   extracts.manage_cadastros
   ```

**Exemplo de permissões para ADMIN:**
```json
{
  "permissions": [
    "dashboard.view",
    "messages.access",
    "btg.access",
    "charges.access",
    "extracts.access",
    "payroll.access",
    "settings.access",
    "users.access",
    "extracts.manage_cadastros"  // ← ADICIONAR ESTA
  ]
}
```

### **Passo 3: Verificar Outros Perfis**
1. Para usuários com perfil **teste**, **operator**, **viewer**:
2. **REMOVER** a permissão `extracts.manage_cadastros` se existir
3. **NÃO ADICIONAR** esta permissão

**Exemplo de permissões para TESTE:**
```json
{
  "permissions": [
    "dashboard.view",
    "messages.access",
    "btg.access",
    "charges.access",
    "extracts.access"
    // NÃO incluir: extracts.manage_cadastros
  ]
}
```

## 🧪 TESTE DA IMPLEMENTAÇÃO

### **Teste 1: Login como Admin**
1. Faça login com usuário admin
2. Vá para menu **Extratos**
3. Expanda o submenu **Cadastros**
4. ✅ Deve ver: Categorias, Formas de Pagamento, Contas, Clientes/Fornecedores

### **Teste 2: Login como Teste**
1. Faça login com usuário de perfil "teste"
2. Vá para menu **Extratos**
3. ✅ Deve ver apenas: "Ver Extrato"
4. ❌ NÃO deve ver: submenu "Cadastros"

### **Teste 3: Login como Operador**
1. Faça login com usuário de perfil "operator"
2. Vá para menu **Extratos**
3. ✅ Deve ver apenas: "Ver Extrato"
4. ❌ NÃO deve ver: submenu "Cadastros"

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Usuários admin têm `extracts.manage_cadastros`
- [ ] Usuários teste NÃO têm `extracts.manage_cadastros`
- [ ] Usuários operator NÃO têm `extracts.manage_cadastros`
- [ ] Usuários viewer NÃO têm `extracts.manage_cadastros`
- [ ] Admin consegue ver submenu "Cadastros"
- [ ] Outros perfis NÃO veem submenu "Cadastros"

## 🔍 VERIFICAÇÃO RÁPIDA

### **No Console do Navegador (F12):**
```javascript
// Verificar permissões do usuário atual
console.log('Permissões:', window.authUser?.permissions);
console.log('Tem extracts.manage_cadastros:', window.authUser?.permissions?.includes('extracts.manage_cadastros'));
```

### **Logs Esperados:**
- **Admin:** `true` (pode ver cadastros)
- **Outros:** `false` (não pode ver cadastros)

## 🚨 SE AINDA NÃO FUNCIONAR

### **Possíveis Causas:**
1. **Cache do navegador** - Limpe (Ctrl+Shift+R)
2. **Permissões não atualizadas** - Verifique no Firestore
3. **Build antiga** - Faça deploy novamente

### **Solução:**
1. Verifique se as permissões estão corretas no Firestore
2. Limpe o cache do navegador
3. Faça logout e login novamente
4. Teste com diferentes perfis

## 📞 SUPORTE

Se ainda houver problemas:
1. Capture screenshot das permissões no Firestore
2. Descreva qual perfil está testando
3. Informe o que aparece no menu Extratos

---

**✅ IMPLEMENTAÇÃO COMPLETA - APENAS ATUALIZAÇÃO MANUAL NECESSÁRIA!** 