import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Lock, Users, Eye, Check, X } from 'lucide-react';
import { PERMISSION_GROUPS, PERMISSION_DESCRIPTIONS, DEFAULT_PROFILES } from '../utils/permissions';

export default function PermissionSelector({ 
  selectedPermissions = [], 
  onPermissionsChange, 
  selectedProfile = 'custom',
  isAdmin = false 
}) {
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const togglePermission = (permission) => {
    const newPermissions = selectedPermissions.includes(permission)
      ? selectedPermissions.filter(p => p !== permission)
      : [...selectedPermissions, permission];
    
    onPermissionsChange(newPermissions);
  };

  const toggleGroupPermissions = (groupPermissions) => {
    const allSelected = groupPermissions.every(p => selectedPermissions.includes(p));
    
    let newPermissions;
    if (allSelected) {
      // Remover todas as permissões do grupo
      newPermissions = selectedPermissions.filter(p => !groupPermissions.includes(p));
    } else {
      // Adicionar todas as permissões do grupo
      newPermissions = [...new Set([...selectedPermissions, ...groupPermissions])];
    }
    
    onPermissionsChange(newPermissions);
  };

  const loadProfilePermissions = (profile) => {
    const profilePermissions = DEFAULT_PROFILES[profile]?.permissions || [];
    onPermissionsChange(profilePermissions);
  };

  const getPermissionCount = (groupPermissions) => {
    const selected = groupPermissions.filter(p => selectedPermissions.includes(p)).length;
    return `${selected}/${groupPermissions.length}`;
  };

  const isGroupFullySelected = (groupPermissions) => {
    return groupPermissions.every(p => selectedPermissions.includes(p));
  };

  const isGroupPartiallySelected = (groupPermissions) => {
    return groupPermissions.some(p => selectedPermissions.includes(p)) && 
           !groupPermissions.every(p => selectedPermissions.includes(p));
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com perfis rápidos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Gerenciamento de Permissões
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {Object.entries(DEFAULT_PROFILES).map(([key, profile]) => (
            <button
              key={key}
              type="button"
              onClick={() => loadProfilePermissions(key)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedProfile === key
                  ? 'border-blue-500 bg-blue-100 text-blue-900'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="font-medium text-sm">{profile.name}</div>
              <div className="text-xs text-gray-600 mt-1">
                {profile.permissions.length} permissões
              </div>
            </button>
          ))}
        </div>

        <div className="text-sm text-gray-600">
          <strong>Permissões selecionadas:</strong> {selectedPermissions.length} de {Object.keys(PERMISSION_DESCRIPTIONS).length}
        </div>
      </div>

      {/* Lista de grupos de permissões */}
      <div className="space-y-3">
        {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
          // Filtrar grupos de admin se usuário não for admin
          if (!isAdmin && group.adminOnly) {
            return null;
          }

          const expanded = expandedGroups[groupKey];
          const fullySelected = isGroupFullySelected(group.permissions);
          const partiallySelected = isGroupPartiallySelected(group.permissions);

          return (
            <div key={groupKey} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Cabeçalho do grupo */}
              <div 
                className={`p-4 cursor-pointer transition-colors ${
                  fullySelected 
                    ? 'bg-green-50 border-b border-green-200' 
                    : partiallySelected 
                    ? 'bg-yellow-50 border-b border-yellow-200'
                    : 'bg-gray-50 hover:bg-gray-100 border-b border-gray-200'
                }`}
                onClick={() => toggleGroup(groupKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Checkbox do grupo */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroupPermissions(group.permissions);
                      }}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        fullySelected
                          ? 'bg-green-500 border-green-500 text-white'
                          : partiallySelected
                          ? 'bg-yellow-500 border-yellow-500 text-white'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {fullySelected && <Check className="w-3 h-3" />}
                      {partiallySelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        {group.adminOnly && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                            <Lock className="w-3 h-3" />
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{group.description}</p>
                    </div>

                    <div className="text-sm text-gray-500">
                      {getPermissionCount(group.permissions)}
                    </div>
                  </div>

                  <div className="ml-3">
                    {expanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Lista de permissões do grupo */}
              {expanded && (
                <div className="p-4 bg-white space-y-3">
                  {group.permissions.map(permission => {
                    const isSelected = selectedPermissions.includes(permission);
                    const description = PERMISSION_DESCRIPTIONS[permission];
                    const isAdminOnly = description?.includes('🔒 ADMIN');

                    return (
                      <div key={permission} className="flex items-center gap-3 py-2">
                        <button
                          type="button"
                          onClick={() => togglePermission(permission)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                              {description}
                            </span>
                            {isAdminOnly && !isSelected && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-600 text-xs rounded">
                                <Lock className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {permission}
                          </div>
                        </div>

                        {isSelected && (
                          <button
                            type="button"
                            onClick={() => togglePermission(permission)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remover permissão"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumo final */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Resumo das Permissões
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total selecionadas:</span>
            <span className="font-semibold ml-2">{selectedPermissions.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Disponíveis:</span>
            <span className="font-semibold ml-2">{Object.keys(PERMISSION_DESCRIPTIONS).length}</span>
          </div>
          <div>
            <span className="text-gray-600">Cobertura:</span>
            <span className="font-semibold ml-2">
              {Math.round((selectedPermissions.length / Object.keys(PERMISSION_DESCRIPTIONS).length) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 