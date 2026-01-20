import { useState, useMemo, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ModernCard, ModernBadge } from '../ui/modern';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import { useCalendarTransactions } from '../../hooks/useCalendarTransactions';
import { useMonthlyDashboard } from '../../contexts/MonthlyDashboardContext';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';
import { TrendingUp, TrendingDown, Activity, X, Calendar, Filter, Receipt, ShoppingCart, CreditCard, DollarSign } from 'lucide-react';
import 'react-day-picker/dist/style.css';
import '../../styles/calendar.css';

const MiniCalendario = () => {
  const { classes, size } = useResponsiveClasses();
  const [selected, setSelected] = useState<Date>();
  const [selectedDayData, setSelectedDayData] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'receitas' | 'despesas'>('all');
  const { currentMonth, currentYear, fetchMonthData } = useMonthlyDashboard();

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

  // Estilo padrao consistente com outros cards
  const cardStyle = 'bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col';
  const headerStyle = 'px-4 py-3 border-b border-slate-100 flex items-center gap-2';

  return (
    <div className={cn(
      cardStyle,
      size === 'mobile' ? 'min-h-[240px]' : ''
    )}>
      {/* Header padrao */}
      <div className={headerStyle}>
        <Calendar className="w-4 h-4 text-slate-400" />
        <h3 className="font-medium text-slate-700 text-sm">Calendario</h3>
      </div>

      <div className={cn(
        size === 'mobile' ? 'p-1' : 'p-2',
        'flex-1 flex items-center justify-center'
      )}>
        <div className="calendario-mini w-full h-full flex items-center justify-center">
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
            onMonthChange={(month) => {
              // Integrar com o contexto do dashboard para mudança de mês
              const newMonth = month.getMonth() + 1;
              const newYear = month.getFullYear();
              console.log(`📅 MiniCalendario mudando para: ${newMonth}/${newYear}`);
              fetchMonthData(newMonth, newYear);
            }}
            showOutsideDays={false}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            captionLayout="buttons"
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
                fontSize: size === 'mobile' ? '0.75rem' : classes.textSm === 'text-xs' ? '0.65rem' : '0.75rem',
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
                width: size === 'mobile' ? '100%' : '100%',
                tableLayout: 'fixed'
              },
              day: {
                fontSize: size === 'mobile' ? '0.625rem' : classes.textSm === 'text-xs' ? '0.65rem' : '0.75rem',
                padding: size === 'mobile' ? '0.125rem' : size === 'compact' ? '0.2rem' : '0.3rem',
                minWidth: size === 'mobile' ? '1.5rem' : size === 'compact' ? '1.5rem' : '1.8rem',
                minHeight: size === 'mobile' ? '1.5rem' : size === 'compact' ? '1.5rem' : '1.8rem',
              },
              day_button: {
                fontSize: size === 'mobile' ? '0.625rem' : classes.textSm === 'text-xs' ? '0.65rem' : '0.75rem',
                padding: size === 'mobile' ? '0.125rem' : size === 'compact' ? '0.2rem' : '0.3rem',
                minWidth: size === 'mobile' ? '1.5rem' : size === 'compact' ? '1.5rem' : '1.8rem',
                minHeight: size === 'mobile' ? '1.5rem' : size === 'compact' ? '1.5rem' : '1.8rem',
              },
              caption: {
                fontSize: size === 'mobile' ? '0.7rem' : size === 'compact' ? '0.65rem' : classes.textSm === 'text-xs' ? '0.75rem' : '0.875rem',
                textAlign: 'center',
                marginBottom: size === 'mobile' ? '0.4rem' : '0.5rem'
              },
              weekdays: {
                fontSize: size === 'mobile' ? '0.6rem' : classes.textSm === 'text-xs' ? '0.65rem' : '0.75rem'
              },
            }}
          />
        </div>
      </div>

      {/* Modal lateral para detalhes do dia */}
      <AnimatePresence>
        {isModalOpen && selectedDayData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex"
            onClick={() => setIsModalOpen(false)}
          >
            {/* Overlay com backdrop blur */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Modal Container - Lateral */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
                "relative bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col z-10",
                size === 'mobile'
                  ? "w-full h-full" // Mobile: tela cheia
                  : "ml-auto w-96 h-full" // Desktop: lateral direito
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header com gradiente coral */}
              <div className="relative px-4 py-4 bg-gradient-to-r from-coral-400 via-coral-500 to-coral-600 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white" />
                      <h2 className="text-base font-semibold text-white">
                        {format(selectedDayData, "dd 'de' MMM", { locale: ptBR })}
                      </h2>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo com scroll otimizado */}
                <div className="flex-1 overflow-y-auto p-4">
                  {(() => {
                    const dayData = getDayTransactions(selectedDayData);
                    if (!dayData) return null;

                    // Filtrar transações baseado no filtro ativo
                    const filteredTransactions = dayData.transactions.filter(trans => {
                      if (filterType === 'receitas') return trans.tipo === 'receita';
                      if (filterType === 'despesas') return trans.tipo === 'despesa' || trans.tipo === 'despesa_cartao';
                      return true;
                    });

                    return (
                      <>
                        {/* Resumo financeiro compacto */}
                        <div className="mb-4">
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {dayData.receitas > 0 && (
                              <div className="bg-green-50/80 backdrop-blur-sm rounded-xl p-2 border border-green-100">
                                <div className="flex items-center gap-1 mb-1">
                                  <TrendingUp size={12} className="text-green-600" />
                                  <span className="text-xs font-medium text-green-800">Receitas</span>
                                </div>
                                <p className="text-sm font-bold text-green-600">
                                  {formatCurrency(dayData.receitas)}
                                </p>
                              </div>
                            )}

                            {dayData.despesas > 0 && (
                              <div className="bg-coral-50/80 backdrop-blur-sm rounded-xl p-2 border border-coral-100">
                                <div className="flex items-center gap-1 mb-1">
                                  <TrendingDown size={12} className="text-coral" />
                                  <span className="text-xs font-medium text-coral">Despesas</span>
                                </div>
                                <p className="text-sm font-bold text-coral">
                                  {formatCurrency(dayData.despesas)}
                                </p>
                              </div>
                            )}

                            {/* Saldo do dia */}
                            <div className={cn(
                              "backdrop-blur-sm rounded-xl p-2 border",
                              dayData.saldo >= 0
                                ? "bg-green-50/80 border-green-100"
                                : "bg-red-50/80 border-red-100"
                            )}>
                              <div className="flex items-center gap-1 mb-1">
                                <Activity size={12} className={dayData.saldo >= 0 ? "text-green-600" : "text-red-600"} />
                                <span className="text-xs font-medium text-gray-700">Saldo</span>
                              </div>
                              <p className={cn(
                                "text-sm font-bold",
                                dayData.saldo >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {formatCurrency(dayData.saldo)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Filtros interativos */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Filter className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-medium text-gray-600">Filtrar por:</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setFilterType('all')}
                              className={cn(
                                "px-2 py-1 text-xs rounded-full font-medium transition-all duration-200 hover:scale-105",
                                filterType === 'all'
                                  ? "bg-coral-100 text-coral-700 border border-coral-200"
                                  : "bg-slate-100 text-slate-700"
                              )}
                            >
                              Todas ({dayData.count})
                            </button>
                            {dayData.receitas > 0 && (
                              <button
                                onClick={() => setFilterType('receitas')}
                                className={cn(
                                  "px-2 py-1 text-xs rounded-full font-medium transition-all duration-200 hover:scale-105",
                                  filterType === 'receitas'
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : "bg-slate-100 text-slate-700"
                                )}
                              >
                                Receitas ({dayData.transactions.filter(t => t.tipo === 'receita').length})
                              </button>
                            )}
                            {dayData.despesas > 0 && (
                              <button
                                onClick={() => setFilterType('despesas')}
                                className={cn(
                                  "px-2 py-1 text-xs rounded-full font-medium transition-all duration-200 hover:scale-105",
                                  filterType === 'despesas'
                                    ? "bg-red-100 text-red-700 border border-red-200"
                                    : "bg-slate-100 text-slate-700"
                                )}
                              >
                                Despesas ({dayData.transactions.filter(t => t.tipo === 'despesa' || t.tipo === 'despesa_cartao').length})
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Lista de transações filtrada */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            Lançamentos
                            <span className="text-xs text-gray-500">({filteredTransactions.length})</span>
                          </h4>

                          <div className="space-y-2">
                            {filteredTransactions.map((trans, idx) => {
                              const isReceita = trans.tipo === 'receita';
                              const tipoFormatted = trans.tipo.replace(/_/g, ' ');

                              return (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/40 hover:bg-white/80 transition-all duration-200"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <div className={cn(
                                        "w-6 h-6 rounded-lg flex items-center justify-center",
                                        isReceita ? "bg-green-100" : "bg-coral-100"
                                      )}>
                                        {(() => {
                                          if (isReceita) {
                                            return <DollarSign className="w-3 h-3 text-green-600" />;
                                          } else if (trans.tipo === 'despesa_cartao') {
                                            return <CreditCard className="w-3 h-3 text-coral" />;
                                          } else {
                                            return <ShoppingCart className="w-3 h-3 text-coral" />;
                                          }
                                        })()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {trans.descricao || trans.categoria_nome}
                                        </p>
                                        {trans.categoria_nome && trans.descricao && (
                                          <p className="text-xs text-gray-500 truncate">
                                            {trans.categoria_nome}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <p className={cn(
                                        "text-sm font-bold",
                                        isReceita ? "text-green-600" : "text-coral"
                                      )}>
                                        {isReceita ? '+' : '-'}
                                        {formatCurrency(Math.abs(Number(trans.valor)))}
                                      </p>
                                      <p className="text-xs text-gray-500 capitalize">
                                        {tipoFormatted}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>

                          {filteredTransactions.length === 0 && (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500">Nenhuma transação encontrada</p>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MiniCalendario;