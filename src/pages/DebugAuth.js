import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DebugAuth() {
  const authContext = useAuth();
  
  const {
    currentUser,
    userProfile,
    isAdmin,
    unidades,
    permissions,
    hasPermission,
    canAccessMenu
  } = authContext;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 Debug AuthContext</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estado do Usuário */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">👤 Estado do Usuário</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium">currentUser:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${currentUser ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {currentUser ? '✅ Logado' : '❌ Não logado'}
                </span>
              </div>
              
              <div>
                <span className="font-medium">userProfile:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${userProfile ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {userProfile ? '✅ Carregado' : '❌ Não carregado'}
                </span>
              </div>
              
              <div>
                <span className="font-medium">isAdmin:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${isAdmin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {isAdmin ? '✅ É Admin' : '❌ Não é Admin'}
                </span>
              </div>
            </div>
          </div>

          {/* Dados do Perfil */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Dados do Perfil</h2>
            {userProfile ? (
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Nome:</span> {userProfile.nome}</div>
                <div><span className="font-medium">Email:</span> {userProfile.email}</div>
                <div><span className="font-medium">Perfil:</span> {userProfile.perfil}</div>
                <div><span className="font-medium">Ativo:</span> {userProfile.ativo ? '✅' : '❌'}</div>
                <div><span className="font-medium">Acesso Total:</span> {userProfile.acessoTotal ? '✅' : '❌'}</div>
                <div><span className="font-medium">Unidades:</span> {unidades?.length || 0}</div>
                <div><span className="font-medium">Permissões:</span> {permissions?.length || 0}</div>
              </div>
            ) : (
              <p className="text-gray-500">Perfil não carregado</p>
            )}
          </div>

          {/* Permissões */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔐 Permissões</h2>
            {permissions && permissions.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {permissions.map((permission, index) => (
                  <div key={index} className="bg-blue-50 text-blue-800 px-3 py-1 rounded text-sm">
                    {permission}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma permissão encontrada</p>
            )}
          </div>

          {/* Testes de Permissão */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🧪 Testes de Permissão</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'users.view',
                'users.create',
                'users.edit',
                'users.delete',
                'dashboard.view',
                'messages.view'
              ].map(permission => (
                <div key={permission} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{permission}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    hasPermission(permission) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {hasPermission(permission) ? '✅ TEM' : '❌ NÃO TEM'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Teste de Menu */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📱 Teste de Acesso ao Menu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'users',
                'dashboard',
                'messages',
                'btg_accounts',
                'charges',
                'extracts'
              ].map(menu => (
                <div key={menu} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{menu}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    canAccessMenu(menu) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {canAccessMenu(menu) ? '✅ PODE' : '❌ NÃO PODE'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dados Brutos */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔧 Dados Brutos</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">currentUser:</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(currentUser ? {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    emailVerified: currentUser.emailVerified
                  } : null, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">userProfile:</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(userProfile, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 