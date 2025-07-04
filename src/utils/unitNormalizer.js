// Utilitário para normalização de nomes de unidades
// Resolve inconsistências entre diferentes formas de escrever o mesmo nome de unidade

/**
 * Mapeamento de variações de nomes de unidades para nomes padronizados
 */
const UNIT_MAPPING = {
  // Progresso / Vila Progresso
  'vila progresso': 'Progresso',
  'Vila Progresso': 'Progresso',
  'VILA PROGRESSO': 'Progresso',
  'progresso': 'Progresso',
  'PROGRESSO': 'Progresso',
  
  // Outras variações que podem existir
  'julio de mesquita': 'Julio de Mesquita',
  'JULIO DE MESQUITA': 'Julio de Mesquita',
  'aparecidinha': 'Aparecidinha',
  'APARECIDINHA': 'Aparecidinha',
  'coop': 'Coop',
  'COOP': 'Coop',
  'vila haro': 'Vila Haro',
  'VILA HARO': 'Vila Haro',
  'vila helena': 'Vila Helena',
  'VILA HELENA': 'Vila Helena'
};

/**
 * Normaliza o nome de uma unidade para o formato padrão
 * @param {string} unitName - Nome da unidade a ser normalizado
 * @returns {string} - Nome normalizado da unidade
 */
export function normalizeUnitName(unitName) {
  if (!unitName || typeof unitName !== 'string') {
    return unitName;
  }
  
  const normalized = unitName.trim();
  
  // Verificar se existe um mapeamento direto
  if (UNIT_MAPPING[normalized]) {
    return UNIT_MAPPING[normalized];
  }
  
  // Verificar se existe um mapeamento case-insensitive
  const lowerCase = normalized.toLowerCase();
  if (UNIT_MAPPING[lowerCase]) {
    return UNIT_MAPPING[lowerCase];
  }
  
  // Se não encontrar mapeamento, retornar o nome original
  return normalized;
}

/**
 * Verifica se duas unidades são equivalentes
 * @param {string} unit1 - Primeira unidade
 * @param {string} unit2 - Segunda unidade
 * @returns {boolean} - True se as unidades são equivalentes
 */
export function areUnitsEquivalent(unit1, unit2) {
  if (!unit1 || !unit2) {
    return false;
  }
  
  const normalized1 = normalizeUnitName(unit1);
  const normalized2 = normalizeUnitName(unit2);
  
  return normalized1 === normalized2;
}

/**
 * Filtra dados baseado em unidade com normalização
 * @param {Array} data - Array de dados para filtrar
 * @param {string} filterUnit - Unidade para filtrar
 * @param {string} unitField - Nome do campo que contém a unidade (padrão: 'unidade')
 * @returns {Array} - Dados filtrados
 */
export function filterDataByUnit(data, filterUnit, unitField = 'unidade') {
  if (!data || !Array.isArray(data) || !filterUnit) {
    return data;
  }
  
  const normalizedFilterUnit = normalizeUnitName(filterUnit);
  
  return data.filter(item => {
    const itemUnit = item[unitField];
    const normalizedItemUnit = normalizeUnitName(itemUnit);
    return normalizedItemUnit === normalizedFilterUnit;
  });
}

/**
 * Obtém todas as variações possíveis de um nome de unidade
 * @param {string} unitName - Nome da unidade
 * @returns {Array} - Array com todas as variações possíveis
 */
export function getUnitVariations(unitName) {
  if (!unitName) {
    return [];
  }
  
  const normalized = normalizeUnitName(unitName);
  const variations = [normalized];
  
  // Adicionar variações conhecidas
  Object.entries(UNIT_MAPPING).forEach(([variation, standard]) => {
    if (standard === normalized) {
      variations.push(variation);
    }
  });
  
  return [...new Set(variations)]; // Remove duplicatas
}

/**
 * Lista todas as unidades padrão do sistema
 * @returns {Array} - Array com todas as unidades padrão
 */
export function getStandardUnits() {
  return [
    'Julio de Mesquita',
    'Aparecidinha',
    'Coop',
    'Progresso',
    'Vila Haro',
    'Vila Helena'
  ];
}

export default {
  normalizeUnitName,
  areUnitsEquivalent,
  filterDataByUnit,
  getUnitVariations,
  getStandardUnits
}; 