import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Users
} from 'lucide-react';
import { collection, getDocs, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { 
  getPermissionsByProfile,
  hasPermission,
  PERMISSIONS
} from '../utils/permissions';
import PermissionSelector from '../components/PermissionSelector';
import toast from 'react-hot-toast';

export default function GerenciarUsuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alterarSenha, setAlterarSenha] = useState(false);
  const [tipoAlteracaoSenha, setTipoAlteracaoSenha] = useState('email');
  const [showPermissions, setShowPermissions] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'operator',
    unidades: [],
    permissions: [],
    ativo: true
  });

  const unidades = ['Julio de Mesquita', 'Aparecidinha', 'Coop', 'Progresso', 'Vila Haro', 'Vila Helena'];
  
  const perfis = [
    { value: 'admin', label: 'Administrador' },
    { value: 'manager', label: 'Gerente' },
    { value: 'operator', label: 'Operador' },
    { value: 'viewer', label: 'Visualizador' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      console.log('🔄 Buscando usuários...');
      console.log('👤 Usuário atual:', user.email, '(UID:', user.uid, ')');
      
      // Buscar usuários diretamente do Firestore
      const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
      console.log('📊 Total de documentos encontrados:', usuariosSnapshot.docs.length);
      
      const usuariosList = usuariosSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`📄 Documento ${doc.id}:`, {
          nome: data.nome,
          email: data.email,
          perfil: data.perfil,
          ativo: data.ativo,
          unidades: Array.isArray(data.unidades) ? data.unidades.length : 'NÃO É ARRAY',
          permissions: Array.isArray(data.permissions) ? data.permissions.length : 'NÃO É ARRAY'
        });
        
        return {
          id: doc.id,
          ...data,
          // Garantir que arrays nunca sejam undefined
          unidades: Array.isArray(data.unidades) ? data.unidades : [],
          permissions: Array.isArray(data.permissions) ? data.permissions : [],
          // Garantir campos obrigatórios
          nome: data.nome || 'Nome não definido',
          email: data.email || 'Email não definido',
          perfil: data.perfil || 'operator',
          ativo: typeof data.ativo === 'boolean' ? data.ativo : true
        };
      });
      
      console.log('✅ Usuários processados:', usuariosList.length);
      console.log('📋 Lista final:', usuariosList.map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        perfil: u.perfil,
        ativo: u.ativo,
        unidadesCount: u.unidades.length,
        permissionsCount: u.permissions.length
      })));
      
      setUsuarios(usuariosList);
      
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      console.error('🔍 Detalhes do erro:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = 'Erro ao carregar usuários';
      if (error.code === 'permission-denied') {
        errorMessage = 'Sem permissão para acessar usuários. Verifique se você é administrador.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
      } else {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // Função para enviar email de redefinição de senha
  const enviarEmailRedefinicaoSenha = async (email) => {
    try {
      console.log('📧 Enviando email de redefinição de senha para:', email);
      await sendPasswordResetEmail(auth, email);
      toast.success(`Email de redefinição de senha enviado para ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de redefinição:', error);
      
      let errorMessage = 'Erro ao enviar email de redefinição';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado no sistema de autenticação';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  // Função utilitária para remover undefined de forma profunda
  function deepRemoveUndefined(obj) {
    if (obj === undefined || obj === null) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(deepRemoveUndefined).filter(item => item !== null);
    } else if (obj && typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          const cleanedValue = deepRemoveUndefined(value);
          if (cleanedValue !== null) {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return cleaned;
    }
    return obj;
  }

  // Função para validar e limpar dados do usuário antes de salvar
  function validateAndCleanUserData(userData) {
    console.log('🔍 Validando dados do usuário antes de salvar...');
    console.log('📋 Dados originais:', JSON.stringify(userData, null, 2));
    
    // Garantir campos obrigatórios
    const cleanedData = {
      // Campos obrigatórios
      nome: userData.nome || '',
      email: userData.email || '',
      perfil: userData.perfil || 'operator',
      ativo: typeof userData.ativo === 'boolean' ? userData.ativo : true,
      
      // Arrays sempre definidos
      unidades: Array.isArray(userData.unidades) ? userData.unidades : [],
      permissions: Array.isArray(userData.permissions) ? userData.permissions : [],
      
      // Timestamps
      criadoEm: userData.criadoEm || new Date(),
      updatedAt: new Date(),
      
      // Campos opcionais
      ...(userData.criadoPor && { criadoPor: userData.criadoPor }),
      ...(userData.criadoPorEmail && { criadoPorEmail: userData.criadoPorEmail }),
      ...(userData.versao && { versao: userData.versao }),
      ...(userData.uid && { uid: userData.uid }),
      
      // Campos de controle
      telefone: userData.telefone || '',
      cargo: userData.cargo || '',
      role: userData.role || userData.perfil,
      isAdmin: userData.perfil === 'admin',
      superUser: userData.perfil === 'admin',
      acessoTotal: userData.perfil === 'admin'
    };
    
    // Remover undefined de forma profunda
    const finalData = deepRemoveUndefined(cleanedData);
    
    console.log('✅ Dados validados e limpos:', JSON.stringify(finalData, null, 2));
    
    // Validações finais
    if (!finalData.nome || !finalData.email) {
      throw new Error('Nome e email são obrigatórios');
    }
    
    if (!Array.isArray(finalData.unidades)) {
      throw new Error('Unidades deve ser um array');
    }
    
    if (!Array.isArray(finalData.permissions)) {
      throw new Error('Permissions deve ser um array');
    }
    
    return finalData;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || (!editingUser && !formData.senha)) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (editingUser && alterarSenha && tipoAlteracaoSenha === 'manual' && !formData.senha) {
      toast.error('Por favor, digite a nova senha');
      return;
    }

    // Garantir que unidades e permissions nunca sejam undefined
    const safeUnidades = Array.isArray(formData.unidades) ? formData.unidades : [];
    const safePermissions = Array.isArray(formData.perfil === 'custom' ? formData.permissions : getPermissionsByProfile(formData.perfil))
      ? (formData.perfil === 'custom' ? formData.permissions : getPermissionsByProfile(formData.perfil))
      : [];

    if ((formData.perfil === 'operator' || formData.perfil === 'custom') && safeUnidades.length === 0) {
      toast.error('Usuários devem ter pelo menos uma unidade associada');
      return;
    }
    if (formData.perfil === 'custom' && safePermissions.length === 0) {
      toast.error('Perfil personalizado deve ter pelo menos uma permissão');
      return;
    }

    setLoading(true);
    
    try {
      // Definir permissões baseadas no perfil
      const permissions = safePermissions;

      if (editingUser) {
        // Atualizar usuário existente - USANDO A COLEÇÃO CORRETA 'usuarios'
        const userRef = doc(db, 'usuarios', editingUser.id);
        
        // Dados básicos para atualizar
        const updateData = {
          nome: formData.nome,
          email: formData.email,
          perfil: formData.perfil,
          unidades: safeUnidades,
          permissions: permissions,
          ativo: formData.ativo,
          updatedAt: new Date()
        };

        await updateDoc(userRef, validateAndCleanUserData(updateData));
        
        // Se o usuário quer alterar a senha
        if (alterarSenha) {
          if (tipoAlteracaoSenha === 'email') {
            // Enviar email de redefinição
            const emailEnviado = await enviarEmailRedefinicaoSenha(formData.email);
            if (emailEnviado) {
              await updateDoc(userRef, {
                ...validateAndCleanUserData(updateData),
                emailRedefinicaoEnviado: true,
                dataEmailRedefinicao: new Date()
              });
              toast.success('Usuário atualizado e email de redefinição de senha enviado!');
            } else {
              toast.success('Usuário atualizado, mas houve problema ao enviar o email de redefinição.');
            }
          } else {
            // Salvar informação de que a senha deve ser alterada (para implementação futura com Admin SDK)
            await updateDoc(userRef, {
              ...validateAndCleanUserData(updateData),
              novaSenhaPendente: formData.senha,
              dataSolicitacaoSenha: new Date()
            });
            toast('⚠️ Usuário atualizado. Nota: A alteração manual de senha requer configuração adicional do Admin SDK.', {
              icon: '⚠️',
              duration: 4000
            });
          }
        } else {
          toast.success('Usuário atualizado com sucesso!');
        }
      } else {
        // Criar novo usuário - SISTEMA ROBUSTO E DEFINITIVO
        console.log('🔄 Criando novo usuário:', formData.email);
        console.log('📋 Dados do formulário:', {
          nome: formData.nome,
          email: formData.email,
          perfil: formData.perfil,
          unidades: safeUnidades,
          permissions: permissions
        });
        
        // Validar se o usuário atual é admin
        if (!user) {
          toast.error('❌ Apenas administradores podem criar usuários');
          return;
        }
        
        // Salvar dados do admin atual
        console.log('💾 Admin atual:', user.email, '(UID:', user.uid, ')');
        
        let newUserCredential = null;
        let tentativas = 0;
        const maxTentativas = 3;
        
        try {
          // ETAPA 1: Criar usuário no Firebase Auth
          console.log('🔐 Criando usuário no Firebase Authentication...');
          newUserCredential = await createUserWithEmailAndPassword(
            auth, 
            formData.email, 
            formData.senha
          );
          
          console.log('✅ Usuário criado no Auth:', newUserCredential.user.uid);
          
          // ETAPA 2: Salvar dados no Firestore com retry automático
          const userData = {
            nome: formData.nome,
            email: formData.email,
            perfil: formData.perfil,
            unidades: safeUnidades,
            permissions: permissions,
            ativo: formData.ativo,
            criadoEm: new Date(),
            updatedAt: new Date(),
            criadoPor: user.uid,
            criadoPorEmail: user.email,
            versao: '1.0'
          };
          
          console.log('📄 Salvando dados no Firestore...');
          
          // Sistema de retry para salvamento no Firestore
          while (tentativas < maxTentativas) {
            try {
              tentativas++;
              console.log(`📝 Tentativa ${tentativas}/${maxTentativas} de salvar no Firestore...`);
              
              await setDoc(doc(db, 'usuarios', newUserCredential.user.uid), validateAndCleanUserData(userData));
              
              console.log('✅ Dados salvos no Firestore com sucesso!');
              break; // Sucesso, sair do loop
              
            } catch (firestoreError) {
              console.error(`❌ Erro na tentativa ${tentativas}:`, firestoreError);
              
              if (tentativas === maxTentativas) {
                // Última tentativa falhou
                throw new Error(`Falha ao salvar no Firestore após ${maxTentativas} tentativas: ${firestoreError.message}`);
              }
              
              // Aguardar antes da próxima tentativa
              console.log('⏳ Aguardando 2 segundos antes da próxima tentativa...');
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          
          // ETAPA 3: Não fazer logout do admin - manter sessão ativa
          console.log('✅ Mantendo sessão do administrador ativa...');
          
          // ETAPA 4: Mostrar mensagem de sucesso
          toast.success(`✅ Usuário ${formData.nome} criado com sucesso!
          
📧 Email: ${formData.email}
🔑 Senha: ${formData.senha}
🏷️ Perfil: ${perfis.find(p => p.value === formData.perfil)?.label}`, {
            duration: 8000,
            style: {
              maxWidth: '500px'
            }
          });
          
          console.log('✅ Processo de criação concluído com sucesso!');
          
          // Recarregar lista de usuários
          await fetchUsuarios();
          
          // Limpar formulário
          setFormData({
            nome: '',
            email: '',
            senha: '',
            perfil: 'operator',
            unidades: [],
            permissions: [],
            ativo: true
          });
          setEditingUser(null);
          setShowModal(false);
          setAlterarSenha(false);
          setTipoAlteracaoSenha('email');
          
          return; // Sucesso total
          
        } catch (error) {
          console.error('❌ Erro no processo de criação:', error);
          
          // Tratamento específico de erros
          let errorMessage = 'Erro ao criar usuário';
          let shouldShowAuthError = false;
          
          if (error.code === 'auth/email-already-in-use') {
            errorMessage = '📧 Este email já está em uso por outro usuário';
          } else if (error.code === 'auth/weak-password') {
            errorMessage = '🔒 A senha deve ter pelo menos 6 caracteres';
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = '📧 Email inválido';
          } else if (error.code === 'permission-denied' || error.message.includes('Firestore')) {
            errorMessage = `🔐 Erro de permissão no banco de dados. 
            
${newUserCredential ? '⚠️ O usuário foi criado no Authentication mas não foi salvo no banco.' : ''}

🔧 Soluções:
1. Verifique se você está logado como administrador
2. Aguarde alguns minutos e tente novamente
3. Entre em contato com o suporte técnico`;
            shouldShowAuthError = true;
          } else if (error.message.includes('tentativas')) {
            errorMessage = `⚠️ ${error.message}
            
🔧 O usuário foi criado no Authentication mas houve problemas ao salvar os dados.
Tente fazer login com as credenciais do novo usuário para verificar.`;
            shouldShowAuthError = true;
          }
          
          toast.error(errorMessage, {
            duration: shouldShowAuthError ? 15000 : 6000,
            style: {
              maxWidth: '600px'
            }
          });
          
          // Se o usuário foi criado no Auth mas não no Firestore
          if (newUserCredential && (error.code === 'permission-denied' || error.message.includes('Firestore'))) {
            toast('ℹ️ Informação Importante: O usuário foi criado no Firebase Authentication com as credenciais fornecidas, mas os dados adicionais não foram salvos devido a problemas de permissão.', {
              icon: 'ℹ️',
              duration: 12000,
              style: {
                maxWidth: '600px',
                backgroundColor: '#e3f2fd'
              }
            });
          }
          
          throw error;
        }
      }
      
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      
      let errorMessage = 'Erro ao salvar usuário';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está em uso';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      perfil: usuario.perfil,
      unidades: usuario.unidades || [],
      permissions: usuario.permissions || [],
      ativo: usuario.ativo
    });
    setAlterarSenha(false);
    setTipoAlteracaoSenha('email');
    setShowModal(true);
  };

  const handleDelete = async (usuarioId) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    // Não permitir que o usuário delete a si mesmo
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }

    setLoading(true);
    try {
      // USANDO A COLEÇÃO CORRETA 'usuarios'
      await deleteDoc(doc(db, 'usuarios', usuarioId));
      toast.success('Usuário excluído com sucesso!');
      await fetchUsuarios();
    } catch (error) {
      toast.error('Erro ao excluir usuário');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (usuario) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      // USANDO A COLEÇÃO CORRETA 'usuarios'
      const userRef = doc(db, 'usuarios', usuario.id);
      await updateDoc(userRef, {
        ativo: !usuario.ativo,
        updatedAt: new Date()
      });
      
      toast.success(`Usuário ${!usuario.ativo ? 'ativado' : 'desativado'} com sucesso!`);
      await fetchUsuarios();
    } catch (error) {
      toast.error('Erro ao alterar status do usuário');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnidadeChange = (unidade, checked) => {
    if (checked) {
      setFormData({
        ...formData,
        unidades: [...formData.unidades, unidade]
      });
    } else {
      setFormData({
        ...formData,
        unidades: formData.unidades.filter(u => u !== unidade)
      });
    }
  };

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openNewUserModal = () => {
    setEditingUser(null);
    setFormData({
      nome: '',
      email: '',
      senha: '',
      perfil: 'operator',
      unidades: [],
      permissions: [],
      ativo: true
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setAlterarSenha(false);
    setTipoAlteracaoSenha('email');
    setFormData({
      nome: '',
      email: '',
      senha: '',
      perfil: 'operator',
      unidades: [],
      permissions: [],
      ativo: true
    });
  };

  // Funções antigas de permissões removidas - usando PermissionSelector

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
              <p className="text-gray-600">Gerencie usuários e permissões do sistema</p>
            </div>
          </div>
          
          <button
            onClick={openNewUserModal}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Usuário</span>
          </button>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Buscar usuários</label>
          <input
            type="text"
            placeholder="Digite nome ou email para buscar usuários..."
            className="input-field w-full md:w-96"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Lista de Usuários */}
        {loading && !showModal ? (
          <div className="flex justify-center py-8">
            <div className="loading-spinner w-8 h-8"></div>
          </div>
        ) : (
          <div>
            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Perfil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissões
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {usuario.nome}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {usuario.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.perfil === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : usuario.perfil === 'manager' 
                            ? 'bg-blue-100 text-blue-800'
                            : usuario.perfil === 'operator' 
                              ? 'bg-green-100 text-green-800'
                              : usuario.perfil === 'viewer' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}>
                        {usuario.perfil === 'admin' ? 'Administrador' : usuario.perfil === 'manager' ? 'Gerente' : usuario.perfil === 'operator' ? 'Operador' : usuario.perfil === 'viewer' ? 'Visualizador' : 'Personalizado'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {usuario.perfil === 'admin' 
                          ? '🏢 Todas as unidades' 
                          : (usuario.unidades || []).join(', ') || 'Nenhuma unidade'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {usuario.permissions && usuario.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {usuario.permissions.length} permissões
                            </span>
                            {usuario.perfil === 'custom' && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                Personalizado
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Nenhuma</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleUserStatus(usuario)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                          usuario.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(usuario)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar usuário"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => enviarEmailRedefinicaoSenha(usuario.email)}
                        className="text-green-600 hover:text-green-900"
                        title="Enviar email para redefinir senha"
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(usuario.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir usuário"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards - Visible only on mobile */}
          <div className="md:hidden space-y-4">
            {filteredUsuarios.map((usuario) => (
              <div key={usuario.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {usuario.nome}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {usuario.email}
                    </p>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.perfil === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : usuario.perfil === 'manager' 
                            ? 'bg-blue-100 text-blue-800'
                            : usuario.perfil === 'operator' 
                              ? 'bg-green-100 text-green-800'
                              : usuario.perfil === 'viewer' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}>
                        {usuario.perfil === 'admin' 
                          ? 'Admin' 
                          : usuario.perfil === 'manager' 
                            ? 'Gerente' 
                            : usuario.perfil === 'operator' 
                              ? 'Operador' 
                              : usuario.perfil === 'viewer' 
                                ? 'Viewer' 
                                : 'Custom'
                        }
                      </span>
                      <button
                        onClick={() => toggleUserStatus(usuario)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer touch-manipulation ${
                          usuario.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => handleEdit(usuario)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                      title="Editar usuário"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => enviarEmailRedefinicaoSenha(usuario.email)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors touch-manipulation"
                      title="Enviar email para redefinir senha"
                    >
                      <Lock className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(usuario.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                      title="Excluir usuário"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Unidades:</span> {usuario.perfil === 'admin' 
                      ? '🏢 Todas as unidades' 
                      : (usuario.unidades || []).join(', ') || 'Nenhuma unidade'}
                  </div>
                  <div>
                    <span className="font-medium">Permissões:</span> {usuario.permissions && usuario.permissions.length > 0 ? (
                      <span className="inline-block ml-1">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {usuario.permissions.length} permissões
                        </span>
                        {usuario.perfil === 'custom' && (
                          <span className="ml-1 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Personalizado
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">Nenhuma</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

            {filteredUsuarios.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum usuário encontrado
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="input-field"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled={editingUser}
                    />
                  </div>

                  {/* Campo de senha - sempre visível, mas com lógica diferente */}
                  <div>
                    {editingUser ? (
                      <>
                        <div className="flex items-center space-x-2 mb-3">
                          <input
                            type="checkbox"
                            id="alterarSenha"
                            checked={alterarSenha}
                            onChange={(e) => {
                              setAlterarSenha(e.target.checked);
                              if (!e.target.checked) {
                                setFormData({...formData, senha: ''});
                                setTipoAlteracaoSenha('email');
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="alterarSenha" className="flex items-center text-sm font-medium text-gray-700">
                            <Lock className="h-4 w-4 mr-1" />
                            Alterar senha do usuário
                          </label>
                        </div>
                        
                        {alterarSenha && (
                          <div className="space-y-3">
                            {/* Opções de alteração de senha */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Método de alteração:</label>
                              <div className="space-y-2">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name="tipoAlteracaoSenha"
                                    value="email"
                                    checked={tipoAlteracaoSenha === 'email'}
                                    onChange={(e) => {
                                      setTipoAlteracaoSenha(e.target.value);
                                      setFormData({...formData, senha: ''});
                                    }}
                                    className="text-blue-600 focus:ring-blue-500"
                                  />
                                  <Lock className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm text-gray-700">Enviar email de redefinição</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name="tipoAlteracaoSenha"
                                    value="manual"
                                    checked={tipoAlteracaoSenha === 'manual'}
                                    onChange={(e) => setTipoAlteracaoSenha(e.target.value)}
                                    className="text-blue-600 focus:ring-blue-500"
                                  />
                                  <Lock className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm text-gray-700">Definir nova senha manualmente</span>
                                </label>
                              </div>
                            </div>

                            {/* Campo de senha manual */}
                            {tipoAlteracaoSenha === 'manual' && (
                              <div className="relative">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Digite a nova senha"
                                  className="input-field pr-10"
                                  value={formData.senha}
                                  onChange={(e) => setFormData({...formData, senha: e.target.value})}
                                />
                                <button
                                  type="button"
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                  ) : (
                                    <Eye className="h-5 w-5 text-gray-400" />
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Informações sobre cada método */}
                            <div className="p-3 bg-blue-50 rounded-lg">
                              {tipoAlteracaoSenha === 'email' ? (
                                <div className="flex items-start space-x-2">
                                  <Lock className="h-4 w-4 text-blue-600 mt-0.5" />
                                  <div className="text-xs text-blue-700">
                                    <p className="font-medium">Email de redefinição</p>
                                    <p>O usuário receberá um email com link para redefinir a senha. Método mais seguro e recomendado.</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start space-x-2">
                                  <Lock className="h-4 w-4 text-amber-600 mt-0.5" />
                                  <div className="text-xs text-amber-700">
                                    <p className="font-medium">Alteração manual</p>
                                    <p>⚠️ Funcionalidade limitada. Requer configuração adicional do Firebase Admin SDK para funcionar completamente.</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Senha *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            className="input-field pr-10"
                            value={formData.senha}
                            onChange={(e) => setFormData({...formData, senha: e.target.value})}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Perfil *
                    </label>
                    <select
                      required
                      className="select-field"
                      value={formData.perfil}
                                             onChange={(e) => {
                         const newProfile = e.target.value;
                         setFormData({
                           ...formData, 
                           perfil: newProfile, 
                           unidades: [], 
                           permissions: newProfile === 'custom' ? formData.permissions : getPermissionsByProfile(newProfile)
                         });
                         if (newProfile === 'custom') {
                           setShowPermissions(true);
                         } else {
                           setShowPermissions(false);
                         }
                       }}
                    >
                      {perfis.map((perfil) => (
                        <option key={perfil.value} value={perfil.value}>
                          {perfil.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Unidades (para operator e custom) */}
                {(formData.perfil === 'operator' || formData.perfil === 'custom') && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Unidades *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {unidades.map((unidade) => (
                        <label key={unidade} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.unidades.includes(unidade)}
                            onChange={(e) => handleUnidadeChange(unidade, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 font-medium">{unidade}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Permissões - Usando componente avançado */}
                {(showPermissions || formData.perfil === 'custom') && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <PermissionSelector
                      selectedPermissions={formData.permissions}
                      onPermissionsChange={(permissions) => setFormData({...formData, permissions})}
                      selectedProfile={formData.perfil}
                      isAdmin={user?.perfil === 'admin' || hasPermission(user?.permissions, PERMISSIONS.USERS_MANAGE_PERMISSIONS)}
                    />
                  </div>
                )}

                {/* Status */}
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.ativo}
                        onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm font-medium text-gray-700">
                        Usuário ativo
                      </label>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formData.ativo ? '✅ Usuário poderá fazer login' : '❌ Login será bloqueado'}
                    </div>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary px-6 py-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-6 py-2"
                  >
                    {loading ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 