import React, { useState, useEffect } from 'react';
import { 
  User, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  Shield,
  Edit2,
  Key
} from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSION_DESCRIPTIONS, PERMISSIONS } from '../utils/permissions';
import toast from 'react-hot-toast';

export default function Perfil() {
  const { user } = useAuth();

  // Mapeamento de números para chaves de permissões
  const getPermissionKeyByNumber = (num) => {
    const permissionKeys = Object.values(PERMISSIONS);
    return permissionKeys[parseInt(num)] || `permission_${num}`;
  };

  // Função para obter nome da permissão por número ou chave
  const getPermissionName = (key) => {
    // Se for um número, converter para a chave correspondente
    if (!isNaN(key)) {
      const permissionKey = getPermissionKeyByNumber(key);
      return PERMISSION_DESCRIPTIONS[permissionKey] || `Permissão ${key}`;
    }
    // Se for uma chave, buscar diretamente
    return PERMISSION_DESCRIPTIONS[key] || key;
  };
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    cargo: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || '',
        telefone: user.telefone || '',
        cargo: user.cargo || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.nome.trim()) {
        toast.error('Nome é obrigatório');
        return;
      }

      const userRef = doc(db, 'usuarios', user.uid);
      await updateDoc(userRef, {
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim(),
        cargo: formData.cargo.trim(),
        updatedAt: new Date()
      });

      setIsEditing(false);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!passwordData.currentPassword) {
        toast.error('Senha atual é obrigatória');
        return;
      }

      if (!passwordData.newPassword) {
        toast.error('Nova senha é obrigatória');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast.error('Nova senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('Confirmação de senha não confere');
        return;
      }

      // Reautenticar usuário
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Atualizar senha
      await updatePassword(auth.currentUser, passwordData.newPassword);

      // Limpar formulário
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordSection(false);

      toast.success('Senha alterada com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      
      if (error.code === 'auth/wrong-password') {
        toast.error('Senha atual incorreta');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Nova senha muito fraca');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Por segurança, faça login novamente antes de alterar a senha');
      } else {
        toast.error('Erro ao alterar senha');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData({
      nome: user.nome || '',
      telefone: user.telefone || '',
      cargo: user.cargo || ''
    });
  };

  const cancelPasswordChange = () => {
    setShowPasswordSection(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-8">
          <div className="loading-spinner w-8 h-8 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-gray-600">Gerencie suas informações pessoais e configurações</p>
          </div>
        </div>

        {/* Avatar e informações básicas */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-3xl font-bold">
              {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user?.nome}</h2>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                {user?.perfil === 'admin' ? 'Administrador' : 
                 user?.perfil === 'manager' ? 'Gerente' :
                 user?.perfil === 'operator' ? 'Operador' :
                 user?.perfil === 'viewer' ? 'Visualizador' : 'Personalizado'}
              </span>
            </div>
          </div>
        </div>

        {/* Informações editáveis */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Informações Pessoais</h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Edit2 className="w-4 h-4" />
                <span>Editar</span>
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo/Função
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.cargo}
                    onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                    placeholder="Ex: Instrutor, Secretária, etc."
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nome Completo</label>
                <p className="text-gray-900 font-medium">{user?.nome || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-900">{user?.email || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Telefone</label>
                <p className="text-gray-900">{user?.telefone || 'Não informado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Cargo/Função</label>
                <p className="text-gray-900">{user?.cargo || 'Não informado'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Segurança */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Key className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Segurança</h3>
            <p className="text-gray-600">Altere sua senha para manter sua conta segura</p>
          </div>
        </div>

        {!showPasswordSection ? (
          <button
            onClick={() => setShowPasswordSection(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Key className="w-4 h-4" />
            <span>Alterar Senha</span>
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha Atual *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className="input-field pr-10"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nova Senha *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="input-field pr-10"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nova Senha *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="input-field pr-10"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner w-4 h-4"></div>
                    <span>Alterando...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Alterar Senha</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={cancelPasswordChange}
                className="btn-secondary flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Permissões */}
      {(user?.permissoes || user?.permissions) && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Permissões</h3>
              <p className="text-gray-600">Suas permissões no sistema</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Verificar se permissões é um objeto (permissoes) ou array (permissions) */}
            {user?.permissoes && typeof user.permissoes === 'object' && !Array.isArray(user.permissoes) ? (
              // Formato objeto: { "0": true, "1": false, ... }
              Object.entries(user.permissoes).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {getPermissionName(key)}
                  </span>
                </div>
              ))
            ) : user?.permissions && Array.isArray(user.permissions) ? (
              // Formato array: ["visualizar_dashboard", "enviar_mensagens", ...]
              user.permissions.map((permission) => (
                <div key={permission} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {PERMISSION_DESCRIPTIONS[permission] || permission}
                  </span>
                </div>
              ))
            ) : (
              // Fallback para debug
              <div className="col-span-full p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Debug:</strong> Estrutura de permissões não reconhecida
                </p>
                <pre className="text-xs text-yellow-700 mt-2">
                  {JSON.stringify({ permissoes: user?.permissoes, permissions: user?.permissions }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 