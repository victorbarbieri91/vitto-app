// =====================================================
// TIPOS PARA CENTRAL IA
// =====================================================

// Sessão de Chat
export interface ChatSession {
  id: string;
  user_id: string;
  titulo: string | null;
  created_at: string;
  updated_at: string;
  mensagem_count: number;
  ultima_mensagem: string | null;
  metadata: Record<string, unknown>;
}

// Mensagem de Chat
export interface ChatMessage {
  id?: string;
  sessao_id?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  metadata?: Record<string, unknown>;
  created_at?: string;
}

// Tool Call (chamada de ferramenta)
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

// Resultado de Tool
export interface ToolResult {
  tool_call_id: string;
  content: string;
}

// Ação Pendente de Confirmação
export interface PendingAction {
  id: string;
  user_id?: string;
  sessao_id?: string;
  action_type: string;
  action_data: Record<string, unknown>;
  preview_message: string;
  status?: 'pending' | 'confirmed' | 'rejected' | 'expired';
  expires_at?: string;
  created_at?: string;
}

// Resposta do Agente
export interface AgentResponse {
  type: 'complete' | 'needs_confirmation' | 'needs_data' | 'error' | 'streaming';
  message?: string;
  pendingAction?: PendingAction;
  dataRequest?: DataRequest;
  error?: string;
  sessionId?: string;
}

// Solicitação de Dados (para modal dinâmico)
export interface DataRequest {
  fields: FieldDefinition[];
  context: string;
}

// Definição de Campo para Modal
export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'currency';
  required: boolean;
  options?: SelectOption[];
  defaultValue?: string | number;
  placeholder?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

// Quick Action (ação pré-programada)
export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  prompt: string;
  category: 'consulta' | 'acao' | 'analise';
}

// Estado do Chat
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentSession: ChatSession | null;
  pendingAction: PendingAction | null;
  dataRequest: DataRequest | null;
}

// Request para API
export interface CentralIARequest {
  messages: ChatMessage[];
  sessionId?: string;
  confirmationToken?: string;
  confirmed?: boolean;
  userData?: Record<string, unknown>;
}

// Documentação do Sistema
export interface SystemDoc {
  id: string;
  categoria: string;
  titulo: string;
  conteudo: string;
  metadata: Record<string, unknown>;
  ativo: boolean;
  created_at: string;
}

// Configuração do Chat
export interface ChatConfig {
  maxIterations: number;
  enableStreaming: boolean;
  showToolExecution: boolean;
  confirmDestructiveActions: boolean;
}

// Dados para preview de ação
export interface ActionPreview {
  tipo: 'transacao' | 'meta' | 'orcamento' | 'outro';
  titulo: string;
  campos: {
    label: string;
    valor: string;
  }[];
  alerta?: string;
}

// Estado de UI do Chat
export interface ChatUIState {
  isSidebarOpen: boolean;
  isQuickActionsOpen: boolean;
  isConfirmModalOpen: boolean;
  isDataModalOpen: boolean;
  selectedSession: string | null;
}

// Filtros para histórico de sessões
export interface SessionFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

// Métricas de uso
export interface ChatMetrics {
  totalSessions: number;
  totalMessages: number;
  averageMessagesPerSession: number;
  mostUsedActions: string[];
}
