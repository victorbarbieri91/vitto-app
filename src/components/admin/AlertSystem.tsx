import { useState, useEffect } from 'react';
import { AgentMetrics, AgentConfigService } from '../../services/api/agentConfig';
import { ModernCard, ModernButton } from '../ui/modern';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bell,
  BellOff,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'high' | 'medium' | 'low';
  agent: string;
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  metric?: string;
  value?: number;
  threshold?: number;
}

interface AlertSystemProps {
  period: number;
}

export function AlertSystem({ period }: AlertSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [thresholds, setThresholds] = useState({
    successRate: 85,
    responseTime: 3000,
    errorRate: 15,
    minExecutions: 5
  });

  useEffect(() => {
    analyzeMetricsAndGenerateAlerts();

    const interval = setInterval(() => {
      analyzeMetricsAndGenerateAlerts();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [period, thresholds]);

  const analyzeMetricsAndGenerateAlerts = async () => {
    try {
      setLoading(true);
      const metrics = await AgentConfigService.getMetrics(period);
      const newAlerts = generateAlertsFromMetrics(metrics);
      setAlerts(newAlerts);
    } catch (error) {
      console.error('Erro ao analisar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAlertsFromMetrics = (metrics: AgentMetrics[]): Alert[] => {
    const alerts: Alert[] = [];
    const agentSummary: Record<string, {
      execucoes: number;
      sucessos: number;
      falhas: number;
      tempoMedio: number;
      dias: number;
      lastActivity: string;
    }> = {};

    // Aggregate metrics by agent
    metrics.forEach(metric => {
      if (!agentSummary[metric.agente_tipo]) {
        agentSummary[metric.agente_tipo] = {
          execucoes: 0,
          sucessos: 0,
          falhas: 0,
          tempoMedio: 0,
          dias: 0,
          lastActivity: metric.data_metricas
        };
      }

      const agent = agentSummary[metric.agente_tipo];
      agent.execucoes += metric.total_execucoes;
      agent.sucessos += metric.total_sucessos;
      agent.falhas += metric.total_falhas;
      agent.tempoMedio = (agent.tempoMedio + metric.tempo_medio_ms) / 2;
      agent.dias += 1;

      if (new Date(metric.data_metricas) > new Date(agent.lastActivity)) {
        agent.lastActivity = metric.data_metricas;
      }
    });

    // Generate alerts for each agent
    Object.entries(agentSummary).forEach(([agentType, data]) => {
      const agentName = getAgentName(agentType);
      const successRate = data.execucoes > 0 ? (data.sucessos / data.execucoes) * 100 : 0;
      const errorRate = data.execucoes > 0 ? (data.falhas / data.execucoes) * 100 : 0;

      // High error rate alert
      if (errorRate > thresholds.errorRate && data.execucoes >= thresholds.minExecutions) {
        alerts.push({
          id: `${agentType}-error-rate`,
          type: 'error',
          severity: 'high',
          agent: agentName,
          title: 'Taxa de Erro Elevada',
          message: `O agente ${agentName} apresenta ${errorRate.toFixed(1)}% de falhas nas execuções.`,
          timestamp: new Date(),
          acknowledged: false,
          metric: 'errorRate',
          value: errorRate,
          threshold: thresholds.errorRate
        });
      }

      // Low success rate alert
      if (successRate < thresholds.successRate && data.execucoes >= thresholds.minExecutions) {
        alerts.push({
          id: `${agentType}-success-rate`,
          type: 'warning',
          severity: successRate < 70 ? 'high' : 'medium',
          agent: agentName,
          title: 'Taxa de Sucesso Baixa',
          message: `O agente ${agentName} tem apenas ${successRate.toFixed(1)}% de taxa de sucesso.`,
          timestamp: new Date(),
          acknowledged: false,
          metric: 'successRate',
          value: successRate,
          threshold: thresholds.successRate
        });
      }

      // High response time alert
      if (data.tempoMedio > thresholds.responseTime && data.execucoes >= thresholds.minExecutions) {
        alerts.push({
          id: `${agentType}-response-time`,
          type: 'warning',
          severity: data.tempoMedio > thresholds.responseTime * 2 ? 'high' : 'medium',
          agent: agentName,
          title: 'Tempo de Resposta Elevado',
          message: `O agente ${agentName} está respondendo em ${Math.round(data.tempoMedio)}ms em média.`,
          timestamp: new Date(),
          acknowledged: false,
          metric: 'responseTime',
          value: data.tempoMedio,
          threshold: thresholds.responseTime
        });
      }

      // Low activity alert
      if (data.execucoes === 0) {
        alerts.push({
          id: `${agentType}-no-activity`,
          type: 'info',
          severity: 'low',
          agent: agentName,
          title: 'Sem Atividade',
          message: `O agente ${agentName} não teve execuções no período analisado.`,
          timestamp: new Date(),
          acknowledged: false
        });
      }

      // Inconsistent performance alert
      if (data.dias > 1 && data.execucoes > 0) {
        const avgPerDay = data.execucoes / data.dias;
        if (avgPerDay < 1 && data.execucoes >= 3) {
          alerts.push({
            id: `${agentType}-inconsistent`,
            type: 'info',
            severity: 'low',
            agent: agentName,
            title: 'Performance Inconsistente',
            message: `O agente ${agentName} tem uso irregular (${avgPerDay.toFixed(1)} execuções/dia).`,
            timestamp: new Date(),
            acknowledged: false
          });
        }
      }
    });

    return alerts.sort((a, b) => {
      // Sort by severity and timestamp
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
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

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const acknowledgeAll = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, acknowledged: true })));
  };

  const getAlertIcon = (type: string) => {
    if (type === 'error') return <XCircle className="w-5 h-5 text-red-500" />;
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-blue-500" />;
  };

  const getAlertBorderColor = (type: string) => {
    if (type === 'error') return 'border-l-red-500';
    if (type === 'warning') return 'border-l-yellow-500';
    return 'border-l-blue-500';
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-300 rounded-lg"></div>
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
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Sistema de Alertas</h3>
            <p className="text-sm text-gray-600">
              Monitoramento inteligente da performance dos agentes
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            icon={showSettings ? <EyeOff className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          >
            {showSettings ? 'Ocultar' : 'Configurar'}
          </ModernButton>
          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => setEnableNotifications(!enableNotifications)}
            icon={enableNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          >
            {enableNotifications ? 'Ativo' : 'Inativo'}
          </ModernButton>
        </div>
      </div>

      {/* Configurações de thresholds */}
      {showSettings && (
        <ModernCard variant="glass" className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Configurações de Alerta</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Sucesso Mínima (%)
              </label>
              <input
                type="number"
                value={thresholds.successRate}
                onChange={(e) => setThresholds(prev => ({ ...prev, successRate: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo Máximo (ms)
              </label>
              <input
                type="number"
                value={thresholds.responseTime}
                onChange={(e) => setThresholds(prev => ({ ...prev, responseTime: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Erro Máxima (%)
              </label>
              <input
                type="number"
                value={thresholds.errorRate}
                onChange={(e) => setThresholds(prev => ({ ...prev, errorRate: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mín. Execuções para Alerta
              </label>
              <input
                type="number"
                value={thresholds.minExecutions}
                onChange={(e) => setThresholds(prev => ({ ...prev, minExecutions: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
          </div>
        </ModernCard>
      )}

      {/* Resumo de alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModernCard variant="metric" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Alertas Críticos</p>
              <p className="text-2xl font-bold text-red-600">
                {alerts.filter(a => !a.acknowledged && a.severity === 'high').length}
              </p>
            </div>
          </div>
        </ModernCard>

        <ModernCard variant="metric" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avisos</p>
              <p className="text-2xl font-bold text-yellow-600">
                {alerts.filter(a => !a.acknowledged && a.severity === 'medium').length}
              </p>
            </div>
          </div>
        </ModernCard>

        <ModernCard variant="metric" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Informativos</p>
              <p className="text-2xl font-bold text-blue-600">
                {alerts.filter(a => !a.acknowledged && a.severity === 'low').length}
              </p>
            </div>
          </div>
        </ModernCard>
      </div>

      {/* Lista de alertas ativos */}
      {activeAlerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Alertas Ativos ({activeAlerts.length})</h4>
            <ModernButton
              variant="outline"
              size="sm"
              onClick={acknowledgeAll}
            >
              Reconhecer Todos
            </ModernButton>
          </div>

          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <ModernCard
                key={alert.id}
                variant="glass"
                className={`p-4 border-l-4 ${getAlertBorderColor(alert.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-medium text-gray-900">{alert.title}</h5>
                        <span className="text-xs text-gray-500">• {alert.agent}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          alert.severity === 'high' ? 'bg-red-100 text-red-700' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {alert.severity === 'high' ? 'Crítico' :
                           alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                      {alert.metric && (
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Valor atual: {alert.value?.toFixed(1)}</span>
                          <span>Threshold: {alert.threshold}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        {alert.timestamp.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Reconhecer
                  </ModernButton>
                </div>
              </ModernCard>
            ))}
          </div>
        </div>
      )}

      {/* Estado sem alertas */}
      {activeAlerts.length === 0 && (
        <ModernCard variant="glass" className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Tudo Funcionando Bem!
          </h4>
          <p className="text-gray-600">
            Não há alertas ativos no momento. Todos os agentes estão operando dentro dos parâmetros normais.
          </p>
        </ModernCard>
      )}

      {/* Alertas reconhecidos (opcional) */}
      {acknowledgedAlerts.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
            Ver alertas reconhecidos ({acknowledgedAlerts.length})
          </summary>
          <div className="mt-4 space-y-2">
            {acknowledgedAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="p-3 bg-gray-50 rounded-lg text-sm opacity-60">
                <div className="flex items-center space-x-2">
                  {getAlertIcon(alert.type)}
                  <span className="font-medium">{alert.title}</span>
                  <span className="text-gray-500">• {alert.agent}</span>
                </div>
                <p className="text-gray-600 mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}