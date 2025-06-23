# Deploy no Railway

Este repositório contém **frontend React** (raiz) e **backend Node/Express** na pasta `server`.

## Passo-a-passo

### 1. Criar serviço do Backend
1. Acesse o projeto no Railway
2. Clique **+ New → GitHub Repo**
3. Selecione este repositório
4. Em **Root Directory** digite `server`
5. Start Command: `node server.js`
6. Deploy 🚀

> Alternativamente, basta manter o arquivo `railway.json` na raiz (já incluso). O Railway detecta e cria o serviço automaticamente.

### 2. Variável de ambiente no Frontend
No serviço que constrói o React (root):

```
REACT_APP_API_URL=https://<URL_DO_BACKEND>.railway.app/api
```

Depois clique **Redeploy**.

### 3. Teste
- Backend: `https://<URL_DO_BACKEND>.railway.app/health`
- Frontend: categorias / contas etc. devem carregar sem 404. 