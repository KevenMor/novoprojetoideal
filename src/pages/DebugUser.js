import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnitSelection } from '../hooks/useUnitSelection';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getPermissionsByProfile } from '../utils/permissions';
import toast from 'react-hot-toast';

export default function DebugUser() {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const { 
    selectedUnit, 
    availableUnits, 
    getUnitDisplayName, 
    shouldShowUnitSelector 
  } = useUnitSelection();

  const fixCurrentUser = async () => {
    if (!currentUser) {
      toast.error('Nenhum usuário logado');
      return;
    }

    try {
      console.log('🔧 Corrigindo usuário atual:', currentUser.uid);
      
      const userRef = doc(db, 'usuarios', currentUser.uid);
      
      const updatedData = {
        nome: userProfile?.nome || 'Usuário Teste',
        email: currentUser.email,
        perfil: 'operator',
        unidades: ['Aparecidinha'],
        permissions: getPermissionsByProfile('operator'),
        ativo: true,
        updatedAt: new Date()
      };
      
      await updateDoc(userRef, updatedData);
      
      toast.success('Usuário corrigido! Recarregue a página.');
      console.log('✅ Usuário corrigido:', updatedData);
      
    } catch (error) {
      console.error('❌ Erro ao corrigir usuário:', error);
      toast.error('Erro ao corrigir usuário: ' + error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Debug do Usuário</h1>
        
        <div className="mb-4">
          <button
            onClick={fixCurrentUser}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔧 Corrigir Usuário Atual
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold text-blue-900">Current User (Firebase Auth)</h3>
            <pre className="text-sm mt-2 text-blue-800">
              {JSON.stringify({
                uid: currentUser?.uid,
                email: currentUser?.email,
                displayName: currentUser?.displayName
              }, null, 2)}
            </pre>
          </div>

          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-semibold text-green-900">User Profile (Firestore)</h3>
            <pre className="text-sm mt-2 text-green-800">
              {JSON.stringify(userProfile, null, 2)}
            </pre>
          </div>

          <div className="bg-purple-50 p-4 rounded">
            <h3 className="font-semibold text-purple-900">Unit Selection Hook</h3>
            <pre className="text-sm mt-2 text-purple-800">
              {JSON.stringify({
                selectedUnit,
                availableUnits,
                displayName: getUnitDisplayName(),
                shouldShowSelector: shouldShowUnitSelector(),
                isAdmin
              }, null, 2)}
            </pre>
          </div>

          <div className="bg-yellow-50 p-4 rounded">
            <h3 className="font-semibold text-yellow-900">Diagnóstico</h3>
            <div className="text-sm mt-2 text-yellow-800 space-y-1">
              <div>✅ Usuário autenticado: {currentUser ? 'Sim' : 'Não'}</div>
              <div>✅ Perfil carregado: {userProfile ? 'Sim' : 'Não'}</div>
              <div>✅ É admin: {isAdmin ? 'Sim' : 'Não'}</div>
              <div>✅ Unidades disponíveis: {availableUnits.length}</div>
              <div>✅ Unidade selecionada: {selectedUnit || 'Nenhuma'}</div>
              <div>✅ Deve mostrar seletor: {shouldShowUnitSelector() ? 'Sim' : 'Não'}</div>
            </div>
          </div>

          {userProfile && userProfile.unidades && userProfile.unidades.length === 0 && (
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <h3 className="font-semibold text-red-900">⚠️ Problema Detectado</h3>
              <p className="text-sm mt-2 text-red-800">
                O usuário não tem unidades atribuídas. Clique no botão "Corrigir Usuário Atual" para resolver.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 