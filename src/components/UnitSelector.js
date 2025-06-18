import React, { useState } from 'react';
import { ChevronDown, Building2, Eye } from 'lucide-react';
import { useUnitFilter } from '../contexts/UnitFilterContext';

export default function UnitSelector() {
  const { 
    selectedUnit, 
    availableUnits, 
    changeSelectedUnit, 
    hasMultipleUnits
  } = useUnitFilter();
  
  const [isOpen, setIsOpen] = useState(false);

  // Se o usuário tem apenas uma unidade, não mostrar o seletor
  if (availableUnits.length === 1) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        {/* <Building2 className="h-4 w-4" /> */}
        <span>{availableUnits[0] || 'Nenhuma unidade'}</span>
      </div>
    );
  }

  const handleUnitChange = (unit) => {
    changeSelectedUnit(unit);
    setIsOpen(false);
  };

  // Troca 'all' por 'Geral' para exibição
  const displayUnit = (unit) => unit === 'all' ? 'Geral' : unit;

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 transition"
      >
        <span className="text-gray-900 font-medium">{selectedUnit === 'all' ? 'Geral' : (selectedUnit || 'Selecione a unidade')}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          {availableUnits.map(unit => (
            <button
              key={unit}
              onClick={() => handleUnitChange(unit)}
              className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition ${
                selectedUnit === unit ? 'bg-blue-100 font-semibold' : ''
              }`}
            >
              <span className={`text-gray-900 font-medium ${unit === 'all' ? '' : ''}`}>{unit === 'all' ? 'Geral' : unit}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 