# Guia de Configuração de Perfis - Versão de Teste

## 🎯 Objetivo
Configurar perfis de usuário específicos para a versão de teste do sistema, com permissões granulares conforme solicitado.

## 📋 Perfis Configurados

### 1. **Perfil "teste"** - Para as meninas (versão de teste)
**Acesso limitado conforme solicitado:**

#### ✅ **Módulo Mensagens**
- ✅ Enviar mensagem
- ✅ Histórico de mensagens

#### ✅ **Contas BTG**
- ✅ Cadastrar contas
- ✅ Gestão de contas (apenas das contas registradas por ela)

#### ✅ **Menu Cobrança**
- ✅ Registrar cobranças
- ✅ Histórico (apenas dos registros feitos por ela)

#### ✅ **Extratos**
- ✅ Visualizar extratos de receitas (apenas próprios lançamentos)

#### ❌ **Restrições**
- ❌ Configurações Sheets (apenas admin)
- ❌ Gerenciar Usuários (apenas admin)
- ❌ Folha de Pagamento (apenas admin)
- ❌ Gestão de Contas Geral (apenas admin)

### 2. **Perfil "operator"** - Operador
Acesso intermediário com funcionalidades básicas.

### 3. **Perfil "viewer"** - Visualizador
Apenas visualização de dados.

### 4. **Perfil "admin"** - Administrador
Acesso completo ao sistema.

## 🔧 Como Configurar

### Passo 1: Aplicar Regras Temporárias
```bash
# Copiar as regras temporárias para o arquivo principal
cp firestore.rules firestore.rules.backup
cp firestore-rules-temporarias.rules firestore.rules
```

### Passo 2: Executar Script de Configuração
```bash
node configurar-usuarios-direto.js
```

### Passo 3: Aplicar Regras Seguras
```bash
# Restaurar as regras seguras
cp firestore-rules-seguras.rules firestore.rules

# Deploy das regras (se tiver Firebase CLI)
firebase deploy --only firestore:rules
```

## 👥 Usuários Criados

### Credenciais de Teste:
```
teste1@autoescolaideal.com / 123456
teste2@autoescolaideal.com / 123456
operador@autoescolaideal.com / 123456
visualizador@autoescolaideal.com / 123456
```

### Unidades Atribuídas:
- **teste1**: Julio de Mesquita, Vila Haro
- **teste2**: Aparecidinha, Coop
- **operador**: Todas as unidades
- **visualizador**: Julio de Mesquita

## 🔐 Permissões Detalhadas

### Perfil "teste" (13 permissões):
```
✅ Dashboard: 1 permissão
✅ Mensagens: 3 permissões
✅ Contas BTG: 3 permissões
✅ Cobranças: 3 permissões
✅ Extratos: 2 permissões
✅ Configurações: 1 permissão
```

### Perfil "operator" (14 permissões):
```
✅ Dashboard: 1 permissão
✅ Mensagens: 3 permissões
✅ Contas BTG: 3 permissões
✅ Cobranças: 3 permissões
✅ Extratos: 2 permissões
✅ Configurações: 2 permissões
```

### Perfil "viewer" (6 permissões):
```
✅ Dashboard: 1 permissão
✅ Mensagens: 1 permissão
✅ Contas BTG: 1 permissão
✅ Cobranças: 1 permissão
✅ Extratos: 1 permissão
✅ Configurações: 1 permissão
```

## 🧪 Como Testar

### 1. **Teste de Login**
- Fazer login com cada usuário
- Verificar se o perfil está correto
- Confirmar se as permissões estão carregadas

### 2. **Teste de Menus**
- Verificar se apenas os menus permitidos aparecem
- Confirmar que menus restritos não estão visíveis

### 3. **Teste de Funcionalidades**
- **Mensagens**: Enviar e ver histórico
- **Contas BTG**: Cadastrar e ver apenas próprias contas
- **Cobranças**: Registrar e ver apenas próprios registros
- **Extratos**: Ver apenas próprios lançamentos

### 4. **Teste de Restrições**
- Tentar acessar configurações sheets (deve ser bloqueado)
- Tentar acessar gerenciar usuários (deve ser bloqueado)
- Tentar ver contas de outros usuários (deve ser bloqueado)

## ⚠️ Importante

### Regras de Segurança
- As regras temporárias permitem acesso total
- **SEMPRE** restaure as regras seguras após a configuração
- As regras seguras incluem o novo perfil "teste"

### Backup
- Faça backup das configurações atuais antes de aplicar
- Mantenha as regras antigas como backup

### Monitoramento
- Monitore os logs do Firestore durante os testes
- Verifique se as permissões estão funcionando corretamente

## 🔄 Atualizações Futuras

### Para Adicionar Novos Usuários:
1. Editar o array `usuariosParaConfigurar` no script
2. Executar o script novamente
3. Apenas usuários novos serão criados

### Para Modificar Permissões:
1. Editar o objeto `PERFIS_TESTE` no script
2. Executar o script para atualizar usuários existentes

### Para Adicionar Novos Perfis:
1. Adicionar novo perfil no objeto `PERFIS_TESTE`
2. Adicionar perfil nas regras do Firestore
3. Executar o script de configuração

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs do console
2. Confirmar se as regras foram aplicadas
3. Testar com usuário admin primeiro
4. Verificar se as permissões estão no formato correto

---

**Status**: ✅ Configuração preparada
**Próximo passo**: Executar o script de configuração 