import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { IndicatorsService, type DashboardSummary } from '../../services/api/IndicatorsService';
import { cn } from '../../utils/cn';

interface SaldoPrevistoCardProps {
  className?: string;
  showDetails?: boolean;
  accountId?: number; // Se especificado, mostra apenas desta conta
}

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
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'next'>('current');

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

  const getVariationColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getVariationIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4" />;
    if (value < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className={cn(
        "bg-white rounded-2xl p-6 shadow-sm border border-gray-100",
        className
      )}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "bg-white rounded-2xl p-6 shadow-sm border border-red-200",
        className
      )}>
        <div className="text-center">
          <div className="text-red-600 mb-2">Erro ao carregar dados</div>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="text-sm text-primary hover:underline"
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
        "bg-white rounded-2xl p-6 shadow-sm border border-gray-100",
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
  const taxaEconomia = summary.taxa_economia || 0;
  const tipoPeriodo = summary.tipo_periodo || 'atual';

  return (
    <div className={cn(
      "bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Saldo Previsto</h3>
          {tipoPeriodo !== 'atual' && (
            <span className={cn(
              "px-2 py-1 text-xs rounded-full font-medium",
              tipoPeriodo === 'futuro' && "bg-blue-100 text-blue-700",
              tipoPeriodo === 'passado' && "bg-gray-100 text-gray-700"
            )}>
              {tipoPeriodo === 'futuro' ? 'Futuro' : 'Passado'}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowValues(!showValues)}
            className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
            title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
          >
            {showValues ? (
              <Eye className="w-4 h-4 text-gray-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-600" />
            )}
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-white/60 transition-colors disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={cn(
              "w-4 h-4 text-gray-600",
              refreshing && "animate-spin"
            )} />
          </button>
        </div>
      </div>

      {/* Saldo Principal */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-1">Saldo atual</div>
        <div className="text-2xl font-bold text-gray-900 mb-2">
          {formatCurrency(summary.saldo_total_atual)}
        </div>
        
        <div className="text-sm text-gray-600 mb-1">
          {tipoPeriodo === 'atual' ? 'Saldo previsto (fim do mês)' :
           tipoPeriodo === 'futuro' ? 'Saldo projetado' :
           'Saldo final do mês'}
        </div>
        <div className="text-3xl font-bold text-blue-600 mb-2">
          {formatCurrency(summary.saldo_total_previsto)}
        </div>

        {/* Economia do Mês */}
        <div className="text-sm text-gray-600 mb-1">Economia do mês</div>
        <div className={cn(
          "text-lg font-semibold mb-2",
          economiaAtual >= 0 ? "text-green-600" : "text-red-600"
        )}>
          {economiaAtual >= 0 ? '+' : ''}{formatCurrency(economiaAtual)}
          {taxaEconomia !== 0 && (
            <span className="ml-2 text-sm">
              ({taxaEconomia >= 0 ? '+' : ''}{taxaEconomia.toFixed(1)}%)
            </span>
          )}
        </div>
        
        {/* Variação */}
        <div className={cn(
          "flex items-center space-x-1 text-sm",
          getVariationColor(variacao)
        )}>
          {getVariationIcon(variacao)}
          <span>
            {variacao >= 0 ? '+' : ''}{formatCurrency(variacao)}
            {percentualVariacao !== 0 && (
              <span className="ml-1">
                ({percentualVariacao >= 0 ? '+' : ''}{percentualVariacao.toFixed(1)}%)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Detalhes Mensais */}
      {showDetails && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">
                {tipoPeriodo === 'futuro' ? 'Receitas previstas' : 'Receitas do mês'}
              </div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(summary.receitas_mes)}
              </div>
            </div>

            <div className="bg-white/60 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">
                {tipoPeriodo === 'futuro' ? 'Despesas previstas' : 'Despesas do mês'}
              </div>
              <div className="text-lg font-semibold text-red-600">
                {formatCurrency(summary.despesas_mes)}
              </div>
            </div>
          </div>

          {/* Score de Saúde Financeira */}
          <div className="bg-white/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Score de Saúde</span>
              <span className="text-sm font-semibold">
                {summary.score_medio_saude}/100
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  summary.score_medio_saude >= 80 && "bg-green-500",
                  summary.score_medio_saude >= 60 && summary.score_medio_saude < 80 && "bg-yellow-500",
                  summary.score_medio_saude < 60 && "bg-red-500"
                )}
                style={{ width: `${summary.score_medio_saude}%` }}
              ></div>
            </div>
          </div>

          {/* Resultado do Período */}
          <div className="bg-white/60 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">
              {tipoPeriodo === 'atual' ? 'Resultado previsto' :
               tipoPeriodo === 'futuro' ? 'Resultado projetado' :
               'Resultado do mês'}
            </div>
            <div className={cn(
              "text-lg font-semibold",
              economiaAtual >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {economiaAtual >= 0 ? '+' : ''}{formatCurrency(economiaAtual)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {tipoPeriodo === 'futuro'
                ? 'Incluindo lançamentos fixos'
                : 'Baseado nos lançamentos do período'}
            </div>
          </div>

          {/* Resumo por Conta */}
          {summary.contas.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 font-medium">Por conta:</div>
              {summary.contas.map((conta) => (
                <div key={conta.conta_id} className="bg-white/60 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {conta.nome_conta}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatCurrency(conta.saldo_previsto)}
                      </div>
                      {conta.variacao_percentual !== 0 && (
                        <div className={cn(
                          "text-xs",
                          getVariationColor(conta.variacao_percentual)
                        )}>
                          {conta.variacao_percentual >= 0 ? '+' : ''}
                          {conta.variacao_percentual.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/60">
        <div className="text-xs text-gray-500 text-center">
          {tipoPeriodo === 'atual'
            ? `Última atualização: ${new Date().toLocaleTimeString('pt-BR')}`
            : tipoPeriodo === 'futuro'
            ? 'Projeção baseada em lançamentos fixos e pendentes'
            : 'Dados históricos do período'}
        </div>
      </div>
    </div>
  );
} 