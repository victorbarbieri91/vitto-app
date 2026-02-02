/**
 * Tipos para o fluxo de importacao conversacional
 */

// Estados do fluxo de importacao
export type ImportFlowStep =
  | 'idle'                    // Aguardando arquivo
  | 'analyzing'               // Processando arquivo (OCR/parsing)
  | 'identifying'             // Identificando tipo de documento
  | 'confirming_type'         // Confirmando tipo com usuario
  | 'selecting_destination'   // Escolhendo destino (cartao/conta)
  | 'collecting_data'         // Coletando dados faltantes (mes/ano)
  | 'preview'                 // Mostrando preview das transacoes
  | 'importing'               // Executando importacao
  | 'completed'               // Importacao concluida
  | 'error';                  // Erro no processo

// Tipo de documento identificado
export type DocumentType =
  | 'fatura_cartao'
  | 'extrato_bancario'
  | 'comprovante_pix'
  | 'cupom_fiscal'
  | 'planilha_investimentos'
  | 'lista_despesas_fixas'
  | 'outro';

// Destino da importacao
export type ImportDestination =
  | 'transacoes'           // app_transacoes
  | 'transacoes_fixas'     // app_transacoes_fixas
  | 'patrimonio';          // app_patrimonio_ativo

// Transacao extraida do documento
export interface ExtractedTransaction {
  id: string;              // ID temporario para UI
  data: string;            // YYYY-MM-DD
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
  categoria_id?: number;
  categoria_nome?: string;
  selecionada: boolean;    // Se vai ser importada
  duplicata?: boolean;     // Se ja existe no banco
}

// Cartao de credito disponivel
export interface AvailableCard {
  id: number;
  nome: string;
  ultimos_digitos?: string;
  dia_fechamento: number;
  dia_vencimento: number;
}

// Conta bancaria disponivel
export interface AvailableAccount {
  id: number;
  nome: string;
  tipo: string;
  saldo_atual: number;
}

// Categoria disponivel
export interface AvailableCategory {
  id: number;
  nome: string;
  tipo: 'receita' | 'despesa' | 'ambos';
}

// Pergunta para o usuario
export interface ImportQuestion {
  id: string;
  tipo: 'single_choice' | 'multiple_choice' | 'text' | 'date' | 'month_year';
  pergunta: string;
  opcoes?: Array<{
    id: string | number;
    label: string;
    descricao?: string;
  }>;
  resposta?: string | number | string[];
  obrigatoria: boolean;
}

// Estado completo do fluxo de importacao
export interface ImportFlowState {
  step: ImportFlowStep;

  // Documento
  fileName?: string;
  fileType?: 'pdf' | 'xlsx' | 'csv' | 'image';
  documentType?: DocumentType;
  confianca?: number;

  // Destino
  destination?: ImportDestination;
  cartaoId?: number;
  cartaoNome?: string;
  contaId?: number;
  contaNome?: string;

  // Periodo
  mesReferencia?: number;
  anoReferencia?: number;

  // Dados extraidos
  transacoes: ExtractedTransaction[];
  totalTransacoes: number;
  valorTotal: number;

  // Perguntas pendentes
  currentQuestion?: ImportQuestion;
  questionsHistory: ImportQuestion[];

  // Observacoes e alertas
  observacoes: string[];
  alertas: string[];

  // Resultado
  importedCount?: number;
  errorMessage?: string;
}

// Acoes do fluxo
export type ImportFlowAction =
  | { type: 'START_ANALYSIS'; fileName: string; fileType: string }
  | { type: 'ANALYSIS_COMPLETE'; documentType: DocumentType; confianca: number; transacoes: ExtractedTransaction[]; observacoes: string[] }
  | { type: 'ANALYSIS_ERROR'; error: string }
  | { type: 'CONFIRM_TYPE'; documentType: DocumentType }
  | { type: 'SELECT_CARD'; cartaoId: number; cartaoNome: string }
  | { type: 'SELECT_ACCOUNT'; contaId: number; contaNome: string }
  | { type: 'SET_PERIOD'; mes: number; ano: number }
  | { type: 'ANSWER_QUESTION'; questionId: string; answer: string | number | string[] }
  | { type: 'TOGGLE_TRANSACTION'; transactionId: string }
  | { type: 'UPDATE_CATEGORY'; transactionId: string; categoryId: number; categoryName: string }
  | { type: 'START_IMPORT' }
  | { type: 'IMPORT_COMPLETE'; count: number }
  | { type: 'IMPORT_ERROR'; error: string }
  | { type: 'RESET' };

// Mensagem do chat de importacao
export interface ImportChatMessage {
  id: string;
  tipo: 'sistema' | 'usuario' | 'pergunta' | 'preview' | 'resultado';
  conteudo: string;
  timestamp: Date;
  dados?: {
    question?: ImportQuestion;
    transacoes?: ExtractedTransaction[];
    summary?: {
      total: number;
      valor: string;
      destino: string;
    };
    resultado?: {
      sucesso: boolean;
      importados: number;
      erros?: string[];
    };
  };
}

// Configuracao do agente de importacao
export interface ImportAgentConfig {
  userId: string;
  cards: AvailableCard[];
  accounts: AvailableAccount[];
  categories: AvailableCategory[];
}
