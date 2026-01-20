/**
 * Tipos para o módulo Central do Patrimônio
 * Suporta múltiplas categorias de ativos com campos específicos
 */

// =============================================
// CATEGORIAS E ENUMS
// =============================================

export type CategoriaAtivo =
  | 'liquidez'
  | 'renda_fixa'
  | 'renda_variavel'
  | 'cripto'
  | 'imoveis'
  | 'veiculos'
  | 'previdencia'
  | 'outros';

export type TipoRentabilidade = 'pre' | 'pos' | 'ipca' | 'cdi';
export type TipoLiquidez = 'diaria' | 'vencimento' | 'carencia';
export type TipoTitulo = 'CDB' | 'LCI' | 'LCA' | 'Tesouro Direto' | 'Debentures' | 'Outro';
export type TipoAtivoRV = 'Acao' | 'FII' | 'ETF' | 'BDR';
export type TipoCripto = 'Bitcoin' | 'Ethereum' | 'Stablecoin' | 'Altcoin';
export type TipoImovel = 'Casa' | 'Apartamento' | 'Terreno' | 'Comercial' | 'Outro';
export type TipoVeiculo = 'Carro' | 'Moto' | 'Outros';
export type TipoPrevidencia = 'PGBL' | 'VGBL' | 'Outro';

// =============================================
// DADOS ESPECÍFICOS POR CATEGORIA (JSONB)
// =============================================

export interface DadosRendaFixa {
  ticker?: string;
  taxa_rentabilidade: number;
  tipo_rentabilidade: TipoRentabilidade;
  data_vencimento?: string;
  liquidez: TipoLiquidez;
  dias_carencia?: number;
  tipo_titulo: TipoTitulo;
  isento_ir?: boolean;
}

export interface DadosRendaVariavel {
  ticker: string;
  quantidade: number;
  preco_medio: number;
  setor?: string;
  dividendos_recebidos?: number;
  tipo_ativo: TipoAtivoRV;
}

export interface DadosCripto {
  ticker: string;
  quantidade: number;
  preco_medio_usd?: number;
  preco_medio_brl?: number;
  exchange?: string;
  wallet?: 'Exchange' | 'Cold Wallet' | 'Hot Wallet';
  tipo_cripto: TipoCripto;
}

export interface DadosImovel {
  tipo_imovel: TipoImovel;
  endereco?: string;
  cidade?: string;
  area_m2?: number;
  valor_venal?: number;
  valor_mercado?: number;
  financiado: boolean;
  saldo_devedor?: number;
  parcela_mensal?: number;
  alugado: boolean;
  renda_aluguel?: number;
}

export interface DadosVeiculo {
  tipo_veiculo: TipoVeiculo;
  marca?: string;
  modelo?: string;
  ano?: number;
  placa?: string;
  valor_fipe?: number;
  financiado: boolean;
  saldo_devedor?: number;
  parcela_mensal?: number;
}

export interface DadosPrevidencia {
  tipo_previdencia: TipoPrevidencia;
  administradora?: string;
  nome_fundo?: string;
  taxa_administracao?: number;
  taxa_carregamento?: number;
  contribuicao_mensal?: number;
}

export interface DadosOutros {
  descricao_detalhada?: string;
  tipo_bem?: string;
}

export type DadosEspecificos =
  | DadosRendaFixa
  | DadosRendaVariavel
  | DadosCripto
  | DadosImovel
  | DadosVeiculo
  | DadosPrevidencia
  | DadosOutros
  | Record<string, unknown>;

// =============================================
// ENTIDADE PRINCIPAL
// =============================================

export interface PatrimonioAtivo {
  id: number;
  user_id: string;
  nome: string;
  categoria: CategoriaAtivo;
  subcategoria?: string | null;
  valor_atual: number;
  valor_aquisicao?: number | null;
  data_aquisicao?: string | null;
  instituicao?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  dados_especificos: DadosEspecificos;
  conta_id?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export type NewPatrimonioAtivo = Omit<PatrimonioAtivo, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdatePatrimonioAtivo = Partial<Omit<NewPatrimonioAtivo, 'categoria'>>;

// =============================================
// HISTÓRICO
// =============================================

export interface PatrimonioHistorico {
  id: number;
  user_id: string;
  ativo_id?: number | null;
  mes: number;
  ano: number;
  valor_inicio_mes: number;
  valor_fim_mes: number;
  variacao_absoluta: number;
  variacao_percentual: number;
  categoria?: string | null;
  created_at: string;
}

// =============================================
// DTOs PARA VISUALIZAÇÃO
// =============================================

export interface PatrimonioPorCategoria {
  categoria: CategoriaAtivo;
  valor_total: number;
  quantidade_ativos: number;
  percentual: number;
}

export interface EvolucaoPatrimonial {
  mes: number;
  ano: number;
  patrimonio_total: number;
  variacao_mensal: number;
  variacao_percentual: number;
}

export interface PatrimonioConsolidado {
  patrimonio_total: number;
  patrimonio_liquido: number;
  total_dividas: number;
  variacao_mes_valor: number;
  variacao_mes_percentual: number;
  quantidade_ativos: number;
  por_categoria: PatrimonioPorCategoria[];
  evolucao_12_meses: EvolucaoPatrimonial[];
}

// =============================================
// METADADOS DE CATEGORIAS (para UI)
// =============================================

export interface CategoriaMetadata {
  id: CategoriaAtivo;
  nome: string;
  icone: string;
  cor: string;
  corHex: string;
  descricao: string;
}

export const CATEGORIAS_METADATA: Record<CategoriaAtivo, CategoriaMetadata> = {
  liquidez: {
    id: 'liquidez',
    nome: 'Liquidez',
    icone: 'Wallet',
    cor: 'emerald',
    corHex: '#10B981',
    descricao: 'Contas bancárias e dinheiro disponível'
  },
  renda_fixa: {
    id: 'renda_fixa',
    nome: 'Renda Fixa',
    icone: 'TrendingUp',
    cor: 'blue',
    corHex: '#3B82F6',
    descricao: 'CDB, LCI, LCA, Tesouro Direto, Debêntures'
  },
  renda_variavel: {
    id: 'renda_variavel',
    nome: 'Renda Variável',
    icone: 'BarChart3',
    cor: 'violet',
    corHex: '#8B5CF6',
    descricao: 'Ações, FIIs, ETFs, BDRs'
  },
  cripto: {
    id: 'cripto',
    nome: 'Criptomoedas',
    icone: 'Bitcoin',
    cor: 'orange',
    corHex: '#F97316',
    descricao: 'Bitcoin, Ethereum, Stablecoins'
  },
  imoveis: {
    id: 'imoveis',
    nome: 'Imóveis',
    icone: 'Home',
    cor: 'amber',
    corHex: '#F59E0B',
    descricao: 'Casa, Apartamento, Terreno, Comercial'
  },
  veiculos: {
    id: 'veiculos',
    nome: 'Veículos',
    icone: 'Car',
    cor: 'slate',
    corHex: '#64748B',
    descricao: 'Carros, Motos'
  },
  previdencia: {
    id: 'previdencia',
    nome: 'Previdência',
    icone: 'Shield',
    cor: 'teal',
    corHex: '#14B8A6',
    descricao: 'PGBL, VGBL, Previdência Privada'
  },
  outros: {
    id: 'outros',
    nome: 'Outros',
    icone: 'Package',
    cor: 'gray',
    corHex: '#6B7280',
    descricao: 'Joias, Arte, Empréstimos a receber'
  }
};

// =============================================
// SUBCATEGORIAS POR CATEGORIA
// =============================================

export const SUBCATEGORIAS: Record<CategoriaAtivo, string[]> = {
  liquidez: ['Conta Corrente', 'Conta Poupança', 'Conta Digital', 'Conta Salário'],
  renda_fixa: ['CDB', 'LCI', 'LCA', 'Tesouro Selic', 'Tesouro IPCA+', 'Tesouro Prefixado', 'Debêntures', 'CRI', 'CRA'],
  renda_variavel: ['Ações', 'FIIs', 'ETFs', 'BDRs'],
  cripto: ['Bitcoin', 'Ethereum', 'Stablecoins', 'Altcoins', 'NFTs'],
  imoveis: ['Casa', 'Apartamento', 'Terreno', 'Sala Comercial', 'Galpão', 'Fazenda'],
  veiculos: ['Carro', 'Moto', 'Caminhão', 'Barco', 'Outros'],
  previdencia: ['PGBL', 'VGBL', 'Fundo de Pensão'],
  outros: ['Joias', 'Arte', 'Colecionáveis', 'Empréstimos a Receber', 'Participações Societárias']
};

// =============================================
// HELPERS
// =============================================

/**
 * Retorna o nome formatado da categoria
 */
export function getNomeCategoria(categoria: CategoriaAtivo): string {
  return CATEGORIAS_METADATA[categoria]?.nome || categoria;
}

/**
 * Retorna a cor da categoria
 */
export function getCorCategoria(categoria: CategoriaAtivo): string {
  return CATEGORIAS_METADATA[categoria]?.cor || 'gray';
}

/**
 * Retorna a cor hex da categoria
 */
export function getCorHexCategoria(categoria: CategoriaAtivo): string {
  return CATEGORIAS_METADATA[categoria]?.corHex || '#6B7280';
}

/**
 * Calcula rentabilidade de um ativo
 */
export function calcularRentabilidade(ativo: PatrimonioAtivo): {
  valor: number;
  percentual: number;
} {
  const valorAquisicao = ativo.valor_aquisicao || 0;
  const valorAtual = ativo.valor_atual;
  const valor = valorAtual - valorAquisicao;
  const percentual = valorAquisicao > 0 ? (valor / valorAquisicao) * 100 : 0;

  return { valor, percentual };
}

/**
 * Verifica se um ativo tem financiamento
 */
export function ativoTemFinanciamento(ativo: PatrimonioAtivo): boolean {
  const dados = ativo.dados_especificos as DadosImovel | DadosVeiculo;
  return dados?.financiado === true && (dados?.saldo_devedor || 0) > 0;
}

/**
 * Obtém o saldo devedor de um ativo financiado
 */
export function getSaldoDevedor(ativo: PatrimonioAtivo): number {
  const dados = ativo.dados_especificos as DadosImovel | DadosVeiculo;
  return dados?.saldo_devedor || 0;
}
