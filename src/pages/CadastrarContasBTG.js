import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnitFilter } from '../contexts/UnitFilterContext';
import { contasBTGService } from '../services/contasBTGService';
import { lancamentosService } from '../services/lancamentosService';
import toast from 'react-hot-toast';
import { FileText, Smartphone } from 'lucide-react';
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
  });

  const [pixData, setPixData] = useState({
    tipoChave: 'celular',
    chavePix: '',
    favorecido: '',
    cpfCnpjFavorecido: '',
    valor: '',
    vencimento: '',
    descricao: '',
  });

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
        categoria: 'CONTA_BTG',
        formaPagamento: tipo.toUpperCase(),
        status: 'AGUARDANDO',
        contaBTGId: contaCriada.id, // Link para a conta BTG
        criadoPor: user.email, // Adicionando quem criou o lançamento
      };

      await lancamentosService.criarLancamento(lancamentoData);
      
      toast.success('Conta cadastrada e lançamento criado com sucesso!');
      
      // Limpar formulário
      if (tipo === 'boleto') {
        setBoletoData({ linhaDigitavel: '', valor: '', vencimento: '', descricao: '' });
      } else {
        setPixData({ tipoChave: 'celular', chavePix: '', favorecido: '', cpfCnpjFavorecido: '', valor: '', vencimento: '', descricao: '' });
      }

    } catch (error) {
      console.error("Erro ao cadastrar conta:", error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2">Cadastrar Contas BTG</h1>
        <p className="text-gray-600 mb-6">Cadastre contas para pagamento via boleto ou PIX.</p>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Unidade</label>
          <UnitSelector />
        </div>

        <form onSubmit={handleSubmit}>
          {/* TIPO DE PAGAMENTO */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Tipo de Pagamento *</label>
            <div className="flex gap-4">
               <button type="button" onClick={() => setTipo('boleto')} className={`flex-1 p-4 border-2 rounded-lg text-left transition-colors flex items-center ${tipo === 'boleto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <FileText className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium">Boleto</div>
                  <div className="text-sm text-gray-500">Linha digitável</div>
                </div>
              </button>
              <button type="button" onClick={() => setTipo('pix')} className={`flex-1 p-4 border-2 rounded-lg text-left transition-colors flex items-center ${tipo === 'pix' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <Smartphone className="h-6 w-6 text-green-600 mr-3" />
                 <div>
                  <div className="font-medium">PIX</div>
                  <div className="text-sm text-gray-500">Chave PIX</div>
                </div>
              </button>
            </div>
          </div>

          {/* FORMULÁRIO BOLETO */}
          {tipo === 'boleto' && (
            <div className="space-y-4">
              <input 
                name="linhaDigitavel" 
                value={boletoData.linhaDigitavel} 
                onChange={(e) => handleChange(e, 'boleto')} 
                placeholder="Linha Digitável (44 números) *" 
                className="input-field w-full p-2 border rounded"
                maxLength="44"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <input 
                    name="valor" 
                    value={boletoData.valor} 
                    onChange={(e) => handleChange(e, 'boleto')} 
                    placeholder="0,00" 
                    className="input-field w-full p-2 pl-10 border rounded"
                  />
                </div>
                <input type="date" name="vencimento" value={boletoData.vencimento} onChange={(e) => handleChange(e, 'boleto')} placeholder="Vencimento *" className="input-field w-full p-2 border rounded"/>
              </div>
              <input name="descricao" value={boletoData.descricao} onChange={(e) => handleChange(e, 'boleto')} placeholder="Descrição *" className="input-field w-full p-2 border rounded"/>
            </div>
          )}

          {/* FORMULÁRIO PIX */}
          {tipo === 'pix' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select name="tipoChave" value={pixData.tipoChave} onChange={(e) => handleChange(e, 'pix')} className="input-field w-full p-2 border rounded">
                  <option value="celular">Celular</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="aleatoria">Aleatória</option>
                </select>
                <input name="chavePix" value={pixData.chavePix} onChange={(e) => handleChange(e, 'pix')} placeholder="Chave PIX *" className="input-field w-full p-2 border rounded"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input name="favorecido" value={pixData.favorecido} onChange={(e) => handleChange(e, 'pix')} placeholder="Nome do Favorecido *" className="input-field w-full p-2 border rounded"/>
                <input name="cpfCnpjFavorecido" value={pixData.cpfCnpjFavorecido} onChange={(e) => handleChange(e, 'pix')} placeholder="CPF/CNPJ do Favorecido *" className="input-field w-full p-2 border rounded"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <input 
                    name="valor" 
                    value={pixData.valor} 
                    onChange={(e) => handleChange(e, 'pix')} 
                    placeholder="0,00" 
                    className="input-field w-full p-2 pl-10 border rounded"
                  />
                </div>
                <input type="date" name="vencimento" value={pixData.vencimento} onChange={(e) => handleChange(e, 'pix')} placeholder="Vencimento *" className="input-field w-full p-2 border rounded"/>
              </div>
              <input name="descricao" value={pixData.descricao} onChange={(e) => handleChange(e, 'pix')} placeholder="Descrição *" className="input-field w-full p-2 border rounded"/>
            </div>
          )}

          <div className="mt-8">
            <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline">
              {loading ? 'Cadastrando...' : 'Cadastrar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastrarContasBTG;