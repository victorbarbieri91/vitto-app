import { useState, useEffect } from 'react';
import { AgentMetrics, AgentConfigService } from '../../services/api/agentConfig';
import { ModernCard } from '../ui/modern';
import {
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  LineChart,
  Bell
} from 'lucide-react';
import { PerformanceCharts } from './PerformanceCharts';
import { AlertSystem } from './AlertSystem';

interface MetricsObserverProps {
  refreshInterval?: number; // em segundos
}

export function MetricsObserver({ refreshInterval = 30 }: MetricsObserverProps) {
  const [metrics, setMetrics] = useState<AgentMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(7);
  const [activeView, setActiveView] = useState<'overview' | 'charts' | 'alerts'>('overview');

  useEffect(() => {
    loadMetrics();

    const interval = setInterval(() => {
      loadMetrics();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [selectedPeriod, refreshInterval]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await AgentConfigService.getMetrics(selectedPeriod);
      setMetrics(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const aggregateMetrics = () => {
    const summary = metrics.reduce((acc, metric) => {
      if (!acc[metric.agente_tipo]) {
        acc[metric.agente_tipo] = {
          tipo: metric.agente_tipo,
          total_execucoes: 0,
          total_sucessos: 0,
          total_falhas: 0,
          tempo_medio_ms: 0,
          feedback_medio: 0,
          total_feedbacks: 0,
          dias_ativos: 0
        };
      }

      const agentData = acc[metric.agente_tipo];
      agentData.total_execucoes += metric.total_execucoes;
      agentData.total_sucessos += metric.total_sucessos;
      agentData.total_falhas += metric.total_falhas;
      agentData.tempo_medio_ms = (agentData.tempo_medio_ms + metric.tempo_medio_ms) / 2;
      agentData.feedback_medio = (agentData.feedback_medio + metric.feedback_medio) / 2;
      agentData.total_feedbacks += metric.total_feedbacks;
      agentData.dias_ativos += 1;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(summary);
  };

  const getAgentName = (tipo: string) => {
    const names: Record<string, string> = {
      communication: 'Comunicação',
      analysis: 'Análise',
      execution: 'Execução',
      validation: 'Validação',
      document: 'Documentos'
    };
    return names[tipo] || tipo;
  };

  const getSuccessRate = (sucessos: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((sucessos / total) * 100);
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (rate: number) => {
    if (rate >= 95) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (rate >= 85) return <Activity className="w-4 h-4 text-yellow-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const aggregatedMetrics = aggregateMetrics();
  const totalExecutions = aggregatedMetrics.reduce((sum, m) => sum + m.total_execucoes, 0);
  const totalSuccesses = aggregatedMetrics.reduce((sum, m) => sum + m.total_sucessos, 0);
  const overallSuccessRate = getSuccessRate(totalSuccesses, totalExecutions);

  if (loading && metrics.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Observabilidade dos Agentes</h3>
          <p className="text-sm text-gray-600 mt-1">
            Monitoramento em tempo real da performance dos agentes IA
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Botões de visualização */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeView === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity className="w-4 h-4 mr-1 inline" />
              Visão Geral
            </button>
            <button
              onClick={() => setActiveView('charts')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeView === 'charts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LineChart className="w-4 h-4 mr-1 inline" />
              Gráficos
            </button>
            <button
              onClick={() => setActiveView('alerts')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeView === 'alerts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bell className="w-4 h-4 mr-1 inline" />
              Alertas
            </button>
          </div>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>Últimas 24h</option>
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
          </select>
          <button
            onClick={loadMetrics}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Resumo geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ModernCard variant="metric" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Execuções</p>
              <p className="text-2xl font-bold text-gray-900">{totalExecutions}</p>
            </div>
          </div>
        </ModernCard>

        <ModernCard variant="metric" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Taxa de Sucesso</p>
              <p className={`text-2xl font-bold ${getPerformanceColor(overallSuccessRate)}`}>
                {overallSuccessRate}%
              </p>
            </div>
          </div>
        </ModernCard>

        <ModernCard variant="metric" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tempo Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(aggregatedMetrics.reduce((sum, m) => sum + m.tempo_medio_ms, 0) / aggregatedMetrics.length || 0)}ms
              </p>
            </div>
          </div>
        </ModernCard>

        <ModernCard variant="metric" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Agentes Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{aggregatedMetrics.length}</p>
            </div>
          </div>
        </ModernCard>
      </div>

      {/* Conteúdo baseado na visualização ativa */}
      {activeView === 'overview' ? (
        /* Métricas por agente */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {aggregatedMetrics.map((agentMetric) => {
          const successRate = getSuccessRate(agentMetric.total_sucessos, agentMetric.total_execucoes);
          const hasAlerts = successRate < 85 || agentMetric.tempo_medio_ms > 3000;

          return (
            <ModernCard key={agentMetric.tipo} variant="glass" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Agente {getAgentName(agentMetric.tipo)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {agentMetric.dias_ativos} dias de atividade
                    </p>
                  </div>
                </div>
                {hasAlerts && (
                  <div className="flex items-center space-x-1 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">Atenção</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Execuções</span>
                    <span className="font-medium">{agentMetric.total_execucoes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sucessos</span>
                    <div className="flex items-center space-x-1">
                      {getPerformanceIcon(successRate)}
                      <span className={`font-medium ${getPerformanceColor(successRate)}`}>
                        {successRate}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Falhas</span>
                    <span className="font-medium text-red-600">{agentMetric.total_falhas}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tempo Médio</span>
                    <span className={`font-medium ${agentMetric.tempo_medio_ms > 3000 ? 'text-red-600' : 'text-gray-900'}`}>
                      {Math.round(agentMetric.tempo_medio_ms)}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Feedback</span>
                    <span className="font-medium">
                      {agentMetric.feedback_medio > 0 ? `⭐ ${agentMetric.feedback_medio.toFixed(1)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avaliações</span>
                    <span className="font-medium">{agentMetric.total_feedbacks}</span>
                  </div>
                </div>
              </div>

              {/* Barra de progresso da taxa de sucesso */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Performance</span>
                  <span className={`font-medium ${getPerformanceColor(successRate)}`}>
                    {successRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      successRate >= 95 ? 'bg-green-500' :
                      successRate >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${successRate}%` }}
                  />
                </div>
              </div>
            </ModernCard>
          );
        })}
        </div>
      ) : activeView === 'charts' ? (
        /* Visualização de gráficos */
        <PerformanceCharts period={selectedPeriod} />
      ) : (
        /* Sistema de alertas */
        <AlertSystem period={selectedPeriod} />
      )}

      {/* Status da última atualização */}
      {lastUpdate && (
        <div className="text-center text-sm text-gray-500">
          Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          {' • '}
          Próxima em {refreshInterval}s
        </div>
      )}

      {/* Estado vazio */}
      {aggregatedMetrics.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-500 mb-2">
            Nenhuma métrica encontrada
          </h4>
          <p className="text-gray-400 max-w-md mx-auto">
            As métricas dos agentes aparecerão aqui conforme eles forem utilizados no chat.
            Comece uma conversa para ver os dados.
          </p>
        </div>
      )}
    </div>
  );
}