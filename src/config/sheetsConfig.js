// Configuração das Planilhas Google Sheets
// 
// Para configurar suas planilhas:
// 1. Abra sua planilha no Google Sheets
// 2. Copie o ID da URL (exemplo: https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit)
// 3. Cole o ID no mapeamento abaixo
// 4. Certifique-se que a planilha está compartilhada com: autoescola-ideal-service@sistema-ideal-dbffd.iam.gserviceaccount.com

export const SHEETS_CONFIG = {
  // Chave da API do Google Sheets
  API_KEY: 'AIzaSyBJGbAd_1HfYqwuBPXtCn45YTZM2iiBzQ8',
  
  // Email do Service Account
  SERVICE_ACCOUNT: 'autoescola-ideal-service@sistema-ideal-dbffd.iam.gserviceaccount.com',
  
  // Mapeamento de Unidades para IDs das Planilhas - CONFIGURADO COM OS IDs REAIS
  UNIDADES_PLANILHAS: {
    'Julio de Mesquita': '1FRMHgo95GcZrzmRWnGJc2AfEN_lELfbOQr1r0HzBiiI', // ✅ FUNCIONANDO
    'Aparecidinha': '1bGxiQIi5aB3faiW9US6mOsR-M_KjPiTLaPq15zQBMx8',
    'Coop': '1wdIYUoI_hdzuey4p51EFnQgRG2r0QlhhmnmZbpKtqoE',
    'Progresso': '1iysHQKpov_ZTDGtd7p4Qv2cYotnmUZ6fA5tnuHu0RG0',
    'Vila Haro': '1o4TQg7jgpbUP6yUBEDN8cL6yXqGm3zawgjqNFQlr0qU', // ✅ FUNCIONANDO - 21 registros
    'Vila Helena': '1rJAA5f_svrD_j_NAFDFisFsA1CeRGakH-c4yHYm6OFM',
    'Geral': '' // Placeholder para busca geral (todas as unidades)
  },
  
  // Ranges específicos por unidade - ATUALIZADO BASEADO NO TESTE
  RANGES: {
    'Vila Haro': 'A:F',           // ✅ FUNCIONANDO - Range padrão
    'Julio de Mesquita': 'A:F',   // ✅ FUNCIONANDO - Range padrão
    'Aparecidinha': 'A:F',        // Range padrão
    'Coop': 'A:F',                // Range padrão
    'Progresso': 'A:F',           // Range padrão
    'Vila Helena': 'A:F',         // Range padrão
    'Geral': 'A:F'                // Range padrão
  },
  
  // Configuração de colunas das planilhas - ESTRUTURA REAL DAS SUAS PLANILHAS
  // Baseado no teste real: ['Nome Cliente', 'Valor', 'Data de Pagamento', 'Forma de Pagamento', 'Unidade', 'Observações']
  ESTRUTURA_COLUNAS: {
    CLIENTE: 0,        // Coluna A - Nome Cliente
    VALOR: 1,          // Coluna B - Valor
    DATA: 2,           // Coluna C - Data de Pagamento ✅ CORRIGIDO!
    FORMA_PAGAMENTO: 3, // Coluna D - Forma de Pagamento
    UNIDADE: 4,        // Coluna E - Unidade
    OBSERVACOES: 5     // Coluna F - Observações
  },
  
  // Range padrão para buscar dados (sem nome de aba para funcionar com qualquer planilha)
  RANGE_PADRAO: 'A:F',
  
  // Range alternativo para primeira linha (cabeçalhos)
  RANGE_CABECALHOS: 'A1:F1',
  
  // Range para dados (excluindo primeira linha)
  RANGE_DADOS: 'A2:F',
  
  // Planilha de teste para validação da API (usando a planilha Julio de Mesquita)
  PLANILHA_TESTE: '1FRMHgo95GcZrzmRWnGJc2AfEN_lELfbOQr1r0HzBiiI'
};

// STATUS DAS PLANILHAS (atualizado em 2024):
// ✅ Julio de Mesquita: FUNCIONANDO - 2 registros encontrados
// ✅ Vila Haro: FUNCIONANDO - 21 registros válidos (R$ 6.230,90 total)
//    - Formas de pagamento: CREDIT_CARD (6), BOLETO (6), PIX (9)
//    - Clientes reais: WILLIAM JOSE NEVES, LUCAS KAINA, KETYLLYN KAYANE, etc.

// Exemplos de IDs de planilhas (formato de referência):
// '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' - Planilha de exemplo do Google
// '1abc123def456ghi789jkl012mno345pqr678stu901vwx' - Formato padrão de ID

// Instruções para encontrar o ID da planilha:
// 1. Abra a planilha no Google Sheets
// 2. Veja a URL: https://docs.google.com/spreadsheets/d/ID_ESTÁ_AQUI/edit#gid=0
// 3. Copie a parte entre "/d/" e "/edit"

export default SHEETS_CONFIG; 