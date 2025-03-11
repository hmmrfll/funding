// Форматирование процентов
export const formatPercent = (value) => {
    return (value * 100).toFixed(4) + '%';
  };
  
  // Форматирование аннуализированной доходности
  export const formatAnnualReturn = (value) => {
    return (value * 100).toFixed(2) + '%';
  };
  
  // Определение цвета в зависимости от значения
  export const getColorByValue = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };