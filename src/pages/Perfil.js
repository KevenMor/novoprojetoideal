import React, { useState, useEffect } from 'react';
import { User, Shield, Building2, Calendar, Save, Eye, EyeOff, Key } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSION_DESCRIPTIONS } from '../utils/permissions';
import toast from 'react-hot-toast';

export default function Perfil() {
  const { userProfile, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        nome: userProfile.nome || '',
        email: userProfile.email || '',
        telefone: userProfile.telefone || '',
        cargo: userProfile.cargo || ''
      });
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.nome.trim()) {
        toast.error('Nome é obrigatório');
        return;
      }

      const userRef = doc(db, 'usuarios', currentUser.uid);
      await updateDoc(userRef, {
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim(),
        cargo: formData.cargo.trim(),
        updatedAt: new Date()
      });

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
        currentUser.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Atualizar senha
      await updatePassword(currentUser, passwordData.newPassword);

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
      } else {
        toast.error('Erro ao alterar senha');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
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
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {userProfile.nome?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-gray-600">Gerencie suas informações pessoais e configurações</p>
          </div>
        </div>

        {/* Informações do Usuário */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Perfil de Acesso</span>
            </div>
            <p className="text-sm text-gray-600">
              {userProfile.perfil === 'admin' ? 'Administrador' :
               userProfile.perfil === 'manager' ? 'Gerente' :
               userProfile.perfil === 'operator' ? 'Operador' :
               userProfile.perfil === 'viewer' ? 'Visualizador' : 'Personalizado'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              {/* <Building2 className="h-5 w-5 text-green-600" /> */}
              <span className="font-medium text-gray-900">Unidades</span>
            </div>
            <p className="text-sm text-gray-600">
              {userProfile.perfil === 'admin' 
                ? '🏢 Todas as unidades' 
                : userProfile.unidades?.length > 0 
                  ? userProfile.unidades.join(', ')
                  : '⚠️ Nenhuma unidade atribuída'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-gray-900">Membro desde</span>
            </div>
            <p className="text-sm text-gray-600">
              {userProfile.criadoEm ? 
                new Date(userProfile.criadoEm.seconds * 1000).toLocaleDateString('pt-BR') :
                'Data não disponível'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-gray-900">Permissões</span>
            </div>
            <p className="text-sm text-gray-600">
              {userProfile.permissions?.length || 0} permissões ativas
            </p>
          </div>
        </div>
      </div>

      {/* Formulário de Dados Pessoais */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <User className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Informações Pessoais</h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                Email
              </label>
              <input
                type="email"
                disabled
                className="input-field bg-gray-100 cursor-not-allowed"
                value={formData.email}
              />
              <p className="text-xs text-gray-500 mt-1">
                O email não pode ser alterado
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                className="input-field"
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
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

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Seção de Alteração de Senha */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">Segurança</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="btn-secondary"
          >
            {showPasswordSection ? 'Cancelar' : 'Alterar Senha'}
          </button>
        </div>

        {showPasswordSection && (
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Atenção:</strong> Após alterar a senha, você precisará fazer login novamente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha Atual *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    className="input-field pr-10"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
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
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    className="input-field pr-10"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nova Senha *
                </label>
                <input
                  type="password"
                  required
                  className="input-field"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <Key className="h-4 w-4" />
                <span>{loading ? 'Alterando...' : 'Alterar Senha'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Minhas Permissões */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Minhas Permissões</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userProfile.permissions?.map((permission) => (
            <div
              key={permission}
              className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {PERMISSION_DESCRIPTIONS[permission] || permission}
                </p>
                <p className="text-xs text-gray-500">
                  {permission}
                </p>
              </div>
            </div>
          )) || (
            <div className="col-span-full text-center py-8 text-gray-500">
              Nenhuma permissão encontrada
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 