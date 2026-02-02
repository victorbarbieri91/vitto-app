/**
 * Smart Import Types
 *
 * Tipos para o sistema de importacao inteligente que suporta:
 * - Transacoes normais (receitas/despesas)
 * - Transacoes fixas/recorrentes
 * - Patrimonio/Investimentos
 */

// Tipo de destino da importacao
export type ImportTarget = 'transacoes' | 'transacoes_fixas' | 'patrimonio';

// Tipo de arquivo suportado
export type FileType = 'pdf' | 'xlsx' | 'xls' | 'csv' | 'image';

// Tipo de transacao
export type TransactionType = 'receita' | 'despesa' | 'despesa_cartao';

// Campos mapeáveis para cada tipo de importacao
export type TransactionField =
  | 'data'
  | 'descricao'
  | 'valor'
  | 'categoria'
  | 'tipo'
  | 'conta'
  | 'cartao'
  | 'observacoes'
  | 'ignorar';

export type RecurringField =
  | 'descricao'
  | 'valor'
  | 'tipo'
  | 'dia_mes'
  | 'categoria'
  | 'conta'
  | 'cartao'
  | 'data_inicio'
  | 'data_fim'
  | 'observacoes'
  | 'ignorar';

export type AssetField =
  | 'nome'
  | 'categoria'
  | 'valor_atual'
  | 'valor_aquisicao'
  | 'data_aquisicao'
  | 'instituicao'
  | 'subcategoria'
  | 'observacoes'
  | 'ignorar';

export type MappableField = TransactionField | RecurringField | AssetField;

// Informacao de uma coluna detectada
export interface ColumnInfo {
  index: number;
  originalName: string;
  normalizedName: string;
  sampleValues: string[];
  detectedType: 'date' | 'number' | 'text' | 'category' | 'unknown';
  suggestedField: MappableField;
  confidence: number;
}

// Mapeamento de coluna definido pelo usuario
export interface ColumnMapping {
  columnIndex: number;
  columnName: string;
  targetField: MappableField;
  sampleValues: string[];
}

// Resultado da analise do arquivo
export interface FileAnalysis {
  success: boolean;
  error?: string;

  // Info do arquivo
  fileName: string;
  fileType: FileType;
  fileSize: number;

  // Dados detectados
  rowCount: number;
  columns: ColumnInfo[];
  sampleRows: Record<string, any>[];

  // Sugestoes da IA
  suggestedImportType: ImportTarget;
  suggestedMappings: ColumnMapping[];
  confidence: number;
  observations: string[];

  // Dados extras da Vision API (quando arquivo é imagem)
  visionData?: any;
}

// Configuracao do passo 1 - Tipo de importacao
export interface Step1Config {
  importType: ImportTarget;
}

// Configuracao do passo 2 - Mapeamento de colunas
export interface Step2Config {
  mappings: ColumnMapping[];
}

// Configuracao do passo 3 - Destino
export interface Step3Config {
  transactionType: TransactionType | 'auto'; // 'auto' = detectar pelo valor
  destinationType: 'conta' | 'cartao' | 'auto'; // 'auto' = detectar pela coluna
  contaId?: number;
  cartaoId?: number;
  categoriaDefault?: number;
}

// Configuracao do passo 4 - Selecao de itens
export interface Step4Config {
  selectedIds: Set<number>;
}

// Configuracao completa do wizard
export interface ImportWizardConfig {
  step1: Step1Config;
  step2: Step2Config;
  step3: Step3Config;
  step4: Step4Config;
}

// Item preparado para importacao
export interface PreparedImportItem {
  id: number; // indice da linha no arquivo
  selected: boolean;
  valid: boolean;
  validationErrors: string[];

  // Campos extraidos
  data?: string;
  descricao?: string;
  valor?: number;
  tipo?: TransactionType;
  categoria?: string;
  categoriaId?: number;
  contaId?: number;
  cartaoId?: number;
  observacoes?: string;

  // Para transacoes fixas
  diaMes?: number;
  dataInicio?: string;
  dataFim?: string;

  // Para patrimonio
  nome?: string;
  categoriaPatrimonio?: string;
  valorAtual?: number;
  valorAquisicao?: number;
  dataAquisicao?: string;
  instituicao?: string;

  // Dados originais
  rawData: Record<string, any>;
}

// Resultado da preparacao dos dados
export interface PreparedImportData {
  items: PreparedImportItem[];
  totalItems: number;
  validItems: number;
  invalidItems: number;
  totalValue: number;
  dateRange?: {
    start: string;
    end: string;
  };
  categoriesFound: string[];
}

// Resultado da importacao
export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  errors: ImportError[];
  summary: {
    totalValue: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
  };
}

export interface ImportError {
  itemIndex: number;
  itemDescription: string;
  error: string;
}

// Estado do wizard
export interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  file: File | null;
  analysis: FileAnalysis | null;
  config: Partial<ImportWizardConfig>;
  preparedData: PreparedImportData | null;
  isAnalyzing: boolean;
  isImporting: boolean;
  importResult: ImportResult | null;
  error: string | null;
}

// Opcoes de categoria de patrimonio
export const PATRIMONIO_CATEGORIES = [
  { value: 'liquidez', label: 'Liquidez', icon: '💰' },
  { value: 'renda_fixa', label: 'Renda Fixa', icon: '📈' },
  { value: 'renda_variavel', label: 'Renda Variável', icon: '📊' },
  { value: 'cripto', label: 'Criptomoedas', icon: '₿' },
  { value: 'imoveis', label: 'Imóveis', icon: '🏠' },
  { value: 'veiculos', label: 'Veículos', icon: '🚗' },
  { value: 'previdencia', label: 'Previdência', icon: '🏦' },
  { value: 'outros', label: 'Outros', icon: '📦' },
] as const;

// Labels para campos por tipo de importacao
export const FIELD_LABELS: Record<ImportTarget, Record<string, { label: string; required: boolean; icon: string }>> = {
  transacoes: {
    data: { label: 'Data', required: true, icon: '📅' },
    descricao: { label: 'Descrição', required: true, icon: '📝' },
    valor: { label: 'Valor', required: true, icon: '💰' },
    categoria: { label: 'Categoria', required: false, icon: '🏷️' },
    tipo: { label: 'Tipo (Receita/Despesa)', required: false, icon: '↕️' },
    conta: { label: 'Conta', required: false, icon: '🏦' },
    cartao: { label: 'Cartão', required: false, icon: '💳' },
    observacoes: { label: 'Observações', required: false, icon: '📋' },
    ignorar: { label: 'Ignorar coluna', required: false, icon: '🚫' },
  },
  transacoes_fixas: {
    descricao: { label: 'Descrição', required: true, icon: '📝' },
    valor: { label: 'Valor', required: true, icon: '💰' },
    tipo: { label: 'Tipo (Receita/Despesa)', required: true, icon: '↕️' },
    dia_mes: { label: 'Dia do Mês', required: true, icon: '📅' },
    categoria: { label: 'Categoria', required: false, icon: '🏷️' },
    conta: { label: 'Conta', required: false, icon: '🏦' },
    cartao: { label: 'Cartão', required: false, icon: '💳' },
    data_inicio: { label: 'Data Início', required: false, icon: '▶️' },
    data_fim: { label: 'Data Fim', required: false, icon: '⏹️' },
    observacoes: { label: 'Observações', required: false, icon: '📋' },
    ignorar: { label: 'Ignorar coluna', required: false, icon: '🚫' },
  },
  patrimonio: {
    nome: { label: 'Nome do Ativo', required: true, icon: '📝' },
    categoria: { label: 'Categoria', required: true, icon: '🏷️' },
    valor_atual: { label: 'Valor Atual', required: true, icon: '💰' },
    valor_aquisicao: { label: 'Valor de Aquisição', required: false, icon: '💵' },
    data_aquisicao: { label: 'Data de Aquisição', required: false, icon: '📅' },
    instituicao: { label: 'Instituição', required: false, icon: '🏦' },
    subcategoria: { label: 'Subcategoria', required: false, icon: '📂' },
    observacoes: { label: 'Observações', required: false, icon: '📋' },
    ignorar: { label: 'Ignorar coluna', required: false, icon: '🚫' },
  },
};

// Campos obrigatorios por tipo
export const REQUIRED_FIELDS: Record<ImportTarget, string[]> = {
  transacoes: ['data', 'descricao', 'valor'],
  transacoes_fixas: ['descricao', 'valor', 'tipo', 'dia_mes'],
  patrimonio: ['nome', 'categoria', 'valor_atual'],
};
