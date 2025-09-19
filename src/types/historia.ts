/**
 * Tipos para o módulo "Sua História"
 * Sistema de gamificação da jornada financeira
 */

export type MarcoCategoria = 'sistema' | 'objetivo';
export type MarcoStatus = 'pendente' | 'concluido';
export type EventoTipo = 'marco' | 'badge';

export interface Marco {
  id: string;
  user_id: string;
  categoria: MarcoCategoria;
  titulo: string;
  descricao?: string;
  valor_alvo?: number;
  valor_atual: number;
  status: MarcoStatus;
  icon_slug?: string;
  cor: string;
  created_at: string;
  updated_at: string;
  achieved_at?: string;
}

export interface Badge {
  id: string;
  user_id: string;
  nome: string;
  descricao?: string;
  icon_slug?: string;
  cor: string;
  created_at: string;
  unlocked_at: string;
}

export interface EventoTimeline {
  tipo: EventoTipo;
  id: string;
  user_id: string;
  meta_id?: number; // Adicionado para associar a uma meta financeira
  nome: string;
  descricao?: string;
  status: MarcoStatus;
  icon_slug?: string;
  cor: string;
  valor_alvo?: number;
  valor_atual?: number;
  created_at: string;
  data_evento: string;
  concluido: boolean;
}

export interface NovoMarco {
  categoria: MarcoCategoria;
  titulo: string;
  descricao?: string;
  valor_alvo?: number;
  valor_atual?: number;
  icon_slug?: string;
  cor?: string;
}

export interface NovaBadge {
  nome: string;
  descricao?: string;
  icon_slug?: string;
  cor?: string;
}

export interface ProgressoMarco {
  valor_atual: number;
  percentual: number;
  atingido: boolean;
}

export interface ResumoHistoria {
  total_marcos: number;
  marcos_concluidos: number;
  marcos_pendentes: number;
  total_badges: number;
  percentual_conclusao: number;
  proximos_marcos: Marco[];
  badges_recentes: Badge[];
}

// Tipos para o personagem Vitto
export interface FraseVitto {
  id: string;
  contexto: 'boas-vindas' | 'parabens' | 'motivacao' | 'dica' | 'comemoração';
  texto: string;
  emoji?: string;
}

export interface CueVitto {
  trigger: string;
  frase: FraseVitto;
  duracao?: number; // em segundos
  animacao?: 'bounce' | 'fade' | 'slide';
}

// Tipos para configuração do tabuleiro
export interface ConfigTabuleiro {
  modo: 'linear' | 'circular';
  animacoes: boolean;
  som_enabled: boolean;
  confetti_enabled: boolean;
}

// Tipos para estatísticas e achievements
export interface EstatisticasJornada {
  dias_ativos: number;
  marcos_por_mes: number;
  badges_por_categoria: Record<string, number>;
  tempo_medio_conclusao: number;
  streak_atual: number;
  maior_streak: number;
}