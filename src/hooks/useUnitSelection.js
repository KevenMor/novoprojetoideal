import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useUnitSelection = () => {
  const { user, isAdmin } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState('');
  const [availableUnits, setAvailableUnits] = useState([]);
  const [allUnits] = useState([
    'Julio de Mesquita',
    'Aparecidinha',
    'Vila Helena',
    'Vila Haro',
    'Vila Progresso',
    'Coop'
  ]);

  useEffect(() => {
    console.log('🔄 useUnitSelection - Efeito executado');
    
    if (!user) return;

    console.log('🔍 useUnitSelection - user:', user);
    console.log('🔍 useUnitSelection - isAdmin:', isAdmin);
    console.log('🔍 useUnitSelection - user.unidades:', user.unidades);

    // Se é admin, pode ver todas as unidades
    if (isAdmin) {
      console.log('👑 Usuário é admin - disponibilizando todas as unidades');
      setAvailableUnits(['Geral', ...allUnits]);
      if (!selectedUnit) {
        setSelectedUnit('Geral');
      }
    } else {
      // Usuário comum - apenas suas unidades
      const userUnits = user.unidades || [];
      console.log('👤 Usuário comum - unidades:', userUnits);
      
      setAvailableUnits(userUnits);
      
      // Se o usuário tem apenas uma unidade, selecionar automaticamente
      if (userUnits.length === 1) {
        setSelectedUnit(userUnits[0]);
        console.log('🎯 Selecionando automaticamente unidade única:', userUnits[0]);
      } else if (userUnits.length > 1 && !selectedUnit) {
        // Se tem múltiplas, deixar para o usuário escolher
        setSelectedUnit('');
        console.log('🤔 Múltiplas unidades - aguardando seleção do usuário');
      }
    }
  }, [user, isAdmin, allUnits]);

  // Função para verificar se o usuário pode ver dados de uma unidade específica
  const canViewUnit = (unidade) => {
    if (!user) return false;
    
    console.log('🔍 Verificando acesso à unidade:', unidade);
    
    // Admin pode ver tudo
    if (isAdmin) {
      console.log('👑 Admin pode ver todas as unidades');
      return true;
    }
    
    // Usuário comum só pode ver suas unidades
    const userUnits = user.unidades || [];
    const canView = userUnits.includes(unidade);
    console.log('👤 Usuário pode ver unidade?', canView);
    return canView;
  };

  // Função para filtrar dados baseado na unidade selecionada
  const filterDataByUnit = (data, unitField = 'unidade') => {
    if (!data || !Array.isArray(data)) return [];
    
    console.log('🔍 Filtrando dados por unidade:', selectedUnit);
    console.log('📊 Total de itens antes do filtro:', data.length);
    
    if (selectedUnit === 'Geral') {
      console.log('📊 Seleção "Geral" - retornando todos os dados');
      return data;
    }
    
    const filtered = data.filter(item => {
      const itemUnit = item[unitField];
      return itemUnit === selectedUnit;
    });
    
    console.log('📊 Itens após filtro:', filtered.length);
    return filtered;
  };

  const changeSelectedUnit = (newUnit) => {
    console.log('🔄 Alterando unidade selecionada para:', newUnit);
    setSelectedUnit(newUnit);
  };

  return {
    selectedUnit,
    availableUnits,
    canViewUnit,
    filterDataByUnit,
    changeSelectedUnit,
    allUnits,
    user
  };
}; 