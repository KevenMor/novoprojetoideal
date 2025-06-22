# 🔗 Integração: Cobranças Pagas → Extratos Automáticos

## 📋 **Funcionalidade Implementada**

Quando uma parcela de cobrança é **marcada como paga** ou **desfeita** no menu **"Histórico de Cobranças"**, ela automaticamente é **adicionada/removida** como **RECEITA** no menu **"Extratos"** da respectiva unidade.

## 🔄 **Como Funciona**

### 1. **Marcação de Pagamento**
- Usuário acessa: `Histórico de Cobranças`
- Clica no botão verde ✅ para **marcar como pago**
- Confirma a ação no popup

### 2. **Processamento Duplo Automático**
- ✅ **Firestore Cobranças**: Atualiza a parcela como paga
- ✅ **Firestore Lançamentos**: Cria automaticamente um lançamento de RECEITA
- ✅ **Histórico**: Registra a ação no histórico de alterações

### 3. **Aparece nos Extratos**
- A receita aparece automaticamente no menu **"Extratos"**
- Classificada como **RECEITA**
- Categoria: **"COBRANCA_PAGA"**
- Unidade: Mesma unidade da cobrança original

### 4. **Reversão de Pagamento**
- Se o usuário clicar no botão laranja ↩️ para **desfazer pagamento**
- ✅ **Remove automaticamente** o lançamento de receita do extrato
- ✅ **Mantém a integridade** entre cobranças e extratos

## 📊 **Estrutura do Lançamento Criado**

```javascript
{
  descricao: "Cobrança paga - João Silva - Parcela 1/3",
  valor: 350.00, // Valor da parcela
  data: "2024-06-22", // Data do pagamento (hoje)
  unidade: "Julio de Mesquita", // Unidade da cobrança
  cliente: "João Silva", // Nome do cliente
  tipo: "RECEITA",
  categoria: "COBRANCA_PAGA",
  formaPagamento: "PIX", // Tipo de pagamento da cobrança
  status: "CONFIRMED",
  origem: "COBRANCA_AUTOMATICA",
  observacoes: "Gerado automaticamente pela cobrança abc123 - Mensalidade",
  // Campos de rastreabilidade:
  cobrancaId: "abc123", // ID da cobrança original
  parcelaNumero: 1, // Número da parcela paga
  dataLancamento: Timestamp,
  dataCriacao: Timestamp
}
```

## 🎯 **Benefícios**

1. **Automatização Total**: Não precisa lançar receita manualmente
2. **Sincronização Perfeita**: Cobranças e extratos sempre alinhados
3. **Auditoria Completa**: Rastreabilidade total entre cobrança e lançamento
4. **Fluxo de Caixa Real**: Receitas aparecem automaticamente quando confirmadas
5. **Reversibilidade**: Pode desfazer pagamentos e remove do extrato automaticamente
6. **Controle por Unidade**: Cada receita fica na unidade correta

## 📈 **Impacto nos Extratos**

### **Antes da Integração:**
- Extratos mostravam apenas: Google Sheets + Lançamentos Manuais + Contas BTG
- Receitas de cobranças tinham que ser lançadas manualmente

### **Depois da Integração:**
- **Extratos mostram:** Google Sheets + Lançamentos Manuais + Contas BTG + **Cobranças Pagas Automaticamente**
- **Fluxo de caixa completo** com receitas automáticas
- **Zero retrabalho** manual

## 🔧 **Configurações Técnicas**

### **Identificação de Lançamentos Automáticos:**
- `origem: "COBRANCA_AUTOMATICA"`
- `categoria: "COBRANCA_PAGA"`
- `cobrancaId: "abc123"` (referência à cobrança)
- `parcelaNumero: 1` (número da parcela)

### **Filtros nos Extratos:**
- ✅ Aparece em filtros por **Unidade**
- ✅ Aparece em filtros por **Data**
- ✅ Aparece em filtros por **Tipo (RECEITA)**
- ✅ Incluído nos **cálculos de saldo**

## 🚀 **Próximos Passos Possíveis**

1. **Dashboard Atualizado**: Saldos incluem cobranças pagas automaticamente
2. **Relatórios Unificados**: Relatórios que mostram origem das receitas
3. **Notificações**: Avisar quando grandes valores são pagos
4. **Conciliação Bancária**: Comparar lançamentos com extratos bancários

## ⚠️ **Importante**

- **Não editar manualmente** lançamentos com `origem: "COBRANCA_AUTOMATICA"`
- **Usar sempre os botões** de marcar/desmarcar pagamento para manter sincronização
- **Verificar unidades** para garantir que receitas estão na unidade correta
- **Backup regular** dos dados para segurança 