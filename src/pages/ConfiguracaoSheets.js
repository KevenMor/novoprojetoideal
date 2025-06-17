import React, { useState, useEffect } from 'react';
import { Settings, Key, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Save, TestTube, RefreshCw, Activity, Database, AlertTriangle, Download, Clock, TrendingUp, Terminal } from 'lucide-react';
import { SHEETS_CONFIG } from '../config/sheetsConfig';
import { googleSheetsService } from '../services/googleSheetsService';
import { extratosService } from '../services/extratosService';
import LogViewer from '../components/LogViewer';
import toast from 'react-hot-toast';

export default function ConfiguracaoSheets() {
  const [config, setConfig] = useState({
    apiKey: SHEETS_CONFIG.API_KEY || '',
    serviceAccount: SHEETS_CONFIG.SERVICE_ACCOUNT || '',
    unidadesPlanilhas: { ...SHEETS_CONFIG.UNIDADES_PLANILHAS }
  });
  
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState('pending');
  const [systemStatus, setSystemStatus] = useState({});
  const [diagnosticResults, setDiagnosticResults] = useState({});
  const [activeTab, setActiveTab] = useState('config');
  const [logs, setLogs] = useState([]);

  const unidades = Object.keys(config.unidadesPlanilhas);

  // Sistema de logging
  const addLog = (level, message, source = null, details = null) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      details
    };
    
    setLogs(prev => [...prev, newLog]);
    
    // Manter apenas os últimos 1000 logs
    if (logs.length > 1000) {
      setLogs(prev => prev.slice(-1000));
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs limpos pelo usuário', 'Sistema');
  };

  // Testar API Key automaticamente quando carrega a página
  useEffect(() => {
    addLog('info', 'Sistema de Configuração Google Sheets iniciado', 'Sistema');
    
    if (config.apiKey) {
      testarApiKey();
    }
    carregarStatusSistema();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const carregarStatusSistema = async () => {
    try {
      addLog('info', 'Carregando status do sistema...', 'Sistema');
      const status = {};
      
      for (const unidade of unidades) {
        const spreadsheetId = config.unidadesPlanilhas[unidade];
        if (spreadsheetId) {
          try {
            addLog('info', `Verificando status da unidade ${unidade}`, 'Status');
            const extratos = await extratosService.buscarExtratos({ unidade });
            status[unidade] = {
              registros: extratos.length,
              ultimaAtualizacao: new Date().toISOString(),
              status: 'online',
              valorTotal: extratos.reduce((sum, e) => sum + (e.valor || 0), 0)
            };
            addLog('success', `Unidade ${unidade}: ${extratos.length} registros encontrados`, 'Status');
          } catch (error) {
            status[unidade] = {
              registros: 0,
              status: 'error',
              erro: error.message
            };
            addLog('error', `Erro na unidade ${unidade}: ${error.message}`, 'Status');
          }
        } else {
          addLog('warning', `Unidade ${unidade} não configurada`, 'Status');
        }
      }
      
      setSystemStatus(status);
      addLog('success', 'Status do sistema carregado com sucesso', 'Sistema');
    } catch (error) {
      addLog('error', `Erro ao carregar status do sistema: ${error.message}`, 'Sistema');
      console.error('Erro ao carregar status do sistema:', error);
    }
  };

  const testarApiKey = async () => {
    addLog('info', 'Iniciando teste da API Key...', 'API');
    console.log('🔑 Testando API Key...');
    setApiKeyStatus('testing');
    
    try {
      const API_KEY = config.apiKey;
      
      if (!API_KEY) {
        setApiKeyStatus('invalid');
        addLog('error', 'API Key não fornecida', 'API');
        return;
      }

      addLog('info', 'Testando conectividade com Google Sheets API...', 'API');
      
      // Testar com planilha pública conhecida
      const planilhaPublica = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
      const range = 'Class Data!A2:E';
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${planilhaPublica}/values/${range}?key=${API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ API Key válida!', data);
        setApiKeyStatus('valid');
        addLog('success', 'API Key válida e funcionando corretamente!', 'API', { 
          linhasRetornadas: data.values?.length || 0 
        });
        toast.success('✅ API Key está funcionando!');
      } else {
        console.log('❌ Erro na API:', response.status, data);
        setApiKeyStatus('invalid');
        
        let errorMessage = `Erro ${response.status}`;
        if (response.status === 400) {
          errorMessage = 'API Key inválida ou mal formatada';
          toast.error('❌ API Key inválida ou mal formatada');
        } else if (response.status === 403) {
          errorMessage = 'API Key sem permissões para Google Sheets API';
          toast.error('❌ API Key sem permissões para Google Sheets API');
        } else {
          errorMessage = `Erro ${response.status}: ${data.error?.message || 'Erro desconhecido'}`;
          toast.error(`❌ Erro ${response.status}: ${data.error?.message || 'Erro desconhecido'}`);
        }
        
        addLog('error', errorMessage, 'API', data);
      }
      
    } catch (error) {
      console.error('❌ Erro ao testar API Key:', error);
      setApiKeyStatus('invalid');
      addLog('error', `Erro de conexão: ${error.message}`, 'API');
      toast.error(`❌ Erro de conexão: ${error.message}`);
    }
  };

  const executarDiagnosticoCompleto = async () => {
    setLoading(true);
    const resultados = {};
    
    addLog('info', 'Iniciando diagnóstico completo do sistema...', 'Diagnóstico');
    toast.loading('🔍 Executando diagnóstico completo...', { id: 'diagnostic' });
    
    for (const unidade of unidades) {
      const spreadsheetId = config.unidadesPlanilhas[unidade];
      if (!spreadsheetId) {
        resultados[unidade] = {
          status: 'not_configured',
          message: 'ID da planilha não configurado'
        };
        addLog('warning', `Unidade ${unidade}: ID da planilha não configurado`, 'Diagnóstico');
        continue;
      }

      try {
        addLog('info', `Diagnosticando unidade ${unidade}...`, 'Diagnóstico');
        console.log(`🔍 Diagnosticando ${unidade}...`);
        
        // Teste 1: Conectividade básica
        addLog('info', `${unidade}: Testando conectividade...`, 'Diagnóstico');
        const conectividade = await testarConectividade(spreadsheetId);
        
        // Teste 2: Estrutura dos dados
        addLog('info', `${unidade}: Analisando estrutura dos dados...`, 'Diagnóstico');
        const estrutura = await analisarEstrutura(spreadsheetId, unidade);
        
        // Teste 3: Qualidade dos dados
        addLog('info', `${unidade}: Analisando qualidade dos dados...`, 'Diagnóstico');
        const qualidade = await analisarQualidadeDados(spreadsheetId, unidade);
        
        // Teste 4: Performance
        addLog('info', `${unidade}: Medindo performance...`, 'Diagnóstico');
        const performance = await medirPerformance(spreadsheetId, unidade);
        
        resultados[unidade] = {
          status: 'success',
          conectividade,
          estrutura,
          qualidade,
          performance,
          timestamp: new Date().toISOString()
        };
        
        addLog('success', `Diagnóstico da unidade ${unidade} concluído com sucesso`, 'Diagnóstico', {
          conectividade: conectividade.status,
          estrutura: estrutura.status,
          qualidade: qualidade.status,
          performance: performance.status
        });
        
      } catch (error) {
        resultados[unidade] = {
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString()
        };
        addLog('error', `Erro no diagnóstico da unidade ${unidade}: ${error.message}`, 'Diagnóstico');
      }
    }
    
    setDiagnosticResults(resultados);
    setLoading(false);
    addLog('success', 'Diagnóstico completo finalizado!', 'Diagnóstico');
    toast.success('✅ Diagnóstico completo finalizado!', { id: 'diagnostic' });
  };

  const testarConectividade = async (spreadsheetId) => {
    const inicio = Date.now();
    
    try {
      const dados = await googleSheetsService.buscarDadosSpreadsheet(spreadsheetId, 'A1:F10');
      const tempoResposta = Date.now() - inicio;
      
      return {
        status: 'success',
        tempoResposta,
        linhasEncontradas: dados.length,
        acessivel: true
      };
    } catch (error) {
      return {
        status: 'error',
        tempoResposta: Date.now() - inicio,
        erro: error.message,
        acessivel: false
      };
    }
  };

  const analisarEstrutura = async (spreadsheetId, unidade) => {
    try {
      const dados = await googleSheetsService.buscarDadosSpreadsheet(spreadsheetId, 'A1:F100');
      
      if (!dados || dados.length === 0) {
        return {
          status: 'error',
          message: 'Planilha vazia'
        };
      }
      
      const cabecalhos = dados[0] || [];
      const linhasDados = dados.slice(1);
      
      // Verificar estrutura esperada
      const estruturaEsperada = ['Nome Cliente', 'Valor', 'Data de Pagamento', 'Forma de Pagamento', 'Unidade', 'Observações'];
      const estruturaCorreta = estruturaEsperada.every((col, index) => 
        cabecalhos[index] && cabecalhos[index].toLowerCase().includes(col.toLowerCase().split(' ')[0])
      );
      
      return {
        status: estruturaCorreta ? 'success' : 'warning',
        cabecalhos,
        estruturaCorreta,
        totalLinhas: dados.length,
        linhasComDados: linhasDados.filter(linha => linha.some(cel => cel && cel.trim())).length,
        colunas: cabecalhos.length
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  };

  const analisarQualidadeDados = async (spreadsheetId, unidade) => {
    try {
      const extratos = await extratosService.buscarExtratos({ unidade });
      
      if (extratos.length === 0) {
        return {
          status: 'warning',
          message: 'Nenhum extrato encontrado'
        };
      }
      
      // Análise de qualidade
      const problemas = [];
      const estatisticas = {
        total: extratos.length,
        comCliente: 0,
        comValor: 0,
        comData: 0,
        valoresInvalidos: 0,
        datasInvalidas: 0
      };
      
      extratos.forEach(extrato => {
        if (extrato.cliente && extrato.cliente.trim()) estatisticas.comCliente++;
        if (extrato.valor && extrato.valor > 0) estatisticas.comValor++;
        if (extrato.data) estatisticas.comData++;
        
        if (extrato.valor && (isNaN(extrato.valor) || extrato.valor < 0)) {
          estatisticas.valoresInvalidos++;
        }
        
        if (extrato.data && isNaN(new Date(extrato.data).getTime())) {
          estatisticas.datasInvalidas++;
        }
      });
      
      // Identificar problemas
      if (estatisticas.comCliente / estatisticas.total < 0.8) {
        problemas.push('Muitos registros sem nome do cliente');
      }
      if (estatisticas.comValor / estatisticas.total < 0.9) {
        problemas.push('Muitos registros sem valor válido');
      }
      if (estatisticas.valoresInvalidos > 0) {
        problemas.push(`${estatisticas.valoresInvalidos} valores inválidos encontrados`);
      }
      if (estatisticas.datasInvalidas > 0) {
        problemas.push(`${estatisticas.datasInvalidas} datas inválidas encontradas`);
      }
      
      const qualidade = problemas.length === 0 ? 'excellent' : 
                       problemas.length <= 2 ? 'good' : 'poor';
      
      return {
        status: qualidade === 'excellent' ? 'success' : qualidade === 'good' ? 'warning' : 'error',
        qualidade,
        estatisticas,
        problemas,
        valorTotal: extratos.reduce((sum, e) => sum + (e.valor || 0), 0)
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  };

  const medirPerformance = async (spreadsheetId, unidade) => {
    const inicio = Date.now();
    
    try {
      // Teste de performance com diferentes tamanhos
      const teste1 = Date.now();
      await googleSheetsService.buscarDadosSpreadsheet(spreadsheetId, 'A1:F10');
      const tempo10Linhas = Date.now() - teste1;
      
      const teste2 = Date.now();
      await googleSheetsService.buscarDadosSpreadsheet(spreadsheetId, 'A1:F100');
      const tempo100Linhas = Date.now() - teste2;
      
      const tempoTotal = Date.now() - inicio;
      
      return {
        status: tempoTotal < 3000 ? 'success' : tempoTotal < 5000 ? 'warning' : 'error',
        tempo10Linhas,
        tempo100Linhas,
        tempoTotal,
        performance: tempoTotal < 2000 ? 'excellent' : tempoTotal < 4000 ? 'good' : 'slow'
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        tempoTotal: Date.now() - inicio
      };
    }
  };

  const testarPlanilha = async (unidade, spreadsheetId) => {
    if (!spreadsheetId) {
      toast.error(`Por favor, configure o ID da planilha para ${unidade}`);
      addLog('error', `Tentativa de teste sem ID configurado para ${unidade}`, 'Teste');
      return;
    }

    setLoading(true);
    setTestResults(prev => ({ ...prev, [unidade]: 'testing' }));
    
    addLog('info', `Iniciando teste da planilha ${unidade}`, 'Teste');
    
    try {
      console.log(`🧪 Testando planilha ${unidade}: ${spreadsheetId}`);
      
      const dados = await googleSheetsService.buscarDadosSpreadsheet(spreadsheetId, 'A:F');
      
      if (dados && dados.length > 0) {
        console.log(`✅ Planilha ${unidade} acessível!`);
        
        setTestResults(prev => ({ 
          ...prev, 
          [unidade]: { 
            status: 'success', 
            rows: dados.length,
            cabecalhos: dados[0] || []
          }
        }));
        
        addLog('success', `Planilha ${unidade} conectada com sucesso! ${dados.length} linhas encontradas`, 'Teste', {
          linhas: dados.length,
          cabecalhos: dados[0] || []
        });
        toast.success(`✅ Planilha ${unidade} conectada! ${dados.length} linhas encontradas`);
      } else {
        setTestResults(prev => ({ ...prev, [unidade]: { status: 'error', message: 'Planilha vazia' } }));
        addLog('warning', `Planilha ${unidade} está vazia`, 'Teste');
        toast.error(`❌ Planilha ${unidade} está vazia`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao testar planilha ${unidade}:`, error);
      setTestResults(prev => ({ 
        ...prev, 
        [unidade]: { 
          status: 'error', 
          message: error.message 
        }
      }));
      addLog('error', `Erro ao testar planilha ${unidade}: ${error.message}`, 'Teste');
      toast.error(`❌ Erro na planilha ${unidade}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testarTodasPlanilhas = async () => {
    setLoading(true);
    addLog('info', 'Iniciando teste de todas as planilhas...', 'Teste');
    
    for (const unidade of unidades) {
      const spreadsheetId = config.unidadesPlanilhas[unidade];
      if (spreadsheetId) {
        await testarPlanilha(unidade, spreadsheetId);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    addLog('success', 'Teste de todas as planilhas concluído', 'Teste');
    setLoading(false);
  };

  const exportarRelatorio = () => {
    const relatorio = {
      timestamp: new Date().toISOString(),
      apiKeyStatus,
      systemStatus,
      testResults,
      diagnosticResults,
      logs: logs.slice(-100), // Últimos 100 logs
      config: {
        ...config,
        apiKey: config.apiKey ? '***HIDDEN***' : ''
      }
    };
    
    const blob = new Blob([JSON.stringify(relatorio, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-sheets-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    addLog('info', 'Relatório exportado com sucesso', 'Sistema');
    toast.success('📄 Relatório exportado com sucesso!');
  };

  const salvarConfiguracao = () => {
    addLog('info', 'Tentativa de salvar configuração', 'Sistema');
    toast.success('🚧 Funcionalidade de salvar em desenvolvimento');
    console.log('Configuração para salvar:', config);
  };

  const handleApiKeyChange = (value) => {
    setConfig(prev => ({ ...prev, apiKey: value }));
    if (value.length === 39) {
      setApiKeyStatus('pending');
      addLog('info', 'Nova API Key inserida, aguardando teste', 'API');
    }
  };

  const handlePlanilhaChange = (unidade, value) => {
    setConfig(prev => ({
      ...prev,
      unidadesPlanilhas: {
        ...prev.unidadesPlanilhas,
        [unidade]: value
      }
    }));
    
    if (value) {
      addLog('info', `ID da planilha atualizado para ${unidade}`, 'Configuração');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'invalid':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'testing':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'invalid':
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'testing':
        return 'border-blue-200 bg-blue-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'config':
        return renderConfigTab();
      case 'monitoring':
        return renderMonitoringTab();
      case 'diagnostic':
        return renderDiagnosticTab();
      case 'logs':
        return renderLogsTab();
      default:
        return renderConfigTab();
    }
  };

  const renderLogsTab = () => (
    <div className="space-y-6">
      <LogViewer 
        logs={logs} 
        onClear={clearLogs}
        title="Logs do Sistema Google Sheets"
      />
    </div>
  );

  const renderConfigTab = () => (
    <div className="space-y-6">
      {/* API Key Configuration */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">API Key do Google Sheets</h3>
            {getStatusIcon(apiKeyStatus)}
          </div>
          <button
            onClick={testarApiKey}
            disabled={!config.apiKey || apiKeyStatus === 'testing'}
            className="btn-secondary flex items-center space-x-2"
          >
            <TestTube className="h-4 w-4" />
            <span>Testar</span>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chave da API *
            </label>
            <input
              type="text"
              placeholder="Cole sua API Key aqui (39 caracteres)"
              className="input-field font-mono text-sm"
              value={config.apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Obtenha em: Google Cloud Console → APIs & Services → Credentials
            </p>
          </div>
          
          {apiKeyStatus === 'valid' && (
            <div className="text-sm text-green-700 bg-green-100 p-3 rounded">
              ✅ API Key válida e funcionando corretamente!
            </div>
          )}
          
          {apiKeyStatus === 'invalid' && (
            <div className="text-sm text-red-700 bg-red-100 p-3 rounded">
              ❌ API Key inválida ou sem permissões. Verifique:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Se a chave está correta (39 caracteres)</li>
                <li>Se Google Sheets API está habilitada</li>
                <li>Se não há restrições de domínio/IP</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Service Account */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Key className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Conta de Serviço</h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email da Conta de Serviço
          </label>
          <input
            type="email"
            className="input-field font-mono text-sm"
            value={config.serviceAccount}
            onChange={(e) => setConfig(prev => ({ ...prev, serviceAccount: e.target.value }))}
            placeholder="exemplo@projeto123.iam.gserviceaccount.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Compartilhe suas planilhas com este email para dar acesso
          </p>
        </div>
      </div>

      {/* Planilhas Configuration */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Planilhas por Unidade</h3>
          </div>
          <button
            onClick={testarTodasPlanilhas}
            disabled={loading || apiKeyStatus !== 'valid'}
            className="btn-primary flex items-center space-x-2"
          >
            <TestTube className="h-4 w-4" />
            <span>Testar Todas</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {unidades.map((unidade) => {
            const resultado = testResults[unidade];
            const status = resultado?.status || 'pending';
            
            return (
              <div key={unidade} className={`border rounded-lg p-4 ${getStatusColor(status)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{unidade}</h4>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <button
                      onClick={() => testarPlanilha(unidade, config.unidadesPlanilhas[unidade])}
                      disabled={loading || !config.unidadesPlanilhas[unidade]}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Testar
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="ID da planilha (exemplo: 1ABC123...)"
                    className="input-field text-sm font-mono"
                    value={config.unidadesPlanilhas[unidade] || ''}
                    onChange={(e) => handlePlanilhaChange(unidade, e.target.value)}
                  />
                  
                  {resultado && (
                    <div className="text-xs">
                      {resultado.status === 'success' && (
                        <span className="text-green-600">
                          ✅ {resultado.rows} linhas encontradas
                        </span>
                      )}
                      {resultado.status === 'error' && (
                        <span className="text-red-600">
                          ❌ {resultado.message}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderMonitoringTab = () => (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status da API</p>
              <p className={`text-lg font-bold ${apiKeyStatus === 'valid' ? 'text-green-600' : 'text-red-600'}`}>
                {apiKeyStatus === 'valid' ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Planilhas Ativas</p>
              <p className="text-lg font-bold text-blue-600">
                {Object.values(systemStatus).filter(s => s.status === 'online').length} / {unidades.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Registros</p>
              <p className="text-lg font-bold text-purple-600">
                {Object.values(systemStatus).reduce((sum, s) => sum + (s.registros || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Status */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Status Detalhado por Unidade</h3>
        
        <div className="space-y-4">
          {unidades.map((unidade) => {
            const status = systemStatus[unidade];
            
            return (
              <div key={unidade} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{unidade}</h4>
                  <div className="flex items-center space-x-2">
                    {status?.status === 'online' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                        Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>
                        Offline
                      </span>
                    )}
                  </div>
                </div>
                
                {status && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Registros:</span>
                      <span className="ml-1 font-medium">{status.registros || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Valor Total:</span>
                      <span className="ml-1 font-medium">
                        R$ {(status.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Última Atualização:</span>
                      <span className="ml-1 font-medium">
                        {status.ultimaAtualizacao ? new Date(status.ultimaAtualizacao).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-1 font-medium ${status.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                        {status.status === 'online' ? 'Funcionando' : 'Com problemas'}
                      </span>
                    </div>
                  </div>
                )}
                
                {status?.erro && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    ❌ {status.erro}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderDiagnosticTab = () => (
    <div className="space-y-6">
      {/* Diagnostic Controls */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Diagnóstico Avançado</h3>
            <p className="text-sm text-gray-600">Análise completa de conectividade, estrutura e qualidade dos dados</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportarRelatorio}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exportar Relatório</span>
            </button>
            <button
              onClick={executarDiagnosticoCompleto}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Executar Diagnóstico</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostic Results */}
      {Object.keys(diagnosticResults).length > 0 && (
        <div className="space-y-4">
          {unidades.map((unidade) => {
            const resultado = diagnosticResults[unidade];
            if (!resultado) return null;
            
            return (
              <div key={unidade} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">{unidade}</h4>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(resultado.status)}
                    <span className="text-sm text-gray-500">
                      {resultado.timestamp && new Date(resultado.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {resultado.status === 'success' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Conectividade */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">Conectividade</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>Status: {getStatusIcon(resultado.conectividade.status)}</div>
                        <div>Tempo: {resultado.conectividade.tempoResposta}ms</div>
                        <div>Linhas: {resultado.conectividade.linhasEncontradas}</div>
                      </div>
                    </div>
                    
                    {/* Estrutura */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Database className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">Estrutura</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>Status: {getStatusIcon(resultado.estrutura.status)}</div>
                        <div>Colunas: {resultado.estrutura.colunas}</div>
                        <div>Com dados: {resultado.estrutura.linhasComDados}</div>
                      </div>
                    </div>
                    
                    {/* Qualidade */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-sm">Qualidade</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>Status: {getStatusIcon(resultado.qualidade.status)}</div>
                        <div>Registros: {resultado.qualidade.estatisticas?.total}</div>
                        <div>Problemas: {resultado.qualidade.problemas?.length || 0}</div>
                      </div>
                    </div>
                    
                    {/* Performance */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-sm">Performance</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>Status: {getStatusIcon(resultado.performance.status)}</div>
                        <div>Tempo total: {resultado.performance.tempoTotal}ms</div>
                        <div>Qualidade: {resultado.performance.performance}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {resultado.status === 'error' && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                    ❌ {resultado.message}
                  </div>
                )}
                
                {/* Problemas de Qualidade */}
                {resultado.qualidade?.problemas && resultado.qualidade.problemas.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h5 className="font-medium text-yellow-800 mb-2">Problemas Identificados:</h5>
                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                      {resultado.qualidade.problemas.map((problema, index) => (
                        <li key={index}>{problema}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuração Google Sheets</h1>
            <p className="text-gray-600">Configure, monitore e diagnostique a integração com as planilhas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('config')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Configuração</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'monitoring'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Monitoramento</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('diagnostic')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'diagnostic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Diagnóstico</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4" />
                <span>Logs</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Actions */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Configure sua API Key e IDs das planilhas para começar a usar a integração
          </div>
          <button
            onClick={salvarConfiguracao}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Salvar Configuração</span>
          </button>
        </div>
      </div>
    </div>
  );
} 