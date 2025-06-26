# 🔍 GUIA DE VERIFICAÇÃO DE PERMISSÕES

## 🎯 Problema Identificado
O menu "Folha de Pagamento" ainda aparece para usuários que não deveriam ter acesso.

## ✅ Lógica Corrigida
A lógica de permissões está funcionando corretamente (confirmado pelos testes). O problema pode estar nos dados do usuário no sistema.

## 🔍 PASSOS PARA VERIFICAR E CORRIGIR

### 1. **Verificar Console do Navegador**
1. Abra o sistema no navegador
2. Pressione **F12** para abrir as ferramentas do desenvolvedor
3. Vá para a aba **Console**
4. Faça login com um usuário de perfil "teste"
5. Procure por logs como:
   ```
   🔍 Menu "Contas BTG": ✅ VISÍVEL (permissão: btg.access)
     🔍 Submenu "Folha de Pagamento": ❌ OCULTO (permissão: payroll.access)
   ```

### 2. **Verificar Permissões do Usuário no Firestore**
1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Vá para **Firestore Database**
3. Procure pela coleção **usuarios**
4. Encontre o documento do usuário que está testando
5. Verifique o campo **permissions**

**Permissões corretas para perfil "teste":**
```json
{
  "permissions": [
    "dashboard.view",
    "messages.access", 
    "btg.access",
    "charges.access",
    "extracts.access"
  ]
}
```

**❌ NÃO deve ter:**
- `payroll.access`
- `settings.access` 
- `users.access`

### 3. **Verificar AuthContext**
1. No console do navegador, digite:
   ```javascript
   // Verificar se o AuthContext está carregando as permissões
   console.log('Usuário atual:', window.authUser);
   console.log('Permissões:', window.authUser?.permissions);
   ```

### 4. **Corrigir Permissões do Usuário**

#### Opção A: Via Firebase Console
1. No Firestore, edite o documento do usuário
2. Remova as permissões: `payroll.access`, `settings.access`, `users.access`
3. Salve as alterações

#### Opção B: Via Script (Recomendado)
Execute o script para corrigir as permissões:

```bash
node configurar-perfis-teste.js
```

### 5. **Testar Novamente**
1. Faça logout do sistema
2. Faça login novamente com o usuário corrigido
3. Verifique se o menu "Folha de Pagamento" não aparece mais
4. Confirme no console que aparecem os logs de permissões

## 🧪 TESTE RÁPIDO

### Para verificar se está funcionando:
1. **Login como Admin**: Deve ver todos os menus
2. **Login como Teste**: Deve ver apenas:
   - Dashboard
   - Mensagens  
   - Contas BTG (sem submenu Folha de Pagamento)
   - Cobranças
   - Extratos
3. **Login como Operador**: Deve ver apenas:
   - Dashboard
   - Mensagens
   - Contas BTG (sem submenu Folha de Pagamento)
   - Cobranças

## 🔧 POSSÍVEIS CAUSAS DO PROBLEMA

### 1. **Cache do Navegador**
- Limpe o cache (Ctrl+Shift+R)
- Ou abra em aba anônima

### 2. **Permissões Incorretas no Firestore**
- Usuário tem permissões extras que não deveria ter
- Campo `permissions` está vazio ou undefined

### 3. **AuthContext não Atualizado**
- Permissões não estão sendo carregadas corretamente
- Usuário não está sendo recarregado após mudança

### 4. **Build Antiga**
- Sistema pode estar usando versão antiga do código
- Faça deploy novamente se necessário

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Console mostra logs de permissões
- [ ] Usuário tem permissões corretas no Firestore
- [ ] AuthContext carrega as permissões
- [ ] Cache do navegador limpo
- [ ] Sistema atualizado (última versão)
- [ ] Testado com diferentes perfis

## 🚨 SE AINDA NÃO FUNCIONAR

### 1. **Verificar Logs Detalhados**
No console do navegador, adicione:
```javascript
// Debug detalhado
console.log('=== DEBUG PERMISSÕES ===');
console.log('Usuário:', window.authUser);
console.log('Permissões:', window.authUser?.permissions);
console.log('Tem payroll.access?', window.authUser?.permissions?.includes('payroll.access'));
```

### 2. **Forçar Recarregamento**
```javascript
// Forçar recarregamento das permissões
window.location.reload();
```

### 3. **Verificar Build**
- Confirme que o código atual está em produção
- Verifique se não há cache do servidor

## 📞 SUPORTE

Se ainda houver problemas:
1. Capture os logs do console
2. Tire screenshot das permissões no Firestore
3. Descreva exatamente o que está acontecendo
4. Informe qual perfil de usuário está testando

---

**✅ LEMBRE-SE: A lógica está correta, o problema é provavelmente nos dados do usuário!** 