import React, { useState } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Users, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const funcionariosVilaProgresso = [
  {
    nome: "CLAUDINEI PAULINO DE OLVEIRA",
    cpf: "126.104.648-00",
    unidade: "Progresso",
    tipoChavePix: "telefone",
    chavePix: "15998442514"
  },
  {
    nome: "ARTHUR CRISTIAN HEROLD",
    cpf: "129.799.338-13",
    unidade: "Progresso", 
    tipoChavePix: "cpf",
    chavePix: "12979933813"
  },
  {
    nome: "LUIZ CESAR DOS SANTOS",
    cpf: "122.742.858-88",
    unidade: "Progresso",
    tipoChavePix: "cpf", 
    chavePix: "12274285888"
  },
  {
    nome: "JAQUELINE BUENO DA SILVA",
    cpf: "441.337.258-16",
    unidade: "Progresso",
    tipoChavePix: "telefone",
    chavePix: "15996672660"
  },
  {
    nome: "ARI ROGERIO DEARO",
    cpf: "122.877.808-66",
    unidade: "Progresso",
    tipoChavePix: "cpf",
    chavePix: "12287780866"
  },
  {
    nome: "DENILSON DE MELLO",
    cpf: "077.724.448-93",
    unidade: "Progresso",
    tipoChavePix: "telefone", 
    chavePix: "15988163746"
  },
  {
    nome: "MARCOS CESAR ESTEVES SOARES",
    cpf: "818.568.585-1",
    unidade: "Progresso",
    tipoChavePix: "cpf",
    chavePix: "08185685851"
  },
  {
    nome: "CLEBERSON RODRIGUES MORAES",
    cpf: "347.088.758-60",
    unidade: "Progresso",
    tipoChavePix: "cpf",
    chavePix: "34708875860"
  },
  {
    nome: "JENIFFER NEVES DOS SANTOS",
    cpf: "384.399.008-56",
    unidade: "Progresso",
    tipoChavePix: "cpf",
    chavePix: "38439900856"
  },
  {
    nome: "DEBORA APARECIDA DE OLIVEIRA",
    cpf: "367.626.068-65",
    unidade: "Progresso",
    tipoChavePix: "telefone",
    chavePix: "15995252285"
  },
  {
    nome: "KAMILY KAROLINE BLAZOTI RODRIGUES",
    cpf: "538.017.988-60",
    unidade: "Progresso",
    tipoChavePix: "email",
    chavePix: "kamily.karoline@icloud.com"
  }
];

const CadastroRapidoVilaProgresso = () => {
  const { loading } = useAuth();
  const [resultados, setResultados] = useState([]);
  const [processado, setProcessado] = useState(false);

  const verificarFuncionarioExiste = async (documento) => {
    try {
      // Verifica tanto por CPF quanto por CNPJ
      const qCpf = query(collection(db, 'funcionarios'), where('cpf', '==', documento));
      const qCnpj = query(collection(db, 'funcionarios'), where('cnpj', '==', documento));
      
      const [snapshotCpf, snapshotCnpj] = await Promise.all([
        getDocs(qCpf),
        getDocs(qCnpj)
      ]);
      
      return !snapshotCpf.empty || !snapshotCnpj.empty;
    } catch (error) {
      console.error('Erro ao verificar funcionário:', error);
      return false;
    }
  };

  const cadastrarFuncionarios = async () => {
    setResultados([]);
    
    const novosResultados = [];
    let sucessos = 0;
    let pulos = 0;
    let erros = 0;

    for (const funcionario of funcionariosVilaProgresso) {
      try {
        console.log(`Processando: ${funcionario.nome}`);
        
        // Verificar se já existe
        const existe = await verificarFuncionarioExiste(funcionario.cpf);
        
        if (existe) {
          novosResultados.push({
            nome: funcionario.nome,
            cpf: funcionario.cpf,
            status: 'exists',
            mensagem: 'Já cadastrado'
          });
          pulos++;
          continue;
        }

        // Determinar se é CPF ou CNPJ
        const documento = funcionario.cpf;
        const ehCNPJ = documento.replace(/\D/g, '').length === 14;
        
        // Preparar dados para inserção
        const dadosFuncionario = {
          nome: funcionario.nome,
          ...(ehCNPJ ? { cnpj: documento } : { cpf: documento }),
          unidade: funcionario.unidade,
          tipoChavePix: funcionario.tipoChavePix,
          chavePix: funcionario.chavePix,
          salario: 0,
          adiantamento: 0,
          ativo: true,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        };

        // Inserir no Firebase
        const docRef = await addDoc(collection(db, 'funcionarios'), dadosFuncionario);
        
        novosResultados.push({
          nome: funcionario.nome,
          cpf: funcionario.cpf,
          status: 'success',
          mensagem: `Cadastrado com sucesso! ID: ${docRef.id}`,
          pix: `${funcionario.tipoChavePix}: ${funcionario.chavePix}`
        });
        
        sucessos++;
        
      } catch (error) {
        console.error(`Erro ao cadastrar ${funcionario.nome}:`, error);
        novosResultados.push({
          nome: funcionario.nome,
          cpf: funcionario.cpf,
          status: 'error',
          mensagem: `Erro: ${error.message}`
        });
        erros++;
      }
    }

    setResultados(novosResultados);
          setProcessado(true);

    // Logs com resumo
    if (sucessos > 0) {
      console.log(`✅ ${sucessos} funcionários cadastrados com sucesso!`);
    }
    if (pulos > 0) {
      console.log(`⚠️ ${pulos} funcionários já existiam`);
    }
    if (erros > 0) {
      console.error(`❌ ${erros} erros durante o cadastro`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'exists':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'exists':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Cadastro Rápido - Funcionários Vila Progresso
          </h1>
        </div>

        {/* Preview dos funcionários */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Funcionários a serem cadastrados ({funcionariosVilaProgresso.length}):
          </h2>
          <div className="grid gap-3">
            {funcionariosVilaProgresso.map((funcionario, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{funcionario.nome}</h3>
                    <p className="text-sm text-gray-600">
                      {funcionario.cpf.replace(/\D/g, '').length === 14 ? 'CNPJ' : 'CPF'}: {funcionario.cpf}
                    </p>
                    <p className="text-sm text-gray-600">Unidade: {funcionario.unidade}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">PIX: {funcionario.tipoChavePix}</p>
                    <p className="text-sm font-mono text-gray-800">{funcionario.chavePix}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botão de cadastro */}
        {!processado && (
          <div className="flex justify-center mb-6">
            <button
              onClick={cadastrarFuncionarios}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-5 w-5" />
              {loading ? 'Cadastrando...' : 'Cadastrar Todos os Funcionários'}
            </button>
          </div>
        )}

        {/* Resultados */}
        {resultados.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Resultados do Cadastro:
            </h2>
            <div className="space-y-3">
              {resultados.map((resultado, index) => (
                <div key={index} className={`rounded-lg p-4 border ${getStatusColor(resultado.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(resultado.status)}
                                         <div className="flex-1">
                       <h3 className="font-medium text-gray-900">{resultado.nome}</h3>
                       <p className="text-sm text-gray-600">
                         {resultado.cpf.replace(/\D/g, '').length === 14 ? 'CNPJ' : 'CPF'}: {resultado.cpf}
                       </p>
                       <p className="text-sm text-gray-700">{resultado.mensagem}</p>
                       {resultado.pix && (
                         <p className="text-sm text-gray-600">PIX: {resultado.pix}</p>
                       )}
                     </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo */}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">Resumo:</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {resultados.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-gray-600">Sucessos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {resultados.filter(r => r.status === 'exists').length}
                  </div>
                  <div className="text-gray-600">Já existiam</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {resultados.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-gray-600">Erros</div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800">
                ✅ Processo concluído! Você pode agora acessar a página 
                <strong> "Folha de Pagamento" </strong> 
                para definir salários e adiantamentos dos funcionários cadastrados.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CadastroRapidoVilaProgresso; 