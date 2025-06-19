import { SHEETS_CONFIG } from '../config/sheetsConfig';

// Mapeamento de unidades para IDs das planilhas
const UNIDADES_PLANILHAS = SHEETS_CONFIG.UNIDADES_PLANILHAS;
const RANGES = SHEETS_CONFIG.RANGES;

export const googleSheetsService = {
  // Buscar dados de uma planilha específica
  async buscarDadosSpreadsheet(spreadsheetId, range = null, unidade = null) {
    try {
      const API_KEY = SHEETS_CONFIG.API_KEY;
      
      // Determinar o range a ser usado
      let rangeParaUsar = range;
      if (!rangeParaUsar && unidade && RANGES[unidade]) {
        rangeParaUsar = RANGES[unidade];
        console.log(`📋 Usando range específico para ${unidade}: ${rangeParaUsar}`);
      } else if (!rangeParaUsar) {
        rangeParaUsar = SHEETS_CONFIG.RANGE_PADRAO;
      }
      
      console.log(`📊 Buscando dados da planilha: ${spreadsheetId}`);
      console.log(`📋 Range solicitado: ${rangeParaUsar}`);
      
      // Teste específico para Vila Haro e Julio de Mesquita
      if (unidade === 'Vila Haro' || unidade === 'Julio de Mesquita') {
        console.log(`🧪 TESTE ESPECÍFICO - ${unidade}:`);
        console.log(`   Spreadsheet ID: ${spreadsheetId}`);
        console.log(`   Range: ${rangeParaUsar}`);
      }
      
      // Tentar diferentes formatos de range se o primeiro falhar
      const rangesParaTestar = [
        rangeParaUsar,                 // Range específico da unidade
        'A:F',                         // Range simples sem aba
        'A:Z',                         // Range mais amplo
        'A1:F1000',                    // Range específico grande
        'A1:Z1000',                    // Range específico muito amplo
        'A2:F1000',                    // Range sem cabeçalho
        'Sheet1!A:F',                  // Com nome de aba padrão
        'Sheet1!A:Z',                  // Aba padrão mais ampla
        'Planilha1!A:F',               // Com nome de aba em português
        'Planilha1!A:Z',               // Aba em português mais ampla
        'Página1!A:F',                 // Variação de nome
        'Dados!A:F',                   // Nome comum para dados
        'Extratos!A:F'                 // Nome específico para extratos
      ];
      
      let dadosEncontrados = null;
      let rangeUsado = null;
      
      for (const rangeAtual of rangesParaTestar) {
        try {
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeAtual}?key=${API_KEY}`;
          
          console.log(`🔗 Tentando URL: ${url}`);
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (response.ok && data.values && data.values.length > 0) {
            console.log(`✅ Sucesso com range: ${rangeAtual}`);
            console.log(`📊 ${data.values.length} linhas encontradas`);
            
            // Log específico para Vila Haro e Julio de Mesquita
            if (unidade === 'Vila Haro' || unidade === 'Julio de Mesquita') {
              console.log(`🎯 ${unidade} - Dados encontrados:`, data.values.slice(0, 3));
            }
            
            dadosEncontrados = data.values;
            rangeUsado = rangeAtual;
            break;
          } else if (response.status === 400) {
            console.warn(`⚠️ Range inválido: ${rangeAtual} - ${data.error?.message || 'Erro 400'}`);
            continue;
          } else {
            console.warn(`⚠️ Erro ${response.status} com range: ${rangeAtual}`);
          }
          
        } catch (error) {
          console.warn(`⚠️ Erro de conexão com range ${rangeAtual}:`, error.message);
          continue;
        }
      }
      
      if (!dadosEncontrados) {
        throw new Error(`Nenhum range funcionou para a planilha ${spreadsheetId}. Verifique se a planilha existe e tem dados.`);
      }
      
      console.log(`🎯 Range funcional encontrado: ${rangeUsado}`);
      return dadosEncontrados;
      
    } catch (error) {
      console.error(`❌ Erro ao buscar dados da planilha ${spreadsheetId}:`, error);
      throw error;
    }
  },

  // Detectar automaticamente a estrutura da planilha
  detectarEstruturaPlanilha(dadosSheet, unidade) {
    console.log(`🔍 Detectando estrutura da planilha para ${unidade}`);
    
    if (!dadosSheet || dadosSheet.length < 2) {
      return null;
    }
    
    // Procurar por cabeçalhos em diferentes linhas
    let linhaCabecalho = -1;
    let estrutura = {};
    
    for (let i = 0; i < Math.min(3, dadosSheet.length); i++) {
      const linha = dadosSheet[i];
      const textoLinha = linha.join(' ').toLowerCase();
      
      console.log(`🔍 Analisando linha ${i + 1}:`, linha);
      
      if (textoLinha.includes('cliente') || textoLinha.includes('nome') || 
          textoLinha.includes('valor') || textoLinha.includes('data')) {
        linhaCabecalho = i;
        
        // Mapear colunas baseado nos cabeçalhos
        linha.forEach((cabecalho, index) => {
          const cab = cabecalho.toString().toLowerCase();
          
          if (cab.includes('cliente') || cab.includes('nome')) {
            estrutura.cliente = index;
          } else if (cab.includes('valor') && !cab.includes('data')) {
            estrutura.valor = index;
          } else if (cab.includes('data')) {
            estrutura.data = index;
          } else if (cab.includes('pagamento') && !cab.includes('data')) {
            estrutura.formaPagamento = index;
          } else if (cab.includes('observ')) {
            estrutura.observacoes = index;
          }
        });
        
        console.log(`✅ Estrutura detectada na linha ${i + 1}:`, estrutura);
        break;
      }
    }
    
    return {
      linhaCabecalho,
      estrutura,
      linhasDados: linhaCabecalho >= 0 ? dadosSheet.slice(linhaCabecalho + 1) : dadosSheet.slice(1)
    };
  },

  // Formatar dados das planilhas para o formato esperado
  formatarDadosSheets(dadosSheet, unidade) {
    if (!dadosSheet || dadosSheet.length === 0) {
      console.warn(`⚠️ Nenhum dado fornecido para formatação da unidade ${unidade}`);
      return [];
    }

    console.log(`🔄 Formatando ${dadosSheet.length} linhas para unidade: ${unidade}`);
    
    // Detectar estrutura automaticamente
    const deteccao = this.detectarEstruturaPlanilha(dadosSheet, unidade);
    
    if (!deteccao) {
      console.warn(`⚠️ Não foi possível detectar a estrutura da planilha para ${unidade}`);
      return [];
    }
    
    const { linhaCabecalho, estrutura, linhasDados } = deteccao;
    
    console.log(`📋 Cabeçalho encontrado na linha ${linhaCabecalho + 1}`);
    console.log(`📊 ${linhasDados.length} linhas de dados para processar`);
    console.log(`🗂️ Estrutura detectada:`, estrutura);
    
    if (linhasDados.length === 0) {
      console.warn(`⚠️ Nenhuma linha de dados encontrada para ${unidade}`);
      return [];
    }

    const extratosFormatados = linhasDados.map((linha, index) => {
      try {
        // Log da linha sendo processada
        console.log(`🔍 Processando linha ${index + linhaCabecalho + 2}:`, linha);
        
        // Usar estrutura detectada ou fallback para posições padrão
        const cliente = linha[estrutura.cliente ?? 0] || '';
        const valor = linha[estrutura.valor ?? 1] || '0';
        const dataString = linha[estrutura.data ?? 2] || '';
        const formaPagamento = linha[estrutura.formaPagamento ?? 3] || '';
        const observacoes = linha[estrutura.observacoes ?? 5] || '';
        
        console.log(`📋 Dados extraídos:`, {
          cliente: `"${cliente}" (coluna ${estrutura.cliente ?? 0})`,
          valor: `"${valor}" (coluna ${estrutura.valor ?? 1})`,
          data: `"${dataString}" (coluna ${estrutura.data ?? 2})`,
          formaPagamento: `"${formaPagamento}" (coluna ${estrutura.formaPagamento ?? 3})`
        });
        
        // Verificar se é linha de cabeçalho (contém palavras como "Cliente", "Valor", etc.)
        const textoLinha = linha.join(' ').toLowerCase();
        if (textoLinha.includes('cliente') || textoLinha.includes('valor') || textoLinha.includes('data') || textoLinha.includes('pagamento')) {
          console.warn(`⚠️ Linha ${index + 2} parece ser cabeçalho, pulando:`, linha);
          return null;
        }
        
        // Converter data para Date (ou ISO string) e ignorar linhas com data inválida
        let data;
        try {
          data = this.parseDate(dataString);
          if (isNaN(data.getTime())) {
            console.error(`❌ Data inválida na linha ${index + linhaCabecalho + 2}: "${dataString}"`);
            return null;
          }
        } catch (error) {
          console.error(`❌ Erro ao converter data na linha ${index + linhaCabecalho + 2}: "${dataString}"`, error);
          return null;
        }
        
        // Formatar valor (remover R$ e converter para número)
        const valorNumerico = this.parseValor(valor);
        
        // Determinar tipo e categoria
        const tipo = this.normalizarTipo(formaPagamento);
        const categoria = this.determinarCategoria(formaPagamento, observacoes);
        
        return {
          cliente,
          valor: valorNumerico,
          data: data.toISOString(), // Converter para ISO string para garantir consistência
          formaPagamento,
          observacoes,
          tipo,
          categoria,
          unidade
        };
      } catch (error) {
        console.error(`❌ Erro ao processar linha ${index + linhaCabecalho + 2}:`, error);
        return null;
      }
    }).filter(Boolean); // Remover linhas nulas (com erro ou cabeçalho)
    
    console.log(`✅ ${extratosFormatados.length} extratos formatados com sucesso para ${unidade}`);
    return extratosFormatados;
  },

  // Parsear data (vários formatos suportados)
  parseDate(dataString) {
    if (!dataString) {
      console.warn('⚠️ Data vazia, usando data atual');
      return new Date();
    }

    console.log(`📅 Parseando data: "${dataString}"`);

    try {
      // Limpar a string
      const dataLimpa = dataString.toString().trim();
      
      // Formatos suportados: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD/MM/YY
      if (dataLimpa.includes('/')) {
        const partes = dataLimpa.split('/');
        if (partes.length === 3) {
          let [dia, mes, ano] = partes;
          
          // Se o ano tem 2 dígitos, assumir 20XX
          if (ano.length === 2) {
            ano = '20' + ano;
          }
          
          const dataResultado = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
          console.log(`📅 Data parseada (DD/MM/YYYY): ${dataResultado.toLocaleDateString()}`);
          return dataResultado;
        }
      } else if (dataLimpa.includes('-')) {
        // Formato YYYY-MM-DD ou DD-MM-YYYY
        const partes = dataLimpa.split('-');
        if (partes.length === 3) {
          if (partes[0].length === 4) {
            // YYYY-MM-DD
            const dataResultado = new Date(dataLimpa);
            console.log(`📅 Data parseada (YYYY-MM-DD): ${dataResultado.toLocaleDateString()}`);
            return dataResultado;
          } else {
            // DD-MM-YYYY
            const [dia, mes, ano] = partes;
            const dataResultado = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
            console.log(`📅 Data parseada (DD-MM-YYYY): ${dataResultado.toLocaleDateString()}`);
            return dataResultado;
          }
        }
      }
      
      // Tentar parse direto
      const dataResultado = new Date(dataLimpa);
      if (!isNaN(dataResultado.getTime())) {
        console.log(`📅 Data parseada (direto): ${dataResultado.toLocaleDateString()}`);
        return dataResultado;
      }
      
      // Se contém apenas letras (como "Data de Pagamento"), usar data atual
      if (/^[a-zA-Z\s]+$/.test(dataLimpa)) {
        console.warn(`⚠️ Data contém apenas texto: "${dataString}", usando data atual`);
        return new Date();
      }
      
      console.warn(`⚠️ Formato de data não reconhecido: "${dataString}", usando data atual`);
      return new Date();
    } catch (error) {
      console.warn('⚠️ Erro ao parsear data:', dataString, error);
      return new Date();
    }
  },

  // Parsear valor monetário (suporta formatos brasileiros e americanos)
  parseValor(valorString) {
    if (!valorString) return 0;

    try {
      const valorStr = valorString.toString().trim();
      console.log(`💰 Parseando valor: "${valorStr}"`);
      
      // Se contém apenas letras, retornar 0
      if (/^[a-zA-Z\s]+$/.test(valorStr)) {
        console.warn(`⚠️ Valor contém apenas letras: "${valorStr}", retornando 0`);
        return 0;
      }
      
      // Remove símbolos de moeda e letras
      let valorLimpo = valorStr.replace(/[R$\s]/g, '').replace(/[a-zA-Z]/g, '');
      
      // Se ficou vazio após limpeza, retornar 0
      if (!valorLimpo) {
        console.warn(`⚠️ Valor vazio após limpeza: "${valorStr}", retornando 0`);
        return 0;
      }
      
      // Detectar formato brasileiro (1.234,56) vs americano (1,234.56)
      const pontos = (valorLimpo.match(/\./g) || []).length;
      const virgulas = (valorLimpo.match(/,/g) || []).length;
      
      if (pontos > 0 && virgulas > 0) {
        // Ambos presentes - determinar qual é separador decimal
        const ultimoPonto = valorLimpo.lastIndexOf('.');
        const ultimaVirgula = valorLimpo.lastIndexOf(',');
        
        if (ultimaVirgula > ultimoPonto) {
          // Formato brasileiro: 1.234,56
          valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
        } else {
          // Formato americano: 1,234.56
          valorLimpo = valorLimpo.replace(/,/g, '');
        }
      } else if (virgulas > 0 && pontos === 0) {
        // Apenas vírgulas - pode ser separador decimal brasileiro
        if (virgulas === 1 && valorLimpo.split(',')[1].length <= 2) {
          // Provavelmente separador decimal: 123,45
          valorLimpo = valorLimpo.replace(',', '.');
        } else {
          // Provavelmente separador de milhares: 1,234
          valorLimpo = valorLimpo.replace(/,/g, '');
        }
      } else if (pontos > 0 && virgulas === 0) {
        // Apenas pontos - pode ser separador de milhares ou decimal
        if (pontos === 1 && valorLimpo.split('.')[1].length <= 2) {
          // Provavelmente decimal: 123.45
          // Manter como está
        } else {
          // Provavelmente separador de milhares: 1.234
          valorLimpo = valorLimpo.replace(/\./g, '');
        }
      }
      
      const valor = parseFloat(valorLimpo) || 0;
      
      // Validação básica - valores muito altos podem indicar erro de parsing
      if (valor > 100000) {
        console.warn(`⚠️ Valor muito alto detectado: ${valor} (original: ${valorString})`);
      }
      
      return valor;
    } catch (error) {
      console.warn('⚠️ Erro ao parsear valor:', valorString);
      return 0;
    }
  },

  // Normalizar tipo para português
  normalizarTipo(tipo) {
    if (!tipo) return 'RECEITA';
    
    const tipoUpper = tipo.toString().toUpperCase();
    
    if (tipoUpper.includes('RECEITA') || tipoUpper.includes('ENTRADA') || tipoUpper.includes('CREDIT')) {
      return 'RECEITA';
    }
    
    if (tipoUpper.includes('DESPESA') || tipoUpper.includes('SAÍDA') || tipoUpper.includes('DEBIT')) {
      return 'DESPESA';
    }
    
    return 'RECEITA'; // Default
  },

  // Normalizar tipo para inglês (compatibilidade)
  normalizarTipoEn(tipo) {
    const tipoNormalized = this.normalizarTipo(tipo);
    return tipoNormalized === 'RECEITA' ? 'CREDIT' : 'DEBIT';
  },

  // Determinar categoria baseada na forma de pagamento e observações
  determinarCategoria(formaPagamento, observacoes) {
    const texto = `${formaPagamento} ${observacoes}`.toLowerCase();
    
    if (texto.includes('pix')) return 'PIX';
    if (texto.includes('cartão') || texto.includes('cartao')) return 'CARTÃO';
    if (texto.includes('dinheiro') || texto.includes('espécie')) return 'DINHEIRO';
    if (texto.includes('transferência') || texto.includes('transferencia')) return 'TRANSFERÊNCIA';
    if (texto.includes('boleto')) return 'BOLETO';
    
    return 'OUTROS';
  },

  // Buscar extratos por unidade específica
  async buscarExtratosPorUnidade(unidades = []) {
    try {
      console.log('📊 Buscando extratos do Google Sheets para unidades:', unidades);

      const resultados = {};

      // Se nenhuma unidade especificada, buscar todas
      const unidadesParaBuscar = unidades.length > 0 ? unidades : Object.keys(UNIDADES_PLANILHAS);

      for (const unidade of unidadesParaBuscar) {
        const spreadsheetId = UNIDADES_PLANILHAS[unidade];
        
        if (!spreadsheetId) {
          console.warn(`⚠️ Planilha não configurada para unidade: ${unidade}`);
          continue;
        }

        try {
          console.log(`🔍 Processando ${unidade}...`);
          const dadosSheet = await this.buscarDadosSpreadsheet(spreadsheetId, null, unidade);
          const extratosFormatados = this.formatarDadosSheets(dadosSheet, unidade);
          
          resultados[unidade] = extratosFormatados;
          console.log(`✅ ${extratosFormatados.length} extratos carregados para ${unidade}`);
          
          // Log específico para Vila Haro e Julio de Mesquita
          if (unidade === 'Vila Haro' || unidade === 'Julio de Mesquita') {
            console.log(`🎯 ${unidade} - Resultado final:`, {
              total: extratosFormatados.length,
              primeiros3: extratosFormatados.slice(0, 3).map(e => ({
                cliente: e.cliente,
                valor: e.valor,
                data: e.data
              }))
            });
          }
        } catch (error) {
          console.error(`❌ Erro ao buscar extratos da unidade ${unidade}:`, error);
          resultados[unidade] = [];
        }
      }

      return resultados;
    } catch (error) {
      console.error('❌ Erro geral ao buscar extratos do Sheets:', error);
      throw error;
    }
  },

  // Buscar extratos filtrados por período
  async buscarExtratosFiltrados(filtros = {}) {
    try {
      const { dataInicial, dataFinal, unidade } = filtros;

      console.log('🔍 Buscando extratos Google Sheets com filtros:', filtros);

      // Determinar unidades para buscar
      let unidadesParaBuscar;
      
      if (unidade && unidade !== '' && unidade !== 'all') {
        // Unidade específica selecionada
        unidadesParaBuscar = [unidade];
        console.log('🏢 Buscando unidade específica:', unidade);
      } else {
        // Todas as unidades (quando "Todas as Unidades" está selecionado)
        unidadesParaBuscar = Object.keys(UNIDADES_PLANILHAS);
        console.log('🏢 Buscando todas as unidades disponíveis');
      }
      
      console.log('📋 Unidades que serão consultadas:', unidadesParaBuscar);
      
      const resultadosUnidades = await this.buscarExtratosPorUnidade(unidadesParaBuscar);

      // Combinar todos os extratos
      const todosExtratos = Object.values(resultadosUnidades).flat();
      console.log(`📊 Total de extratos antes dos filtros: ${todosExtratos.length}`);

      // Aplicar filtros de data
      let extratosFiltrados = todosExtratos;

      if (dataInicial && dataFinal) {
        const dataIni = new Date(dataInicial);
        const dataFim = new Date(dataFinal);
        // Zerar horário da data inicial e colocar fim do dia na data final
        dataIni.setHours(0, 0, 0, 0);
        dataFim.setHours(23, 59, 59, 999);
        
        console.log(`📅 Filtrando por período: ${dataIni.toLocaleDateString()} até ${dataFim.toLocaleDateString()}`);
        console.log(`📅 Período em timestamp: ${dataIni.getTime()} até ${dataFim.getTime()}`);
        
        extratosFiltrados = todosExtratos.filter(extrato => {
          const dataExtrato = new Date(extrato.data);
          // Zerar horário da data do extrato para comparar apenas ano, mês e dia
          dataExtrato.setHours(0, 0, 0, 0);
          const timestampExtrato = dataExtrato.getTime();
          const timestampIni = dataIni.getTime();
          const timestampFim = dataFim.getTime();
          
          const dentroDoPeríodo = timestampExtrato >= timestampIni && timestampExtrato <= timestampFim;
          
          if (!dentroDoPeríodo) {
            console.log(`❌ Extrato FORA do período: ${dataExtrato.toLocaleDateString()} (${extrato.cliente})`);
          } else {
            console.log(`✅ Extrato DENTRO do período: ${dataExtrato.toLocaleDateString()} (${extrato.cliente})`);
          }
          
          return dentroDoPeríodo;
        });
      }

      // FILTRO FINAL: Garantir que apenas extratos da unidade correta sejam retornados
      if (unidade && unidade !== '' && unidade !== 'all') {
        console.log(`🔍 FILTRO FINAL: Aplicando filtro rigoroso para unidade "${unidade}"`);
        
        const extratosFiltradosPorUnidade = extratosFiltrados.filter(extrato => {
          const unidadeExtrato = extrato.unidade;
          const pertenceAUnidade = unidadeExtrato === unidade;
          
          if (!pertenceAUnidade) {
            console.log(`❌ FILTRO FINAL: Removendo extrato de "${unidadeExtrato}" (não é "${unidade}")`);
          } else {
            console.log(`✅ FILTRO FINAL: Mantendo extrato de "${unidadeExtrato}"`);
          }
          
          return pertenceAUnidade;
        });
        
        extratosFiltrados = extratosFiltradosPorUnidade;
        console.log(`🔍 FILTRO FINAL: ${extratosFiltrados.length} extratos após filtro rigoroso por unidade`);
      }

      console.log(`✅ ${extratosFiltrados.length} extratos encontrados no Google Sheets após todos os filtros`);

      // Log detalhado para debug
      if (extratosFiltrados.length > 0) {
        const unidadesEncontradas = [...new Set(extratosFiltrados.map(e => e.unidade))];
        console.log('🏢 Unidades com dados encontrados após filtro final:', unidadesEncontradas);
        
        unidadesEncontradas.forEach(u => {
          const qtd = extratosFiltrados.filter(e => e.unidade === u).length;
          console.log(`   ${u}: ${qtd} extratos`);
        });
        
        // Log dos primeiros extratos para verificação
        console.log('📊 Primeiros 3 extratos finais:', extratosFiltrados.slice(0, 3).map(e => ({
          cliente: e.cliente,
          unidade: e.unidade,
          valor: e.valor
        })));
      }

      return extratosFiltrados;
    } catch (error) {
      console.error('❌ Erro ao buscar extratos filtrados do Sheets:', error);
      return [];
    }
  },

  // Configurar IDs das planilhas (método utilitário)
  configurarPlanilhas(mapeamento) {
    Object.assign(UNIDADES_PLANILHAS, mapeamento);
    console.log('✅ Mapeamento de planilhas atualizado:', UNIDADES_PLANILHAS);
  },

  // Testar conexão com uma planilha
  async testarConexao(spreadsheetId) {
    try {
      console.log('🧪 Testando conexão com planilha:', spreadsheetId);
      
      const dados = await this.buscarDadosSpreadsheet(spreadsheetId, 'A1:F1');
      
      console.log('✅ Conexão OK! Primeira linha:', dados[0]);
      return { sucesso: true, dados: dados[0] };
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      return { sucesso: false, erro: error.message };
    }
  }
}; 