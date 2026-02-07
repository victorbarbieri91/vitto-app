import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, DollarSign, Wallet, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { KPIType } from '../../hooks/useKPIDetailModal';
import type { KPIDetailData } from '../../contexts/MonthlyDashboardContext';

interface KPIDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiType: KPIType | null;
  data: KPIDetailData;
  consolidatedData: {
    totalSaldo: number;
    totalReceitas: number;
    totalDespesas: number;
    saldoPrevisto: number;
    economiaMes: number;
  };
}

// Configurações de cor por tipo de KPI
const kpiConfig: Record<KPIType, {
  title: string;
  icon: React.ReactNode;
  colors: {
    headerBg: string;
    headerText: string;
    headerIcon: string;
    bodyBg: string;
    totalBg: string;
    totalText: string;
    positiveLine: string;
    negativeLine: string;
  };
}> = {
  saldo_previsto: {
    title: 'Saldo Previsto',
    icon: <Wallet className="w-4 h-4" />,
    colors: {
      headerBg: 'bg-deep-blue',
      headerText: 'text-white',
      headerIcon: 'text-slate-300',
      bodyBg: 'bg-white',
      totalBg: 'bg-slate-100',
      totalText: 'text-deep-blue',
      positiveLine: 'text-emerald-600',
      negativeLine: 'text-red-500',
    },
  },
  saldo_conta: {
    title: 'Saldo em Conta Corrente',
    icon: <DollarSign className="w-4 h-4" />,
    colors: {
      headerBg: 'bg-slate-700',
      headerText: 'text-white',
      headerIcon: 'text-slate-300',
      bodyBg: 'bg-white',
      totalBg: 'bg-slate-50',
      totalText: 'text-slate-700',
      positiveLine: 'text-emerald-600',
      negativeLine: 'text-red-600',
    },
  },
  receitas: {
    title: 'Receitas do Mes',
    icon: <TrendingUp className="w-4 h-4" />,
    colors: {
      headerBg: 'bg-teal-700',
      headerText: 'text-white',
      headerIcon: 'text-teal-200',
      bodyBg: 'bg-white',
      totalBg: 'bg-teal-50',
      totalText: 'text-teal-700',
      positiveLine: 'text-teal-600',
      negativeLine: 'text-red-600',
    },
  },
  despesas: {
    title: 'Despesas do Mes',
    icon: <TrendingDown className="w-4 h-4" />,
    colors: {
      headerBg: 'bg-coral-500',
      headerText: 'text-white',
      headerIcon: 'text-coral-100',
      bodyBg: 'bg-white',
      totalBg: 'bg-coral-50',
      totalText: 'text-coral-700',
      positiveLine: 'text-emerald-600',
      negativeLine: 'text-coral-600',
    },
  },
  economia: {
    title: 'Economia do Mes',
    icon: <Activity className="w-4 h-4" />,
    colors: {
      headerBg: 'bg-teal-600',
      headerText: 'text-white',
      headerIcon: 'text-teal-200',
      bodyBg: 'bg-white',
      totalBg: 'bg-teal-50',
      totalText: 'text-teal-700',
      positiveLine: 'text-teal-600',
      negativeLine: 'text-red-600',
    },
  },
};

// Formatar valor em BRL
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Componente de linha de cálculo
interface CalcLineProps {
  label: string;
  value: number;
  operator?: '+' | '-' | '=';
  isTotal?: boolean;
  colors: typeof kpiConfig['saldo_previsto']['colors'];
}

function CalcLine({ label, value, operator, isTotal, colors }: CalcLineProps) {
  const isPositive = value >= 0;
  const displayValue = operator === '-' ? -Math.abs(value) : value;

  return (
    <div
      className={cn(
        'flex items-center justify-between py-1.5 px-3',
        isTotal && cn(colors.totalBg, 'rounded-lg mt-2 py-2')
      )}
    >
      <div className="flex items-center gap-2">
        {operator && !isTotal && (
          <span className={cn(
            'text-xs font-mono w-3',
            operator === '+' ? colors.positiveLine : colors.negativeLine
          )}>
            {operator}
          </span>
        )}
        {isTotal && (
          <span className={cn('text-xs font-mono w-3', colors.totalText)}>=</span>
        )}
        <span className={cn(
          'text-xs',
          isTotal ? cn('font-semibold', colors.totalText) : 'text-gray-600'
        )}>
          {label}
        </span>
      </div>
      <span className={cn(
        'text-xs font-mono tabular-nums',
        isTotal ? cn('font-bold', colors.totalText) : (
          operator === '-' || displayValue < 0 ? colors.negativeLine : colors.positiveLine
        )
      )}>
        {formatCurrency(displayValue)}
      </span>
    </div>
  );
}

// Componente de linha de conta
interface AccountLineProps {
  nome: string;
  saldo: number;
  colors: typeof kpiConfig['saldo_conta']['colors'];
}

function AccountLine({ nome, saldo, colors }: AccountLineProps) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3">
      <span className="text-xs text-gray-600 truncate max-w-[60%]">{nome}</span>
      <span className={cn(
        'text-xs font-mono tabular-nums',
        saldo >= 0 ? colors.positiveLine : colors.negativeLine
      )}>
        {formatCurrency(saldo)}
      </span>
    </div>
  );
}

export default function KPIDetailModal({
  isOpen,
  onClose,
  kpiType,
  data,
  consolidatedData,
}: KPIDetailModalProps) {
  // Prevenir scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Listener para ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!kpiType) return null;

  const config = kpiConfig[kpiType];

  // Renderizar conteúdo baseado no tipo de KPI
  const renderContent = () => {
    switch (kpiType) {
      case 'saldo_previsto':
        return (
          <>
            <CalcLine
              label="Saldo Atual das Contas"
              value={data.saldoAtualTotal}
              colors={config.colors}
            />
            <div className="border-t border-gray-100 my-1" />
            <CalcLine
              label="Receitas Pendentes"
              value={data.receitasPendentes}
              operator="+"
              colors={config.colors}
            />
            <CalcLine
              label="Despesas Pendentes"
              value={data.despesasPendentes}
              operator="-"
              colors={config.colors}
            />
            <CalcLine
              label="Receitas Fixas Pendentes"
              value={data.receitasFixasNaoGeradas}
              operator="+"
              colors={config.colors}
            />
            <CalcLine
              label="Despesas Fixas Pendentes"
              value={data.despesasFixasNaoGeradas}
              operator="-"
              colors={config.colors}
            />
            <CalcLine
              label="Faturas de Cartao"
              value={data.faturasMes}
              operator="-"
              colors={config.colors}
            />
            <CalcLine
              label="SALDO PREVISTO"
              value={consolidatedData.saldoPrevisto}
              isTotal
              colors={config.colors}
            />
          </>
        );

      case 'saldo_conta':
        return (
          <>
            {data.contas.length > 0 ? (
              data.contas.map((conta) => (
                <AccountLine
                  key={conta.id}
                  nome={conta.nome}
                  saldo={conta.saldo_atual}
                  colors={config.colors}
                />
              ))
            ) : (
              <div className="text-xs text-gray-500 text-center py-4">
                Nenhuma conta cadastrada
              </div>
            )}
            <CalcLine
              label="TOTAL EM CONTA"
              value={consolidatedData.totalSaldo}
              isTotal
              colors={config.colors}
            />
          </>
        );

      case 'receitas':
        return (
          <>
            <CalcLine
              label="Receitas Efetivadas"
              value={data.receitasConfirmadas}
              colors={config.colors}
            />
            {data.receitasPendentes > 0 && (
              <CalcLine
                label="Receitas Pendentes"
                value={data.receitasPendentes}
                operator="+"
                colors={config.colors}
              />
            )}
            {data.receitasFixasNaoGeradas > 0 && (
              <CalcLine
                label="Receitas Fixas Previstas"
                value={data.receitasFixasNaoGeradas}
                operator="+"
                colors={config.colors}
              />
            )}
            <CalcLine
              label="TOTAL RECEITAS"
              value={consolidatedData.totalReceitas}
              isTotal
              colors={config.colors}
            />
          </>
        );

      case 'despesas':
        return (
          <>
            <CalcLine
              label="Despesas Efetivadas"
              value={data.despesasConfirmadas}
              colors={config.colors}
            />
            {data.despesasPendentes > 0 && (
              <CalcLine
                label="Despesas Pendentes"
                value={data.despesasPendentes}
                operator="+"
                colors={config.colors}
              />
            )}
            {data.despesasFixasNaoGeradas > 0 && (
              <CalcLine
                label="Despesas Fixas Previstas"
                value={data.despesasFixasNaoGeradas}
                operator="+"
                colors={config.colors}
              />
            )}
            {data.faturasMes > 0 && (
              <CalcLine
                label="Faturas de Cartao"
                value={data.faturasMes}
                operator="+"
                colors={config.colors}
              />
            )}
            <CalcLine
              label="TOTAL DESPESAS"
              value={consolidatedData.totalDespesas}
              isTotal
              colors={config.colors}
            />
          </>
        );

      case 'economia':
        return (
          <>
            <CalcLine
              label="Total Receitas"
              value={consolidatedData.totalReceitas}
              colors={config.colors}
            />
            <CalcLine
              label="Total Despesas"
              value={consolidatedData.totalDespesas}
              operator="-"
              colors={config.colors}
            />
            <CalcLine
              label="ECONOMIA DO MES"
              value={consolidatedData.economiaMes}
              isTotal
              colors={config.colors}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="w-full max-w-xs bg-white rounded-xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={cn('flex items-center justify-between px-4 py-3', config.colors.headerBg)}>
                <div className="flex items-center gap-2">
                  <span className={config.colors.headerIcon}>{config.icon}</span>
                  <h3 className={cn('text-sm font-semibold', config.colors.headerText)}>
                    {config.title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className={cn(
                    'p-1 rounded-lg transition-colors',
                    config.colors.headerIcon,
                    'hover:bg-white/20'
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className={cn('py-3', config.colors.bodyBg)}>
                {renderContent()}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
