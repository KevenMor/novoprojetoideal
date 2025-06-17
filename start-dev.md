# 🚀 Inicializar Sistema Autoescola Ideal - Desenvolvimento

## ✅ Persistência Completa Implementada

O sistema agora possui **persistência completa no Firestore** para todas as funcionalidades:

### 📋 Funcionalidades com Persistência:
- ✅ **Mensagens WhatsApp**: Salvas no Firestore antes do envio via webhook
- ✅ **Contas BTG**: Boletos e PIX validados e armazenados
- ✅ **Cobranças**: Registro completo com validação de dados
- ✅ **Extratos**: Consulta de dados financeiros no Firestore
- ✅ **Usuários**: Gestão completa de permissões
- ✅ **Auditoria**: Log completo de todas as ações do sistema

## 🔧 Configuração Inicial

### 1. Configurar Firebase (OBRIGATÓRIO)

Antes de iniciar o backend, configure o Firebase:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Configurações do Projeto** > **Contas de Serviço**
3. Clique em **Gerar nova chave privada**
4. Baixe o arquivo JSON
5. Salve como `server/config/serviceAccountKey.json`

**OU** use o arquivo de exemplo:
```bash
cp server/config/serviceAccountKey.example.json server/config/serviceAccountKey.json
# Edite o arquivo com suas credenciais reais
```

### 2. Instalar Dependências

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
```

## 🚀 Inicializar o Sistema

### Opção 1: Manual (2 terminais)

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm start
```

### Opção 2: PowerShell (Windows)

```powershell
# Iniciar backend em background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start"

# Aguardar 5 segundos e iniciar frontend
Start-Sleep -Seconds 5
npm start
```

### Opção 3: Bash (Linux/Mac)

```bash
# Iniciar backend em background
cd server && npm start &

# Aguardar e iniciar frontend
sleep 5 && cd .. && npm start
```

## 🔗 URLs do Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🗃️ Estrutura de Dados no Firestore

O backend cria automaticamente as seguintes coleções:

```
autoescola-ideal/
├── users/                 # Dados dos usuários
├── messages/              # Mensagens WhatsApp com status
├── btg_accounts/          # Contas BTG (boleto/PIX)
├── charges/               # Cobranças registradas
├── extracts/              # Extratos financeiros
├── audit_log/             # Logs de auditoria
├── system_config/         # Configurações do sistema
├── notifications/         # Notificações
└── units/                 # Dados das unidades
```

## 📊 Monitoramento

### Logs do Sistema:
- **Console do Backend**: Logs detalhados de todas as operações
- **Console do Frontend**: Logs de requisições e respostas
- **Firestore**: Dados persistidos com timestamps

### Endpoints de Monitoramento:
- `GET /health` - Status do servidor
- `GET /api/audit/logs` - Logs de auditoria (Admin)
- `GET /api/audit/stats` - Estatísticas (Admin)

## 🔐 Segurança Implementada

- **Autenticação**: Token Firebase obrigatório
- **Autorização**: Controle por perfil (admin/user)
- **Validação**: Dados validados antes da persistência
- **Rate Limiting**: Proteção contra spam (100 req/15min)
- **Auditoria**: Log de todas as ações dos usuários

## 🛠️ Fluxo de Persistência

### Mensagens WhatsApp:
```
Frontend → Backend → Firestore → Webhook Make.com → Atualizar Status
```

### Contas BTG:
```
Frontend → Backend → Validação → Firestore → Webhook → Status
```

### Cobranças:
```
Frontend → Backend → Validação → Firestore → Log Auditoria
```

## 🚨 Solução de Problemas

### Backend não inicia:
1. Verifique se o arquivo `serviceAccountKey.json` existe
2. Verifique se as credenciais do Firebase estão corretas
3. Verifique se a porta 3001 está livre

### Frontend não conecta:
1. Verifique se o backend está rodando
2. Verifique se `REACT_APP_API_URL` está correto
3. Verifique o console do browser para erros

### Firestore não salva:
1. Verifique as permissões do Firebase
2. Verifique se o projeto Firebase está ativo
3. Verifique os logs do backend

## ✅ Teste de Funcionamento

1. **Acesse**: http://localhost:3000
2. **Faça login** com um usuário Firebase
3. **Envie uma mensagem** via WhatsApp
4. **Verifique no console** se foi salva no Firestore
5. **Acesse os logs** de auditoria (se for admin)

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do backend
2. Verifique o console do browser
3. Verifique as configurações do Firebase
4. Teste os endpoints via Postman

---

🎉 **Sistema totalmente funcional com persistência garantida no Firestore!**

Todas as informações são salvas antes de serem enviadas via webhook, garantindo que nenhum dado seja perdido. 