import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Download, Trash2, Play, Pause, Filter } from 'lucide-react';

export default function LogViewer({ logs = [], onClear, title = "Logs do Sistema" }) {
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const logContainerRef = useRef(null);

  // Auto scroll para o final quando novos logs chegam
  useEffect(() => {
    if (isAutoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.level === filter;
    const matchesSearch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const exportLogs = () => {
    const logData = filteredLogs.map(log => ({
      timestamp: log.timestamp,
      level: log.level,
      source: log.source,
      message: log.message
    }));

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-sheets-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Terminal className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">{title}</h3>
          <span className="text-sm text-gray-500">({filteredLogs.length} entradas)</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={`p-2 rounded ${isAutoScroll ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            title={isAutoScroll ? 'Desabilitar auto-scroll' : 'Habilitar auto-scroll'}
          >
            {isAutoScroll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          
          {/* Export */}
          <button
            onClick={exportLogs}
            className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Exportar logs"
          >
            <Download className="h-4 w-4" />
          </button>
          
          {/* Clear */}
          <button
            onClick={onClear}
            className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Limpar logs"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">Todos os níveis</option>
            <option value="error">Erros</option>
            <option value="warning">Avisos</option>
            <option value="success">Sucessos</option>
            <option value="info">Informações</option>
          </select>
        </div>
        
        <input
          type="text"
          placeholder="Buscar nos logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-sm border border-gray-300 rounded px-3 py-1 flex-1 max-w-xs"
        />
      </div>

      {/* Log Container */}
      <div
        ref={logContainerRef}
        className="bg-gray-900 text-gray-100 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm"
        style={{ scrollBehavior: 'smooth' }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            {logs.length === 0 ? 'Nenhum log disponível' : 'Nenhum log corresponde aos filtros'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${getLogLevelColor(log.level)} border-l-4 ${
                  log.level === 'error' ? 'border-red-500' :
                  log.level === 'warning' ? 'border-yellow-500' :
                  log.level === 'success' ? 'border-green-500' :
                  'border-blue-500'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <span className="flex-shrink-0">{getLogIcon(log.level)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      {log.source && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-1 rounded">
                          {log.source}
                        </span>
                      )}
                    </div>
                    <div className="text-sm break-words">
                      {log.message}
                    </div>
                    {log.details && (
                      <div className="mt-1 text-xs opacity-75">
                        {typeof log.details === 'object' ? 
                          JSON.stringify(log.details, null, 2) : 
                          log.details
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>
          {filteredLogs.length > 0 && `Última entrada: ${new Date(filteredLogs[filteredLogs.length - 1]?.timestamp).toLocaleTimeString()}`}
        </span>
        <span>
          Auto-scroll: {isAutoScroll ? 'Ativo' : 'Inativo'}
        </span>
      </div>
    </div>
  );
} 