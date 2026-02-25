// =====================================================
// TIPOS COMPARTILHADOS
// =====================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: object;
  };
}

export interface RAGResult {
  source: string;
  content: string;
  title: string;
  category: string;
  weighted_score: number;
}

export interface DataRequest {
  fields: FieldDefinition[];
  context: string;
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'currency';
  required: boolean;
  options?: { value: string; label: string }[];
}

export interface UserProfile {
  nome: string;
  receita_mensal: number | null;
  meta_despesa: number | null;
  ai_context: Record<string, unknown>;
  perfil_financeiro: Record<string, unknown>;
}

export type ToolResult = { success: boolean; data?: unknown; error?: string };
