# Backend - Sistema Autoescola Ideal

Backend Node.js com persistência completa no Firestore para o Sistema Autoescola Ideal.

## 🚀 Funcionalidades Implementadas

### ✅ Persistência Completa
- **Mensagens WhatsApp**: Salvamento no Firestore antes do envio via webhook
- **Contas BTG**: Validação e armazenamento de boletos e PIX
- **Cobranças**: Registro completo de cobranças com validação
- **Extratos**: Consulta de dados financeiros com filtros
- **Usuários**: Gestão completa de usuários e permissões
- **Auditoria**: Log completo de todas as ações do sistema

### 🔐 Segurança e Autenticação
- Firebase Authentication integrado
- Middleware de autenticação e autorização
- Controle de acesso por unidades
- Rate limiting e segurança com Helmet
- Logs de auditoria para compliance

### 📊 Monitoramento
- Health check endpoint
- Logs detalhados com Morgan
- Estatísticas em tempo real
- Métricas de performance

## 🛠️ Instalação e Configuração

### 1. Instalar dependências
```bash
cd server
npm install
```

### 2. Configurar Firebase
Crie o arquivo `config/serviceAccountKey.json` com as credenciais do Firebase:

```json
{
  "type": "service_account",
  "project_id": "autoescola-ideal",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@autoescola-ideal.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do servidor:

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
FIREBASE_PROJECT_ID=autoescola-ideal
FIREBASE_DATABASE_URL=https://autoescola-ideal-default-rtdb.firebaseio.com
```

### 4. Iniciar o servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📡 Endpoints da API

### 🔐 Autenticação Obrigatória
Todas as rotas requerem header de autenticação:
```
Authorization: Bearer <firebase-token>
```

### 📱 Mensagens WhatsApp
- `POST /api/messages` - Enviar mensagem
- `GET /api/messages` - Listar mensagens
- `GET /api/messages/stats` - Estatísticas de mensagens
- `GET /api/messages/:id` - Buscar mensagem por ID
- `POST /api/messages/:id/retry` - Reenviar mensagem

### 💳 Contas BTG
- `POST /api/btg-accounts` - Cadastrar conta BTG
- `GET /api/btg-accounts` - Listar contas BTG
- `GET /api/btg-accounts/stats` - Estatísticas de contas BTG

### 💰 Cobranças
- `POST /api/charges` - Registrar cobrança
- `GET /api/charges` - Listar cobranças

### 📈 Extratos
- `GET /api/extracts` - Buscar extratos financeiros

### 👥 Usuários (Admin)
- `GET /api/users` - Listar usuários

### 🕵️ Auditoria (Admin)
- `GET /api/audit/logs` - Logs de auditoria
- `GET /api/audit/stats` - Estatísticas de auditoria

### 🏥 Health Check
- `GET /health` - Status do servidor

## 🗃️ Estrutura do Firestore

### Coleções Principais:
- `users` - Dados dos usuários
- `messages` - Mensagens WhatsApp
- `btg_accounts` - Contas BTG (boleto/PIX)
- `charges` - Cobranças registradas
- `extracts` - Extratos financeiros
- `audit_log` - Logs de auditoria
- `system_config` - Configurações do sistema
- `notifications` - Notificações
- `units` - Dados das unidades

## 🔄 Fluxo de Persistência

### 1. Mensagens WhatsApp
```
Frontend → Backend → Firestore → Webhook Make.com → Atualizar Status
```

### 2. Contas BTG
```
Frontend → Backend → Validação → Firestore → Webhook → Atualizar Status
```

### 3. Cobranças
```
Frontend → Backend → Validação → Firestore → Log Auditoria
```

### 4. Auditoria
```
Qualquer Ação → Log Automático → Firestore (audit_log)
```

## 🛡️ Segurança Implementada

- **Autenticação**: Firebase Auth tokens
- **Autorização**: Controle por perfil (admin/user)
- **Validação**: Joi para validação de dados
- **Rate Limiting**: Proteção contra spam
- **Helmet**: Headers de segurança
- **CORS**: Configurado para frontend específico
- **Logs**: Auditoria completa de ações

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar com coverage
npm run test:coverage
```

## 📝 Logs e Monitoramento

### Tipos de Logs:
- **Sistema**: Inicialização, erros, conexões
- **Auditoria**: Todas as ações dos usuários
- **Performance**: Tempo de resposta, uso de recursos
- **Segurança**: Tentativas de acesso, falhas de autenticação

### Visualização:
- Logs do sistema via console
- Logs de auditoria via endpoint `/api/audit/logs`
- Estatísticas via endpoint `/api/audit/stats`

## 🚀 Deploy em Produção

### Variáveis de Ambiente Obrigatórias:
```env
NODE_ENV=production
PORT=3001
FIREBASE_SERVICE_ACCOUNT=<json-completo>
FIREBASE_PROJECT_ID=autoescola-ideal
FRONTEND_URL=https://seu-dominio.com
```

### Comandos:
```bash
# Build (se necessário)
npm run build

# Iniciar em produção
npm start
```

## 🔧 Manutenção

### Limpeza de Logs Antigos:
Os logs de auditoria podem ser limpos automaticamente:
```javascript
// Limpar logs com mais de 90 dias
await AuditService.cleanOldLogs(90);
```

### Backup do Firestore:
Configure backups automáticos no Firebase Console.

## 📞 Suporte

Para dúvidas sobre a implementação:
1. Verifique os logs do servidor
2. Consulte a documentação do Firebase
3. Verifique a configuração das variáveis de ambiente
4. Teste os endpoints via Postman/Insomnia

---

✅ **Backend totalmente funcional com persistência garantida no Firestore!** 