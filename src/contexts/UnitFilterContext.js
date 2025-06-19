import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UnitFilterContext = createContext();

export function useUnitFilter() {
  return useContext(UnitFilterContext);
}

export function UnitFilterProvider({ children }) {
  const { userProfile } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState('all'); // 'all' ou nome da unidade específica
  const [availableUnits, setAvailableUnits] = useState([]);

  // Atualizar unidades disponíveis quando o perfil do usuário mudar
  useEffect(() => {
    if (userProfile?.unidades && Array.isArray(userProfile.unidades)) {
      setAvailableUnits(userProfile.unidades);
      
      // Se o usuário tem apenas uma unidade, selecionar automaticamente
      if (userProfile.unidades.length === 1) {
        setSelectedUnit(userProfile.unidades[0]);
      } else if (userProfile.perfil === 'admin') {
        // Se é admin, começar com "all" (Geral)
        setSelectedUnit('all');
      } else {
        // Se tem múltiplas unidades, começar com "all"
        setSelectedUnit('all');
      }
    } else {
      setAvailableUnits([]);
      setSelectedUnit('all');
    }
  }, [userProfile]);

  // Função para verificar se deve mostrar dados da unidade
  const shouldShowUnitData = (unidade) => {
    // Se o usuário é admin e selecionou 'all', mostrar todas as unidades
    if (userProfile?.perfil === 'admin' && selectedUnit === 'all') {
      return true;
    }
    
    // Se uma unidade específica está selecionada, mostrar apenas ela
    if (selectedUnit && selectedUnit !== 'all') {
      return unidade === selectedUnit;
    }
    
    // Se o usuário tem acesso à unidade
    return userProfile?.unidades?.includes(unidade);
  };

  // Função para alterar a unidade selecionada
  const changeSelectedUnit = (newUnit) => {
    console.log('🔄 Alterando unidade selecionada para:', newUnit);
    setSelectedUnit(newUnit);
  };

  // Função para filtrar dados baseado na unidade selecionada
  const filterDataByUnit = (data, unitField = 'unidade') => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.filter(item => {
      const itemUnit = item[unitField];
      return shouldShowUnitData(itemUnit);
    });
  };

  // Função para obter o nome de exibição da unidade
  const getSelectedUnitDisplay = () => {
    if (selectedUnit === 'all') {
      return 'Geral';
    }
    return selectedUnit || 'Selecione uma unidade';
  };

  // Função para verificar se o usuário tem múltiplas unidades
  const hasMultipleUnits = () => {
    return userProfile?.unidades?.length > 1 || userProfile?.perfil === 'admin';
  };

  const value = {
    selectedUnit,
    availableUnits,
    changeSelectedUnit,
    shouldShowUnitData,
    filterDataByUnit,
    getSelectedUnitDisplay,
    hasMultipleUnits,
    isViewingAll: selectedUnit === 'all'
  };

  return (
    <UnitFilterContext.Provider value={value}>
      {children}
    </UnitFilterContext.Provider>
  );
} 