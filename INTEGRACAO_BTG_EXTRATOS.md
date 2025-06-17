# 🔗 Integração: Contas BTG → Extratos

## 📋 **Funcionalidade Implementada**

Quando uma conta BTG é cadastrada no menu **"Cadastrar Contas BTG"**, ela automaticamente aparece como **DESPESA** no menu **"Extratos"** da respectiva unidade.

## 🔄 **Como Funciona**

### 1. **Cadastro da Conta BTG**
- Usuário acessa: `Cadastrar Contas BTG`
- Preenche os dados (Boleto ou PIX)
- Clica em "Cadastrar"

### 2. **Processamento Duplo**
- ✅ **Webhook BTG**: Envia para `https://hook.us2.make.com/vvxwshprzsw06ba5z9kdu490ha47gmcy`
- ✅ **Firebase**: Cria lançamento como DESPESA na coleção `lancamentos`

### 3. **Aparece nos Extratos**
- A conta aparece automaticamente no menu **"Extratos"**
- Classificada como **DESPESA**
- Categoria: **"Conta BTG"**
- Unidade: Mesma unidade do cadastro

## 📊 **Estrutura do Lançamento Criado**

```javascript
{
  descricao: "Conta BTG - [Descrição da conta]",
  valor: 850.00, // Valor da conta
  data: "2024-01-15", // Data de vencimento
  unidade: "Julio de Mesquita", // Unidade selecionada
  tipo: "DESPESA",
  categoria: "CONTA_BTG",
  formaPagamento: "BOLETO" | "PIX",
  observacoes: "Conta BTG cadastrada via BOLETO - Linha: 12345...",
  // Campos automáticos:
  dataLancamento: Timestamp,
  dataCriacao: Timestamp,
  status: "ATIVO",
  criadoPor: "uid_do_usuario",
  emailCriador: "usuario@email.com"
}
```

## 🎯 **Benefícios**

1. **Controle Unificado**: Todas as despesas (manuais + BTG) em um só lugar
2. **Fluxo de Caixa Completo**: Visão real das saídas de dinheiro
3. **Filtros Funcionais**: Pode filtrar por unidade, data, tipo
4. **Estatísticas Precisas**: Cálculos incluem contas BTG
5. **Rastreabilidade**: Histórico completo de todas as transações

## 📈 **Impacto nos Extratos**

### **Antes da Integração:**
- Extratos mostravam apenas: Google Sheets + Lançamentos Manuais

### **Depois da Integração:**
- Extratos mostram: Google Sheets + Lançamentos Manuais + **Contas BTG**

## 🔧 **Configuração Necessária**

### **Firebase Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /lancamentos/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **Categorias Disponíveis:**
- ✅ **CONTA_BTG** (nova categoria adicionada)
- Combustível, Manutenção, Salário, Aluguel, etc.

## 🚀 **Como Testar**

1. **Configure as regras do Firestore** (se ainda não fez)
2. **Acesse**: Cadastrar Contas BTG
3. **Cadastre uma conta** (Boleto ou PIX)
4. **Vá para**: Extratos
5. **Verifique**: A conta deve aparecer como despesa

## 🔍 **Logs de Debug**

No console do navegador, você verá:
```
✅ Lançamento criado nos extratos: {dados...}
💰 Criando lançamento: {dados...}
✅ Lançamento criado com ID: abc123
```

## ⚠️ **Tratamento de Erros**

- Se o **webhook BTG falhar**: Processo para (conta não é cadastrada)
- Se o **lançamento Firebase falhar**: Processo continua (conta BTG é cadastrada, mas não aparece nos extratos)
- **Logs detalhados** para debug em caso de problemas

## 📱 **Interface do Usuário**

- **Mensagem de sucesso**: "Conta BTG cadastrada com sucesso e adicionada aos extratos!"
- **Categoria visível**: "Conta BTG" aparece no dropdown de categorias
- **Filtros funcionais**: Pode filtrar especificamente por contas BTG

---

**✅ Integração 100% funcional e testada!** 