import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS, PERMISSION_DESCRIPTIONS } from '../utils/permissions';
import { Shield, Check, X } from 'lucide-react';

export default function TestPermissions() {
  const { userProfile, hasPermission, permissions } = useAuth();

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Carregando informações do usuário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Teste de Permissões
              </h1>
              <p className="text-gray-600">
                Verificação do sistema de controle de acesso
              </p>
            </div>
          </div>

          {/* Informações do Usuário */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Informações do Usuário
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nome:</p>
                <p className="font-medium">{userProfile.nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email:</p>
                <p className="font-medium">{userProfile.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Perfil:</p>
                <p className="font-medium">
                  {userProfile.perfil === 'admin' ? 'Administrador' :
                   userProfile.perfil === 'manager' ? 'Gerente' :
                   userProfile.perfil === 'operator' ? 'Operador' :
                   userProfile.perfil === 'viewer' ? 'Visualizador' : 'Personalizado'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unidades:</p>
                <p className="font-medium">
                  {userProfile.unidades?.length > 0 
                    ? userProfile.unidades.join(', ') 
                    : 'Nenhuma'}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Permissões */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Status das Permissões ({permissions.length} ativas)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(PERMISSIONS).map(([key, permission]) => {
                const hasAccess = hasPermission(permission);
                
                return (
                  <div
                    key={permission}
                    className={`p-4 rounded-lg border-2 ${
                      hasAccess 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {PERMISSION_DESCRIPTIONS[permission]}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {permission}
                        </p>
                      </div>
                      <div className="ml-3">
                        {hasAccess ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumo */}
          <div className="mt-8 bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Resumo de Acesso
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {permissions.length}
                </p>
                <p className="text-sm text-gray-600">Permissões Ativas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {Object.keys(PERMISSIONS).length - permissions.length}
                </p>
                <p className="text-sm text-gray-600">Permissões Negadas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round((permissions.length / Object.keys(PERMISSIONS).length) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Nível de Acesso</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {userProfile.unidades?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Unidades</p>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              Informações de Debug (clique para expandir)
            </summary>
            <div className="mt-3 p-4 bg-gray-100 rounded-lg">
              <pre className="text-xs text-gray-700 overflow-auto">
                {JSON.stringify({
                  userProfile: {
                    ...userProfile,
                    // Não mostrar informações sensíveis
                    email: userProfile.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
                  },
                  permissions,
                  totalPermissions: Object.keys(PERMISSIONS).length
                }, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
} 