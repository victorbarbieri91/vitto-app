import { useState } from 'react';
import Button from './Button';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface CustomDateRangePickerProps {
  onApply: (dateRange: DateRange) => void;
  onCancel: () => void;
  initialDateRange?: DateRange;
}

/**
 *
 */
export default function CustomDateRangePicker({ 
  onApply, 
  onCancel, 
  initialDateRange 
}: CustomDateRangePickerProps) {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    if (initialDateRange) return initialDateRange;
    
    // Padrão: último mês
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    return { startDate, endDate };
  });
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = new Date(e.target.value);
    setDateRange(prev => ({
      ...prev,
      startDate: newStartDate
    }));
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = new Date(e.target.value);
    setDateRange(prev => ({
      ...prev,
      endDate: newEndDate
    }));
  };
  
  const handleApply = () => {
    onApply(dateRange);
  };
  
  // Formatadores de data para o input
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Presets rápidos de período
  const applyPreset = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    setDateRange({ startDate, endDate });
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h3 className="font-medium text-lg mb-4">Selecionar Período</h3>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              id="start-date"
              value={formatDateForInput(dateRange.startDate)}
              onChange={handleStartDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex-1">
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              id="end-date"
              value={formatDateForInput(dateRange.endDate)}
              onChange={handleEndDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min={formatDateForInput(dateRange.startDate)}
              max={formatDateForInput(new Date())}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            onClick={() => applyPreset(7)} 
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
          >
            7 dias
          </button>
          <button 
            onClick={() => applyPreset(30)} 
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
          >
            30 dias
          </button>
          <button 
            onClick={() => applyPreset(90)} 
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
          >
            3 meses
          </button>
          <button 
            onClick={() => applyPreset(180)} 
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
          >
            6 meses
          </button>
          <button 
            onClick={() => applyPreset(365)} 
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
          >
            1 ano
          </button>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleApply}>
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
