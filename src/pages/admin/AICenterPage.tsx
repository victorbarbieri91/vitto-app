import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useCanAccessAICenter } from '../../hooks/useAdminPermissions';
import { ModernCard } from '../../components/ui/modern';
import {
  Settings,
  BarChart3,
  Upload,
  Database,
  Cog,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Edit3,
  TestTube,
  FileText,
  Zap,
  Brain,
  MessageCircle,
  FileSearch,
  Play,
  Shield,
  TrendingUp,
  Cpu,
  Bot
} from 'lucide-react';
import { AgentConfig, AgentConfigService } from '../../services/api/agentConfig';
import { PromptEditor } from '../../components/admin/PromptEditor';
import { MetricsObserver } from '../../components/admin/MetricsObserver';
import DocumentUpload from '../../components/admin/training/DocumentUpload';
import KnowledgeBaseDashboard from '../../components/admin/training/KnowledgeBaseDashboard';
import RAGTester from '../../components/admin/training/RAGTester';


export default function AICenterPage() {
  const canAccessAICenter = useCanAccessAICenter();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'prompts' | 'metrics' | 'training' | 'knowledge' | 'config'>('prompts');
  const [trainingTab, setTrainingTab] = useState<'upload' | 'test' | 'manage'>('upload');
  const [systemStatus, setSystemStatus] = useState({
    aiSystem: 'active',
    pgvector: 'active',
    openai: 'active',
    vectorSearch: 'active'
  });
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);

  // Verificar permissões
  if (!canAccessAICenter) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    loadAgents();
    loadMetrics();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const agentsData = await AgentConfigService.getAll();
      setAgents(agentsData);
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const metricsData = await AgentConfigService.getMetrics(1); // Últimas 24h
      const metricsMap: Record<string, any> = {};

      metricsData.forEach(metric => {
        if (!metricsMap[metric.agente_tipo]) {
          metricsMap[metric.agente_tipo] = {
            executions: 0,
            successRate: 0,
            avgTime: 0
          };
        }

        metricsMap[metric.agente_tipo].executions += metric.total_execucoes;
        const rate = metric.total_execucoes > 0
          ? Math.round((metric.total_sucessos / metric.total_execucoes) * 100)
          : 0;
        metricsMap[metric.agente_tipo].successRate = rate;
        metricsMap[metric.agente_tipo].avgTime = Math.round(metric.tempo_medio_ms);
      });

      setAgentMetrics(metricsMap);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  };

  const handleAgentUpdate = (updatedAgent: AgentConfig) => {
    setAgents(prev => prev.map(agent =>
      agent.id === updatedAgent.id ? updatedAgent : agent
    ));
    setSelectedAgent(updatedAgent);
  };

  // Função para obter configurações visuais de cada agente
  const getAgentConfig = (agentType: string) => {
    const configs = {
      analysis: {
        icon: Brain,
        gradient: 'from-blue-500 to-indigo-600',
        bgGradient: 'from-blue-50 to-indigo-50',
        borderColor: 'border-blue-200',
        summary: 'Detecta padrões, analisa tendências e gera insights acionáveis dos seus dados financeiros.',
        specialties: ['Análise de Tendências', 'Detecção de Anomalias', 'Projeções Inteligentes']
      },
      communication: {
        icon: MessageCircle,
        gradient: 'from-emerald-500 to-teal-600',
        bgGradient: 'from-emerald-50 to-teal-50',
        borderColor: 'border-emerald-200',
        summary: 'Interface principal do Vitto, responsável por comunicação natural e contextualizada.',
        specialties: ['Linguagem Natural', 'Educação Financeira', 'Respostas Contextuais']
      },
      document: {
        icon: FileSearch,
        gradient: 'from-purple-500 to-violet-600',
        bgGradient: 'from-purple-50 to-violet-50',
        borderColor: 'border-purple-200',
        summary: 'Processa documentos financeiros com OCR avançado e extração inteligente de dados.',
        specialties: ['OCR Avançado', 'Extração de Dados', 'Validação Documental']
      },
      execution: {
        icon: Play,
        gradient: 'from-orange-500 to-red-600',
        bgGradient: 'from-orange-50 to-red-50',
        borderColor: 'border-orange-200',
        summary: 'Executa operações financeiras práticas como transações, transferências e importações.',
        specialties: ['Criação de Transações', 'Transferências', 'Operações Seguras']
      },
      validation: {
        icon: Shield,
        gradient: 'from-slate-500 to-gray-600',
        bgGradient: 'from-slate-50 to-gray-50',
        borderColor: 'border-slate-200',
        summary: 'Auditor de qualidade que detecta anomalias e garante integridade dos dados.',
        specialties: ['Controle de Qualidade', 'Detecção de Anomalias', 'Auditoria de Dados']
      }
    };
    return configs[agentType] || configs.analysis;
  };

  const tabs = [
    { id: 'prompts' as const, label: 'Prompts', icon: Settings },
    { id: 'metrics' as const, label: 'Métricas', icon: BarChart3 },
    { id: 'training' as const, label: 'Treino', icon: Upload },
    { id: 'knowledge' as const, label: 'Base', icon: Database },
    { id: 'config' as const, label: 'Config', icon: Cog }
  ];

  const renderPromptsSection = () => {
    if (selectedAgent) {
      return (
        <PromptEditor
          agent={selectedAgent}
          onUpdate={handleAgentUpdate}
          onClose={() => setSelectedAgent(null)}
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* Header da seção */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-center space-x-2">
            <Bot className="w-5 h-5 text-gray-600" />
            <span>Agentes IA Especializados</span>
          </h3>
          <p className="text-sm text-gray-600">
            Cada agente possui especializações únicas para diferentes aspectos do sistema financeiro
          </p>
        </div>

        {/* Grid de cards dos agentes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const config = getAgentConfig(agent.tipo);
            const IconComponent = config.icon;

            return (
              <div
                key={agent.id}
                className={`relative overflow-hidden rounded-xl border ${config.borderColor} bg-gradient-to-br ${config.bgGradient} hover:shadow-lg transition-all duration-300 group cursor-pointer`}
                onClick={() => setSelectedAgent(agent)}
              >
                {/* Header do card */}
                <div className="p-4 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient} shadow-lg`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{agent.nome}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${agent.ativo ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs text-gray-600">
                            {agent.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                          <span className="text-xs text-gray-500">v{agent.versao}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corpo do card */}
                <div className="p-4 space-y-3">
                  {/* Resumo */}
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {config.summary}
                  </p>

                  {/* Especialidades */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-700">Especialidades:</div>
                    <div className="flex flex-wrap gap-1">
                      {config.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white/60 text-xs text-gray-700 rounded-full border border-white/40"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Métricas reais dos agentes */}
                  <div className="pt-2 border-t border-white/20">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-gray-900">
                          {agentMetrics[agent.tipo]?.executions || 0}
                        </div>
                        <div className="text-xs text-gray-600">Execuções</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-green-600">
                          {agentMetrics[agent.tipo]?.successRate || 0}%
                        </div>
                        <div className="text-xs text-gray-600">Sucesso</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-blue-600">
                          {agentMetrics[agent.tipo]?.avgTime || 0}ms
                        </div>
                        <div className="text-xs text-gray-600">Tempo</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer com botões */}
                <div className="p-3 bg-white/30 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgent(agent);
                        }}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-white/60 hover:bg-white/80 rounded-md transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implementar teste rápido
                        }}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-white/60 hover:bg-white/80 rounded-md transition-colors"
                      >
                        <TestTube className="w-3 h-3" />
                        <span>Testar</span>
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implementar toggle de ativo/inativo
                      }}
                      className={`w-8 h-4 rounded-full transition-colors ${
                        agent.ativo
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                        agent.ativo ? 'translate-x-4' : 'translate-x-0.5'
                      }`}></div>
                    </button>
                  </div>
                </div>

                {/* Efeito hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Rodapé com informações */}
        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Clique em um agente para editar seus prompts e configurações
          </p>
        </div>
      </div>
    );
  };

  const renderMetricsSection = () => (
    <MetricsObserver refreshInterval={30} />
  );

  const renderTrainingSection = () => {
    return (
      <div className="space-y-4">
        {/* Status do sistema */}
        <div className="flex items-center space-x-6 py-3 px-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">pgvector</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">OpenAI</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Busca Ativa</span>
            </div>
          </div>
        </div>

        {/* Sub-navegação */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'upload', label: 'Upload Docs', icon: Upload },
            { id: 'test', label: 'Testar RAG', icon: TestTube },
            { id: 'manage', label: 'Gerenciar', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setTrainingTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  trainingTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Conteúdo baseado na sub-aba */}
        <div className="min-h-[400px]">
          {trainingTab === 'upload' && <DocumentUpload onUploadComplete={() => {}} />}
          {trainingTab === 'test' && <RAGTester />}
          {trainingTab === 'manage' && <KnowledgeBaseDashboard />}
        </div>
      </div>
    );
  };

  const renderKnowledgeSection = () => {
    // Por enquanto mostrar valores realistas mas indicar que está em desenvolvimento
    const knowledgeStats = {
      documents: 0, // Será preenchido quando documentos forem adicionados
      indexProgress: 0, // Será calculado baseado no processamento
      qualityScore: 0 // Será calculado baseado no feedback
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <Database className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Documentos</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{knowledgeStats.documents}</div>
            <div className="text-sm text-gray-600">vectorizados</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <Activity className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Índice</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{knowledgeStats.indexProgress}%</div>
            <div className="text-sm text-gray-600">atualizado</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <Zap className="w-5 h-5 text-coral-600" />
              <span className="font-medium text-gray-900">Qualidade</span>
            </div>
            <div className="text-2xl font-bold text-coral-600">{knowledgeStats.qualityScore}%</div>
            <div className="text-sm text-gray-600">precisão</div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Browser de Conhecimentos</h4>
        <div className="text-center text-gray-500 py-8">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Interface para explorar e gerenciar a base de conhecimento.
            <br />Disponível em breve.
          </p>
        </div>
      </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const renderConfigSection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Sistema IA</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">RAG Híbrido</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Ativo</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Auto-aprendizado</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Ativo</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Métricas</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Coletando</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Modelos</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">OpenAI GPT-4</span>
              <span className="text-sm font-medium text-gray-900">Principal</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Embeddings</span>
              <span className="text-sm font-medium text-gray-900">text-embedding-3-small</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Temperatura</span>
              <span className="text-sm font-medium text-gray-900">0.7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header com status do sistema */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Centro de Comando IA</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Sistema Operacional</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navegação horizontal */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo */}
        <ModernCard variant="glass" padding="lg">
          {activeTab === 'prompts' && renderPromptsSection()}
          {activeTab === 'metrics' && renderMetricsSection()}
          {activeTab === 'training' && renderTrainingSection()}
          {activeTab === 'knowledge' && renderKnowledgeSection()}
          {activeTab === 'config' && renderConfigSection()}
        </ModernCard>
      </div>
    </div>
  );
}