# 📊 Configuração Google Sheets - Sistema Autoescola Ideal

Este documento explica como configurar a integração com Google Sheets para carregar extratos financeiros automaticamente.

## 🔧 Configuração Inicial

### 1. **Chave da API já configurada:**
- ✅ Chave: `442d02222826c879c27bced74b60ddc0b639d75a`
- ✅ Service Account: `autoescola-ideal-service@sistema-ideal-dbffd.iam.gserviceaccount.com`

### 2. **Como encontrar o ID da sua planilha:**

1. Abra sua planilha no Google Sheets
2. Veja a URL: `https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit`
3. Copie a parte entre `/d/` e `/edit`

**Exemplo:**
```
URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
ID:  1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

## 📋 Estrutura da Planilha

### **Formato esperado das colunas:**

| A (Data) | B (Descrição) | C (Tipo) | D (Valor) | E (Status) | F (Categoria) |
|----------|---------------|----------|-----------|------------|---------------|
| 01/06/2025 | Aulas Práticas | RECEITA | 150,00 | CONFIRMADO | Aulas |
| 02/06/2025 | Taxa Habilitação | RECEITA | 850,00 | CONFIRMADO | Habilitação |
| 03/06/2025 | Simulador | RECEITA | 80,00 | CONFIRMADO | Simulador |

### **Formatos aceitos:**

**📅 Data:**
- `01/06/2025` (DD/MM/AAAA)
- `2025-06-01` (AAAA-MM-DD)
- `01-06-2025` (DD-MM-AAAA)

**💰 Valor:**
- `150,00` ou `150.00`
- `R$ 150,00`
- `1.500,00` (com separador de milhares)

**📝 Tipo:**
- `RECEITA`, `ENTRADA`, `CREDIT` → Receita
- `DESPESA`, `SAÍDA`, `DEBIT` → Despesa

## ⚙️ Configuração no Sistema

### **1. Edite o arquivo:** `src/config/sheetsConfig.js`

```javascript
UNIDADES_PLANILHAS: {
  'Unidade Centro': 'SEU_ID_PLANILHA_CENTRO',
  'Unidade Norte': 'SEU_ID_PLANILHA_NORTE',
  'Unidade Sul': 'SEU_ID_PLANILHA_SUL',
  // ... outras unidades
}
```

### **2. Exemplo prático:**

```javascript
UNIDADES_PLANILHAS: {
  'Unidade Centro': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  'Unidade Norte': '1AbC123dEf456GhI789jKl012MnO345pQr678StU901vWx',
  'Geral': '1XyZ987wVu654TsR321qPo098NmL765kJi432HgF210eDc'
}
```

## 🔒 Permissões das Planilhas

### **IMPORTANTE:** Compartilhe cada planilha com:
```
autoescola-ideal-service@sistema-ideal-dbffd.iam.gserviceaccount.com
```

### **Como compartilhar:**

1. Abra a planilha no Google Sheets
2. Clique em **"Compartilhar"** (canto superior direito)
3. Digite: `autoescola-ideal-service@sistema-ideal-dbffd.iam.gserviceaccount.com`
4. Defina permissão como **"Visualizador"**
5. Clique em **"Enviar"**

## 🧪 Testando a Integração

### **No sistema:**

1. Acesse **Extratos**
2. Clique em **"Testar Sheets"** (botão verde)
3. Verifique o console do navegador (F12)
4. Se funcionar: ✅ "Google Sheets conectado com sucesso!"

### **Carregando dados reais:**

1. Configure os IDs das planilhas
2. Clique em **"Aplicar Filtros"**
3. Os dados das planilhas aparecerão automaticamente

## 📊 Logs e Debug

### **Console do navegador mostrará:**

```
📊 Buscando dados do Google Sheets: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
✅ 15 linhas encontradas no Sheets
📋 Cabeçalhos encontrados: ["Data", "Descrição", "Tipo", "Valor", "Status", "Categoria"]
✅ 14 extratos carregados para Unidade Centro
```

## ❌ Solução de Problemas

### **Erro 403 - Permissão negada:**
- ❌ Planilha não compartilhada
- ✅ Compartilhe com o service account

### **Erro 404 - Planilha não encontrada:**
- ❌ ID da planilha incorreto
- ✅ Verifique o ID na URL

### **Nenhum dado carregado:**
- ❌ Planilha vazia ou formato incorreto
- ✅ Verifique a estrutura das colunas

### **Dados mal formatados:**
- ❌ Formato de data/valor incorreto
- ✅ Use os formatos documentados acima

## 🎯 Próximos Passos

1. **Configure suas planilhas** com a estrutura correta
2. **Compartilhe todas** com o service account
3. **Adicione os IDs** no arquivo de configuração
4. **Teste a integração** no sistema
5. **Use "Aplicar Filtros"** para carregar dados reais

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no console (F12)
2. Teste com a planilha de exemplo primeiro
3. Confirme as permissões de compartilhamento 