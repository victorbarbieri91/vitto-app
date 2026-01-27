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
  // Conteúdo interativo (botões, análise de arquivo, etc.)
  interactive?: InteractiveContent;
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

// =====================================================
// TIPOS PARA MENSAGENS INTERATIVAS (IMPORT CONVERSACIONAL)
// =====================================================

// Tipo de elemento interativo
export type InteractiveElementType =
  | 'buttons'           // Botões de opção
  | 'file_analysis'     // Análise de arquivo
  | 'column_mapping'    // Mapeamento de colunas
  | 'preview_table'     // Tabela de preview
  | 'import_result'     // Resultado da importação
  | 'confirmation';     // Confirmação de ação

// Botão interativo
export interface InteractiveButton {
  id: string;
  label: string;
  value: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
}

// Elemento interativo de botões
export interface ButtonsElement {
  type: 'buttons';
  question?: string;
  buttons: InteractiveButton[];
  allowMultiple?: boolean;
}

// Elemento de análise de arquivo
export interface FileAnalysisElement {
  type: 'file_analysis';
  fileName: string;
  fileType: string;
  rowCount: number;
  columns: Array<{
    name: string;
    type: string;
    samples: string[];
    suggestedField?: string;
    confidence?: number;
  }>;
  suggestedImportType?: string;
  observations?: string[];
}

// Elemento de mapeamento de colunas
export interface ColumnMappingElement {
  type: 'column_mapping';
  importType: string;
  mappings: Array<{
    columnName: string;
    columnIndex: number;
    suggestedField: string;
    confidence: number;
    samples: string[];
  }>;
  missingRequired: string[];
  availableFields: Array<{
    field: string;
    label: string;
    required: boolean;
  }>;
}

// Elemento de preview de importação
export interface PreviewTableElement {
  type: 'preview_table';
  items: Array<{
    id: number;
    data?: string;
    descricao: string;
    valor: number;
    tipo?: string;
    categoria?: string;
    valid: boolean;
    errors?: string[];
  }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    totalValue: number;
  };
}

// Elemento de resultado de importação
export interface ImportResultElement {
  type: 'import_result';
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  totalValue: number;
  errors?: Array<{
    description: string;
    error: string;
  }>;
}

// Elemento de confirmação
export interface ConfirmationElement {
  type: 'confirmation';
  title: string;
  description: string;
  details?: Array<{
    label: string;
    value: string;
  }>;
  confirmLabel?: string;
  cancelLabel?: string;
}

// União de todos os elementos interativos
export type InteractiveElement =
  | ButtonsElement
  | FileAnalysisElement
  | ColumnMappingElement
  | PreviewTableElement
  | ImportResultElement
  | ConfirmationElement;

// Mensagem com elementos interativos
export interface InteractiveContent {
  elements: InteractiveElement[];
  contextId?: string; // ID para manter contexto da conversa (ex: importação em andamento)
}

// Estado de importação conversacional
export interface ConversationalImportState {
  id: string;
  status: 'analyzing' | 'awaiting_type' | 'awaiting_mapping' | 'awaiting_destination' | 'awaiting_confirmation' | 'importing' | 'completed' | 'error';
  file: File | null;
  fileName: string;
  fileType: string;
  analysis?: {
    rowCount: number;
    columns: Array<{
      index: number;
      name: string;
      type: string;
      samples: string[];
      suggestedField?: string;
      confidence?: number;
    }>;
    suggestedImportType?: string;
    observations?: string[];
  };
  importType?: 'transacoes' | 'transacoes_fixas' | 'patrimonio';
  mappings?: Array<{
    columnIndex: number;
    columnName: string;
    targetField: string;
  }>;
  destination?: {
    transactionType?: 'receita' | 'despesa' | 'auto';
    contaId?: number;
    cartaoId?: number;
    categoriaDefault?: number;
  };
  preparedItems?: Array<{
    id: number;
    data?: string;
    descricao: string;
    valor: number;
    tipo?: string;
    categoria?: string;
    valid: boolean;
    errors?: string[];
    selected: boolean;
  }>;
  result?: {
    imported: number;
    failed: number;
    skipped: number;
    totalValue: number;
    errors?: Array<{ description: string; error: string }>;
  };
  error?: string;
}
