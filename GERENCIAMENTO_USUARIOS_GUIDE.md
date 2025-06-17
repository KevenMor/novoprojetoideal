# 👥 Guia do Sistema de Gerenciamento de Usuários

## ✅ Funcionalidades Implementadas

### 🔧 **Cadastro de Usuários**
- ✅ Criação de novos usuários com email e senha
- ✅ Definição de perfil (Admin ou Usuário)
- ✅ Atribuição de unidades específicas
- ✅ Controle de status (Ativo/Inativo)

### 🔑 **Alteração de Senhas**
- ✅ **Email de redefinição** (Recomendado)
- ✅ **Alteração manual** (Limitada)
- ✅ **Ação rápida** direto na lista de usuários

## 📋 Como Usar

### 1. **Acessar o Sistema**
- Faça login como **Administrador**
- Acesse o menu **"Gerenciar Usuários"**

### 2. **Criar Novo Usuário**
1. Clique em **"Novo Usuário"**
2. Preencha os dados:
   - **Nome Completo** (obrigatório)
   - **Email** (obrigatório)
   - **Senha** (obrigatório)
   - **Perfil** (Admin ou Usuário)
   - **Unidades** (para usuários não-admin)
3. Clique em **"Criar Usuário"**

### 3. **Editar Usuário Existente**
1. Clique no ícone de **edição** (✏️) na linha do usuário
2. Modifique os dados necessários
3. Clique em **"Salvar Alterações"**

### 4. **Alterar Senha de Usuário**

#### 🔄 **Método 1: Durante a Edição**
1. Abra a edição do usuário
2. Marque **"Alterar senha do usuário"**
3. Escolha o método:
   - **📧 Email de redefinição** (Recomendado)
   - **🔑 Definir nova senha manualmente**

#### ⚡ **Método 2: Ação Rápida**
1. Na lista de usuários, clique no ícone de **email** (📧)
2. O sistema enviará automaticamente um email de redefinição

## 🔐 Métodos de Alteração de Senha

### 📧 **Email de Redefinição** (Recomendado)
- **Como funciona**: Envia email com link seguro para o usuário
- **Vantagens**:
  - ✅ Mais seguro
  - ✅ Usuário define a própria senha
  - ✅ Funciona imediatamente
  - ✅ Padrão do Firebase
- **Quando usar**: Sempre que possível

### 🔑 **Alteração Manual**
- **Como funciona**: Admin define nova senha diretamente
- **Limitações**:
  - ⚠️ Requer Firebase Admin SDK
  - ⚠️ Funcionalidade limitada no momento
  - ⚠️ Menos seguro
- **Quando usar**: Apenas em casos especiais

## 🎯 Ações Disponíveis

### Na Lista de Usuários:
| Ícone | Ação | Descrição |
|-------|------|-----------|
| ✏️ | Editar | Abrir modal de edição completa |
| 📧 | Email | Enviar email de redefinição de senha |
| 🗑️ | Excluir | Remover usuário do sistema |

### No Modal de Edição:
- **Dados básicos**: Nome, email, perfil, unidades
- **Status**: Ativar/desativar usuário
- **Senha**: Opções de alteração de senha

## 🔍 Funcionalidades Adicionais

### 🔍 **Busca de Usuários**
- Digite nome ou email na barra de busca
- Filtro em tempo real

### 📊 **Status dos Usuários**
- **Verde (Ativo)**: Usuário pode fazer login
- **Vermelho (Inativo)**: Login bloqueado
- Clique no status para alternar

### 🏢 **Gestão de Unidades**
- **Admin**: Acesso a todas as unidades
- **Usuário**: Acesso apenas às unidades atribuídas
- Unidades disponíveis:
  - Julio de Mesquita
  - Aparecidinha
  - Coop
  - Progresso
  - Vila Haro
  - Vila Helena

## 🚨 Troubleshooting

### ❌ **"Erro ao carregar usuários"**
- Verifique as regras do Firestore
- Confirme que está logado como admin
- Veja o console do navegador para detalhes

### ❌ **"Email já está em uso"**
- O email já existe no Firebase Auth
- Use um email diferente
- Ou edite o usuário existente

### ❌ **"Usuário não encontrado no sistema de autenticação"**
- O usuário existe no Firestore mas não no Firebase Auth
- Recrie o usuário
- Ou sincronize os dados

### ❌ **Email de redefinição não chegou**
- Verifique a caixa de spam
- Confirme se o email está correto
- Tente novamente após alguns minutos

## 📝 Logs e Debug

O sistema fornece logs detalhados no console do navegador:
- `🔄 Iniciando carregamento de usuários...`
- `✅ Usuários carregados via Firebase: X`
- `📧 Enviando email de redefinição de senha para: email@exemplo.com`
- `🔐 Tentando alterar senha do usuário...`

## 🔧 Configurações Necessárias

### Firebase Console:
1. **Firestore Rules**: Configuradas para permitir acesso
2. **Authentication**: Email/senha habilitado
3. **Email Templates**: Personalizados (opcional)

### Sistema:
1. **Coleção**: `usuarios` (não `users`)
2. **Permissões**: Admin para gerenciar usuários
3. **Unidades**: Nomes corretos das planilhas

## ✅ Status Atual

- ✅ **Cadastro de usuários**: Funcionando
- ✅ **Edição de usuários**: Funcionando
- ✅ **Email de redefinição**: Funcionando
- ⚠️ **Alteração manual**: Limitada (requer Admin SDK)
- ✅ **Busca e filtros**: Funcionando
- ✅ **Controle de status**: Funcionando

O sistema está pronto para uso em produção com as funcionalidades de email de redefinição! 