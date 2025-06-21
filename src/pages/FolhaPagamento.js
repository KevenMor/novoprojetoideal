import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUnitFilter } from '../contexts/UnitFilterContext';
import { Edit2, Plus, Search, Trash2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { funcionariosService } from '../services/funcionariosService';
import { lancamentosService } from '../services/lancamentosService';
import { auth } from '../firebase/config';

const unidadesDisponiveis = [
  "Vila Helena",
  "Vila Progresso",
  "Vila Haro",
  "Coop",
  "Julio de Mesquita",
  "Aparecidinha",
  "Administrativo"
];

const formatDocumento = (documento = '') => {
  const onlyNumbers = String(documento).replace(/\D/g, '');
  if (!onlyNumbers) return '';
  
  // Se tem 14 dígitos, é CNPJ
  if (onlyNumbers.length === 14) {
    return onlyNumbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
  
  // Senão, formata como CPF (11 dígitos)
  return onlyNumbers
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

// Manter compatibilidade com código existente
const formatCPF = formatDocumento;

const formatToBRLString = (value) => {
  const number = Number(value);
  if (value === null || value === undefined || isNaN(number)) {
    return '0,00';
  }
  return number.toFixed(2).replace('.', ',');
};

export default function FolhaPagamento() {
  const { isAdmin, user } = useAuth();
  const { selectedUnit } = useUnitFilter();
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [funcionarioParaEditar, setFuncionarioParaEditar] = useState(null);
  const [busca, setBusca] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cnpj: '',
    tipoDocumento: 'cpf', // 'cpf' ou 'cnpj'
    unidade: '',
    salario: '',
    tipoPix: '',
    chavePix: ''
  });

  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [funcionarioParaPagamento, setFuncionarioParaPagamento] = useState(null);
  const [formPagamento, setFormPagamento] = useState({
    adiantamento: '',
    dataAdiantamento: '',
    salario: '',
    dataSalario: ''
  });

  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [tipoLote, setTipoLote] = useState('salario');
  const [enviandoLote, setEnviandoLote] = useState(false);

  const carregarFuncionarios = useCallback(async () => {
    if (!selectedUnit) return;
    
    try {
      setLoading(true);
      console.log('🔄 Carregando funcionários para unidade:', selectedUnit);
      
             if (!user) {
         toast.error('Usuário não autenticado');
         return;
       }

       const funcionariosData = await funcionariosService.listarFuncionarios(selectedUnit, {
         perfil: user
       });
      
      const dadosFormatados = funcionariosData.map(f => ({
        ...f,
        salario: f.salario ? formatToBRLString(f.salario) : '0,00',
        adiantamento: f.adiantamento ? formatToBRLString(f.adiantamento) : '0,00',
      }));

      console.log('Funcionários carregados e formatados:', dadosFormatados);
      setFuncionarios(dadosFormatados);
    } catch (error) {
      console.error('❌ Erro ao carregar funcionários:', error);
      toast.error('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  }, [selectedUnit, user]);

  useEffect(() => {
    carregarFuncionarios();
  }, [carregarFuncionarios]);

  const handleAbrirModal = (funcionario = null) => {
    if (funcionario) {
      setFormData({
        nome: funcionario.nome || '',
        cpf: funcionario.cpf || '',
        cnpj: funcionario.cnpj || '',
        tipoDocumento: funcionario.cnpj ? 'cnpj' : 'cpf',
        unidade: funcionario.unidade || '',
        salario: funcionario.salario || '',
        tipoPix: funcionario.tipoPix || '',
        chavePix: funcionario.chavePix || ''
      });
    } else {
      setFormData({
        nome: '',
        cpf: '',
        cnpj: '',
        tipoDocumento: 'cpf',
        unidade: selectedUnit === 'Geral' ? '' : selectedUnit,
        salario: '',
        tipoPix: '',
        chavePix: ''
      });
    }
    setFuncionarioParaEditar(funcionario);
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setFuncionarioParaEditar(null);
    setModalAberto(false);
    setFormData({
      nome: '',
      cpf: '',
      cnpj: '',
      tipoDocumento: 'cpf',
      unidade: '',
      salario: '',
      tipoPix: '',
      chavePix: ''
    });
  };

  const formatPhone = (value) => {
    // Remove tudo que não é número
    let v = value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 0) v = '(' + v;
    if (v.length > 3) v = v.slice(0, 3) + ') ' + v.slice(3);
    if (v.length > 10) v = v.slice(0, 10) + '-' + v.slice(10);
    else if (v.length > 6) v = v.slice(0, 9) + '-' + v.slice(9);
    return v;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'salario') {
      // Remove tudo que não é número
      let numericValue = value.replace(/[^\d]/g, '');
      
      // Converte para centavos e depois para reais com duas casas decimais
      if (numericValue) {
        const reais = (parseInt(numericValue) / 100);
        const formatted = reais.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        setFormData(prev => ({
          ...prev,
          [name]: formatted
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    } else if (name === 'tipoDocumento') {
      // Limpa os campos de documento ao trocar o tipo
      setFormData(prev => ({
        ...prev,
        [name]: value,
        cpf: '',
        cnpj: '',
        chavePix: ''
      }));
    } else if (name === 'tipoPix') {
      // Se o tipo PIX for CPF/CNPJ, preenche automaticamente com o documento
      const documento = formData.tipoDocumento === 'cpf' ? formData.cpf : formData.cnpj;
      setFormData(prev => ({
        ...prev,
        [name]: value,
        chavePix: (value === 'CPF' || value === 'CNPJ') ? documento : prev.chavePix
      }));
    } else if (name === 'cpf' || name === 'cnpj') {
      const formattedDoc = formatDocumento(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedDoc,
        chavePix: (prev.tipoPix === 'CPF' || prev.tipoPix === 'CNPJ') ? formattedDoc : prev.chavePix
      }));
    } else if (name === 'chavePix' && formData.tipoPix === 'TELEFONE') {
      setFormData(prev => ({
        ...prev,
        [name]: formatPhone(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFuncionarioChange = (id, campo, valor) => {
    // Formatação automática para campos de valor
    if (campo === 'salario' || campo === 'adiantamento') {
      // Remove tudo que não é número
      let numericValue = valor.replace(/[^\d]/g, '');
      
      if (numericValue) {
        const reais = (parseInt(numericValue) / 100);
        const formatted = reais.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        setFuncionarios(prev => prev.map(f => 
          f.id === id ? { ...f, [campo]: formatted } : f
        ));
      } else {
        setFuncionarios(prev => prev.map(f => 
          f.id === id ? { ...f, [campo]: '' } : f
        ));
      }
    } else {
      setFuncionarios(prev => prev.map(f => 
        f.id === id ? { ...f, [campo]: valor } : f
      ));
    }
  };

  const handleSalvarAlteracao = async (id, campo) => {
    const funcionario = funcionarios.find(f => f.id === id);
    if (!funcionario) {
        toast.error("Funcionário não encontrado para atualizar.");
        return;
    }

    const valorString = funcionario[campo] || '0';
    // Converte valor formatado brasileiro para número
    const valorNumerico = parseFloat(String(valorString).replace(/\./g, '').replace(',', '.')) || 0;

    const dadosParaAtualizar = { ...funcionario, [campo]: valorNumerico };

    try {
      await funcionariosService.atualizarFuncionario(id, dadosParaAtualizar);
      toast.success(`${capitalizeName(campo)} atualizado!`);
      
      // Mantém a formatação na interface
      const valorFormatado = valorNumerico.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      setFuncionarios(prev => prev.map(f => 
        f.id === id ? { ...f, [campo]: valorFormatado } : f
      ));

    } catch (error) {
      toast.error(`Erro ao atualizar ${campo}.`);
      console.error(`Erro ao atualizar campo ${campo}:`, error);
      await carregarFuncionarios();
    }
  };

  function capitalizeName(nome) {
    if (!nome) return '';
    return nome
      .toLowerCase()
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Verificar autenticação novamente
      if (!user) {
        throw new Error('Usuário não está autenticado');
      }

      const salarioSeguro = String(formData.salario || '').replace(',', '.');

      const dadosParaSalvar = {
        nome: capitalizeName(formData.nome),
        unidade: formData.unidade,
        salario: parseFloat(salarioSeguro) || 0,
        tipoPix: formData.tipoPix,
        chavePix: formData.chavePix,
        // Salva apenas o documento correto baseado no tipo
        ...(formData.tipoDocumento === 'cpf' 
          ? { cpf: formData.cpf }
          : { cnpj: formData.cnpj }
        )
      };
      
      console.log('Tentando salvar funcionário:', dadosParaSalvar);

      if (funcionarioParaEditar && funcionarioParaEditar.id) {
        await funcionariosService.atualizarFuncionario(funcionarioParaEditar.id, dadosParaSalvar);
        toast.success('Funcionário atualizado com sucesso!');
      } else {
        await funcionariosService.adicionarFuncionario(dadosParaSalvar);
        toast.success('Funcionário adicionado com sucesso!');
      }

      handleFecharModal();
      await carregarFuncionarios();
    } catch (error) {
      console.error('Erro detalhado ao salvar funcionário:', error);
      toast.error('Erro ao salvar funcionário: ' + error.message);
    }
  };

  const handleExcluirFuncionario = async (funcionario) => {
    try {
      if (window.confirm(`Tem certeza que deseja excluir o funcionário ${funcionario.nome}?`)) {
        await funcionariosService.excluirFuncionario(funcionario.id);
        toast.success('Funcionário excluído com sucesso!');
        await carregarFuncionarios();
      }
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      toast.error('Erro ao excluir funcionário: ' + error.message);
    }
  };

  const funcionariosFiltrados = funcionarios.filter(funcionario => 
    funcionario.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (funcionario.cpf && funcionario.cpf.includes(busca)) ||
    (funcionario.cnpj && funcionario.cnpj.includes(busca))
  );

  const handleAbrirModalPagamento = (funcionario) => {
    setFuncionarioParaPagamento(funcionario);
    setFormPagamento({
      adiantamento: (funcionario.salario * 0.4).toFixed(2), // 40% do salário como padrão
      dataAdiantamento: '', 
      salario: funcionario.salario.toFixed(2),
      dataSalario: ''
    });
    setModalPagamentoAberto(true);
  };

  const handleFecharModalPagamento = () => {
    setFuncionarioParaPagamento(null);
    setModalPagamentoAberto(false);
    setFormPagamento({
      adiantamento: '',
      dataAdiantamento: '',
      salario: '',
      dataSalario: ''
    });
  };

  const handlePagamentoChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'adiantamento' || name === 'salario') {
      // Remove tudo que não é número
      let numericValue = value.replace(/[^\d]/g, '');
      
      // Converte para reais com duas casas decimais
      if (numericValue) {
        const reais = (parseInt(numericValue) / 100).toFixed(2);
        setFormPagamento(prev => ({
          ...prev,
          [name]: reais
        }));
      } else {
        setFormPagamento(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    } else {
      setFormPagamento(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmitPagamento = async (e) => {
    e.preventDefault();
    try {
      if (!funcionarioParaPagamento) {
        throw new Error('Funcionário não selecionado');
      }

      // Validar datas
      if (!formPagamento.dataAdiantamento && !formPagamento.dataSalario) {
        throw new Error('Pelo menos uma data de pagamento deve ser informada');
      }

      // Validar valores
      if (formPagamento.dataAdiantamento && !formPagamento.adiantamento) {
        throw new Error('Valor do adiantamento deve ser informado');
      }
      if (formPagamento.dataSalario && !formPagamento.salario) {
        throw new Error('Valor do salário deve ser informado');
      }

      const dados = {
        adiantamento: formPagamento.adiantamento ? parseFloat(formPagamento.adiantamento) : null,
        dataAdiantamento: formPagamento.dataAdiantamento ? new Date(formPagamento.dataAdiantamento) : null,
        salario: formPagamento.salario ? parseFloat(formPagamento.salario) : null,
        dataSalario: formPagamento.dataSalario ? new Date(formPagamento.dataSalario) : null
      };

      await lancamentosService.programarPagamentos(funcionarioParaPagamento, dados);
      toast.success('Pagamentos programados com sucesso!');
      handleFecharModalPagamento();
    } catch (error) {
      console.error('Erro ao programar pagamentos:', error);
      toast.error('Erro ao programar pagamentos: ' + error.message);
    }
  };

  const formatCurrencyForInput = (value) => {
    if (!value) return '';
    
    // Se já é um número, formata
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    
    // Se é string, retorna como está (já formatada)
    return value;
  };

  const handleAbrirModalLote = () => {
    setModalLoteAberto(true);
    setTipoLote('salario');
  };
  const handleFecharModalLote = () => {
    setModalLoteAberto(false);
    setTipoLote('salario');
  };

  const handleEnviarLote = async () => {
    setEnviandoLote(true);
    try {
      const parseCurrency = (value) => {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string' || !value) return 0;
        const cleanedValue = value
          .replace('R$', '')
          .trim()
          .replace(/\./g, '')
          .replace(',', '.');
        return parseFloat(cleanedValue) || 0;
      };

      const lote = funcionariosFiltrados
        .map(f => {
          const valorCampo = tipoLote === 'salario' ? f.salario : f.adiantamento;
          return {
            ...f,
            valorParaLote: parseCurrency(valorCampo)
          };
        })
        .filter(f => f.valorParaLote > 0)
        .map(f => ({
          nome: f.nome,
          cpf: f.cpf,
          unidade: f.unidade,
          valor: f.valorParaLote,
          tipoPix: f.tipoPix,
          chavePix: f.chavePix
        }));

      if (lote.length === 0) {
        toast.error(`Nenhum funcionário com ${tipoLote} maior que R$ 0,00 para programar.`);
        setEnviandoLote(false);
        return;
      }
      
      // Salva o lote no localStorage para ser pego pela outra página
      localStorage.setItem('lotePagamentoFolha', JSON.stringify({ lote, tipo: tipoLote }));
      
      toast.success(`${lote.length} pagamentos de ${tipoLote} enviados para a Gestão de Contas!`);
      
      // Navega para a página de gestão de contas
      navigate('/gestao-contas-btg');

    } catch (error) {
      toast.error('Erro ao programar lote!');
      console.error(error);
    } finally {
      setEnviandoLote(false);
    }
  };

  return (
    <div className="page-container-xl space-y-8">
      <div className="flex-mobile flex-mobile-row justify-between mb-6">
        <h1 className="text-mobile-lg font-bold">Folha de Pagamento</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAbrirModal}
            className="btn-mobile btn-mobile-primary bg-blue-500 hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus size={16} />
            <span className="hide-mobile">Adicionar</span> Funcionário
          </button>
          <button
            onClick={handleAbrirModalLote}
            className="btn-mobile btn-mobile-primary bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <Calendar size={16} />
            <span className="hide-mobile">Programar</span> Lote
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Buscar funcionário</label>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite o nome, CPF ou CNPJ do funcionário..."
          className="form-input-mobile w-full"
        />
      </div>

      {loading ? (
        <div className="card-mobile text-center">
          <p className="text-mobile-base">Carregando...</p>
        </div>
      ) : (
        <div className="table-mobile-container">
          <table className="table-mobile">
            <thead>
              <tr>
                <th className="text-mobile-xs">Nome</th>
                <th className="text-mobile-xs">CPF/CNPJ</th>
                <th className="text-mobile-xs">Salário</th>
                <th className="text-mobile-xs">Adiantamento</th>
                <th className="text-mobile-xs">Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionariosFiltrados.map((funcionario) => (
                <tr key={funcionario.id}>
                  <td className="text-mobile-sm">{capitalizeName(funcionario.nome)}</td>
                  <td className="text-mobile-sm">{formatDocumento(funcionario.cpf || funcionario.cnpj)}</td>
                  <td>
                    <input
                      type="text"
                      value={funcionario.salario}
                      onChange={(e) => handleFuncionarioChange(funcionario.id, 'salario', e.target.value)}
                      onBlur={() => handleSalvarAlteracao(funcionario.id, 'salario')}
                      className="form-input-mobile p-1 pl-20 text-mobile-sm"
                      placeholder="R$ 0,00"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={funcionario.adiantamento}
                      onChange={(e) => handleFuncionarioChange(funcionario.id, 'adiantamento', e.target.value)}
                      onBlur={() => handleSalvarAlteracao(funcionario.id, 'adiantamento')}
                      className="form-input-mobile p-1 pl-20 text-mobile-sm"
                      placeholder="R$ 0,00"
                    />
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAbrirModal(funcionario)} 
                        className="touch-target text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleExcluirFuncionario(funcionario)} 
                        className="touch-target text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Adicionar/Editar Funcionário */}
      {modalAberto && (
        <div className="modal-mobile">
          <div className="modal-mobile-content">
            <h2 className="text-mobile-lg font-bold mb-6">{funcionarioParaEditar ? 'Editar Funcionário' : 'Adicionar Funcionário'}</h2>
            <form onSubmit={handleSubmit} className="form-mobile">
              <div className="form-group-mobile">
                <label className="form-label-mobile">Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className="form-input-mobile"
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="form-group-mobile">
                <label className="form-label-mobile">Tipo de Documento</label>
                <select
                  name="tipoDocumento"
                  value={formData.tipoDocumento}
                  onChange={handleInputChange}
                  className="form-input-mobile"
                  required
                >
                  <option value="cpf">CPF (Pessoa Física)</option>
                  <option value="cnpj">CNPJ (Pessoa Jurídica)</option>
                </select>
              </div>
              <div className="form-group-mobile">
                <label className="form-label-mobile">
                  {formData.tipoDocumento === 'cpf' ? 'CPF' : 'CNPJ'}
                </label>
                <input
                  type="text"
                  name={formData.tipoDocumento}
                  value={formData.tipoDocumento === 'cpf' ? formData.cpf : formData.cnpj}
                  onChange={handleInputChange}
                  className="form-input-mobile"
                  placeholder={formData.tipoDocumento === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                  required
                />
              </div>
               <div className="form-group-mobile">
                <label className="form-label-mobile">Unidade</label>
                <select
                  name="unidade"
                  value={formData.unidade}
                  onChange={handleInputChange}
                  className="form-input-mobile"
                  required
                >
                  <option value="">Selecione uma unidade</option>
                  {unidadesDisponiveis.map(unidade => (
                    <option key={unidade} value={unidade}>{unidade}</option>
                  ))}
                </select>
              </div>
               <div className="form-group-mobile">
                <label className="form-label-mobile">Salário Base</label>
                <input
                  type="text"
                  name="salario"
                  value={formatCurrencyForInput(formData.salario)}
                  onChange={handleInputChange}
                  className="form-input-mobile pl-20"
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="form-group-mobile">
                <label className="form-label-mobile">Tipo de Chave PIX</label>
                <select name="tipoPix" value={formData.tipoPix} onChange={handleInputChange} className="form-input-mobile" required>
                  <option value="">Selecione</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="TELEFONE">Telefone</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="ALEATORIA">Chave Aleatória</option>
                </select>
              </div>
              <div className="form-group-mobile">
                <label className="form-label-mobile">Chave PIX</label>
                <input
                  type="text"
                  name="chavePix"
                  value={formData.chavePix}
                  onChange={handleInputChange}
                  className="form-input-mobile"
                  placeholder="Digite a chave PIX"
                  required
                />
              </div>
              <div className="flex-mobile flex-mobile-row justify-end">
                <button type="button" onClick={handleFecharModal} className="btn-mobile btn-mobile-secondary">Cancelar</button>
                <button type="submit" className="btn-mobile btn-mobile-primary bg-blue-500 hover:bg-blue-600">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Programar Lote de Pagamento */}
      {modalLoteAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-6">Programar Lote de Pagamento</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o tipo de lote:</label>
              <select
                value={tipoLote}
                onChange={e => setTipoLote(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="salario">Salário</option>
                <option value="adiantamento">Adiantamento</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={handleFecharModalLote}
                className="px-4 py-2 bg-gray-300 rounded-lg"
                disabled={enviandoLote}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEnviarLote}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
                disabled={enviandoLote}
              >
                {enviandoLote ? 'Enviando...' : 'Programar Lote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 