import { SHEETS_CONFIG } from '../config/sheetsConfig';

// Mapeamento de unidades para IDs das planilhas
const UNIDADES_PLANILHAS = SHEETS_CONFIG.UNIDADES_PLANILHAS;



export const googleSheetsService = {
  // Buscar dados de uma planilha específica
  async buscarDadosSpreadsheet(spreadsheetId, range = null, unidade = '') {
    try {
      // Se não foi fornecido um range, usar o padrão da unidade ou o geral
      const rangeEfetivo = range || SHEETS_CONFIG.RANGES[unidade] || SHEETS_CONFIG.RANGE_PADRAO;
      
      // Construir a URL da API
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeEfetivo}?key=${SHEETS_CONFIG.API_KEY}`;
      
      // Fazer a requisição
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.values || [];
      
    } catch (error) {
      console.error('❌ Erro ao buscar dados da planilha:', error);
      throw error;
    }
  },

  // Detectar automaticamente a estrutura da planilha
  detectarEstruturaPlanilha(dadosSheet, unidade) {
    console.log(`🔍 Detectando estrutura da planilha para ${unidade}`);
    console.log(`📊 Total de linhas na planilha: ${dadosSheet.length}`);
    
    if (!dadosSheet || dadosSheet.length < 2) {
      console.warn(`⚠️ Dados insuficientes para ${unidade}: ${dadosSheet?.length || 0} linhas`);
      return null;
    }
    
    // Procurar por cabeçalhos em diferentes linhas
    let linhaCabecalho = -1;
    let estrutura = {};
    
    for (let i = 0; i < Math.min(5, dadosSheet.length); i++) {
      const linha = dadosSheet[i];
      const textoLinha = linha.join(' ').toLowerCase();
      
      console.log(`🔍 Analisando linha ${i + 1}:`, linha);
      console.log(`🔍 Texto da linha: "${textoLinha}"`);
      
      if (textoLinha.includes('cliente') || textoLinha.includes('nome') || 
          textoLinha.includes('valor') || textoLinha.includes('data') ||
          textoLinha.includes('pagamento') || textoLinha.includes('observ')) {
        linhaCabecalho = i;
        
        console.log(`✅ Cabeçalho encontrado na linha ${i + 1}`);
        
        // Mapear colunas baseado nos cabeçalhos
        linha.forEach((cabecalho, index) => {
          const cab = cabecalho.toString().toLowerCase();
          console.log(`📋 Coluna ${index}: "${cabecalho}" (${cab})`);
          
          if (cab.includes('cliente') || cab.includes('nome')) {
            estrutura.cliente = index;
            console.log(`✅ Cliente mapeado para coluna ${index}`);
          } else if (cab.includes('valor') && !cab.includes('data')) {
            estrutura.valor = index;
            console.log(`✅ Valor mapeado para coluna ${index}`);
          } else if (cab.includes('data')) {
            estrutura.data = index;
            console.log(`✅ Data mapeado para coluna ${index}`);
          } else if (cab.includes('pagamento') && !cab.includes('data')) {
            estrutura.formaPagamento = index;
            console.log(`✅ Forma de pagamento mapeado para coluna ${index}`);
          } else if (cab.includes('observ') || cab.includes('descri') || cab.includes('obs') || 
                     cab.includes('coment') || cab.includes('nota') || cab.includes('info')) {
            estrutura.observacoes = index;
            console.log(`✅ Observações mapeado para coluna ${index}`);
          }
        });
        
        console.log(`✅ Estrutura final detectada na linha ${i + 1}:`, estrutura);
        break;
      }
    }
    
    if (linhaCabecalho === -1) {
      console.warn(`⚠️ Nenhum cabeçalho válido encontrado para ${unidade}`);
      console.log(`📋 Primeiras 3 linhas:`, dadosSheet.slice(0, 3));
    }
    
    return {
      linhaCabecalho,
      estrutura,
      linhasDados: linhaCabecalho >= 0 ? dadosSheet.slice(linhaCabecalho + 1) : dadosSheet.slice(1)
    };
  },

  // Função para capitalizar a primeira letra de cada palavra
  capitalizarPalavras(texto) {
    if (!texto) return '';
    
    // Divide o texto em palavras e capitaliza cada uma
    return texto
      .toLowerCase() // Primeiro converte tudo para minúsculo
      .split(' ') // Divide em palavras
      .map(palavra => {
        if (palavra.length === 0) return palavra;
        // Capitaliza a primeira letra e mantém o resto minúsculo
        return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
      })
      .join(' '); // Junta as palavras novamente
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
        const cliente = this.capitalizarPalavras(linha[estrutura.cliente ?? 0]?.trim() || '');
        const valor = linha[estrutura.valor ?? 1]?.trim() || '0';
        const dataString = linha[estrutura.data ?? 2]?.trim() || '';
        const formaPagamento = linha[estrutura.formaPagamento ?? 3]?.trim() || '';
        const observacoes = this.capitalizarPalavras(linha[estrutura.observacoes ?? 5]?.trim() || '');
        
        console.log(`📋 Dados extraídos da linha ${index + linhaCabecalho + 2}:`, {
          cliente: `"${cliente}" (coluna ${estrutura.cliente ?? 0})`,
          valor: `"${valor}" (coluna ${estrutura.valor ?? 1})`,
          data: `"${dataString}" (coluna ${estrutura.data ?? 2})`,
          formaPagamento: `"${formaPagamento}" (coluna ${estrutura.formaPagamento ?? 3})`,
          observacoes: `"${observacoes}" (coluna ${estrutura.observacoes ?? 5})`
        });
        
        // Log específico para debug da descrição
        if (observacoes) {
          console.log(`📝 Observações encontradas: "${observacoes}"`);
        } else {
          console.log(`⚠️ Nenhuma observação encontrada na linha ${index + linhaCabecalho + 2}`);
        }
        
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
          descricao: observacoes, // Usar observações como descrição
          description: observacoes, // Também mapear para description
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
    
    // Log detalhado dos primeiros 3 extratos para debug
    if (extratosFormatados.length > 0) {
      console.log(`🎯 Primeiros 3 extratos formatados para ${unidade}:`, 
        extratosFormatados.slice(0, 3).map(e => ({
          cliente: e.cliente,
          valor: e.valor,
          data: e.data,
          descricao: e.descricao,
          observacoes: e.observacoes
        }))
      );
    }
    
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
                data: e.data,
                descricao: e.descricao
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
  async buscarExtratosFiltrados(filtros) {
    try {
      console.log('🔄 Buscando extratos do Google Sheets com filtros:', filtros);
      
      // Verificar se temos uma unidade válida
      if (!filtros.unidade || !SHEETS_CONFIG.UNIDADES_PLANILHAS[filtros.unidade]) {
        console.warn('⚠️ Unidade não encontrada ou inválida:', filtros.unidade);
        return [];
      }

      // Configuração básica
      const config = {
        apiKey: SHEETS_CONFIG.API_KEY,
        spreadsheetId: SHEETS_CONFIG.UNIDADES_PLANILHAS[filtros.unidade]
      };
      
      // Verificar configuração
      if (!config.spreadsheetId || !config.apiKey) {
        console.warn('⚠️ Configuração do Google Sheets incompleta', {
          temSpreadsheetId: !!config.spreadsheetId,
          temApiKey: !!config.apiKey,
          unidade: filtros.unidade
        });
        return [];
      }
      
      // Construir a URL da API
      const range = SHEETS_CONFIG.RANGES[filtros.unidade] || SHEETS_CONFIG.RANGE_PADRAO;
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
      
      console.log('📊 Buscando dados da planilha:', {
        unidade: filtros.unidade,
        range: range
      });
      
      // Buscar dados da planilha
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados da planilha: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.values || data.values.length < 2) {
        console.warn('⚠️ Nenhum dado encontrado na planilha', {
          unidade: filtros.unidade,
          totalLinhas: data.values?.length || 0
        });
        return [];
      }
      
      // Processar dados da planilha usando a função formatarDadosSheets
      const extratos = this.formatarDadosSheets(data.values, filtros.unidade);
      
      // Filtrar por data se necessário
      let extratosFiltrados = extratos;
      if (filtros.dataInicial && filtros.dataFinal) {
        extratosFiltrados = extratos.filter(extrato => {
          try {
            const dataExtrato = new Date(extrato.data);
            const dataInicial = new Date(filtros.dataInicial);
            const dataFinal = new Date(filtros.dataFinal);
            return dataExtrato >= dataInicial && dataExtrato <= dataFinal;
          } catch (error) {
            console.error('❌ Erro ao filtrar por data:', error);
            return false;
          }
        });
      }
      
      console.log(`✅ ${extratosFiltrados.length} extratos encontrados no Google Sheets após filtros`);
      
      return extratosFiltrados;
    } catch (error) {
      console.error('❌ Erro ao buscar extratos do Google Sheets:', error);
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