import { useState, useMemo, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ModernCard } from '../ui/modern';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import { useCalendarTransactions } from '../../hooks/useCalendarTransactions';
import { useMonthlyDashboard } from '../../contexts/MonthlyDashboardContext';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import 'react-day-picker/dist/style.css';
import '../../styles/calendar.css';

const MiniCalendario = () => {
  const { classes, size } = useResponsiveClasses();
  const [selected, setSelected] = useState<Date>();
  const [selectedDayData, setSelectedDayData] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentMonth, currentYear } = useMonthlyDashboard();

  // Buscar transações do mês
  const {
    transactionsByDay,
    datesWithTransactions,
    getDayTransactions,
    hasTransactions,
    loading
  } = useCalendarTransactions(currentMonth, currentYear);

  // Modifiers para dias com transações
  const modifiers = useMemo(() => {
    console.log('[Calendar] Criando modifiers para:', datesWithTransactions.length, 'datas');
    console.log('[Calendar] Datas com transações:', datesWithTransactions.map(d => format(d, 'yyyy-MM-dd')));

    const hasTransactionsDates = datesWithTransactions;
    const hasReceitasDates = datesWithTransactions.filter(date => {
      const dayData = transactionsByDay[format(date, 'yyyy-MM-dd')];
      const hasReceitas = dayData && dayData.receitas > 0;
      if (hasReceitas) {
        console.log('[Calendar] Dia com receitas:', format(date, 'yyyy-MM-dd'), dayData.receitas);
      }
      return hasReceitas;
    });
    const hasDespesasDates = datesWithTransactions.filter(date => {
      const dayData = transactionsByDay[format(date, 'yyyy-MM-dd')];
      const hasDespesas = dayData && dayData.despesas > 0;
      if (hasDespesas) {
        console.log('[Calendar] Dia com despesas:', format(date, 'yyyy-MM-dd'), dayData.despesas);
      }
      return hasDespesas;
    });

    console.log('[Calendar] Modifier arrays:', {
      hasTransactions: hasTransactionsDates.length,
      hasReceitas: hasReceitasDates.length,
      hasDespesas: hasDespesasDates.length
    });

    return {
      hasTransactions: hasTransactionsDates,
      hasReceitas: hasReceitasDates,
      hasDespesas: hasDespesasDates
    };
  }, [datesWithTransactions, transactionsByDay]);

  // Estilos para os modifiers - usar nomes corretos do react-day-picker
  const modifiersClassNames = {
    hasTransactions: 'rdp-day_hasTransactions',
    hasReceitas: 'rdp-day_hasReceitas',
    hasDespesas: 'rdp-day_hasDespesas'
  };

  // Adicionar tooltips via JavaScript após render
  useEffect(() => {
    const addTooltips = () => {
      const dayButtons = document.querySelectorAll('.rdp-day_hasTransactions .rdp-day_button');

      dayButtons.forEach((button) => {
        const dateStr = button.getAttribute('aria-label');
        if (!dateStr) return;

        // Extrair data do aria-label
        const matches = dateStr.match(/(\d{1,2}) de (\w+) de (\d{4})/);
        if (!matches) return;

        const day = parseInt(matches[1]);
        const monthName = matches[2];
        const year = parseInt(matches[3]);

        // Converter nome do mês para número
        const monthMap: { [key: string]: number } = {
          'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
          'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
          'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
        };

        const monthNum = monthMap[monthName.toLowerCase()];
        if (monthNum === undefined) return;

        const date = new Date(year, monthNum, day);
        const dayData = getDayTransactions(date);

        if (dayData && dayData.count > 0) {
          // Criar tooltip content mais detalhado
          const receitasLine = dayData.receitas > 0 ? `Receitas: ${formatCurrency(dayData.receitas)}` : '';
          const despesasLine = dayData.despesas > 0 ? `Despesas: ${formatCurrency(dayData.despesas)}` : '';
          const saldoLine = `Saldo: ${formatCurrency(dayData.saldo)}`;
          const transacoesLine = `${dayData.count} transaç${dayData.count > 1 ? 'ões' : 'ão'}`;

          const tooltipLines = [
            format(date, "dd 'de' MMMM", { locale: ptBR }),
            receitasLine,
            despesasLine,
            saldoLine,
            transacoesLine
          ].filter(line => line.length > 0);

          button.setAttribute('title', tooltipLines.join('\n'));
        }
      });
    };

    // Aguardar o DayPicker renderizar
    const timer = setTimeout(addTooltips, 100);
    return () => clearTimeout(timer);
  }, [transactionsByDay, getDayTransactions]);

  return (
    <ModernCard className={cn(
      classes.padding,
      'flex flex-col overflow-hidden h-full'
    )}>

      <div className="flex-1 flex items-center justify-center">
        <div className="calendario-mini w-full">
          <DayPicker
            onDayClick={(date) => {
              // Apenas dias com transações são clicáveis
              if (date && hasTransactions(date)) {
                const dayData = getDayTransactions(date);
                if (dayData && dayData.count > 0) {
                  setSelectedDayData(date);
                  setIsModalOpen(true);
                }
              }
            }}
            locale={ptBR}
            month={new Date(currentYear, currentMonth - 1)}
            showOutsideDays={false}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            captionLayout="dropdown-buttons"
            onDayMouseEnter={(date) => {
              const dayData = getDayTransactions(date);
              if (dayData && dayData.count > 0) {
                console.log('Hover em dia com transações:', dayData);
              }
            }}
            disabled={loading}
            className={cn(classes.textSm, 'mx-auto')}
            styles={{
              root: {
                fontSize: classes.textSm === 'text-xs' ? '0.65rem' : '0.75rem',
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
              },
              months: {
                display: 'flex',
                justifyContent: 'center'
              },
              month: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%'
              },
              table: {
                margin: '0 auto',
                width: '100%',
                tableLayout: 'fixed'
              },
              day: {
                fontSize: classes.textSm === 'text-xs' ? '0.65rem' : '0.75rem',
                padding: size === 'compact' ? '0.2rem' : '0.3rem',
                minWidth: size === 'compact' ? '1.5rem' : '1.8rem',
                minHeight: size === 'compact' ? '1.5rem' : '1.8rem',
              },
              day_button: {
                fontSize: classes.textSm === 'text-xs' ? '0.65rem' : '0.75rem',
                padding: size === 'compact' ? '0.2rem' : '0.3rem',
                minWidth: size === 'compact' ? '1.5rem' : '1.8rem',
                minHeight: size === 'compact' ? '1.5rem' : '1.8rem',
              },
              caption: {
                fontSize: size === 'compact' ? '0.65rem' : classes.textSm === 'text-xs' ? '0.75rem' : '0.875rem',
                textAlign: 'center',
                marginBottom: '0.5rem'
              },
              weekdays: {
                fontSize: classes.textSm === 'text-xs' ? '0.65rem' : '0.75rem'
              },
            }}
          />
        </div>
      </div>

      {/* Modal lateral para detalhes do dia */}
      {isModalOpen && selectedDayData && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal lateral direito */}
          <div className="ml-auto w-96 h-full bg-white shadow-xl flex flex-col relative z-10">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-deep-blue">
                {format(selectedDayData, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="sr-only">Fechar</span>
                ✕
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const dayData = getDayTransactions(selectedDayData);
                if (!dayData) return null;

                return (
                  <>
                    {/* Resumo financeiro */}
                    <div className="mb-6">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {dayData.receitas > 0 && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp size={16} className="text-green-600" />
                              <span className="text-sm font-medium text-green-800">Receitas</span>
                            </div>
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(dayData.receitas)}
                            </p>
                          </div>
                        )}

                        {dayData.despesas > 0 && (
                          <div className="bg-coral/10 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingDown size={16} className="text-coral" />
                              <span className="text-sm font-medium text-coral">Despesas</span>
                            </div>
                            <p className="text-lg font-bold text-coral">
                              {formatCurrency(dayData.despesas)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Saldo do dia */}
                      <div className={cn(
                        "rounded-lg p-3 border-2",
                        dayData.saldo >= 0
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <Activity size={16} className={dayData.saldo >= 0 ? "text-green-600" : "text-red-600"} />
                          <span className="text-sm font-medium text-gray-700">Saldo do dia</span>
                        </div>
                        <p className={cn(
                          "text-xl font-bold",
                          dayData.saldo >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(dayData.saldo)}
                        </p>
                      </div>
                    </div>

                    {/* Lista de transações */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-3">
                        Lançamentos ({dayData.count})
                      </h4>

                      <div className="space-y-3">
                        {dayData.transactions.map((trans, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {trans.descricao || trans.categoria_nome}
                                </p>
                                {trans.categoria_nome && trans.descricao && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {trans.categoria_nome}
                                  </p>
                                )}
                              </div>

                              <div className="ml-3 text-right">
                                <p className={cn(
                                  "font-bold",
                                  trans.tipo === 'receita' ? "text-green-600" : "text-coral"
                                )}>
                                  {trans.tipo === 'receita' ? '+' : '-'}
                                  {formatCurrency(Math.abs(Number(trans.valor)))}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                  {trans.tipo.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </ModernCard>
  );
};

export default MiniCalendario;