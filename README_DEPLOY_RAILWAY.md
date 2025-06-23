# Deploy no Railway - Sistema Autoescola Ideal

## Problema Resolvido: Erro de Build com Variáveis de Ambiente

O erro `ERROR: invalid key-value pair "= REACT_APP_API_URL=https://sistema-ideal-api.up.railway.app/api";: empty key` foi causado por problemas de encoding no arquivo `.env`.

## Solução Implementada

1. **Removidos arquivos `.env` problemáticos** para evitar conflitos durante o build
2. **Simplificado o `railway.json`** para configuração mínima
3. **Configuração das variáveis diretamente no Railway** (recomendado)

## Como Configurar as Variáveis de Ambiente no Railway

### 1. Acesse seu projeto no Railway
- Vá para [railway.app](https://railway.app)
- Selecione seu projeto

### 2. Configure as Variáveis de Ambiente
Na aba **Variables**, adicione as seguintes variáveis:

```
REACT_APP_FIREBASE_API_KEY=AIzaSyCH-7WbtdO9ISZ1QqfU7e7fNP9aOC7U
REACT_APP_FIREBASE_AUTH_DOMAIN=sistema-autoescola-ideal-15fc8.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=sistema-autoescola-ideal-15fc8
REACT_APP_FIREBASE_STORAGE_BUCKET=sistema-autoescola-ideal-15fc8.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=981089777010
REACT_APP_FIREBASE_APP_ID=1:981089777010:web:32a5cc06dc5bd415ed99eb
REACT_APP_API_URL=https://sistema-ideal-api.up.railway.app
NODE_ENV=production
```

### 3. Deploy Automático
- O Railway detectará automaticamente as mudanças no repositório
- O build será executado com as variáveis configuradas na plataforma
- O deploy será feito automaticamente

## Estrutura do Projeto

```
SISTEMA AUTOESCOLA IDEAL/
├── src/                 # Frontend React
├── server/             # Backend Node.js (deploy separado)
├── package.json        # Configuração do frontend
└── railway.json        # Configuração simplificada
```

## Scripts Atualizados

Os scripts problemáticos foram removidos do `package.json`:
- ❌ `start:windows` (removido)
- ❌ `start:prod` (removido) 
- ❌ `build:dev` (removido)
- ✅ `build` (simplificado para `react-scripts build`)

## Verificação do Deploy

1. **Frontend**: Será acessível via URL do Railway
2. **Backend**: Deve estar rodando em serviço separado
3. **API**: Configurada via `REACT_APP_API_URL`

## Troubleshooting

### Se o build ainda falhar:
1. Verifique se todas as variáveis estão configuradas no Railway
2. Certifique-se de que não há arquivos `.env` no repositório
3. Verifique os logs de build no Railway

### Se a API não conectar:
1. Confirme que o backend está rodando
2. Verifique se `REACT_APP_API_URL` aponta para o URL correto
3. Teste a API diretamente no navegador

## Comandos Úteis

```bash
# Testar build local (sem variáveis de ambiente)
npm run build

# Verificar se não há arquivos .env
ls -la | grep env

# Verificar configuração do git
git status
```

## Status Atual
- ✅ Arquivo `.env` removido para evitar conflitos
- ✅ `railway.json` simplificado
- ✅ Scripts do `package.json` corrigidos
- ✅ Variáveis de ambiente configuradas via Railway UI
- ✅ Deploy automático configurado 