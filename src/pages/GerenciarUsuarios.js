import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Edit, Trash2, Search, Eye, EyeOff, Key, Mail, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { collection, getDocs, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { 
  PERMISSION_GROUPS, 
  PERMISSION_DESCRIPTIONS, 
  getPermissionsByProfile 
} from '../utils/permissions';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function GerenciarUsuarios() {
  const { currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alterarSenha, setAlterarSenha] = useState(false);
  const [tipoAlteracaoSenha, setTipoAlteracaoSenha] = useState('email');
  const [showPermissions, setShowPermissions] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  
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

  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔄 Iniciando carregamento de usuários...');
      
      // Verificar se o usuário atual tem permissões de admin
      if (!currentUser) {
        console.error('❌ Usuário não autenticado');
        toast.error('Usuário não autenticado');
        return;
      }

      // Tentar usar a API primeiro, se falhar usar Firebase diretamente
      try {
        console.log('🌐 Tentando usar API...');
        const token = await currentUser.getIdToken();
        const response = await axios.get('/api/users', {
          baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          console.log('✅ Usuários carregados via API:', response.data.data.length);
          setUsuarios(response.data.data);
          return;
        }
      } catch (apiError) {
        console.warn('⚠️ API não disponível, tentando Firebase diretamente:', apiError.message);
      }

      // Fallback para Firebase direto - USANDO A COLEÇÃO CORRETA 'usuarios'
      console.log('🔥 Tentando carregar via Firebase direto...');
      
      try {
        // Verificar se o usuário tem token válido
        const token = await currentUser.getIdToken(true); // Force refresh
        console.log('✅ Token obtido, comprimento:', token.length);
        
        const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
        const usuariosList = usuariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('✅ Usuários carregados via Firebase:', usuariosList.length);
        setUsuarios(usuariosList);
        
      } catch (firestoreError) {
        console.error('❌ Erro específico do Firestore:', firestoreError);
        
        if (firestoreError.code === 'permission-denied') {
          toast.error('Sem permissão para acessar usuários. Verifique as regras do Firestore.');
          console.error('🔒 Erro de permissão - Regras do Firestore muito restritivas');
          console.log('💡 Solução: Configure as regras do Firestore para permitir leitura da coleção "usuarios" para usuários autenticados');
        } else if (firestoreError.code === 'unavailable') {
          toast.error('Firestore temporariamente indisponível. Tente novamente.');
        } else {
          toast.error(`Erro do Firestore: ${firestoreError.message}`);
        }
        
        // Definir lista vazia para não quebrar a interface
        setUsuarios([]);
      }
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

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

    if (formData.perfil === 'operator' && formData.unidades.length === 0) {
      toast.error('Usuários devem ter pelo menos uma unidade associada');
      return;
    }

    if (formData.perfil === 'custom' && formData.permissions.length === 0) {
      toast.error('Perfil personalizado deve ter pelo menos uma permissão');
      return;
    }

    setLoading(true);
    
    try {
      // Definir permissões baseadas no perfil
      const permissions = formData.perfil === 'custom' 
        ? formData.permissions 
        : getPermissionsByProfile(formData.perfil);

      if (editingUser) {
        // Atualizar usuário existente - USANDO A COLEÇÃO CORRETA 'usuarios'
        const userRef = doc(db, 'usuarios', editingUser.id);
        
        // Dados básicos para atualizar
        const updateData = {
          nome: formData.nome,
          email: formData.email,
          perfil: formData.perfil,
          unidades: formData.unidades,
          permissions: permissions,
          ativo: formData.ativo,
          updatedAt: new Date()
        };

        await updateDoc(userRef, updateData);
        
        // Se o usuário quer alterar a senha
        if (alterarSenha) {
          if (tipoAlteracaoSenha === 'email') {
            // Enviar email de redefinição
            const emailEnviado = await enviarEmailRedefinicaoSenha(formData.email);
            if (emailEnviado) {
              await updateDoc(userRef, {
                ...updateData,
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
              ...updateData,
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
          unidades: formData.unidades,
          permissions: permissions
        });
        
        // Validar se o usuário atual é admin
        if (!currentUser) {
          toast.error('❌ Apenas administradores podem criar usuários');
          return;
        }
        
        // Salvar dados do admin atual
        const adminEmail = currentUser.email;
        const adminUid = currentUser.uid;
        console.log('💾 Admin atual:', adminEmail, '(UID:', adminUid, ')');
        
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
            unidades: formData.unidades,
            permissions: permissions,
            ativo: formData.ativo,
            criadoEm: new Date(),
            updatedAt: new Date(),
            criadoPor: adminUid,
            criadoPorEmail: adminEmail,
            versao: '1.0'
          };
          
          console.log('📄 Salvando dados no Firestore...');
          
          // Sistema de retry para salvamento no Firestore
          while (tentativas < maxTentativas) {
            try {
              tentativas++;
              console.log(`📝 Tentativa ${tentativas}/${maxTentativas} de salvar no Firestore...`);
              
              await setDoc(doc(db, 'usuarios', newUserCredential.user.uid), userData);
              
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
          await carregarUsuarios();
          
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
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }

    setLoading(true);
    try {
      // USANDO A COLEÇÃO CORRETA 'usuarios'
      await deleteDoc(doc(db, 'usuarios', usuarioId));
      toast.success('Usuário excluído com sucesso!');
      await carregarUsuarios();
    } catch (error) {
      toast.error('Erro ao excluir usuário');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (usuario) => {
    setLoading(true);
    try {
      // USANDO A COLEÇÃO CORRETA 'usuarios'
      const userRef = doc(db, 'usuarios', usuario.id);
      await updateDoc(userRef, {
        ativo: !usuario.ativo,
        updatedAt: new Date()
      });
      
      toast.success(`Usuário ${!usuario.ativo ? 'ativado' : 'desativado'} com sucesso!`);
      await carregarUsuarios();
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

  // Função para alternar grupo de permissões expandido
  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Função para alternar permissão individual
  const togglePermission = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // Função para alternar todas as permissões de um grupo
  const toggleGroupPermissions = (groupPermissions) => {
    const allSelected = groupPermissions.every(permission => 
      formData.permissions.includes(permission)
    );
    
    if (allSelected) {
      // Remover todas as permissões do grupo
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !groupPermissions.includes(p))
      }));
    } else {
      // Adicionar todas as permissões do grupo
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...groupPermissions])]
      }));
    }
  };

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
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Digite nome ou email para buscar usuários..."
              className="input-field pl-10 w-full md:w-96"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de Usuários */}
        {loading && !showModal ? (
          <div className="flex justify-center py-8">
            <div className="loading-spinner w-8 h-8"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => enviarEmailRedefinicaoSenha(usuario.email)}
                        className="text-green-600 hover:text-green-900"
                        title="Enviar email para redefinir senha"
                      >
                        <Mail className="h-4 w-4" />
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
                            <Key className="h-4 w-4 mr-1" />
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
                                  <Mail className="h-4 w-4 text-blue-600" />
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
                                  <Key className="h-4 w-4 text-blue-600" />
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
                                  <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                                  <div className="text-xs text-blue-700">
                                    <p className="font-medium">Email de redefinição</p>
                                    <p>O usuário receberá um email com link para redefinir a senha. Método mais seguro e recomendado.</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start space-x-2">
                                  <Key className="h-4 w-4 text-amber-600 mt-0.5" />
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

                {/* Unidades (apenas para usuários) */}
                {formData.perfil === 'operator' && (
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

                                 {/* Permissões */}
                 {(showPermissions || formData.perfil === 'custom') && (
                   <div className="md:col-span-2 lg:col-span-3">
                     <div className="flex items-center justify-between mb-4">
                       <label className="block text-sm font-medium text-gray-700">
                         <Shield className="inline h-4 w-4 mr-2" />
                         Permissões Personalizadas
                       </label>
                       <span className="text-xs text-gray-500">
                         {formData.permissions.length} selecionadas
                       </span>
                     </div>
                     
                     <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                       {Object.entries(PERMISSION_GROUPS).map(([groupKey, groupData]) => {
                         const isExpanded = expandedGroups[groupKey];
                         const allSelected = groupData.permissions.every(permission => 
                           formData.permissions.includes(permission)
                         );
                         const someSelected = groupData.permissions.some(permission => 
                           formData.permissions.includes(permission)
                         );
                         
                         return (
                           <div key={groupKey} className="border border-gray-100 rounded-lg">
                             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg">
                               <div className="flex items-center space-x-3">
                                 <input
                                   type="checkbox"
                                   checked={allSelected}
                                   ref={input => {
                                     if (input) input.indeterminate = someSelected && !allSelected;
                                   }}
                                   onChange={() => toggleGroupPermissions(groupData.permissions)}
                                   className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                 />
                                 <div>
                                   <h4 className="text-sm font-semibold text-gray-900">
                                     {groupData.name}
                                   </h4>
                                   <p className="text-xs text-gray-500">
                                     {groupData.description}
                                   </p>
                                 </div>
                               </div>
                               <button
                                 type="button"
                                 onClick={() => toggleGroup(groupKey)}
                                 className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                               >
                                 {isExpanded ? (
                                   <ChevronUp className="h-4 w-4" />
                                 ) : (
                                   <ChevronDown className="h-4 w-4" />
                                 )}
                               </button>
                             </div>
                             
                             {isExpanded && (
                               <div className="p-3 space-y-2 bg-white rounded-b-lg">
                                 {groupData.permissions.map((permission) => (
                                   <label key={permission} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                     <input
                                       type="checkbox"
                                       checked={formData.permissions.includes(permission)}
                                       onChange={() => togglePermission(permission)}
                                       className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                     />
                                     <div className="flex-1">
                                       <span className="text-sm text-gray-700 font-medium">
                                         {PERMISSION_DESCRIPTIONS[permission]}
                                       </span>
                                       <p className="text-xs text-gray-500">
                                         {permission}
                                       </p>
                                     </div>
                                   </label>
                                 ))}
                               </div>
                             )}
                           </div>
                         );
                       })}
                     </div>
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