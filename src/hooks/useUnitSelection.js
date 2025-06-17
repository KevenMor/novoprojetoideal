import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useUnitSelection = () => {
  const { userProfile, isAdmin } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState('');
  const [availableUnits, setAvailableUnits] = useState([]);

  // Lista completa de unidades do sistema usando useMemo
  const allUnits = useMemo(() => [
    'Julio de Mesquita', 
    'Aparecidinha', 
    'Coop', 
    'Progresso', 
    'Vila Haro', 
    'Vila Helena'
  ], []);

  useEffect(() => {
    if (!userProfile) return;

    console.log('🔍 useUnitSelection - userProfile:', userProfile);
    console.log('🔍 useUnitSelection - isAdmin:', isAdmin);
    console.log('🔍 useUnitSelection - userProfile.unidades:', userProfile.unidades);

    if (isAdmin) {
      // Admin tem acesso a todas as unidades
      setAvailableUnits(allUnits);
      console.log('👑 Admin - Todas as unidades disponíveis:', allUnits);
    } else {
      // Usuário comum: apenas suas unidades
      const userUnits = userProfile.unidades || [];
      console.log('👤 Usuário comum - Unidades do usuário:', userUnits);
      
      setAvailableUnits(userUnits);
      
      if (userUnits.length === 1) {
        // Se tem apenas uma unidade, seleciona automaticamente
        setSelectedUnit(userUnits[0]);
        console.log('🎯 Selecionando automaticamente unidade única:', userUnits[0]);
      } else if (userUnits.length > 1) {
        // Se tem múltiplas unidades, deixa o usuário escolher
        // Só reseta se a unidade atual não está nas unidades permitidas
        setSelectedUnit(prev => {
          if (!prev || !userUnits.includes(prev)) {
            console.log('🔄 Múltiplas unidades - aguardando seleção do usuário');
            return '';
          }
          return prev;
        });
      } else {
        // Sem unidades atribuídas
        setSelectedUnit('');
        setAvailableUnits([]);
        console.log('❌ Usuário sem unidades atribuídas');
      }
    }
  }, [userProfile, isAdmin, allUnits]);

  const handleUnitChange = (unit) => {
    console.log('🔄 Mudando unidade para:', unit);
    setSelectedUnit(unit);
  };

  const getUnitDisplayName = () => {
    if (!userProfile) return 'Carregando informações...';
    
    if (isAdmin) {
      return selectedUnit || '🏢 Todas as unidades';
    } else {
      const userUnits = userProfile.unidades || [];
      if (userUnits.length === 0) {
        return '⚠️ Nenhuma unidade atribuída';
      } else if (userUnits.length === 1) {
        return userUnits[0];
      } else {
        return selectedUnit || '📋 Selecione uma unidade';
      }
    }
  };

  const shouldShowUnitSelector = () => {
    if (!userProfile) return false;
    
    if (isAdmin) {
      return true; // Admin sempre pode escolher
    } else {
      const userUnits = userProfile.unidades || [];
      return userUnits.length > 1; // Só mostra se tem mais de uma unidade
    }
  };

  const getFilteredUnits = () => {
    if (isAdmin) {
      return selectedUnit ? [selectedUnit] : availableUnits;
    } else {
      return selectedUnit ? [selectedUnit] : availableUnits;
    }
  };

  const hasMultipleUnits = () => {
    return availableUnits.length > 1;
  };

  const canAccessUnit = (unit) => {
    if (isAdmin) return true;
    return availableUnits.includes(unit);
  };

  return {
    selectedUnit,
    availableUnits,
    handleUnitChange,
    getUnitDisplayName,
    shouldShowUnitSelector,
    getFilteredUnits,
    hasMultipleUnits,
    canAccessUnit,
    isAdmin,
    userProfile
  };
}; 