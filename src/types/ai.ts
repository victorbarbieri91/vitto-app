// Tipos para o Sistema de IA Vitto Financial

export interface UserPreferences {
  default_account_id?: number;
  default_categories: { [tipo: string]: number };
  language: 'pt-BR';
  timezone: string;
  notification_settings: NotificationSettings;
}

export interface NotificationSettings {
  budget_alerts: boolean;
  goal_reminders: boolean;
  transaction_confirmations: boolean;
  insights_weekly: boolean;
}

export interface UserSettings {
  currency: 'BRL';
  date_format: 'DD/MM/YYYY';
  number_format: 'pt-BR';
  dark_mode: boolean;
}

export interface ContaComSaldo {
  id: number;
  nome: string;
  tipo: string;
  saldo_atual: number;
  saldo_previsto: number;
  instituicao?: string;
}

export interface IndicadoresMes {
  saldo_total: number;
  saldo_previsto: number;
  receitas_mes: number;
  despesas_mes: number;
  fluxo_liquido: number;
  score_saude_financeira: number;
  meta_orcamento_cumprida: number;
}

export interface TendenciaGastos {
  categoria_id: number;
  categoria_nome: string;
  variacao_percentual: number;
  media_mensal: number;
  mes_atual: number;
  tendencia: 'crescente' | 'decrescente' | 'estavel';
}

export interface SaudeFinanceira {
  score: number;
  nivel: 'excelente' | 'boa' | 'moderada' | 'preocupante';
  fatores_positivos: string[];
  fatores_negativos: string[];
  recomendacoes: string[];
}

export interface ComparacaoMensal {
  mes_anterior: {
    receitas: number;
    despesas: number;
    economia: number;
  };
  mes_atual: {
    receitas: number;
    despesas: number;
    economia: number;
  };
  variacao: {
    receitas_percentual: number;
    despesas_percentual: number;
    economia_percentual: number;
  };
}

export interface PadraoGasto {
  categoria_id: number;
  dia_semana_preferido: number;
  horario_preferido: string;
  valor_medio: number;
  frequencia_mensal: number;
}

export interface CategoriaFrequencia {
  categoria_id: number;
  categoria_nome: string;
  uso_mensal: number;
  valor_total_mes: number;
  ultimo_uso: Date;
}

export interface HorarioPattern {
  hora: number;
  frequencia: number;
  valor_medio: number;
  tipos_transacao: string[];
}

export interface LancamentoFuturo {
  id: number;
  descricao: string;
  valor: number;
  data: Date;
  tipo: 'receita' | 'despesa';
  categoria_nome: string;
  conta_nome: string;
  origem: 'recorrente' | 'parcelado' | 'agendado';
}

export interface ProjecaoMensal {
  mes: number;
  ano: number;
  saldo_projetado: number;
  receitas_previstas: number;
  despesas_previstas: number;
  metas_a_vencer: number;
  orcamentos_em_risco: number;
}

export interface Mensagem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    entities?: ExtractedEntities;
    confidence?: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatResponse {
  response: string;
  confidence?: number;
  insights?: Insight[];
  metadata?: any;
}

export interface Intencao {
  tipo: IntentType;
  confianca: number;
  timestamp: Date;
  executada: boolean;
}

export interface OperacaoRealizada {
  id: string;
  tipo: string;
  dados: any;
  timestamp: Date;
  sucesso: boolean;
  impacto_financeiro?: string;
}

export interface PreferenciaContextual {
  contexto: string;
  preferencia: string;
  aprendido_em: Date;
  usado_vezes: number;
}

// Contexto principal da IA
export interface FinancialContext {
  usuario: {
    id: string;
    nome: string;
    preferencias: UserPreferences;
    configuracoes: UserSettings;
  };
  
  patrimonio: {
    saldo_total: number;
    saldo_previsto: number;
    contas: ContaComSaldo[];
    investimentos: any[]; // Para futuro
  };
  
  indicadores: {
    mes_atual: IndicadoresMes;
    tendencias: TendenciaGastos[];
    saude_financeira: SaudeFinanceira;
    comparacao_mensal: ComparacaoMensal;
  };
  
  historico: {
    lancamentos_recentes: any[];
    padroes_gastos: PadraoGasto[];
    categorias_preferidas: CategoriaFrequencia[];
    horarios_transacoes: HorarioPattern[];
  };
  
  planejamento: {
    lancamentos_futuros: LancamentoFuturo[];
    metas_ativas: any[];
    orcamentos_ativos: any[];
    projecoes: ProjecaoMensal[];
  };
  
  conversa: {
    mensagens_recentes: Mensagem[];
    intencoes_anteriores: Intencao[];
    operacoes_realizadas: OperacaoRealizada[];
    preferencias_contextuais: PreferenciaContextual[];
  };

  // Contexto RAG híbrido
  ragContext?: {
    knowledgeBaseSources: Array<{
      content: string;
      title?: string;
      category: string;
      similarity: number;
    }>;
    userMemorySources: Array<{
      content: string;
      summary?: string;
      similarity: number;
    }>;
    contextSummary: string;
    confidenceScore: number;
    recommendedAction: string;
  };

  // Dados adicionais para contexto
  currentMonth?: number;
  currentYear?: number;
  userFinancialData?: Record<string, any>;
}

// Processamento de linguagem natural
export type IntentType = 
  | 'criar_receita'
  | 'criar_despesa' 
  | 'criar_transferencia'
  | 'criar_parcelado'
  | 'criar_recorrente'
  | 'editar_transacao'
  | 'excluir_transacao'
  | 'consultar_saldo'
  | 'consultar_gastos'
  | 'analisar_categoria'
  | 'criar_meta'
  | 'editar_meta'
  | 'criar_orcamento'
  | 'editar_orcamento'
  | 'criar_conta'
  | 'editar_conta'
  | 'criar_categoria'
  | 'editar_categoria'
  | 'gerar_relatorio'
  | 'prever_saldo'
  | 'dar_dica'
  | 'ajuda'
  | 'unknown';

export interface ExtractedEntities {
  valores: number[];
  categorias: string[];
  datas: Date[];
  contas: string[];
  parcelas: number[];
  descricoes: string[];
  tipos: ('receita' | 'despesa')[];
}

export interface ResolvedEntities {
  valor?: number;
  categoria?: {
    id: number;
    nome: string;
    tipo: string;
  };
  conta?: {
    id: number;
    nome: string;
  };
  data?: Date;
  descricao?: string;
  parcelas?: number;
  tipo?: 'receita' | 'despesa';
}

export interface Intent {
  tipo: IntentType;
  confianca: number;
}

export interface ParsedCommand {
  intent: Intent;
  entities: ResolvedEntities;
  original_text: string;
  confidence: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  clarificationMessage?: string;
  suggestions?: string[];
}

export interface OperationResult {
  type: 'operation_success' | 'operation_cancelled' | 'clarification_needed' | 'error';
  message: string;
  impact?: string;
  insights?: Insight[];
  data?: any;
  suggestions?: string[];
}

export interface Insight {
  id: string;
  tipo: 'economia' | 'investimento' | 'alerta' | 'otimizacao' | 'parabens' | 'dica';
  titulo: string;
  descricao: string;
  acao?: string;
  impacto?: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  categoria_afetada?: string;
  valor_impacto?: number;
  created_at: Date;
}

export interface Anomaly {
  tipo: 'gasto_alto' | 'gasto_incomum' | 'categoria_nova' | 'padrao_quebrado';
  descricao: string;
  valor_detectado: number;
  valor_esperado: number;
  categoria: string;
  confianca: number;
  sugestao_acao: string;
}

export interface Prediction {
  tipo: 'saldo_fim_mes' | 'gasto_categoria' | 'meta_atingida' | 'orcamento_excedido';
  valor_previsto: number;
  data_previsao: Date;
  confianca: number;
  fatores: string[];
  recomendacao: string;
}

// Resposta de erro da IA
export interface AIError {
  type: 'category_not_found' | 'account_not_found' | 'insufficient_funds' | 'invalid_amount' | 'unknown';
  message: string;
  details: any;
}

export interface ClarificationResponse {
  message: string;
  questions: string[];
  suggestions: string[];
}

export interface ErrorResponse {
  error: string;
  message: string;
  suggestions?: string[];
}

export interface RecoveryAction {
  type: 'suggest_creation' | 'suggest_selection' | 'suggest_correction' | 'fallback';
  message: string;
  options?: string[];
  action?: () => Promise<any>;
}

// Configuração da IA
export interface AIConfig {
  model: string;
  max_tokens: number;
  temperature: number;
  context_window_size: number;
  confidence_threshold: number;
  enable_learning: boolean;
  enable_insights: boolean;
}

// Métricas de performance da IA
export interface AIMetrics {
  accuracy: {
    intent_classification: number;
    entity_extraction: number;
    command_completion: number;
  };
  
  performance: {
    avg_response_time: number;
    context_build_time: number;
    operation_execution_time: number;
  };
  
  user_satisfaction: {
    successful_operations: number;
    user_corrections: number;
    session_completion_rate: number;
  };
  
  usage: {
    commands_per_day: number;
    most_used_operations: string[];
    peak_usage_hours: number[];
  };
}

export interface AIOperationLog {
  timestamp: Date;
  user_id: string;
  session_id: string;
  user_input: string;
  extracted_entities: ExtractedEntities;
  classified_intent: Intent;
  context_used: any;
  operation_executed: boolean;
  operation_type: string;
  execution_time: number;
  errors: AIError[];
  user_satisfied: boolean;
  user_corrections: string[];
}

// Tipos para context changes
export interface ContextChange {
  type: 'account_updated' | 'transaction_created' | 'goal_created' | 'budget_updated';
  data: any;
  timestamp: Date;
}

export interface RelevantData {
  transactions: any[];
  accounts: any[];
  categories: any[];
  goals: any[];
  budgets: any[];
  insights: Insight[];
} 