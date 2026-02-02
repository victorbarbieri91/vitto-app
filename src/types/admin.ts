// =====================================================
// ADMIN PANEL TYPES
// =====================================================

// Submodule identifiers
export type BusinessPlanSubmodule =
  | 'thesis'
  | 'market'
  | 'product'
  | 'revenue'
  | 'go_to_market'
  | 'metrics'
  | 'risks';

// Status for business plan submodules
export type BusinessPlanStatus = 'draft' | 'validating' | 'validated';

// Priority levels for agenda tasks
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Status for agenda tasks
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// =====================================================
// BUSINESS PLAN CONTENT TYPES (JSONB schemas)
// =====================================================

export interface ThesisContent {
  problem: string;
  targetAudience: string;
  valueProposition: string;
  differentiators: string[];
  hypotheses: Array<{
    text: string;
    validated: boolean;
  }>;
}

export interface MarketContent {
  segments: Array<{
    name: string;
    size: string;
    characteristics: string;
  }>;
  competitors: Array<{
    name: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  positioning: string;
}

export interface ProductContent {
  features: Array<{
    name: string;
    description: string;
    status: 'implemented' | 'in_progress' | 'planned';
  }>;
  valueDelivered: string;
  limitations: string[];
  roadmap: Array<{
    phase: string;
    description: string;
    targetDate?: string;
  }>;
}

export interface RevenueContent {
  pricing: Array<{
    model: string;
    description: string;
    value?: string;
  }>;
  plans: Array<{
    name: string;
    price: string;
    features: string[];
  }>;
  monetizationStrategies: string[];
  futureHypotheses: string[];
}

export interface GoToMarketContent {
  channels: Array<{
    name: string;
    strategy: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  strategies: string[];
  keyMessages: string[];
  targetAudiences: Array<{
    segment: string;
    message: string;
  }>;
}

export interface MetricsContent {
  keyIndicators: Array<{
    name: string;
    target: string;
    current?: string;
  }>;
  periodObjectives: Array<{
    period: string;
    objectives: string[];
    status: 'pending' | 'in_progress' | 'achieved';
  }>;
  resultsTracking: Array<{
    date: string;
    metric: string;
    value: string;
    notes?: string;
  }>;
}

export interface RisksContent {
  mappedRisks: Array<{
    risk: string;
    impact: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
    mitigation?: string;
  }>;
  decisionsMade: Array<{
    decision: string;
    date: string;
    justification: string;
    impact: string;
  }>;
  decisionsPending: Array<{
    decision: string;
    context: string;
    deadline?: string;
  }>;
  justifications: string[];
}

// Union type for all content types
export type BusinessPlanContent =
  | ThesisContent
  | MarketContent
  | ProductContent
  | RevenueContent
  | GoToMarketContent
  | MetricsContent
  | RisksContent;

// =====================================================
// DATABASE ENTITY TYPES
// =====================================================

export interface BusinessPlan {
  id: number;
  submodule: BusinessPlanSubmodule;
  version: number;
  status: BusinessPlanStatus;
  content: BusinessPlanContent;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessPlanHistory {
  id: number;
  plan_id: number;
  submodule: BusinessPlanSubmodule;
  previous_content: BusinessPlanContent | null;
  new_content: BusinessPlanContent | null;
  change_summary: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface AgendaTask {
  id: number;
  title: string;
  description: string | null;
  responsible_user_id: string | null;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  linked_submodule: BusinessPlanSubmodule | null;
  tags: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// =====================================================
// FORM/INPUT TYPES
// =====================================================

export interface CreateTaskInput {
  title: string;
  description?: string;
  responsible_user_id?: string;
  deadline?: string;
  priority?: TaskPriority;
  linked_submodule?: BusinessPlanSubmodule;
  tags?: string[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: TaskStatus;
}

export interface UpdateBusinessPlanInput {
  content: BusinessPlanContent;
  status?: BusinessPlanStatus;
}

// =====================================================
// ADMIN DASHBOARD KPI TYPES
// =====================================================

export interface AdminMetrics {
  // Métricas de usuários
  totalUsers: number;
  activeUsers7d: number;
  newUsers7d: number;
  retentionRate: number;
  activationRate: number;

  // Métricas de engajamento
  aiSessions7d: number;
  transactions7d: number;

  // Métricas de monetização (placeholder)
  mrr: number;
}

// Cores foscas para KPI cards
export type AdminKPIColor =
  | 'slate'    // #3d4f5f - default
  | 'teal'     // #2d6a6a - sucesso/crescimento
  | 'coral'    // #b85450 - destaque principal
  | 'amber'    // #8b7355 - alerta
  | 'indigo'   // #4a5568 - informação
  | 'emerald'  // #3d6b59 - positivo/monetização
  | 'rose'     // #7d4e57 - negativo
  | 'purple';  // #5b4b6e - especial

export interface AdminKPICardConfig {
  key: keyof AdminMetrics;
  title: string;
  color: AdminKPIColor;
  icon: string;
  format?: 'number' | 'percentage' | 'currency';
}

// Configuração dos 8 KPIs do dashboard
export const ADMIN_KPI_CONFIG: AdminKPICardConfig[] = [
  { key: 'totalUsers', title: 'Usuários Total', color: 'coral', icon: 'Users', format: 'number' },
  { key: 'activeUsers7d', title: 'Ativos 7d', color: 'teal', icon: 'Activity', format: 'number' },
  { key: 'newUsers7d', title: 'Novos 7d', color: 'emerald', icon: 'UserPlus', format: 'number' },
  { key: 'retentionRate', title: 'Retenção', color: 'indigo', icon: 'TrendingUp', format: 'percentage' },
  { key: 'activationRate', title: 'Ativação', color: 'purple', icon: 'CheckCircle', format: 'percentage' },
  { key: 'aiSessions7d', title: 'Sessões IA 7d', color: 'slate', icon: 'MessageSquare', format: 'number' },
  { key: 'transactions7d', title: 'Transações 7d', color: 'slate', icon: 'ArrowRightLeft', format: 'number' },
  { key: 'mrr', title: 'MRR', color: 'emerald', icon: 'DollarSign', format: 'currency' },
];

// Mapeamento de cores foscas para classes Tailwind
export const ADMIN_KPI_COLORS: Record<AdminKPIColor, string> = {
  slate: 'bg-[#3d4f5f]',
  teal: 'bg-[#2d6a6a]',
  coral: 'bg-[#b85450]',
  amber: 'bg-[#8b7355]',
  indigo: 'bg-[#4a5568]',
  emerald: 'bg-[#3d6b59]',
  rose: 'bg-[#7d4e57]',
  purple: 'bg-[#5b4b6e]',
};

// =====================================================
// SUBMODULE METADATA
// =====================================================

export interface SubmoduleInfo {
  id: BusinessPlanSubmodule;
  title: string;
  description: string;
  icon: string;
}

export const SUBMODULE_INFO: Record<BusinessPlanSubmodule, SubmoduleInfo> = {
  thesis: {
    id: 'thesis',
    title: 'Tese do Negócio',
    description: 'Problema, público-alvo, proposta de valor e hipóteses',
    icon: 'Lightbulb',
  },
  market: {
    id: 'market',
    title: 'Mercado e Concorrência',
    description: 'Segmentos, concorrentes e posicionamento',
    icon: 'TrendingUp',
  },
  product: {
    id: 'product',
    title: 'Produto e Diferenciais',
    description: 'Funcionalidades, valor entregue e roadmap',
    icon: 'Package',
  },
  revenue: {
    id: 'revenue',
    title: 'Modelo de Receita',
    description: 'Precificação, planos e monetização',
    icon: 'DollarSign',
  },
  go_to_market: {
    id: 'go_to_market',
    title: 'Go-to-Market',
    description: 'Canais, estratégias e mensagens',
    icon: 'Rocket',
  },
  metrics: {
    id: 'metrics',
    title: 'Métricas e Objetivos',
    description: 'Indicadores-chave e acompanhamento',
    icon: 'BarChart2',
  },
  risks: {
    id: 'risks',
    title: 'Riscos e Decisões',
    description: 'Riscos mapeados e decisões estratégicas',
    icon: 'AlertTriangle',
  },
};

// Status display info
export const STATUS_INFO: Record<BusinessPlanStatus, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'slate' },
  validating: { label: 'Em Validação', color: 'amber' },
  validated: { label: 'Validado', color: 'emerald' },
};

export const PRIORITY_INFO: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'slate' },
  medium: { label: 'Média', color: 'blue' },
  high: { label: 'Alta', color: 'amber' },
  urgent: { label: 'Urgente', color: 'red' },
};

export const TASK_STATUS_INFO: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'slate' },
  in_progress: { label: 'Em Andamento', color: 'blue' },
  completed: { label: 'Concluído', color: 'emerald' },
  cancelled: { label: 'Cancelado', color: 'red' },
};

// =====================================================
// ADMIN FINANCE TYPES (Finanças da Empresa)
// =====================================================

export type FinanceType = 'despesa' | 'receita';

export type FinanceCategory =
  | 'tecnologia'
  | 'desenvolvimento'
  | 'infraestrutura'
  | 'marketing'
  | 'operacional'
  | 'juridico'
  | 'outros';

export interface AdminFinanceEntry {
  id: number;
  tipo: FinanceType;
  categoria: FinanceCategory;
  descricao: string;
  valor: number;
  recorrente: boolean;
  data: string;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFinanceEntryInput {
  tipo: FinanceType;
  categoria: FinanceCategory;
  descricao: string;
  valor: number;
  recorrente?: boolean;
  data?: string;
  observacoes?: string;
}

export interface UpdateFinanceEntryInput extends Partial<CreateFinanceEntryInput> {}

// Metadados das categorias
export const FINANCE_CATEGORY_INFO: Record<FinanceCategory, { label: string; icon: string }> = {
  tecnologia: { label: 'Tecnologia', icon: 'Cpu' },
  desenvolvimento: { label: 'Desenvolvimento', icon: 'Code' },
  infraestrutura: { label: 'Infraestrutura', icon: 'Server' },
  marketing: { label: 'Marketing', icon: 'Megaphone' },
  operacional: { label: 'Operacional', icon: 'Settings' },
  juridico: { label: 'Jurídico', icon: 'Scale' },
  outros: { label: 'Outros', icon: 'MoreHorizontal' },
};

export const FINANCE_TYPE_INFO: Record<FinanceType, { label: string; color: string }> = {
  despesa: { label: 'Despesa', color: 'rose' },
  receita: { label: 'Receita', color: 'emerald' },
};
