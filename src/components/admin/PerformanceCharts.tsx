import { useState, useEffect } from 'react';
import { AgentMetrics, AgentConfigService } from '../../services/api/agentConfig';
import { ModernCard } from '../ui/modern';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Calendar, TrendingUp, Clock, Target } from 'lucide-react';

interface PerformanceChartsProps {
  period: number;
}

export function PerformanceCharts({ period }: PerformanceChartsProps) {
  const [metrics, setMetrics] = useState<AgentMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await AgentConfigService.getMetrics(period);
      setMetrics(data);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Preparar dados para os gráficos
  const prepareTimeSeriesData = () => {
    const dailyData: Record<string, {
      date: string;
      total_execucoes: number;
      total_sucessos: number;
      total_falhas: number;
      tempo_medio: number;
      agents: number;
    }> = {};

    metrics.forEach(metric => {
      const date = new Date(metric.data_metricas).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });

      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          total_execucoes: 0,
          total_sucessos: 0,
          total_falhas: 0,
          tempo_medio: 0,
          agents: 0
        };
      }

      dailyData[date].total_execucoes += metric.total_execucoes;
      dailyData[date].total_sucessos += metric.total_sucessos;
      dailyData[date].total_falhas += metric.total_falhas;
      dailyData[date].tempo_medio = (dailyData[date].tempo_medio + metric.tempo_medio_ms) / 2;
      dailyData[date].agents += 1;
    });

    return Object.values(dailyData).sort((a, b) => {
      const [dayA, monthA] = a.date.split('/');
      const [dayB, monthB] = b.date.split('/');
      return new Date(`2024-${monthA}-${dayA}`).getTime() - new Date(`2024-${monthB}-${dayB}`).getTime();
    });
  };

  const prepareAgentComparisonData = () => {
    const agentData: Record<string, {
      name: string;
      tipo: string;
      execucoes: number;
      sucessos: number;
      falhas: number;
      tempo_medio: number;
      taxa_sucesso: number;
      dias: number;
    }> = {};

    metrics.forEach(metric => {
      if (!agentData[metric.agente_tipo]) {
        agentData[metric.agente_tipo] = {
          name: getAgentName(metric.agente_tipo),
          tipo: metric.agente_tipo,
          execucoes: 0,
          sucessos: 0,
          falhas: 0,
          tempo_medio: 0,
          taxa_sucesso: 0,
          dias: 0
        };
      }

      const agent = agentData[metric.agente_tipo];
      agent.execucoes += metric.total_execucoes;
      agent.sucessos += metric.total_sucessos;
      agent.falhas += metric.total_falhas;
      agent.tempo_medio = (agent.tempo_medio + metric.tempo_medio_ms) / 2;
      agent.dias += 1;
    });

    // Calcular taxa de sucesso
    Object.values(agentData).forEach((agent) => {
      agent.taxa_sucesso = agent.execucoes > 0 ? Math.round((agent.sucessos / agent.execucoes) * 100) : 0;
      agent.tempo_medio = Math.round(agent.tempo_medio);
    });

    return Object.values(agentData);
  };

  const prepareDistributionData = () => {
    const totalExecucoes = metrics.reduce((sum, m) => sum + m.total_execucoes, 0);
    const agentDistribution: Record<string, number> = {};

    metrics.forEach(metric => {
      if (!agentDistribution[metric.agente_tipo]) {
        agentDistribution[metric.agente_tipo] = 0;
      }
      agentDistribution[metric.agente_tipo] += metric.total_execucoes;
    });

    return Object.entries(agentDistribution).map(([tipo, execucoes]) => ({
      name: getAgentName(tipo),
      value: execucoes,
      percentage: totalExecucoes > 0 ? Math.round((execucoes / totalExecucoes) * 100) : 0
    }));
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

  const timeSeriesData = prepareTimeSeriesData();
  const agentComparisonData = prepareAgentComparisonData();
  const distributionData = prepareDistributionData();

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-80 bg-gray-300 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">Gráficos de Performance</h3>
      </div>

      {/* Linha temporal de atividade */}
      <ModernCard variant="glass" className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">Atividade ao Longo do Tempo</h4>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value, name) => [
                value,
                name === 'total_execucoes' ? 'Execuções' :
                name === 'total_sucessos' ? 'Sucessos' :
                name === 'total_falhas' ? 'Falhas' : name
              ]}
            />
            <Line
              type="monotone"
              dataKey="total_execucoes"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Execuções"
            />
            <Line
              type="monotone"
              dataKey="total_sucessos"
              stroke="#10B981"
              strokeWidth={2}
              name="Sucessos"
            />
            <Line
              type="monotone"
              dataKey="total_falhas"
              stroke="#EF4444"
              strokeWidth={2}
              name="Falhas"
            />
          </LineChart>
        </ResponsiveContainer>
      </ModernCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparação de agentes - Taxa de sucesso */}
        <ModernCard variant="glass" className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-gray-900">Taxa de Sucesso por Agente</h4>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Taxa de Sucesso']}
              />
              <Bar
                dataKey="taxa_sucesso"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ModernCard>

        {/* Tempo de resposta médio */}
        <ModernCard variant="glass" className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-orange-600" />
            <h4 className="font-medium text-gray-900">Tempo de Resposta Médio</h4>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value}ms`, 'Tempo Médio']}
              />
              <Bar
                dataKey="tempo_medio"
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ModernCard>

        {/* Volume de execuções por agente */}
        <ModernCard variant="glass" className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h4 className="font-medium text-gray-900">Volume de Execuções</h4>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [value, 'Execuções']}
              />
              <Bar
                dataKey="execucoes"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ModernCard>

        {/* Distribuição de uso dos agentes */}
        <ModernCard variant="glass" className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart className="w-5 h-5 text-indigo-600" />
            <h4 className="font-medium text-gray-900">Distribuição de Uso</h4>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, 'Execuções']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ModernCard>
      </div>

      {/* Resumo estatístico */}
      <ModernCard variant="glass" className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">Resumo Estatístico</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {timeSeriesData.reduce((sum, day: any) => sum + day.total_execucoes, 0)}
            </div>
            <div className="text-sm text-gray-600">Total de Execuções</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(
                (timeSeriesData.reduce((sum, day: any) => sum + day.total_sucessos, 0) /
                 timeSeriesData.reduce((sum, day: any) => sum + day.total_execucoes, 0)) * 100
              ) || 0}%
            </div>
            <div className="text-sm text-gray-600">Taxa de Sucesso Geral</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(
                timeSeriesData.reduce((sum, day: any) => sum + day.tempo_medio, 0) /
                timeSeriesData.length
              ) || 0}ms
            </div>
            <div className="text-sm text-gray-600">Tempo Médio Global</div>
          </div>
        </div>
      </ModernCard>
    </div>
  );
}