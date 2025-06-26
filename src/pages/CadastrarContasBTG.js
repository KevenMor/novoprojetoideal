import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnitFilter } from '../contexts/UnitFilterContext';
import { contasBTGService } from '../services/contasBTGService';
import { lancamentosService } from '../services/lancamentosService';
import toast from 'react-hot-toast';
import { FileText, Smartphone } from 'lucide-react';
import UnitSelector from '../components/UnitSelector';
import SimpleBarcodeScanner from '../components/SimpleBarcodeScanner';

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

  const [showScanner, setShowScanner] = useState(false);

  // Função para detectar mobile
  function isMobile() {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  const mobile = isMobile();

  const handleChange = (e, formType) => {
    const { name, value } = e.target;
    
    if (formType === 'boleto') {
      if (name === 'linhaDigitavel') {
        // Aceita códigos copiados do PDF e limpa automaticamente
        const cleanValue = value.replace(/\D/g, ''); // Remove tudo que não é dígito
        if (cleanValue.length <= 48) {
          setBoletoData(prev => ({ ...prev, [name]: cleanValue }));
        }
      } else if (name === 'valor') {
        // Formatação automática do valor em tempo real
        const formattedValue = formatCurrencyInput(value);
        setBoletoData(prev => ({ ...prev, [name]: formattedValue }));
      } else {
        setBoletoData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      // Formulário PIX
      if (name === 'tipoChave') {
        // Quando mudar o tipo de chave, limpar e aplicar formatação
        setPixData(prev => ({ 
          ...prev, 
          [name]: value,
          chavePix: '', // Limpar chave PIX
          cpfCnpjFavorecido: '' // Limpar CPF/CNPJ
        }));
      } else if (name === 'chavePix') {
        let formattedValue = value;
        
        // Aplicar formatação baseada no tipo de chave
        if (pixData.tipoChave === 'celular') {
          formattedValue = formatPhoneNumber(value);
        } else if (pixData.tipoChave === 'CPF') {
          formattedValue = formatCPF(value);
        } else if (pixData.tipoChave === 'CNPJ') {
          formattedValue = formatCNPJ(value);
        }
        
        setPixData(prev => ({ 
          ...prev, 
          [name]: formattedValue,
          // Se for CPF ou CNPJ, copiar automaticamente para o campo CPF/CNPJ do favorecido
          ...(pixData.tipoChave === 'CPF' || pixData.tipoChave === 'CNPJ' ? {
            cpfCnpjFavorecido: formattedValue
          } : {})
        }));
      } else if (name === 'cpfCnpjFavorecido') {
        // Formatação do CPF/CNPJ do favorecido
        let formattedValue = value;
        const cleanValue = value.replace(/\D/g, '');
        
        // Determinar se é CPF (11 dígitos) ou CNPJ (14 dígitos)
        if (cleanValue.length <= 11) {
          formattedValue = formatCPF(value);
        } else {
          formattedValue = formatCNPJ(value);
        }
        
        setPixData(prev => ({ ...prev, [name]: formattedValue }));
      } else if (name === 'valor') {
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

  // Função para formatar celular
  const formatPhoneNumber = (value) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    // Se não há dígitos, retorna vazio
    if (!digits) return '';
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    const limitedDigits = digits.slice(0, 11);
    
    // Formata: (DDD) NÚMERO
    if (limitedDigits.length <= 2) {
      return limitedDigits;
    } else if (limitedDigits.length <= 7) {
      return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`;
    } else {
      return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7)}`;
    }
  };

  // Função para formatar CPF
  const formatCPF = (value) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    // Se não há dígitos, retorna vazio
    if (!digits) return '';
    
    // Limita a 11 dígitos
    const limitedDigits = digits.slice(0, 11);
    
    // Formata: 000.000.000-00
    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 6) {
      return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3)}`;
    } else if (limitedDigits.length <= 9) {
      return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6)}`;
    } else {
      return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6, 9)}-${limitedDigits.slice(9)}`;
    }
  };

  // Função para formatar CNPJ
  const formatCNPJ = (value) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    // Se não há dígitos, retorna vazio
    if (!digits) return '';
    
    // Limita a 14 dígitos
    const limitedDigits = digits.slice(0, 14);
    
    // Formata: 00.000.000/0000-00
    if (limitedDigits.length <= 2) {
      return limitedDigits;
    } else if (limitedDigits.length <= 5) {
      return `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2)}`;
    } else if (limitedDigits.length <= 8) {
      return `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2, 5)}.${limitedDigits.slice(5)}`;
    } else if (limitedDigits.length <= 12) {
      return `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2, 5)}.${limitedDigits.slice(5, 8)}/${limitedDigits.slice(8)}`;
    } else {
      return `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2, 5)}.${limitedDigits.slice(5, 8)}/${limitedDigits.slice(8, 12)}-${limitedDigits.slice(12)}`;
    }
  };

  // Função para validar CPF
  const validateCPF = (cpf) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  };

  // Função para validar CNPJ
  const validateCNPJ = (cnpj) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;
    
    return true;
  };

  // Função para converter valor formatado de volta para número
  const parseCurrencyValue = (formattedValue) => {
    if (!formattedValue) return 0;
    // Remove pontos de milhares e substitui vírgula por ponto
    return parseFloat(formattedValue.replace(/\./g, '').replace(',', '.'));
  };

  // Função para formatar linha digitável
  function formatarLinhaDigitavel(linha) {
    if (!linha) return '';
    const clean = linha.replace(/\D/g, '');
    if (clean.length === 47) {
      // Boleto bancário comum
      return `${clean.substr(0,5)}.${clean.substr(5,5)} ${clean.substr(10,5)}.${clean.substr(15,6)} ${clean.substr(21,5)}.${clean.substr(26,6)} ${clean.substr(32,1)} ${clean.substr(33)}`;
    } else if (clean.length === 48) {
      // Boleto de concessionária
      return `${clean.substr(0,11)}.${clean.substr(11,11)}.${clean.substr(22,11)}.${clean.substr(33,11)}`;
    } else if (clean.length === 44) {
      // Código de barras puro
      return clean;
    }
    return clean;
  }

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
      if (boletoData.linhaDigitavel && boletoData.linhaDigitavel.length !== 44 && boletoData.linhaDigitavel.length !== 46 && boletoData.linhaDigitavel.length !== 47 && boletoData.linhaDigitavel.length !== 48) {
        toast.error('A linha digitável do boleto deve conter 44, 46, 47 ou 48 números.');
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
      
      // Validação específica para PIX
      if (pixData.tipoChave === 'CPF' && pixData.chavePix && !validateCPF(pixData.chavePix)) {
        toast.error('CPF da chave PIX inválido. Verifique os números.');
        setLoading(false);
        return;
      }
      
      if (pixData.tipoChave === 'CNPJ' && pixData.chavePix && !validateCNPJ(pixData.chavePix)) {
        toast.error('CNPJ da chave PIX inválido. Verifique os números.');
        setLoading(false);
        return;
      }
      
      if (pixData.cpfCnpjFavorecido && !validateCPF(pixData.cpfCnpjFavorecido) && !validateCNPJ(pixData.cpfCnpjFavorecido)) {
        toast.error('CPF/CNPJ do favorecido inválido. Verifique os números.');
        setLoading(false);
        return;
      }
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
              <div className="form-group">
                <label className="block text-gray-700 text-sm font-semibold mb-2">Linha Digitável *</label>
                <div className="flex items-center gap-2">
                  <input
                    name="linhaDigitavel"
                    value={boletoData.linhaDigitavel}
                    onChange={e => handleChange(e, 'boleto')}
                    placeholder="Cole o código do PDF ou digite os números (caracteres especiais serão removidos automaticamente)"
                    className="input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation"
                    maxLength="48"
                    inputMode="numeric"
                  />
                  {/* Botão de escanear só aparece no mobile */}
                  {mobile && (
                    <button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-base cursor-pointer transition-colors"
                      onClick={() => setShowScanner(true)}
                    >
                      Escanear boleto
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {boletoData.linhaDigitavel.length}/48 números • 
                  <span className="text-blue-600 ml-1">💡 Dica: Cole diretamente do PDF do boleto!</span>
                </p>
                {/* Exibir linha digitável formatada para conferência */}
                {boletoData.linhaDigitavel && (
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
                    <span className="font-semibold">Conferir:</span> {formatarLinhaDigitavel(boletoData.linhaDigitavel)}
                  </div>
                )}
                {/* Validação de quantidade de dígitos */}
                {boletoData.linhaDigitavel && ![44,47,48].includes(boletoData.linhaDigitavel.replace(/\D/g, '').length) && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    Atenção: A linha digitável deve ter 44, 47 ou 48 dígitos. Confira o boleto!
                  </div>
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

              {/* Modal do Scanner de Código de Barras */}
              {mobile && showScanner && (
                <SimpleBarcodeScanner
                  isOpen={showScanner}
                  onScan={linha => {
                    setBoletoData(b => ({ ...b, linhaDigitavel: linha }));
                    setShowScanner(false);
                  }}
                  onClose={() => setShowScanner(false)}
                />
              )}
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
                  placeholder={
                    pixData.tipoChave === 'celular' ? '(11) 99999-9999' :
                    pixData.tipoChave === 'CPF' ? '000.000.000-00' :
                    pixData.tipoChave === 'CNPJ' ? '00.000.000/0000-00' :
                    pixData.tipoChave === 'email' ? 'exemplo@email.com' :
                    'Digite a chave PIX'
                  }
                  className={`input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation ${
                    pixData.tipoChave === 'CPF' && pixData.chavePix && !validateCPF(pixData.chavePix) ? 'border-red-500' :
                    pixData.tipoChave === 'CNPJ' && pixData.chavePix && !validateCNPJ(pixData.chavePix) ? 'border-red-500' :
                    'border-gray-300'
                  }`}
                />
                {/* Validação visual para CPF/CNPJ */}
                {pixData.tipoChave === 'CPF' && pixData.chavePix && (
                  <div className={`mt-1 text-xs ${validateCPF(pixData.chavePix) ? 'text-green-600' : 'text-red-600'}`}>
                    {validateCPF(pixData.chavePix) ? '✅ CPF válido' : '❌ CPF inválido'}
                  </div>
                )}
                {pixData.tipoChave === 'CNPJ' && pixData.chavePix && (
                  <div className={`mt-1 text-xs ${validateCNPJ(pixData.chavePix) ? 'text-green-600' : 'text-red-600'}`}>
                    {validateCNPJ(pixData.chavePix) ? '✅ CNPJ válido' : '❌ CNPJ inválido'}
                  </div>
                )}
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
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  CPF/CNPJ do Favorecido *
                  {(pixData.tipoChave === 'CPF' || pixData.tipoChave === 'CNPJ') && (
                    <span className="text-blue-600 text-xs ml-2">(Preenchido automaticamente)</span>
                  )}
                </label>
                <input 
                  name="cpfCnpjFavorecido" 
                  value={pixData.cpfCnpjFavorecido} 
                  onChange={(e) => handleChange(e, 'pix')} 
                  placeholder={
                    pixData.tipoChave === 'CPF' ? '000.000.000-00 (preenchido automaticamente)' :
                    pixData.tipoChave === 'CNPJ' ? '00.000.000/0000-00 (preenchido automaticamente)' :
                    '000.000.000-00 ou 00.000.000/0000-00'
                  }
                  className={`input-field w-full p-3 sm:p-2 border rounded-lg text-sm touch-manipulation ${
                    (pixData.tipoChave === 'CPF' || pixData.tipoChave === 'CNPJ') ? 'bg-gray-50' : ''
                  } ${
                    pixData.cpfCnpjFavorecido && !validateCPF(pixData.cpfCnpjFavorecido) && !validateCNPJ(pixData.cpfCnpjFavorecido) ? 'border-red-500' :
                    'border-gray-300'
                  }`}
                  readOnly={pixData.tipoChave === 'CPF' || pixData.tipoChave === 'CNPJ'}
                />
                {/* Validação visual para CPF/CNPJ do favorecido */}
                {pixData.cpfCnpjFavorecido && (
                  <div className={`mt-1 text-xs ${
                    validateCPF(pixData.cpfCnpjFavorecido) || validateCNPJ(pixData.cpfCnpjFavorecido) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {validateCPF(pixData.cpfCnpjFavorecido) ? '✅ CPF válido' : 
                     validateCNPJ(pixData.cpfCnpjFavorecido) ? '✅ CNPJ válido' : '❌ CPF/CNPJ inválido'}
                  </div>
                )}
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