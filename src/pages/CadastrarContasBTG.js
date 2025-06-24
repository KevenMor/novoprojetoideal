import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnitFilter } from '../contexts/UnitFilterContext';
import { contasBTGService } from '../services/contasBTGService';
import { lancamentosService } from '../services/lancamentosService';
import toast from 'react-hot-toast';
import { FileText, Smartphone, Camera } from 'lucide-react';
import UnitSelector from '../components/UnitSelector';

const CadastrarContasBTG = () => {
  const { user, loading: authLoading } = useAuth();
  const { selectedUnit } = useUnitFilter();

  const [tipo, setTipo] = useState('pix');
  const [loading, setLoading] = useState(false);

  // Estados para cada formulário
  const [boletoData, setBoletoData] = useState({
    linhaDigitavel: '',
    valor: '',
    vencimento: '',
    descricao: '',
    categoria: 'CONTA_BTG',
    formaPagamentoBaixa: 'DINHEIRO'
  });

  const [pixData, setPixData] = useState({
    tipoChave: 'celular',
    chavePix: '',
    favorecido: '',
    cpfCnpjFavorecido: '',
    valor: '',
    vencimento: '',
    descricao: '',
    categoria: 'CONTA_BTG',
    formaPagamentoBaixa: 'PIX'
  });

  // Detectar se está em mobile
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

  const handleChange = (e, formType) => {
    const { name, value } = e.target;
    
    if (formType === 'boleto') {
      if (name === 'linhaDigitavel') {
        const numericValue = value.replace(/\D/g, ''); // Permite apenas números
        if (numericValue.length <= 44) {
          setBoletoData(prev => ({ ...prev, [name]: numericValue }));
        }
      } else if (name === 'valor') {
        // Formatação automática do valor em tempo real
        const formattedValue = formatCurrencyInput(value);
        setBoletoData(prev => ({ ...prev, [name]: formattedValue }));
      } else {
        setBoletoData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      if (name === 'valor') {
        // Formatação automática do valor em tempo real
        const formattedValue = formatCurrencyInput(value);
        setPixData(prev => ({ ...prev, [name]: formattedValue }));
      } else {
        setPixData(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  // Função para formatar valor monetário em tempo real
  const formatCurrencyInput = (value) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    // Se não há dígitos, retorna vazio
    if (!digits) return '';
    
    // Converte para número e divide por 100 para ter centavos
    const number = parseInt(digits, 10) / 100;
    
    // Formata como moeda brasileira
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para converter valor formatado de volta para número
  const parseCurrencyValue = (formattedValue) => {
    if (!formattedValue) return 0;
    // Remove pontos de milhares e substitui vírgula por ponto
    return parseFloat(formattedValue.replace(/\./g, '').replace(',', '.'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUnit) {
      toast.error('Por favor, selecione uma unidade.');
      return;
    }
    
    if (authLoading) {
      toast.error('Aguarde, autenticação em andamento...');
      return;
    }

    if (!user || !user.email) {
      toast.error('Usuário não autenticado ou e-mail inválido.');
      return;
    }

    setLoading(true);

    let dadosParaSalvar;
    if (tipo === 'boleto') {
      // Validação da linha digitável
      if (boletoData.linhaDigitavel && boletoData.linhaDigitavel.length !== 44) {
        toast.error('A linha digitável do boleto deve conter 44 números.');
        setLoading(false);
        return;
      }
      dadosParaSalvar = { 
        ...boletoData,
        valor: parseCurrencyValue(boletoData.valor) // Converte valor formatado para número
      };
    } else {
      dadosParaSalvar = { 
        ...pixData,
        valor: parseCurrencyValue(pixData.valor) // Converte valor formatado para número
      };
    }
    
    // Validação
    if (!dadosParaSalvar.valor || !dadosParaSalvar.vencimento || !dadosParaSalvar.descricao) {
        toast.error('Preencha todos os campos obrigatórios.');
        setLoading(false);
        return;
    }

    const contaData = {
      unidade: selectedUnit,
      emailCriador: user.email,
      tipo,
      ...dadosParaSalvar,
    };

    try {
      // 1. Criar a conta no BTG
      const contaCriada = await contasBTGService.criarConta(contaData);
      console.log('Conta BTG criada:', contaCriada);

      // 2. Criar o lançamento correspondente com status 'AGUARDANDO'
      const lancamentoData = {
        descricao: `[AGUARDANDO] ${contaData.descricao}`,
        valor: contaData.valor, // Já convertido para número
        data: contaData.vencimento, // Formato AAAA-MM-DD
        unidade: selectedUnit,
        tipo: 'DESPESA',
        categoria: contaData.categoria, // Usar categoria selecionada
        formaPagamento: contaData.formaPagamentoBaixa, // Usar forma de pagamento da baixa
        status: 'AGUARDANDO',
        contaBTGId: contaCriada.id, // Link para a conta BTG
        criadoPor: user.email, // Adicionando quem criou o lançamento
        // Campos para quando der baixa
        tipoConta: tipo.toUpperCase(), // BOLETO ou PIX (registro original)
        formaPagamentoOriginal: tipo.toUpperCase(), // Manter referência original
      };

      await lancamentosService.criarLancamento(lancamentoData);
      
      toast.success('Conta cadastrada e lançamento criado com sucesso!');
      
      // Limpar formulário
      if (tipo === 'boleto') {
        setBoletoData({ 
          linhaDigitavel: '', 
          valor: '', 
          vencimento: '', 
          descricao: '', 
          categoria: 'CONTA_BTG', 
          formaPagamentoBaixa: 'DINHEIRO' 
        });
      } else {
        setPixData({ 
          tipoChave: 'celular', 
          chavePix: '', 
          favorecido: '', 
          cpfCnpjFavorecido: '', 
          valor: '', 
          vencimento: '', 
          descricao: '', 
          categoria: 'CONTA_BTG', 
          formaPagamentoBaixa: 'PIX' 
        });
      }

    } catch (error) {
      console.error("Erro ao cadastrar conta:", error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="page-container-xl">
      <div className="w-full bg-white p-4 sm:p-8 rounded-lg shadow-md">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Cadastrar Contas BTG</h1>
        <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Cadastre contas para pagamento via boleto ou PIX.</p>
        
        <div className="mb-4 sm:mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Unidade</label>
          <UnitSelector />
        </div>

        <form onSubmit={handleSubmit}>
          {/* TIPO DE PAGAMENTO */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-3">Tipo de Pagamento *</label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
               <button type="button" onClick={() => setTipo('boleto')} className={`flex-1 p-3 sm:p-4 border-2 rounded-lg text-left transition-colors flex items-center touch-manipulation ${tipo === 'boleto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-sm sm:text-base">Boleto</div>
                  <div className="text-xs sm:text-sm text-gray-500">Linha digitável</div>
                </div>
              </button>
              <button type="button" onClick={() => setTipo('pix')} className={`flex-1 p-3 sm:p-4 border-2 rounded-lg text-left transition-colors flex items-center touch-manipulation ${tipo === 'pix' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-3" />
                 <div>
                  <div className="font-medium text-sm sm:text-base">PIX</div>
                  <div className="text-xs sm:text-sm text-gray-500">Chave PIX</div>
                </div>
              </button>
            </div>
          </div>

          {/* FORMULÁRIO BOLETO */}
          {tipo === 'boleto' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="form-group relative">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Linha Digitável *</label>
                <input 
                  name="linhaDigitavel" 
                  value={boletoData.linhaDigitavel} 
                  onChange={(e) => handleChange(e, 'boleto')} 
                  placeholder="Digite os 44 números da linha digitável" 
                  className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                  maxLength="44"
                />
                <p className="text-xs text-gray-500 mt-1">{boletoData.linhaDigitavel.length}/44 números</p>
                {isMobile && (
                  <button
                    type="button"
                    className="absolute right-2 top-8 flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium shadow transition"
                    onClick={() => alert('Leitura de código de barras via câmera será implementada!')}
                  >
                    <Camera className="w-4 h-4" /> Ler código de barras
                  </button>
                )}
              </div>
              
              <div className="form-group relative">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Valor *</label>
                <input 
                  name="valor" 
                  value={boletoData.valor} 
                  onChange={(e) => handleChange(e, 'boleto')} 
                  placeholder="0,00" 
                  className="input-field w-full p-3 sm:p-2 pl-12 border rounded-lg text-sm touch-manipulation"
                />
                <span className="absolute left-3 top-[42px] text-gray-500 text-sm pointer-events-none">R$</span>
              </div>
              
              <div className="form-group">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Data de Vencimento *</label>
                <input 
                  type="date" 
                  name="vencimento" 
                  value={boletoData.vencimento} 
                  onChange={(e) => handleChange(e, 'boleto')} 
                  className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                />
              </div>
              
              <div className="form-group">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Descrição *</label>
                <input 
                  name="descricao" 
                  value={boletoData.descricao} 
                  onChange={(e) => handleChange(e, 'boleto')} 
                  placeholder="Ex: Conta de luz, Aluguel, etc." 
                  className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Categoria *</label>
                  <select 
                    name="categoria" 
                    value={boletoData.categoria} 
                    onChange={(e) => handleChange(e, 'boleto')} 
                    className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                  >
                    <option value="CONTA_BTG">Conta BTG</option>
                    <option value="COMBUSTIVEL">Combustível</option>
                    <option value="MANUTENCAO">Manutenção</option>
                    <option value="SALARIO">Salário</option>
                    <option value="ALUGUEL">Aluguel</option>
                    <option value="CONTA">Contas (Luz, Água, etc.)</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Forma de Pagamento da Baixa *</label>
                  <select 
                    name="formaPagamentoBaixa" 
                    value={boletoData.formaPagamentoBaixa} 
                    onChange={(e) => handleChange(e, 'boleto')} 
                    className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                  >
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                    <option value="BOLETO">Boleto</option>
                    <option value="BANCO_BTG">Banco BTG</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* FORMULÁRIO PIX */}
          {tipo === 'pix' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="form-group">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Tipo de Chave PIX *</label>
                <select 
                  name="tipoChave" 
                  value={pixData.tipoChave} 
                  onChange={(e) => handleChange(e, 'pix')} 
                  className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                >
                  <option value="celular">📱 Celular</option>
                  <option value="CPF">🆔 CPF</option>
                  <option value="CNPJ">🏢 CNPJ</option>
                  <option value="email">📧 E-mail</option>
                  <option value="aleatoria">🔀 Chave Aleatória</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Chave PIX *</label>
                <input 
                  name="chavePix" 
                  value={pixData.chavePix} 
                  onChange={(e) => handleChange(e, 'pix')} 
                  placeholder="Digite a chave PIX do favorecido" 
                  className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                />
              </div>
              
              <div className="form-group">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Nome do Favorecido *</label>
                <input 
                  name="favorecido" 
                  value={pixData.favorecido} 
                  onChange={(e) => handleChange(e, 'pix')} 
                  placeholder="Nome completo do favorecido" 
                  className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                />
              </div>
              
              <div className="form-group">
                <label className="block text-gray-700 text-sm font-semibold mb-2">CPF/CNPJ do Favorecido *</label>
                <input 
                  name="cpfCnpjFavorecido" 
                  value={pixData.cpfCnpjFavorecido} 
                  onChange={(e) => handleChange(e, 'pix')} 
                  placeholder="000.000.000-00 ou 00.000.000/0000-00" 
                  className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                />
              </div>
              
              <div className="form-group relative">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Valor *</label>
                <input 
                  name="valor" 
                  value={pixData.valor} 
                  onChange={(e) => handleChange(e, 'pix')} 
                  placeholder="0,00" 
                  className="input-field w-full p-3 sm:p-2 pl-12 border rounded-lg text-sm touch-manipulation"
                />
                <span className="absolute left-3 top-[42px] text-gray-500 text-sm pointer-events-none">R$</span>
              </div>
              
              <div className="form-group">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Data de Vencimento *</label>
                <input 
                  type="date" 
                  name="vencimento" 
                  value={pixData.vencimento} 
                  onChange={(e) => handleChange(e, 'pix')} 
                  className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                />
              </div>
              
              <div className="form-group">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Descrição *</label>
                <input 
                  name="descricao" 
                  value={pixData.descricao} 
                  onChange={(e) => handleChange(e, 'pix')} 
                  placeholder="Ex: Pagamento fornecedor, Serviços, etc." 
                  className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Categoria *</label>
                  <select 
                    name="categoria" 
                    value={pixData.categoria} 
                    onChange={(e) => handleChange(e, 'pix')} 
                    className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                  >
                    <option value="CONTA_BTG">Conta BTG</option>
                    <option value="COMBUSTIVEL">Combustível</option>
                    <option value="MANUTENCAO">Manutenção</option>
                    <option value="SALARIO">Salário</option>
                    <option value="ALUGUEL">Aluguel</option>
                    <option value="CONTA">Contas (Luz, Água, etc.)</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Forma de Pagamento da Baixa *</label>
                  <select 
                    name="formaPagamentoBaixa" 
                    value={pixData.formaPagamentoBaixa} 
                    onChange={(e) => handleChange(e, 'pix')} 
                    className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                  >
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                    <option value="BOLETO">Boleto</option>
                    <option value="BANCO_BTG">Banco BTG</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 sm:mt-8">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 sm:py-3 px-4 rounded-lg text-base sm:text-sm focus:outline-none focus:shadow-outline transition-all duration-200 touch-manipulation"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Cadastrando...
                </div>
              ) : (
                'Cadastrar Conta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastrarContasBTG;