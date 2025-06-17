import React, { useState } from 'react';
import { ChevronDown, Building2, Eye } from 'lucide-react';
import { useUnitFilter } from '../contexts/UnitFilterContext';

export default function UnitSelector() {
  const { 
    selectedUnit, 
    availableUnits, 
    changeSelectedUnit, 
    hasMultipleUnits,
    isViewingAll 
  } = useUnitFilter();
  
  const [isOpen, setIsOpen] = useState(false);

  // Se o usuário tem apenas uma unidade, não mostrar o seletor
  if (!hasMultipleUnits()) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Building2 className="h-4 w-4" />
        <span>{availableUnits[0] || 'Nenhuma unidade'}</span>
      </div>
    );
  }

  const handleUnitChange = (unit) => {
    changeSelectedUnit(unit);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Botão do seletor */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-3">
          {isViewingAll ? (
            <Eye className="h-5 w-5 text-blue-600" />
          ) : (
            <Building2 className="h-5 w-5 text-gray-600" />
          )}
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900">
              {isViewingAll ? 'Todas as Unidades' : selectedUnit}
            </div>
          </div>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden w-full">
          {/* Opção "Todas as Unidades" */}
          <button
            onClick={() => handleUnitChange('all')}
            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 ${
              selectedUnit === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Eye className={`h-4 w-4 ${selectedUnit === 'all' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <div className="text-sm font-medium">Todas as Unidades</div>
                <div className="text-xs text-gray-500">
                  Visualizar dados consolidados de {availableUnits.length} unidades
                </div>
              </div>
            </div>
          </button>

          {/* Unidades específicas */}
          {availableUnits.map((unit) => (
            <button
              key={unit}
              onClick={() => handleUnitChange(unit)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 ${
                selectedUnit === unit ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Building2 className={`h-4 w-4 ${selectedUnit === unit ? 'text-blue-600' : 'text-gray-400'}`} />
                <div>
                  <div className="text-sm font-medium">🏢 {unit}</div>
                  <div className="text-xs text-gray-500">
                    Visualizar apenas dados desta unidade
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Backdrop para fechar o dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 