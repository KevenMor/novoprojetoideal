import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnitSelection } from '../hooks/useUnitSelection';
import UnitSelector from '../components/UnitSelector';
import { CreditCard, FileText, Smartphone, User, Calendar, DollarSign, Save } from 'lucide-react';
import InputMask from 'react-input-mask';
import axios from 'axios';
import toast from 'react-hot-toast';
import { lancamentosService } from '../services/lancamentosService';
import { contasBTGService } from '../services/contasBTGService';

export default function CadastrarContasBTG() {
  const { userProfile } = useAuth();
  const { 
    selectedUnit, 
    availableUnits, 
    handleUnitChange, 
    getUnitDisplayName, 
    shouldShowUnitSelector 
  } = useUnitSelection();
  
  // Debug inicial
  console.log('🔍 CadastrarContasBTG - userProfile:', userProfile);
  console.log('🔍 CadastrarContasBTG - selectedUnit:', selectedUnit);
  console.log('🔍 CadastrarContasBTG - availableUnits:', availableUnits);
  
  const [loading, setLoading] = useState(false);
  const [tipoPagamento, setTipoPagamento] = useState('');
  const [formData, setFormData] = useState({
    unidade: selectedUnit || '',
    // Campos Boleto
    linhaDigitavel: '',
    valorBoleto: '',
    vencimentoBoleto: '',
    descricaoBoleto: '',
    // Campos PIX
    tipoChave: '',
    chavePix: '',
    favorecido: '',
    cpfCnpjFavorecido: '',
    valorPix: '',
    vencimentoPix: '',
    descricaoPix: ''
  });

  // Atualizar unidade no form quando selectedUnit mudar
  React.useEffect(() => {
    console.log('🔄 selectedUnit mudou:', selectedUnit);
    setFormData(prev => ({
      ...prev,
      unidade: selectedUnit || ''
    }));
  }, [selectedUnit]);
  
  const tiposChave = [
    { value: 'Copia e Cola', label: 'Copia e Cola' },
    { value: 'CPF', label: 'CPF' },
    { value: 'CNPJ', label: 'CNPJ' },
    { value: 'Email', label: 'Email' },
    { value: 'Celular', label: 'Celular' }
  ];

  const formatLinhaDigitavel = (value) => {
    const cleaned = value.replace(/\D/g, '');
    
    // Limitar a exatamente 44 dígitos
    const limitedCleaned = cleaned.substring(0, 44);
    
    if (limitedCleaned.length <= 44) {
      // Formato: 00000.00000 00000.000000 00000.000000 0 00000000000000
      return limitedCleaned
        .replace(/(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d{1})(\d{14})/, '$1.$2 $3.$4 $5.$6 $7 $8')
        .replace(/(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d{1})(\d{1,14})/, '$1.$2 $3.$4 $5.$6 $7 $8')
        .replace(/(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d{1,1})/, '$1.$2 $3.$4 $5.$6 $7')
        .replace(/(\d{5})(\d{5})(\d{5})(\d{1,6})/, '$1.$2 $3.$4')
        .replace(/(\d{5})(\d{1,5})/, '$1.$2');
    }
    return limitedCleaned;
  };

  const formatCPF = (value) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCNPJ = (value) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatChavePix = (chave, tipo) => {
    switch (tipo) {
      case 'CPF':
        return formatCPF(chave);
      case 'CNPJ':
        return formatCNPJ(chave);
      case 'Celular':
        return chave.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      default:
        return chave;
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChavePixChange = (value) => {
    const formatted = formatChavePix(value, formData.tipoChave);
    setFormData({
      ...formData,
      chavePix: formatted,
      // Auto-preencher favorecido se CPF/CNPJ
      cpfCnpjFavorecido: (formData.tipoChave === 'CPF' || formData.tipoChave === 'CNPJ') 
        ? value.replace(/\D/g, '') 
        : formData.cpfCnpjFavorecido
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Debug: Log dos dados do formulário
    console.log('🔍 Dados do formulário:', formData);
    console.log('🔍 Tipo de pagamento:', tipoPagamento);
    
    // Usar selectedUnit como fallback se formData.unidade estiver vazio
    let unidadeParaUsar = formData.unidade || selectedUnit;
    
    // Se ainda estiver vazio, tentar pegar da primeira unidade disponível
    if (!unidadeParaUsar && availableUnits.length > 0) {
      unidadeParaUsar = availableUnits[0];
      console.log('🔄 Usando primeira unidade disponível:', unidadeParaUsar);
    }
    
    // Se ainda estiver vazio e o usuário não é admin, tentar pegar das unidades do perfil
    if (!unidadeParaUsar && userProfile?.unidades?.length > 0) {
      unidadeParaUsar = userProfile.unidades[0];
      console.log('🔄 Usando primeira unidade do perfil:', unidadeParaUsar);
    }
    
    if (!unidadeParaUsar || !tipoPagamento) {
      console.log('❌ Campos básicos faltando:', { 
        formDataUnidade: formData.unidade, 
        selectedUnit: selectedUnit,
        availableUnits: availableUnits,
        userProfileUnidades: userProfile?.unidades,
        unidadeParaUsar: unidadeParaUsar,
        tipoPagamento 
      });
      
      if (!unidadeParaUsar) {
        toast.error('Erro: Nenhuma unidade disponível. Entre em contato com o administrador.');
      } else {
        toast.error('Por favor, selecione o tipo de pagamento');
      }
      return;
    }

    // Validações específicas
    if (tipoPagamento === 'boleto') {
      const linhaLimpa = formData.linhaDigitavel.replace(/\D/g, '');
      console.log('🔍 Linha digitável limpa:', linhaLimpa, 'Tamanho:', linhaLimpa.length);
      
      if (linhaLimpa.length !== 44) {
        toast.error(`Linha digitável deve ter 44 dígitos (atual: ${linhaLimpa.length})`);
        return;
      }
      
      console.log('🔍 Campos do boleto:', {
        valorBoleto: formData.valorBoleto,
        vencimentoBoleto: formData.vencimentoBoleto,
        descricaoBoleto: formData.descricaoBoleto
      });
      
      // Verificar se a data está completa (não apenas com underscores da máscara)
      const vencimentoLimpo = formData.vencimentoBoleto.replace(/[_/]/g, '');
      
      if (!formData.valorBoleto || !formData.vencimentoBoleto || vencimentoLimpo.length < 8 || !formData.descricaoBoleto) {
        const camposFaltando = [];
        if (!formData.valorBoleto) camposFaltando.push('Valor');
        if (!formData.vencimentoBoleto || vencimentoLimpo.length < 8) camposFaltando.push('Vencimento (data completa)');
        if (!formData.descricaoBoleto) camposFaltando.push('Descrição');
        
        toast.error(`Campos faltando: ${camposFaltando.join(', ')}`);
        return;
      }
    }

    if (tipoPagamento === 'pix') {
      if (!formData.tipoChave || !formData.chavePix || !formData.favorecido || 
          !formData.valorPix || !formData.vencimentoPix || !formData.descricaoPix) {
        toast.error('Preencha todos os campos do PIX');
        return;
      }
      
      if (formData.tipoChave === 'Email' && !validateEmail(formData.chavePix)) {
        toast.error('Email inválido');
        return;
      }
    }

    setLoading(true);
    
    try {
      let payload;
      
      if (tipoPagamento === 'boleto') {
        payload = {
          unidade: unidadeParaUsar,
          usuario: userProfile?.nome,
          tipo: 'boleto',
          linhaDigitavel: formData.linhaDigitavel.replace(/\D/g, ''),
          valor: parseFloat(formData.valorBoleto),
          vencimento: formData.vencimentoBoleto,
          descricao: formData.descricaoBoleto
        };
      } else {
        payload = {
          unidade: unidadeParaUsar,
          usuario: userProfile?.nome,
          tipo: 'pix',
          tipoChave: formData.tipoChave,
          chavePix: formData.tipoChave === 'CPF' || formData.tipoChave === 'CNPJ' 
            ? formData.chavePix.replace(/\D/g, '') 
            : formData.chavePix,
          favorecido: formData.favorecido,
          cpfCnpj: formData.cpfCnpjFavorecido.replace(/\D/g, ''),
          valor: parseFloat(formData.valorPix),
          vencimento: formData.vencimentoPix,
          descricao: formData.descricaoPix
        };
      }

      // 1. Primeiro, salvar no histórico de contas BTG
      let contaBTGCriada;
      try {
        const dadosContaBTG = {
          unidade: unidadeParaUsar,
          tipo: tipoPagamento,
          descricao: tipoPagamento === 'boleto' ? formData.descricaoBoleto : formData.descricaoPix,
          valor: parseFloat(tipoPagamento === 'boleto' ? formData.valorBoleto : formData.valorPix),
          vencimento: tipoPagamento === 'boleto' ? formData.vencimentoBoleto : formData.vencimentoPix,
          // Campos específicos do boleto
          ...(tipoPagamento === 'boleto' && {
            linhaDigitavel: formData.linhaDigitavel.replace(/\D/g, '')
          }),
          // Campos específicos do PIX
          ...(tipoPagamento === 'pix' && {
            tipoChave: formData.tipoChave,
            chavePix: formData.tipoChave === 'CPF' || formData.tipoChave === 'CNPJ' 
              ? formData.chavePix.replace(/\D/g, '') 
              : formData.chavePix,
            favorecido: formData.favorecido,
            cpfCnpjFavorecido: formData.cpfCnpjFavorecido.replace(/\D/g, '')
          })
        };
        
        console.log('💳 Criando conta BTG no histórico:', dadosContaBTG);
        contaBTGCriada = await contasBTGService.criarConta(dadosContaBTG);
        console.log('✅ Conta BTG criada no histórico:', contaBTGCriada);
        
      } catch (contaBTGError) {
        console.error('❌ Erro ao criar conta BTG no histórico:', contaBTGError);
        toast.error(`Erro ao salvar conta BTG: ${contaBTGError.message}`);
        return; // Parar aqui se não conseguir salvar a conta
      }

      // 2. Enviar para o webhook BTG
      try {
        await axios.post('https://hook.us2.make.com/vvxwshprzsw06ba5z9kdu490ha47gmcy', payload);
        console.log('✅ Webhook BTG enviado com sucesso');
      } catch (webhookError) {
        console.error('❌ Erro no webhook BTG:', webhookError);
        toast.error('⚠️ Conta salva, mas houve erro ao enviar para o BTG. Tente novamente.');
      }
      
      // 3. Criar lançamento como DESPESA no Firebase para aparecer nos extratos (com status AGUARDANDO)
      try {
        // Converter data do formato DD/MM/YYYY para YYYY-MM-DD
        const dataOriginal = tipoPagamento === 'boleto' ? formData.vencimentoBoleto : formData.vencimentoPix;
        const partesData = dataOriginal.split('/');
        const dataFormatada = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;
        
        const dadosLancamento = {
          descricao: `[AGUARDANDO] Conta BTG - ${tipoPagamento === 'boleto' ? formData.descricaoBoleto : formData.descricaoPix}`,
          valor: parseFloat(tipoPagamento === 'boleto' ? formData.valorBoleto : formData.valorPix),
          data: dataFormatada,
          unidade: unidadeParaUsar,
          tipo: 'DESPESA',
          categoria: 'CONTA_BTG',
          formaPagamento: tipoPagamento === 'boleto' ? 'BOLETO' : 'PIX',
          observacoes: `Conta BTG cadastrada via ${tipoPagamento.toUpperCase()}${tipoPagamento === 'pix' ? ` - ${formData.tipoChave}: ${formData.chavePix}` : ` - Linha: ${formData.linhaDigitavel}`}`,
          status: 'AGUARDANDO', // Status inicial
          contaBTGId: contaBTGCriada?.id // Referência para a conta BTG
        };
        
        console.log('🚀 Tentando criar lançamento nos extratos:', dadosLancamento);
        
        const resultado = await lancamentosService.criarLancamento(dadosLancamento);
        console.log('✅ Lançamento criado nos extratos com sucesso:', resultado);
        
      } catch (lancamentoError) {
        console.error('❌ ERRO DETALHADO ao criar lançamento nos extratos:', lancamentoError);
        console.error('❌ Stack trace:', lancamentoError.stack);
        
        // Mostrar erro específico para o usuário
        if (lancamentoError.message.includes('permission')) {
          toast.error('⚠️ Conta BTG cadastrada, mas não foi possível adicionar aos extratos. Verifique as permissões do Firebase.');
        } else {
          toast.error('⚠️ Conta BTG cadastrada, mas houve erro ao adicionar aos extratos.');
        }
      }
      
      toast.success('✅ Conta BTG cadastrada com sucesso! Status: AGUARDANDO PAGAMENTO');
      
      // Reset form
      setFormData({
        unidade: unidadeParaUsar,
        linhaDigitavel: '',
        valorBoleto: '',
        vencimentoBoleto: '',
        descricaoBoleto: '',
        tipoChave: '',
        chavePix: '',
        favorecido: '',
        cpfCnpjFavorecido: '',
        valorPix: '',
        vencimentoPix: '',
        descricaoPix: ''
      });
      setTipoPagamento('');
      
    } catch (error) {
      console.error('Erro ao cadastrar conta BTG:', error);
      toast.error('Erro ao cadastrar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cadastrar Contas BTG</h1>
            <p className="text-gray-600">Cadastre contas para pagamento via boleto ou PIX</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Unidade */}
          <div>
            <UnitSelector
              selectedUnit={formData.unidade}
              availableUnits={availableUnits}
              onUnitChange={(unit) => {
                console.log('🔄 Unidade selecionada:', unit);
                setFormData({...formData, unidade: unit});
                handleUnitChange(unit);
              }}
              shouldShowSelector={shouldShowUnitSelector}
              displayName={getUnitDisplayName()}
              label="Unidade *"
              className="w-full"
            />
            {!shouldShowUnitSelector && !formData.unidade && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-red-600">
                  ⚠️ Nenhuma unidade atribuída. Entre em contato com o administrador.
                </p>
                {/* Botão de debug temporário */}
                {(availableUnits.length > 0 || userProfile?.unidades?.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      const unidadeParaForcar = availableUnits[0] || userProfile?.unidades?.[0] || 'Julio de Mesquita';
                      console.log('🔧 Forçando seleção da unidade:', unidadeParaForcar);
                      setFormData({...formData, unidade: unidadeParaForcar});
                      handleUnitChange(unidadeParaForcar);
                    }}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    🔧 Forçar Seleção de Unidade (Debug)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tipo de Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Pagamento *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                tipoPagamento === 'boleto' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="tipoPagamento"
                  value="boleto"
                  checked={tipoPagamento === 'boleto'}
                  onChange={(e) => setTipoPagamento(e.target.value)}
                  className="sr-only"
                />
                <FileText className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Boleto</div>
                  <div className="text-sm text-gray-500">Linha digitável</div>
                </div>
              </label>

              <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                tipoPagamento === 'pix' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="tipoPagamento"
                  value="pix"
                  checked={tipoPagamento === 'pix'}
                  onChange={(e) => setTipoPagamento(e.target.value)}
                  className="sr-only"
                />
                <Smartphone className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">PIX</div>
                  <div className="text-sm text-gray-500">Chave PIX</div>
                </div>
              </label>
            </div>
          </div>

          {/* Campos Boleto */}
          {tipoPagamento === 'boleto' && (
            <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Dados do Boleto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Linha Digitável *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field font-mono text-sm"
                    placeholder="Digite a linha digitável do boleto"
                    value={formData.linhaDigitavel}
                    onChange={(e) => setFormData({...formData, linhaDigitavel: formatLinhaDigitavel(e.target.value)})}
                    maxLength={54}
                  />
                  <div className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span>Digite os 44 dígitos da linha digitável</span>
                    <span className={`${formData.linhaDigitavel.replace(/\D/g, '').length === 44 ? 'text-green-600' : 'text-orange-600'}`}>
                      {formData.linhaDigitavel.replace(/\D/g, '').length}/44 dígitos
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="input-field pl-10"
                      placeholder="Digite o valor do boleto (ex: 850,00)"
                      value={formData.valorBoleto}
                      onChange={(e) => setFormData({...formData, valorBoleto: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vencimento *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <InputMask
                      mask="99/99/9999"
                      value={formData.vencimentoBoleto}
                      onChange={(e) => setFormData({...formData, vencimentoBoleto: e.target.value})}
                      className="input-field pl-10"
                      placeholder="Digite a data de vencimento"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Digite a descrição do pagamento do boleto"
                    value={formData.descricaoBoleto}
                    onChange={(e) => setFormData({...formData, descricaoBoleto: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Campos PIX */}
          {tipoPagamento === 'pix' && (
            <div className="space-y-4 bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Smartphone className="h-5 w-5 mr-2 text-green-600" />
                Dados do PIX
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Chave *
                  </label>
                  <select
                    required
                    className="select-field"
                    value={formData.tipoChave}
                    onChange={(e) => setFormData({...formData, tipoChave: e.target.value, chavePix: ''})}
                  >
                    <option value="">💳 Selecione o tipo de pagamento</option>
                    {tiposChave.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave PIX *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder={
                      formData.tipoChave === 'CPF' ? '000.000.000-00' :
                      formData.tipoChave === 'CNPJ' ? '00.000.000/0000-00' :
                      formData.tipoChave === 'Email' ? 'email@exemplo.com' :
                      formData.tipoChave === 'Celular' ? '(11) 99999-9999' :
                      'Cole a chave PIX'
                    }
                    value={formData.chavePix}
                    onChange={(e) => handleChavePixChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Favorecido *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      className="input-field pl-10"
                      placeholder="Digite o nome completo do favorecido"
                      value={formData.favorecido}
                      onChange={(e) => setFormData({...formData, favorecido: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF/CNPJ do Favorecido *
                  </label>
                  <InputMask
                    mask={formData.cpfCnpjFavorecido.replace(/\D/g, '').length <= 11 ? '999.999.999-99' : '99.999.999/9999-99'}
                    value={formData.cpfCnpjFavorecido}
                    onChange={(e) => setFormData({...formData, cpfCnpjFavorecido: e.target.value})}
                    className="input-field"
                    placeholder="Digite o CPF/CNPJ do favorecido"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="input-field pl-10"
                      placeholder="Digite o valor do PIX (ex: 650,00)"
                      value={formData.valorPix}
                      onChange={(e) => setFormData({...formData, valorPix: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vencimento *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <InputMask
                      mask="99/99/9999"
                      value={formData.vencimentoPix}
                      onChange={(e) => setFormData({...formData, vencimentoPix: e.target.value})}
                      className="input-field pl-10"
                      placeholder="Digite a data de vencimento do PIX"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Digite a descrição do pagamento PIX"
                    value={formData.descricaoPix}
                    onChange={(e) => setFormData({...formData, descricaoPix: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {tipoPagamento && (
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Cadastrando...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Cadastrar Conta</span>
                </>
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}