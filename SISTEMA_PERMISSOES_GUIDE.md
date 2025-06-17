# Sistema de Permissões Granular - Autoescola Ideal

## Visão Geral

O sistema de permissões granular permite controlar exatamente quais funcionalidades cada usuário pode acessar no sistema. Isso oferece flexibilidade total para definir diferentes níveis de acesso baseados nas necessidades de cada função.

## Estrutura do Sistema

### 1. Permissões Disponíveis

O sistema possui **25 permissões** organizadas em **7 grupos funcionais**:

#### Dashboard
- `dashboard.view` - Visualizar dashboard
- `dashboard.all_units` - Ver dados de todas as unidades

#### Mensagens
- `messages.view` - Visualizar mensagens
- `messages.send` - Enviar mensagens
- `messages.history` - Ver histórico completo

#### Contas BTG
- `btg_accounts.view` - Visualizar contas BTG
- `btg_accounts.create` - Criar contas BTG
- `btg_accounts.edit` - Editar contas BTG
- `btg_accounts.delete` - Excluir contas BTG

#### Cobranças
- `charges.view` - Visualizar cobranças
- `charges.create` - Criar cobranças
- `charges.edit` - Editar cobranças
- `charges.delete` - Excluir cobranças

#### Extratos
- `extracts.view` - Visualizar extratos
- `extracts.export` - Exportar extratos
- `extracts.all_units` - Ver extratos de todas as unidades

#### Configurações
- `settings.view` - Acessar configurações
- `settings.sheets` - Configurar Google Sheets
- `settings.system` - Configurações do sistema

#### Usuários (Admin)
- `users.view` - Visualizar usuários
- `users.create` - Criar usuários
- `users.edit` - Editar usuários
- `users.delete` - Excluir usuários
- `users.permissions` - Gerenciar permissões

### 2. Perfis Padrão

#### Administrador (`admin`)
- **Todas as 25 permissões**
- Acesso completo ao sistema
- Pode gerenciar usuários e permissões

#### Gerente (`manager`)
- **18 permissões** (72% do sistema)
- Dashboard completo
- Todas as operações principais
- Configurações básicas
- **Não pode:** Gerenciar usuários, configurações avançadas

#### Operador (`operator`)
- **10 permissões** (40% do sistema)
- Dashboard básico
- Operações de criação e visualização
- **Não pode:** Editar/excluir, ver todas as unidades, gerenciar usuários

#### Visualizador (`viewer`)
- **5 permissões** (20% do sistema)
- Apenas visualização
- **Não pode:** Criar, editar, excluir ou configurar

#### Personalizado (`custom`)
- **Permissões selecionadas manualmente**
- Flexibilidade total para casos específicos

## Como Usar

### 1. Criando/Editando Usuários

1. Acesse **Gerenciar Usuários** (requer permissão `users.view`)
2. Clique em **Novo Usuário** ou edite um existente
3. Selecione o **Perfil**:
   - Para perfis padrão: As permissões são aplicadas automaticamente
   - Para **Personalizado**: Configure as permissões manualmente

### 2. Configurando Permissões Personalizadas

Quando selecionar **Personalizado**:

1. **Interface de Grupos**: Permissões organizadas por funcionalidade
2. **Seleção por Grupo**: Marque/desmarque grupos inteiros
3. **Seleção Individual**: Controle granular por permissão
4. **Contador**: Veja quantas permissões estão ativas
5. **Descrições**: Cada permissão tem explicação clara

### 3. Verificando Permissões

#### Para Desenvolvedores
```javascript
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../utils/permissions';

function MeuComponente() {
  const { hasPermission } = useAuth();
  
  // Verificar permissão específica
  if (hasPermission(PERMISSIONS.USERS_CREATE)) {
    // Mostrar botão de criar usuário
  }
  
  // Verificar múltiplas permissões
  const canManageUsers = hasPermission(PERMISSIONS.USERS_VIEW) && 
                         hasPermission(PERMISSIONS.USERS_EDIT);
}
```

#### Para Usuários
- Acesse `/test-permissions` para ver suas permissões ativas
- Interface visual mostra status de cada permissão
- Resumo com estatísticas de acesso

## Funcionalidades Avançadas

### 1. Controle de Menu
- Menus aparecem apenas se o usuário tem a permissão necessária
- Sistema automático baseado nas permissões do usuário

### 2. Controle de Unidades
- Usuários podem ser limitados a unidades específicas
- Combinação de permissões + unidades para controle total

### 3. Migração Automática
- Usuários existentes recebem permissões baseadas no perfil atual
- Sistema compatível com versões anteriores

### 4. Auditoria
- Todas as permissões são salvas no Firestore
- Histórico de alterações de permissões
- Debug completo disponível

## Exemplos Práticos

### Caso 1: Operador de Unidade Específica
```
Perfil: Operador
Unidades: ["Vila Haro"]
Permissões: 10 básicas
Resultado: Pode operar apenas na Vila Haro
```

### Caso 2: Gerente Regional
```
Perfil: Gerente
Unidades: ["Vila Haro", "Progresso", "Coop"]
Permissões: 18 avançadas
Resultado: Gestão completa de 3 unidades
```

### Caso 3: Contador (Personalizado)
```
Perfil: Personalizado
Permissões: extracts.*, charges.view, dashboard.view
Resultado: Acesso apenas a relatórios financeiros
```

## Segurança

### 1. Validação Dupla
- Frontend: Interface responsiva às permissões
- Backend: Validação no Firestore Rules

### 2. Princípio do Menor Privilégio
- Usuários novos começam com perfil `operator`
- Permissões devem ser explicitamente concedidas

### 3. Auditoria Completa
- Log de todas as alterações de permissões
- Rastreabilidade de quem alterou o quê

## Troubleshooting

### Problema: Usuário não vê menu
**Solução**: Verificar se tem a permissão básica (ex: `dashboard.view`)

### Problema: Permissões não aplicadas
**Solução**: 
1. Verificar se o perfil está correto
2. Fazer logout/login
3. Verificar no `/test-permissions`

### Problema: Erro de permissão no Firestore
**Solução**: Configurar regras do Firestore conforme `FIRESTORE_RULES_SETUP.md`

## Desenvolvimento

### Adicionando Nova Permissão

1. **Definir em `utils/permissions.js`**:
```javascript
export const PERMISSIONS = {
  // ... existentes
  NEW_FEATURE_VIEW: 'new_feature.view',
  NEW_FEATURE_EDIT: 'new_feature.edit'
};
```

2. **Adicionar ao grupo apropriado**:
```javascript
export const PERMISSION_GROUPS = {
  new_feature: {
    name: 'Nova Funcionalidade',
    description: 'Controle da nova funcionalidade',
    permissions: [
      PERMISSIONS.NEW_FEATURE_VIEW,
      PERMISSIONS.NEW_FEATURE_EDIT
    ]
  }
};
```

3. **Adicionar descrições**:
```javascript
export const PERMISSION_DESCRIPTIONS = {
  [PERMISSIONS.NEW_FEATURE_VIEW]: 'Visualizar nova funcionalidade',
  [PERMISSIONS.NEW_FEATURE_EDIT]: 'Editar nova funcionalidade'
};
```

4. **Usar no componente**:
```javascript
const { hasPermission } = useAuth();

if (hasPermission(PERMISSIONS.NEW_FEATURE_VIEW)) {
  // Renderizar funcionalidade
}
```

## Status Atual

✅ **Implementado:**
- Sistema completo de permissões
- Interface de gerenciamento
- Controle de menus
- Perfis padrão
- Página de teste
- Migração automática

⚠️ **Pendente:**
- Configuração das regras do Firestore
- Teste com usuários reais
- Documentação para usuários finais

---

**Versão:** 1.0.0  
**Data:** Dezembro 2024  
**Autor:** Sistema Autoescola Ideal 