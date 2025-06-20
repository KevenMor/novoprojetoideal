import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnitFilter } from '../contexts/UnitFilterContext';
import { Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { lancamentosService } from '../services/lancamentosService';

export default function HistoricoLancamentos() {
  const { isAdmin } = useAuth();
  const { selectedUnit } = useUnitFilter();
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    status: 'AGENDADO',
    tipo: '',
    dataInicial: '',
    dataFinal: ''
  });

  useEffect(() => {
    carregarLancamentos();
  }, [selectedUnit, filtros]);

  const carregarLancamentos = async () => {
    try {
      setLoading(true);
      const dados = await lancamentosService.listarLancamentos({
        ...filtros,
        unidade: selectedUnit
      });
      setLancamentos(dados);
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
      toast.error('Erro ao carregar lançamentos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor) => {
    if (typeof valor !== 'number') return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleExportarBTG = async () => {
    try {
      // TODO: Implementar exportação para BTG
      toast.success('Função de exportação será implementada em breve!');
    } catch (error) {
      console.error('Erro ao exportar para BTG:', error);
      toast.error('Erro ao exportar para BTG: ' + error.message);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Histórico de Lançamentos</h1>
        
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={filtros.status}
                onChange={handleFiltroChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="AGENDADO">Agendado</option>
                <option value="PAGO">Pago</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                name="tipo"
                value={filtros.tipo}
                onChange={handleFiltroChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Todos</option>
                <option value="ADIANTAMENTO">Adiantamento</option>
                <option value="SALARIO">Salário</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                name="dataInicial"
                value={filtros.dataInicial}
                onChange={handleFiltroChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                name="dataFinal"
                value={filtros.dataFinal}
                onChange={handleFiltroChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {isAdmin && (
              <div className="flex items-end">
                <button
                  onClick={handleExportarBTG}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar BTG
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Agendada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Pagamento</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    Carregando...
                  </td>
                </tr>
              ) : lancamentos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    Nenhum lançamento encontrado
                  </td>
                </tr>
              ) : (
                lancamentos.map((lancamento) => (
                  <tr key={lancamento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{lancamento.funcionarioNome}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{lancamento.funcionarioUnidade}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{lancamento.tipo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatarValor(lancamento.valor)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatarData(lancamento.dataAgendada)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        lancamento.status === 'PAGO' ? 'bg-green-100 text-green-800' :
                        lancamento.status === 'AGENDADO' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lancamento.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatarData(lancamento.dataPagamento)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 