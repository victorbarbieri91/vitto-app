import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, RefreshCw, Eye, EyeOff, Activity } from 'lucide-react';
import { IndicatorsService, type DashboardSummary } from '../../services/api/IndicatorsService';
import { cn } from '../../utils/cn';

interface SaldoPrevistoCardProps {
  className?: string;
  showDetails?: boolean;
  accountId?: number; // Se especificado, mostra apenas desta conta
}

/**
 *
 */
export default function SaldoPrevistoCard({ 
  className, 
  showDetails = true,
  accountId 
}: SaldoPrevistoCardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showValues, setShowValues] = useState(true);

  const indicatorsService = new IndicatorsService();

  const loadData = async () => {
    try {
      setError(null);
      const data = await indicatorsService.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Erro ao carregar saldo previsto:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await indicatorsService.refreshAllUserIndicators();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar dados');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accountId]);

  const formatCurrency = (value: number) => {
    if (!showValues) return '••••••';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getVariationIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4" />;
    if (value < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className={cn(
        "bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20",
        className
      )}>
        <div className="animate-pulse">
          <div className="h-4 bg-white/30 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-white/20 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-3 bg-white/20 rounded w-full"></div>
            <div className="h-3 bg-white/20 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "bg-white/10 backdrop-blur-md rounded-xl p-4 border border-red-200/50",
        className
      )}>
        <div className="text-center">
          <div className="text-red-500 mb-2">Erro ao carregar dados</div>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="text-sm text-coral-500 hover:text-coral-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={cn(
        "bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20",
        className
      )}>
        <div className="text-center text-gray-500">
          Nenhum dado disponível
        </div>
      </div>
    );
  }

  const variacao = summary.saldo_total_previsto - summary.saldo_total_atual;
  const percentualVariacao = summary.saldo_total_atual !== 0
    ? (variacao / Math.abs(summary.saldo_total_atual)) * 100
    : 0;

  // Dados adicionais da nova implementação
  const economiaAtual = summary.economia_mes || 0;
  const tipoPeriodo = summary.tipo_periodo || 'atual';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-coral-500" />
          <h3 className="font-semibold text-deep-blue">Saldo Previsto</h3>
          {tipoPeriodo !== 'atual' && (
            <span className={cn(
              "px-2 py-0.5 text-xs rounded-full font-medium",
              tipoPeriodo === 'futuro' && "bg-blue-500/20 text-blue-600",
              tipoPeriodo === 'passado' && "bg-gray-500/20 text-gray-600"
            )}>
              {tipoPeriodo === 'futuro' ? 'Futuro' : 'Passado'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowValues(!showValues)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
          >
            {showValues ? (
              <Eye className="w-4 h-4 text-deep-blue" />
            ) : (
              <EyeOff className="w-4 h-4 text-deep-blue" />
            )}
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={cn(
              "w-4 h-4 text-deep-blue",
              refreshing && "animate-spin"
            )} />
          </button>
        </div>
      </div>

      {/* Saldos Principais */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Saldo Atual */}
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Saldo atual</div>
            <div className="text-xl font-bold text-deep-blue">
              {formatCurrency(summary.saldo_total_atual)}
            </div>
          </div>

          {/* Saldo Previsto */}
          <div className="bg-coral-500/20 rounded-lg p-3">
            <div className="text-xs text-coral-600 mb-1">
              {tipoPeriodo === 'atual' ? 'Previsto' : tipoPeriodo === 'futuro' ? 'Projetado' : 'Final'}
            </div>
            <div className="text-xl font-bold text-coral-600">
              {formatCurrency(summary.saldo_total_previsto)}
            </div>
          </div>
        </div>

        {/* Economia e Variação */}
        <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Economia do mês</div>
            <div className={cn(
              "text-lg font-semibold",
              economiaAtual >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {economiaAtual >= 0 ? '+' : ''}{formatCurrency(economiaAtual)}
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-sm px-2 py-1 rounded-full",
            variacao >= 0 ? "bg-emerald-500/20 text-emerald-600" : "bg-red-500/20 text-red-500"
          )}>
            {getVariationIcon(variacao)}
            <span>{percentualVariacao >= 0 ? '+' : ''}{percentualVariacao.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Detalhes Mensais */}
      {showDetails && (
        <div className="space-y-3">
          {/* Receitas e Despesas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-500/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-500">Receitas</span>
              </div>
              <div className="text-lg font-semibold text-emerald-500">
                {formatCurrency(summary.receitas_mes)}
              </div>
            </div>

            <div className="bg-coral-500/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-coral-500" />
                <span className="text-xs text-gray-500">Despesas</span>
              </div>
              <div className="text-lg font-semibold text-coral-500">
                {formatCurrency(summary.despesas_mes)}
              </div>
            </div>
          </div>

          {/* Score de Saúde Financeira */}
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-deep-blue" />
                <span className="text-xs text-gray-500">Score de Saúde</span>
              </div>
              <span className={cn(
                "text-sm font-bold",
                summary.score_medio_saude >= 80 && "text-emerald-500",
                summary.score_medio_saude >= 60 && summary.score_medio_saude < 80 && "text-yellow-500",
                summary.score_medio_saude < 60 && "text-red-500"
              )}>
                {summary.score_medio_saude}/100
              </span>
            </div>

            <div className="w-full bg-gray-200/30 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${summary.score_medio_saude}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={cn(
                  "h-2 rounded-full",
                  summary.score_medio_saude >= 80 && "bg-emerald-500",
                  summary.score_medio_saude >= 60 && summary.score_medio_saude < 80 && "bg-yellow-500",
                  summary.score_medio_saude < 60 && "bg-red-500"
                )}
              />
            </div>
          </div>

          {/* Resumo por Conta */}
          {summary.contas.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 font-medium">Por conta:</div>
              <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar">
                {summary.contas.map((conta) => (
                  <div key={conta.conta_id} className="bg-white/10 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-deep-blue truncate">
                        {conta.nome_conta}
                      </span>
                      <div className="text-right flex items-center gap-2">
                        <span className="text-sm font-semibold text-deep-blue">
                          {formatCurrency(conta.saldo_previsto)}
                        </span>
                        {conta.variacao_percentual !== 0 && (
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            conta.variacao_percentual >= 0
                              ? "bg-emerald-500/20 text-emerald-600"
                              : "bg-red-500/20 text-red-500"
                          )}>
                            {conta.variacao_percentual >= 0 ? '+' : ''}
                            {conta.variacao_percentual.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="text-xs text-gray-500 text-center">
          {tipoPeriodo === 'atual'
            ? `Atualizado: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
            : tipoPeriodo === 'futuro'
            ? 'Projeção com lançamentos fixos'
            : 'Dados históricos'}
        </div>
      </div>
    </motion.div>
  );
} 