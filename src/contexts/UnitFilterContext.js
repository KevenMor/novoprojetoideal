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
      } else {
        // Se tem múltiplas unidades, começar com "todas"
        setSelectedUnit('all');
      }
    } else {
      setAvailableUnits([]);
      setSelectedUnit('all');
    }
  }, [userProfile]);

  // Função para alterar a unidade selecionada
  const changeSelectedUnit = (unit) => {
    setSelectedUnit(unit);
    console.log('🏢 Unidade selecionada alterada para:', unit);
  };

  // Função para verificar se deve mostrar dados de uma unidade específica
  const shouldShowUnitData = (dataUnit) => {
    if (selectedUnit === 'all') {
      // Se "todas" está selecionado, mostrar apenas se o usuário tem acesso à unidade
      return availableUnits.includes(dataUnit);
    } else {
      // Se uma unidade específica está selecionada, mostrar apenas dados dessa unidade
      return dataUnit === selectedUnit;
    }
  };

  // Função para filtrar dados baseado na unidade selecionada
  const filterDataByUnit = (data, unitField = 'unidade') => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.filter(item => {
      const itemUnit = item[unitField];
      return shouldShowUnitData(itemUnit);
    });
  };

  // Função para obter o texto de exibição da seleção atual
  const getSelectedUnitDisplay = () => {
    if (selectedUnit === 'all') {
      return 'Geral';
    } else {
      return selectedUnit;
    }
  };

  // Função para verificar se o usuário tem acesso a múltiplas unidades
  const hasMultipleUnits = () => {
    return availableUnits.length > 1;
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