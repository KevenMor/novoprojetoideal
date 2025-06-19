# Projeto Baseado no Sistema Autoescola Ideal

Este projeto foi criado utilizando como base o sistema desenvolvido para a **Autoescola Ideal**.

## 📁 Projeto Base de Referência

O projeto original está localizado em:
```
C:\Users\keven\Downloads\SISTEMA AUTOESCOLA IDEAL
```

## 🧩 Estrutura e Padrão
- Layout moderno, responsivo e limpo
- Sidebar fixa, header no topo, cards de resumo, tabelas com filtros, busca e paginação
- Componentização e organização de pastas:
  - `src/pages` — páginas principais
  - `src/components` — componentes reutilizáveis
  - `src/services` — integrações e lógica de negócio
  - `src/contexts` — contexto global (ex: autenticação, filtros)
  - `src/styles` — estilos globais e utilitários
- Experiência do usuário fluida, com feedback visual
- Integração com APIs externas (ex: Asaas, Google Sheets, WhatsApp)

## 🚀 Como Usar para Novos Projetos
1. **Clone ou copie o projeto base** para uma nova pasta.
2. **Renomeie** o projeto e ajuste o README para o novo cliente/empresa.
3. **Troque logo, cores e textos** para a identidade visual do novo cliente.
4. **Adapte as funcionalidades** conforme a necessidade do novo segmento.
5. **Configure variáveis de ambiente** e integrações específicas.
6. **Documente customizações** e diferenças em relação ao projeto base.

## 📝 Pontos de Atenção
- Sempre salve IDs de integrações externas (ex: Asaas) junto aos dados de cobrança para automação.
- Mantenha a estrutura de pastas e componentes para facilitar manutenção e evolução.
- Utilize o padrão de UX e responsividade do projeto base.
- Consulte o projeto original para exemplos de implementação e boas práticas.

---

> Este README serve como guia inicial para replicar e adaptar o sistema da Autoescola Ideal para novos clientes e segmentos, mantendo qualidade, organização e produtividade.

# Sistema Autoescola Ideal

Sistema interno completo para gestão da Autoescola Ideal, desenvolvido com React, Firebase e integração com APIs externas.

## 🚀 Funcionalidades

### 📱 **Enviar Mensagem WhatsApp**
- Formulários para captura de dados do aluno (nome, WhatsApp)
- Tipos de mensagem predefinidos:
  - **Boas-vindas**: Mensagem de recepção para novos alunos
  - **Chamar Cliente**: Convocação para contato urgente
- Preview em tempo real das mensagens
- Integração com Make.com para envio automático
- Extração automática do primeiro nome

### 💳 **Cadastrar Contas BTG**
- **Boleto Bancário**:
  - Linha digitável com formatação automática (44 dígitos)
  - Validação de formato e campos obrigatórios
  - Valor, vencimento e descrição
- **PIX**:
  - Tipos de chave: Copia e Cola, CPF, CNPJ, Email, Celular
  - Formatação automática conforme tipo de chave
  - Auto-preenchimento de dados do favorecido
  - Validação de email e documentos
- Webhook para integração com sistema BTG

### 💰 **Registrar Cobranças**
- **Dados do Aluno**: Nome, CPF, Email, WhatsApp
- **Serviços Disponíveis**:
  - 1º CNH A / B (com e sem simulador)
  - 1º CNH A/B (com e sem simulador)
  - Adições de categoria (A, B, D, A/D)
  - Mudança de categoria D
  - Aulas extras e Curso CFC
- **Tipos de Pagamento**:
  - Boleto, PIX, Cartão de Crédito, Recorrente
  - Parcelamento até 6x
  - Cálculo automático de parcelas
- **Integração Asaas**:
  - Criação automática de clientes
  - Geração de cobranças e assinaturas
  - Histórico completo com status
  - Links de pagamento

### 📊 **Extratos Financeiros**
- Integração completa com API Asaas
- Filtros por período, tipo e unidade
- Estatísticas em tempo real:
  - Receitas e despesas
  - Saldo atual
  - Número de transações
- Exportação para CSV
- Visualização detalhada de movimentações

### 👥 **Gerenciar Usuários** (Admin)
- CRUD completo de usuários
- Dois níveis de acesso:
  - **Administrador**: Acesso total ao sistema
  - **Usuário**: Acesso restrito à sua unidade
- Associação de usuários às unidades
- Ativação/desativação de contas
- Busca e filtros avançados

## 🏢 **Unidades**
- Vila Helena
- Vila Progresso  
- Vila Haro
- Coop
- Júlio de Mesquita
- Aparecinha

## 🛠️ **Tecnologias**

### Frontend
- **React 18** - Interface de usuário
- **React Router DOM** - Roteamento
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **React Hook Form** - Formulários
- **React Input Mask** - Máscaras de entrada
- **React Hot Toast** - Notificações
- **Axios** - Requisições HTTP

### Backend/Database
- **Firebase Auth** - Autenticação
- **Firestore** - Banco de dados NoSQL
- **Asaas API** - Gateway de pagamentos

### Integrações
- **Make.com Webhooks** - Automações
- **WhatsApp Business API** - Mensagens

## 📁 **Estrutura do Projeto**

```
src/
├── components/           # Componentes reutilizáveis
│   ├── Layout/          # Layout principal (Header, Sidebar)
│   ├── Login.js         # Página de login
│   └── PrivateRoute.js  # Proteção de rotas
├── contexts/            # Contextos React
│   └── AuthContext.js   # Gerenciamento de autenticação
├── firebase/            # Configuração Firebase
│   └── config.js        
├── pages/               # Páginas principais
│   ├── Dashboard.js     # Dashboard principal
│   ├── EnviarMensagem.js
│   ├── CadastrarContasBTG.js
│   ├── RegistrarCobrancas.js
│   ├── Extratos.js
│   └── GerenciarUsuarios.js
├── services/            # Serviços externos
│   └── asaasService.js  # Integração Asaas
└── styles/              # Estilos globais
    └── globals.css
```

## ⚙️ **Configuração**

### 1. Instalação
```bash
npm install
```

### 2. Variáveis de Ambiente
Crie um arquivo `.env` com:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyCH-7WbtdO9ISZ1QqfU7e7fNP9aOC7U
REACT_APP_FIREBASE_AUTH_DOMAIN=sistema-autoescola-ideal-15fc8.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=sistema-autoescola-ideal-15fc8
REACT_APP_FIREBASE_STORAGE_BUCKET=sistema-autoescola-ideal-15fc8.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=981089777010
REACT_APP_FIREBASE_APP_ID=1:981089777010:web:32a5cc06dc5bd415ed99eb

# Asaas API
REACT_APP_ASAAS_TOKEN_PROD=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmEyZDE3Mzk1LTI4MTktNGVhMy1hMzJlLTY2ZTI1ODc5ZGE0Njo6JGFhY2hfN2I5YmY3YTktMGUwNi00YjExLWFhNmMtNjYyYjcyZDA1NTY2

# Webhooks
REACT_APP_MAKE_WEBHOOK_MENSAGEM=https://hook.us2.make.com/6o2ul55xv36k4wmxo12ctnwrn2rw1779
REACT_APP_MAKE_WEBHOOK_BTG=https://hook.us2.make.com/vvxwshprzsw06ba5z9kdu490ha47gmcy
```

### 3. Executar
```bash
npm start
```

## 🚀 **Deploy**

### Railway (Recomendado)
1. Conecte o repositório GitHub ao Railway
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Comandos de Build
```bash
npm run build  # Gera build de produção
npm test       # Executa testes
```

## 🔐 **Autenticação & Permissões**

### Níveis de Acesso
- **Admin**: Acesso completo, pode gerenciar usuários e ver todas as unidades
- **Usuário**: Acesso restrito à(s) unidade(s) atribuída(s)

### Rotas Protegidas
- `/dashboard` - Dashboard principal
- `/mensagem` - Enviar mensagens
- `/contas-btg` - Cadastrar contas BTG
- `/cobrancas` - Registrar cobranças
- `/extratos` - Visualizar extratos
- `/usuarios` - Gerenciar usuários (apenas admin)

## 📋 **Validações**

### Formulários
- **CPF**: Validação de formato (xxx.xxx.xxx-xx)
- **CNPJ**: Validação de formato (xx.xxx.xxx/xxxx-xx)
- **Email**: Validação de formato RFC 5322
- **WhatsApp**: Validação de 11 dígitos
- **Linha Digitável**: Exatamente 44 dígitos

### Regras de Negócio
- Usuários devem ter pelo menos uma unidade
- Admins têm acesso a todas as unidades
- Campos obrigatórios em todos os formulários
- Validação de dados antes de envio para APIs

## 🔗 **Integrações**

### Asaas (Gateway de Pagamentos)
- Endpoint: `https://www.asaas.com/api/v3`
- Funcionalidades:
  - Criação de clientes
  - Geração de cobranças
  - Assinaturas recorrentes
  - Consulta de extratos

### Make.com (Automações)
- **Webhook Mensagens**: Disparo de mensagens WhatsApp
- **Webhook BTG**: Processamento de contas bancárias

## 📱 **Design Responsivo**

- Interface adaptável para desktop, tablet e mobile
- Sidebar toggleável em dispositivos menores
- Cards e tabelas responsivas
- Formulários otimizados para toque

## 🎨 **Identidade Visual**

- **Logo**: https://static.wixstatic.com/media/030da1_fec378b6fe8d4ee2b9a5a51b96f6febb~mv2.png
- **Cores**: Azul (#1e40af), Verde (#10b981), Cinza (#6b7280)
- **Tipografia**: Inter font family
- **Componentes**: Design system consistente

## 📞 **Suporte**

Para dúvidas ou suporte técnico, entre em contato com a equipe de desenvolvimento.

---

**Autoescola Ideal** - Sistema Interno v1.0.0 