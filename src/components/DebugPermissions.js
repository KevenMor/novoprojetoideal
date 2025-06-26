import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS, hasPermission } from '../utils/permissions';

export default function DebugPermissions() {
  const { user, permissions, hasPermission: checkPermission } = useAuth();

  if (!user) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
        <h3 className="font-bold text-yellow-800">🔍 Debug Permissões</h3>
        <p className="text-yellow-700">Usuário não autenticado</p>
      </div>
    );
  }

  // Testar permissões específicas
  const testPermissions = [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.MESSAGES_ACCESS,
    PERMISSIONS.BTG_ACCESS,
    PERMISSIONS.CHARGES_ACCESS,
    PERMISSIONS.EXTRACTS_ACCESS,
    PERMISSIONS.PAYROLL_ACCESS,
    PERMISSIONS.SETTINGS_ACCESS,
    PERMISSIONS.USERS_ACCESS
  ];

  // Testar menus
  const testMenus = [
    { key: 'dashboard', name: 'Dashboard' },
    { key: 'messages', name: 'Mensagens' },
    { key: 'btg_accounts', name: 'Contas BTG' },
    { key: 'charges', name: 'Cobranças' },
    { key: 'extracts', name: 'Extratos' },
    { key: 'payroll', name: 'Folha de Pagamento' },
    { key: 'settings', name: 'Configurações' },
    { key: 'users', name: 'Gerenciar Usuários' }
  ];

  return (
    <div className="p-4 bg-blue-100 border border-blue-400 rounded-lg mb-4">
      <h3 className="font-bold text-blue-800 mb-4">🔍 Debug Permissões - Usuário Atual</h3>
      
      {/* Informações do usuário */}
      <div className="mb-4">
        <h4 className="font-semibold text-blue-700">👤 Dados do Usuário:</h4>
        <div className="text-sm text-blue-600">
          <p><strong>Nome:</strong> {user.nome || 'N/A'}</p>
          <p><strong>Email:</strong> {user.email || 'N/A'}</p>
          <p><strong>Perfil:</strong> {user.perfil || 'N/A'}</p>
          <p><strong>Ativo:</strong> {user.ativo ? 'Sim' : 'Não'}</p>
        </div>
      </div>

      {/* Permissões */}
      <div className="mb-4">
        <h4 className="font-semibold text-blue-700">🔐 Permissões:</h4>
        <div className="text-sm">
          <p><strong>Tipo:</strong> {typeof permissions}</p>
          <p><strong>É Array:</strong> {Array.isArray(permissions) ? 'Sim' : 'Não'}</p>
          <p><strong>Quantidade:</strong> {permissions?.length || 0}</p>
          <div className="mt-2">
            <strong>Lista de Permissões:</strong>
            <ul className="list-disc list-inside text-xs">
              {permissions?.map((perm, index) => (
                <li key={index} className="text-blue-600">{perm}</li>
              )) || <li className="text-red-600">Nenhuma permissão encontrada</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Teste de permissões específicas */}
      <div className="mb-4">
        <h4 className="font-semibold text-blue-700">🧪 Teste de Permissões Específicas:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {testPermissions.map(permission => {
            const hasPerm = hasPermission(permissions, permission);
            return (
              <div key={permission} className={`p-2 rounded ${hasPerm ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <span className="font-medium">{hasPerm ? '✅' : '❌'}</span> {permission}
              </div>
            );
          })}
        </div>
      </div>

      {/* Teste de acesso a menus */}
      <div className="mb-4">
        <h4 className="font-semibold text-blue-700">🍽️ Teste de Acesso a Menus:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {testMenus.map(menu => {
            const canAccess = checkPermission(menu.key);
            return (
              <div key={menu.key} className={`p-2 rounded ${canAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <span className="font-medium">{canAccess ? '✅' : '❌'}</span> {menu.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Verificação específica da folha de pagamento */}
      <div className="mb-4">
        <h4 className="font-semibold text-blue-700">💼 Verificação Folha de Pagamento:</h4>
        <div className="text-sm">
          <p><strong>Tem payroll.access:</strong> {hasPermission(permissions, PERMISSIONS.PAYROLL_ACCESS) ? '✅ SIM' : '❌ NÃO'}</p>
          <p><strong>Pode acessar menu payroll:</strong> {checkPermission('payroll') ? '✅ SIM' : '❌ NÃO'}</p>
          <p><strong>Perfil é admin:</strong> {user.perfil === 'admin' ? '✅ SIM' : '❌ NÃO'}</p>
        </div>
      </div>

      {/* Debug do AuthContext */}
      <div className="mb-4">
        <h4 className="font-semibold text-blue-700">🔧 Debug AuthContext:</h4>
        <div className="text-sm">
          <p><strong>Função hasPermission disponível:</strong> {typeof checkPermission === 'function' ? '✅ SIM' : '❌ NÃO'}</p>
          <p><strong>Permissões do AuthContext:</strong> {permissions?.length || 0} permissões</p>
        </div>
      </div>

      {/* Botão para recarregar */}
      <div className="mt-4">
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔄 Recarregar Página
        </button>
      </div>
    </div>
  );
} 