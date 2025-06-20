import { db } from '../firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';

const COLECAO_FUNCIONARIOS = 'funcionarios';

export const funcionariosService = {
  async listarFuncionarios(unidade = null) {
    try {
      console.log('Iniciando listagem de funcionários. Unidade:', unidade);
      
      // Simplificando para buscar todos os documentos primeiro
      const colRef = collection(db, COLECAO_FUNCIONARIOS);
      const snapshot = await getDocs(colRef);
      
      console.log('Snapshot recebido:', {
        empty: snapshot.empty,
        size: snapshot.size,
        docs: snapshot.docs.map(doc => doc.id)
      });

      let funcionarios = [];
      
      for (const doc of snapshot.docs) {
        try {
          const data = doc.data();
          console.log('Processando documento:', {
            id: doc.id,
            rawData: data,
            hasNome: 'nome' in data,
            hasUnidade: 'unidade' in data,
            hasCPF: 'cpf' in data
          });
          
          const funcionario = {
            id: doc.id,
            ...data,
            dataCriacao: data.dataCriacao?.toDate(),
            dataAtualizacao: data.dataAtualizacao?.toDate()
          };
          
          funcionarios.push(funcionario);
        } catch (docError) {
          console.error('Erro ao processar documento:', doc.id, docError);
        }
      }

      console.log('Total de documentos encontrados:', snapshot.size);
      console.log('Total de funcionários processados:', funcionarios.length);

      // Filtrar por unidade no cliente se necessário
      if (unidade && unidade !== 'Geral' && unidade.toLowerCase() !== 'all') {
        const antes = funcionarios.length;
        funcionarios = funcionarios.filter(f => f.unidade === unidade);
        console.log(`Filtro por unidade "${unidade}": ${antes} -> ${funcionarios.length}`);
      }

      // Ordenar os resultados no cliente
      funcionarios.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

      console.log('Funcionários finais:', funcionarios);
      return funcionarios;
    } catch (error) {
      console.error('Erro ao listar funcionários:', error);
      throw error;
    }
  },

  async adicionarFuncionario(dados) {
    try {
      console.log('Iniciando adição de funcionário:', dados);
      
      if (!dados.nome || (!dados.cpf && !dados.cnpj) || !dados.unidade) {
        throw new Error('Dados obrigatórios não fornecidos (nome, CPF/CNPJ e unidade)');
      }

      // Formatar dados antes de salvar
      const dadosFormatados = {
        nome: dados.nome.trim(),
        unidade: dados.unidade.trim(),
        salario: typeof dados.salario === 'string' ? 
          parseFloat(dados.salario.replace(',', '.')) : 
          dados.salario,
        tipoPix: dados.tipoPix,
        chavePix: dados.chavePix,
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      };

      // Adicionar CPF ou CNPJ baseado no que foi fornecido
      if (dados.cpf) {
        dadosFormatados.cpf = dados.cpf.trim().replace(/[^\d]/g, '');
      }
      if (dados.cnpj) {
        dadosFormatados.cnpj = dados.cnpj.trim().replace(/[^\d]/g, '');
      }

      console.log('Dados formatados para salvar:', dadosFormatados);

      // Adicionar documento
      const colRef = collection(db, COLECAO_FUNCIONARIOS);
      const docRef = await addDoc(colRef, dadosFormatados);
      
      console.log('Documento criado com ID:', docRef.id);

      // Verificar se o documento foi criado
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Falha ao criar documento - não encontrado após criação');
      }

      const dadosSalvos = docSnap.data();
      console.log('Dados salvos confirmados:', {
        id: docRef.id,
        ...dadosSalvos
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error);
      throw error;
    }
  },

  async atualizarFuncionario(id, dados) {
    try {
      console.log('Iniciando atualização do funcionário:', { id, dados });
      
      if (!id) {
        throw new Error('ID do funcionário não fornecido');
      }

      // Formatar dados antes de atualizar
      const dadosFormatados = {
        nome: dados.nome.trim(),
        unidade: dados.unidade.trim(),
        salario: typeof dados.salario === 'string' ? 
          parseFloat(dados.salario.replace(',', '.')) : 
          dados.salario,
        tipoPix: dados.tipoPix,
        chavePix: dados.chavePix,
        dataAtualizacao: new Date()
      };

      // Adicionar CPF ou CNPJ baseado no que foi fornecido
      if (dados.cpf) {
        dadosFormatados.cpf = dados.cpf.trim().replace(/[^\d]/g, '');
      }
      if (dados.cnpj) {
        dadosFormatados.cnpj = dados.cnpj.trim().replace(/[^\d]/g, '');
      }

      const docRef = doc(db, COLECAO_FUNCIONARIOS, id);
      await updateDoc(docRef, dadosFormatados);

      // Verificar atualização
      const docAtualizado = await getDoc(docRef);
      console.log('Documento atualizado:', {
        id,
        ...docAtualizado.data()
      });
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      throw error;
    }
  },

  async excluirFuncionario(id) {
    try {
      console.log('Iniciando exclusão do funcionário:', id);
      
      if (!id) {
        throw new Error('ID do funcionário não fornecido');
      }

      // Verificar se o funcionário existe antes de excluir
      const docRef = doc(db, COLECAO_FUNCIONARIOS, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Funcionário não encontrado');
      }

      // Armazenar dados para log
      const dadosAntigos = docSnap.data();
      
      // Excluir o documento
      await deleteDoc(docRef);
      
      console.log('Funcionário excluído com sucesso:', {
        id,
        dadosAntigos
      });
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      throw error;
    }
  },

  async limparTodosFuncionarios() {
    try {
      console.log('Iniciando limpeza da coleção de funcionários...');
      
      // Buscar todos os documentos
      const snapshot = await getDocs(collection(db, COLECAO_FUNCIONARIOS));
      
      console.log(`Encontrados ${snapshot.size} documentos para excluir.`);
      
      // Excluir cada documento
      const promises = snapshot.docs.map(async (documento) => {
        console.log(`Excluindo documento ${documento.id}...`);
        await deleteDoc(doc(db, COLECAO_FUNCIONARIOS, documento.id));
        return documento.id;
      });
      
      // Aguardar todas as exclusões
      const resultados = await Promise.all(promises);
      
      console.log('Limpeza concluída!');
      console.log('Documentos excluídos:', resultados);
      
      return resultados;
    } catch (error) {
      console.error('Erro ao limpar funcionários:', error);
      throw error;
    }
  }
}; 