/**
 * Types para o módulo Juntos - Finanças Compartilhadas
 */

// Tipos de grupo
export type TipoGrupo = 'casal' | 'familia' | 'parceiros';
export type PapelMembro = 'admin' | 'membro';
export type StatusConvite = 'pendente' | 'aceito' | 'recusado' | 'expirado';
export type StatusSolicitacao = 'pendente' | 'aceito' | 'recusado';

// Permissões de visualização
export interface PermissoesMembro {
  patrimonio: boolean;
  receitas: boolean;
  despesas: boolean;
  transacoes: boolean;
  metas: boolean;
}

// Grupo compartilhado
export interface GrupoCompartilhado {
  id: number;
  nome: string;
  criado_por: string;
  tipo: TipoGrupo;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Resumo de grupo (para listagem)
export interface GrupoResumo {
  id: number;
  nome: string;
  tipo: TipoGrupo;
  papel: PapelMembro;
  criado_por: string;
  total_membros: number;
  created_at: string;
}

// Membro do grupo
export interface MembroGrupo {
  id: number;
  grupo_id: number;
  user_id: string;
  papel: PapelMembro;
  apelido: string | null;
  pode_ver_patrimonio: boolean;
  pode_ver_receitas: boolean;
  pode_ver_despesas: boolean;
  pode_ver_transacoes: boolean;
  pode_ver_metas: boolean;
  aceito_em: string | null;
  created_at: string;
}

// Membro com dados financeiros (retornado pela RPC)
export interface MembroDadosFinanceiros {
  user_id: string;
  apelido: string;
  avatar: string | null;
  papel: PapelMembro;
  permissoes: PermissoesMembro;
  patrimonio: number | null;
  receitas_mes: number | null;
  despesas_mes: number | null;
}

// Convite para grupo
export interface ConviteGrupo {
  id: number;
  grupo_id: number;
  convidado_email: string;
  convidado_user_id: string | null;
  token: string;
  status: StatusConvite;
  mensagem_convite: string | null;
  expira_em: string;
  created_at: string;
}

// Informações do convite (para página de aceitar)
export interface ConviteInfo {
  success: boolean;
  error?: string;
  grupo_nome?: string;
  grupo_tipo?: TipoGrupo;
  mensagem?: string | null;
  expira_em?: string;
}

// Resultado de busca de usuários para convite
export interface UsuarioBusca {
  user_id: string;
  nome: string;
  email: string;
  avatar_url: string | null;
  ja_membro: boolean;
  solicitacao_pendente: boolean;
}

// Solicitação de vínculo (convite interno)
export interface SolicitacaoVinculo {
  id: number;
  grupo_id: number;
  grupo_nome: string;
  grupo_tipo: TipoGrupo;
  solicitante_id: string;
  solicitante_nome: string;
  solicitante_avatar: string | null;
  mensagem: string | null;
  created_at: string;
}

// Resposta de envio de solicitação
export interface EnviarSolicitacaoResponse {
  success: boolean;
  error?: string;
  grupo_nome?: string;
}

// Resposta de responder solicitação
export interface ResponderSolicitacaoResponse {
  success: boolean;
  error?: string;
  aceito?: boolean;
  grupo_nome?: string;
  grupo_id?: number;
}

// Meta compartilhada
export interface MetaCompartilhada {
  id: number;
  grupo_id: number;
  titulo: string;
  descricao: string | null;
  valor_meta: number;
  valor_atual: number;
  percentual: number;
  data_inicio: string;
  data_fim: string;
  cor: string | null;
  icone: string | null;
  created_at?: string;
  updated_at?: string;
}

// Contribuição para meta
export interface ContribuicaoMeta {
  id: number;
  meta_id: number;
  user_id: string;
  valor: number;
  data: string;
  observacao: string | null;
  created_at: string;
}

// Dados consolidados do grupo (retornado pela RPC obter_dados_grupo_juntos)
export interface DadosGrupoJuntos {
  success: boolean;
  error?: string;
  grupo_id?: number;
  mes?: number;
  ano?: number;
  patrimonio_total?: number;
  receitas_mes?: number;
  despesas_mes?: number;
  membros?: MembroDadosFinanceiros[];
  metas_compartilhadas?: MetaCompartilhada[];
}

// Resposta de criação de grupo
export interface CriarGrupoResponse {
  success: boolean;
  error?: string;
  grupo_id?: number;
}

// Resposta de envio de convite
export interface EnviarConviteResponse {
  success: boolean;
  error?: string;
  convite_id?: number;
  token?: string;
}

// Resposta de aceitar convite
export interface AceitarConviteResponse {
  success: boolean;
  error?: string;
  grupo_id?: number;
  grupo_nome?: string;
}

// Resposta genérica de sucesso
export interface JuntosSuccessResponse {
  success: boolean;
  error?: string;
}

// Resposta de listar grupos
export interface ListarGruposResponse {
  success: boolean;
  error?: string;
  grupos: GrupoResumo[];
}

// Resposta de criar meta
export interface CriarMetaResponse {
  success: boolean;
  error?: string;
  meta_id?: number;
}

// Formulários

export interface CriarGrupoForm {
  nome: string;
  tipo: TipoGrupo;
}

export interface ConvidarMembroForm {
  email: string;
  mensagem?: string;
}

export interface CriarMetaForm {
  titulo: string;
  descricao?: string;
  valor_meta: number;
  data_fim: string;
  cor?: string;
  icone?: string;
}

export interface ContribuirMetaForm {
  valor: number;
  observacao?: string;
}

export interface AtualizarPermissoesForm {
  pode_ver_patrimonio?: boolean;
  pode_ver_receitas?: boolean;
  pode_ver_despesas?: boolean;
  pode_ver_transacoes?: boolean;
  pode_ver_metas?: boolean;
}

// Estado do contexto Juntos
export interface JuntosContextState {
  grupos: GrupoResumo[];
  grupoAtivo: GrupoResumo | null;
  dadosGrupo: DadosGrupoJuntos | null;
  loading: boolean;
  error: string | null;
  // Solicitações pendentes
  solicitacoesPendentes: number;
}

export interface JuntosContextActions {
  fetchGrupos: () => Promise<void>;
  setGrupoAtivo: (grupo: GrupoResumo | null) => void;
  fetchDadosGrupo: (grupoId: number, mes?: number, ano?: number) => Promise<void>;
  criarGrupo: (form: CriarGrupoForm) => Promise<CriarGrupoResponse>;
  enviarConvite: (grupoId: number, form: ConvidarMembroForm) => Promise<EnviarConviteResponse>;
  aceitarConvite: (token: string) => Promise<AceitarConviteResponse>;
  sairGrupo: (grupoId: number) => Promise<JuntosSuccessResponse>;
  atualizarPermissoes: (grupoId: number, membroUserId: string, permissoes: AtualizarPermissoesForm) => Promise<JuntosSuccessResponse>;
  criarMeta: (grupoId: number, form: CriarMetaForm) => Promise<CriarMetaResponse>;
  contribuirMeta: (metaId: number, form: ContribuirMetaForm) => Promise<JuntosSuccessResponse>;
  refresh: () => Promise<void>;
  // Solicitações
  fetchSolicitacoesPendentes: () => Promise<void>;
}

export type JuntosContextType = JuntosContextState & JuntosContextActions;

// Cores padrão para metas
export const CORES_METAS = [
  '#F87060', // Coral (primary)
  '#10B981', // Verde
  '#3B82F6', // Azul
  '#8B5CF6', // Roxo
  '#F59E0B', // Amarelo
  '#EC4899', // Rosa
  '#14B8A6', // Teal
  '#6366F1', // Indigo
];

// Ícones disponíveis para metas
export const ICONES_METAS = [
  'Target',
  'Home',
  'Car',
  'Plane',
  'GraduationCap',
  'Heart',
  'Smartphone',
  'Laptop',
  'Gift',
  'Briefcase',
  'Umbrella',
  'Wallet',
  'PiggyBank',
  'TrendingUp',
  'Star',
  'Trophy',
];
