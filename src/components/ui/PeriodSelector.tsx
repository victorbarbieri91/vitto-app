import { useState } from 'react';

type Period = 'week' | 'month' | 'year' | 'custom';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface PeriodSelectorProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period, dateRange?: DateRange) => void;
  className?: string;
}

/**
 *
 */
export default function PeriodSelector({ selectedPeriod, onPeriodChange, className = '' }: PeriodSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const handlePeriodClick = (period: Period) => {
    if (period === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onPeriodChange(period);
    }
  };

  const handleCustomRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomRange(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomRangeSubmit = () => {
    onPeriodChange('custom', customRange);
    setShowCustom(false);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <button
          type="button"
          onClick={() => handlePeriodClick('week')}
          className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
            selectedPeriod === 'week'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } border border-gray-200`}
        >
          Semana
        </button>
        <button
          type="button"
          onClick={() => handlePeriodClick('month')}
          className={`px-4 py-2 text-sm font-medium ${
            selectedPeriod === 'month'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } border-t border-b border-gray-200`}
        >
          Mês
        </button>
        <button
          type="button"
          onClick={() => handlePeriodClick('year')}
          className={`px-4 py-2 text-sm font-medium ${
            selectedPeriod === 'year'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } border-t border-b border-gray-200`}
        >
          Ano
        </button>
        <button
          type="button"
          onClick={() => handlePeriodClick('custom')}
          className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
            selectedPeriod === 'custom'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } border border-gray-200`}
        >
          Personalizado
        </button>
      </div>
      
      {showCustom && (
        <div className="mt-3 p-3 bg-white rounded-md shadow-sm border border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-1">
                Data inicial
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={customRange.startDate}
                onChange={handleCustomRangeChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-xs font-medium text-gray-700 mb-1">
                Data final
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={customRange.endDate}
                onChange={handleCustomRangeChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setShowCustom(false)}
              className="mr-2 px-3 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCustomRangeSubmit}
              className="px-3 py-1 text-xs font-medium text-white bg-primary hover:bg-primary-dark rounded-md"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
