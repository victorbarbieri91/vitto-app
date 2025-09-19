export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_cartao_credito: {
        Row: {
          cor: string | null
          created_at: string
          dia_fechamento: number
          dia_vencimento: number
          icone: string | null
          id: number
          limite: number
          nome: string
          user_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          dia_fechamento: number
          dia_vencimento: number
          icone?: string | null
          id?: number
          limite: number
          nome: string
          user_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          dia_fechamento?: number
          dia_vencimento?: number
          icone?: string | null
          id?: number
          limite?: number
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      app_categoria: {
        Row: {
          cor: string | null
          created_at: string
          icone: string | null
          id: number
          is_default: boolean | null
          nome: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: number
          is_default?: boolean | null
          nome: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: number
          is_default?: boolean | null
          nome?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_conta: {
        Row: {
          cor: string | null
          created_at: string
          descricao: string | null
          grupo_id: number | null
          icone: string | null
          id: number
          instituicao: string | null
          moeda: string
          nome: string
          saldo_atual: number
          saldo_inicial: number
          status: string
          tipo: string
          ultima_conciliacao: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          descricao?: string | null
          grupo_id?: number | null
          icone?: string | null
          id?: number
          instituicao?: string | null
          moeda?: string
          nome: string
          saldo_atual?: number
          saldo_inicial?: number
          status?: string
          tipo: string
          ultima_conciliacao?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          descricao?: string | null
          grupo_id?: number | null
          icone?: string | null
          id?: number
          instituicao?: string | null
          moeda?: string
          nome?: string
          saldo_atual?: number
          saldo_inicial?: number
          status?: string
          tipo?: string
          ultima_conciliacao?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_conta_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "app_conta_grupo"
            referencedColumns: ["id"]
          },
        ]
      }
      app_conta_grupo: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: number
          nome: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: number
          nome: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: number
          nome?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_fatura: {
        Row: {
          ano: number
          cartao_id: number
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          id: number
          mes: number
          status: string
          valor_total: number
        }
        Insert: {
          ano: number
          cartao_id: number
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: number
          mes: number
          status?: string
          valor_total?: number
        }
        Update: {
          ano?: number
          cartao_id?: number
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: number
          mes?: number
          status?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_fatura_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "app_cartao_credito"
            referencedColumns: ["id"]
          },
        ]
      }
      app_indicadores: {
        Row: {
          ano: number | null
          burn_rate: number | null
          conta_id: number | null
          despesas_confirmadas: number | null
          despesas_pendentes: number | null
          despesas_recorrentes: number | null
          fatura_atual: number | null
          fatura_proxima: number | null
          fluxo_liquido: number | null
          id: number
          mes: number | null
          projecao_fim_mes: number | null
          receitas_confirmadas: number | null
          receitas_pendentes: number | null
          receitas_recorrentes: number | null
          saldo_atual: number | null
          saldo_inicial: number | null
          saldo_previsto: number | null
          score_saude_financeira: number | null
          status_orcamento: string | null
          taxa_economia: number | null
          tendencia_despesas: string | null
          ultima_atualizacao: string | null
          user_id: string
          variacao_despesas_perc: number | null
        }
        Insert: {
          ano?: number | null
          burn_rate?: number | null
          conta_id?: number | null
          despesas_confirmadas?: number | null
          despesas_pendentes?: number | null
          despesas_recorrentes?: number | null
          fatura_atual?: number | null
          fatura_proxima?: number | null
          fluxo_liquido?: number | null
          id?: number
          mes?: number | null
          projecao_fim_mes?: number | null
          receitas_confirmadas?: number | null
          receitas_pendentes?: number | null
          receitas_recorrentes?: number | null
          saldo_atual?: number | null
          saldo_inicial?: number | null
          saldo_previsto?: number | null
          score_saude_financeira?: number | null
          status_orcamento?: string | null
          taxa_economia?: number | null
          tendencia_despesas?: string | null
          ultima_atualizacao?: string | null
          user_id: string
          variacao_despesas_perc?: number | null
        }
        Update: {
          ano?: number | null
          burn_rate?: number | null
          conta_id?: number | null
          despesas_confirmadas?: number | null
          despesas_pendentes?: number | null
          despesas_recorrentes?: number | null
          fatura_atual?: number | null
          fatura_proxima?: number | null
          fluxo_liquido?: number | null
          id?: number
          mes?: number | null
          projecao_fim_mes?: number | null
          receitas_confirmadas?: number | null
          receitas_pendentes?: number | null
          receitas_recorrentes?: number | null
          saldo_atual?: number | null
          saldo_inicial?: number | null
          saldo_previsto?: number | null
          score_saude_financeira?: number | null
          status_orcamento?: string | null
          taxa_economia?: number | null
          tendencia_despesas?: string | null
          ultima_atualizacao?: string | null
          user_id?: string
          variacao_despesas_perc?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "app_indicadores_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "app_conta"
            referencedColumns: ["id"]
          },
        ]
      }
      app_meta_despesa_mensal: {
        Row: {
          ano: number
          created_at: string | null
          despesa_atual: number | null
          id: number
          mes: number
          meta_despesa: number
          meta_percentual: number
          receita_estimada: number
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ano: number
          created_at?: string | null
          despesa_atual?: number | null
          id?: number
          mes: number
          meta_despesa?: number
          meta_percentual?: number
          receita_estimada?: number
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ano?: number
          created_at?: string | null
          despesa_atual?: number | null
          id?: number
          mes?: number
          meta_despesa?: number
          meta_percentual?: number
          receita_estimada?: number
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_meta_financeira: {
        Row: {
          cor: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: number
          titulo: string
          user_id: string
          valor_atual: number
          valor_meta: number
        }
        Insert: {
          cor?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: number
          titulo: string
          user_id: string
          valor_atual?: number
          valor_meta: number
        }
        Update: {
          cor?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: number
          titulo?: string
          user_id?: string
          valor_atual?: number
          valor_meta?: number
        }
        Relationships: []
      }
      app_orcamento: {
        Row: {
          ano: number
          categoria_id: number
          created_at: string
          id: number
          mes: number
          user_id: string
          valor: number
        }
        Insert: {
          ano: number
          categoria_id: number
          created_at?: string
          id?: number
          mes: number
          user_id: string
          valor: number
        }
        Update: {
          ano?: number
          categoria_id?: number
          created_at?: string
          id?: number
          mes?: number
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_orcamento_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "app_categoria"
            referencedColumns: ["id"]
          },
        ]
      }
      app_perfil: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          meta_despesa_percentual: number | null
          nome: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          receita_mensal_estimada: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          meta_despesa_percentual?: number | null
          nome: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          receita_mensal_estimada?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          meta_despesa_percentual?: number | null
          nome?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          receita_mensal_estimada?: number | null
        }
        Relationships: []
      }
      app_saldo_historico: {
        Row: {
          conta_id: number
          created_at: string | null
          data_referencia: string
          id: number
          lancamento_ajuste_id: number | null
          observacoes: string | null
          saldo_anterior: number | null
          saldo_novo: number
          tipo_operacao: string
          user_id: string
        }
        Insert: {
          conta_id: number
          created_at?: string | null
          data_referencia: string
          id?: number
          lancamento_ajuste_id?: number | null
          observacoes?: string | null
          saldo_anterior?: number | null
          saldo_novo: number
          tipo_operacao: string
          user_id: string
        }
        Update: {
          conta_id?: number
          created_at?: string | null
          data_referencia?: string
          id?: number
          lancamento_ajuste_id?: number | null
          observacoes?: string | null
          saldo_anterior?: number | null
          saldo_novo?: number
          tipo_operacao?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_saldo_historico_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "app_conta"
            referencedColumns: ["id"]
          },
        ]
      }
      app_transacoes: {
        Row: {
          cartao_id: number | null
          categoria_id: number
          conta_id: number | null
          created_at: string | null
          data: string
          data_vencimento: string | null
          descricao: string
          fixo_id: number | null
          grupo_parcelamento: string | null
          id: number
          observacoes: string | null
          origem: string | null
          parcela_atual: number | null
          status: string | null
          tipo: string
          tipo_especial: string | null
          total_parcelas: number | null
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          cartao_id?: number | null
          categoria_id: number
          conta_id?: number | null
          created_at?: string | null
          data: string
          data_vencimento?: string | null
          descricao: string
          fixo_id?: number | null
          grupo_parcelamento?: string | null
          id?: number
          observacoes?: string | null
          origem?: string | null
          parcela_atual?: number | null
          status?: string | null
          tipo: string
          tipo_especial?: string | null
          total_parcelas?: number | null
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          cartao_id?: number | null
          categoria_id?: number
          conta_id?: number | null
          created_at?: string | null
          data?: string
          data_vencimento?: string | null
          descricao?: string
          fixo_id?: number | null
          grupo_parcelamento?: string | null
          id?: number
          observacoes?: string | null
          origem?: string | null
          parcela_atual?: number | null
          status?: string | null
          tipo?: string
          tipo_especial?: string | null
          total_parcelas?: number | null
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_transacoes_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "app_cartao_credito"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_transacoes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "app_categoria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_transacoes_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "app_conta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_transacoes_fixo_id_fkey"
            columns: ["fixo_id"]
            isOneToOne: false
            referencedRelation: "app_transacoes_fixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_transacoes_fixo_id_fkey"
            columns: ["fixo_id"]
            isOneToOne: false
            referencedRelation: "v_transacoes_fixas_proximas"
            referencedColumns: ["id"]
          },
        ]
      }
      app_transacoes_fixas: {
        Row: {
          ativo: boolean | null
          cartao_id: number | null
          categoria_id: number
          conta_id: number | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string
          dia_mes: number
          id: number
          observacoes: string | null
          tipo: string
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          cartao_id?: number | null
          categoria_id: number
          conta_id?: number | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao: string
          dia_mes: number
          id?: number
          observacoes?: string | null
          tipo: string
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          ativo?: boolean | null
          cartao_id?: number | null
          categoria_id?: number
          conta_id?: number | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string
          dia_mes?: number
          id?: number
          observacoes?: string | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_transacoes_fixas_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "app_cartao_credito"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_transacoes_fixas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "app_categoria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_transacoes_fixas_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "app_conta"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_dashboard_consolidado: {
        Row: {
          ano: number | null
          despesas_confirmadas_total: number | null
          despesas_pendentes_total: number | null
          despesas_recorrentes_total: number | null
          fatura_atual_total: number | null
          mes: number | null
          receitas_confirmadas_total: number | null
          receitas_pendentes_total: number | null
          receitas_recorrentes_total: number | null
          saldo_atual_total: number | null
          saldo_inicial_total: number | null
          saldo_previsto_total: number | null
          ultima_atualizacao: string | null
          user_id: string | null
        }
        Relationships: []
      }
      v_dashboard_mes_atual: {
        Row: {
          ano: number | null
          burn_rate: number | null
          conta_cor: string | null
          conta_icone: string | null
          conta_id: number | null
          conta_nome: string | null
          conta_tipo: string | null
          despesas_confirmadas: number | null
          despesas_pendentes: number | null
          despesas_recorrentes: number | null
          despesas_total: number | null
          fatura_atual: number | null
          fatura_proxima: number | null
          fluxo_liquido: number | null
          id: number | null
          margem_resultado: number | null
          mes: number | null
          projecao_fim_mes: number | null
          receitas_confirmadas: number | null
          receitas_pendentes: number | null
          receitas_recorrentes: number | null
          receitas_total: number | null
          resultado_mes: number | null
          saldo_atual: number | null
          saldo_inicial: number | null
          saldo_previsto: number | null
          score_saude_financeira: number | null
          status_orcamento: string | null
          taxa_economia: number | null
          tendencia_despesas: string | null
          ultima_atualizacao: string | null
          user_id: string | null
          variacao_despesas_perc: number | null
        }
        Relationships: [
          {
            foreignKeyName: "app_indicadores_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "app_conta"
            referencedColumns: ["id"]
          },
        ]
      }
      v_faturas_pendentes: {
        Row: {
          ano: number | null
          cartao_id: number | null
          cartao_limite: number | null
          cartao_nome: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          id: number | null
          mes: number | null
          status: string | null
          status_vencimento: string | null
          total_transacoes: number | null
          user_id: string | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "app_fatura_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "app_cartao_credito"
            referencedColumns: ["id"]
          },
        ]
      }
      v_parcelamentos_ativos: {
        Row: {
          cartao_id: number | null
          data_fim: string | null
          data_inicio: string | null
          descricao_base: string | null
          grupo_parcelamento: string | null
          parcelas_pagas: number | null
          parcelas_pendentes: number | null
          total_parcelas: number | null
          user_id: string | null
          valor_pago: number | null
          valor_pendente: number | null
          valor_total: number | null
        }
        Relationships: []
      }
      v_transacoes_fixas_proximas: {
        Row: {
          ativo: boolean | null
          cartao_id: number | null
          cartao_nome: string | null
          categoria_cor: string | null
          categoria_icone: string | null
          categoria_id: number | null
          categoria_nome: string | null
          conta_id: number | null
          conta_nome: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          dia_mes: number | null
          id: number | null
          observacoes: string | null
          proxima_ocorrencia: string | null
          tipo: string | null
          updated_at: string | null
          user_id: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "app_transacoes_fixas_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "app_cartao_credito"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_transacoes_fixas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "app_categoria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_transacoes_fixas_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "app_conta"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      ajustar_saldo_conta: {
        Args: {
          p_conta_id: number
          p_novo_saldo: number
          p_observacoes?: string
        }
        Returns: Json
      }
      antecipar_parcelas: {
        Args: { p_grupo_id: string; p_quantidade?: number }
        Returns: Json
      }
      atualizar_etapa_onboarding: {
        Args: { step_data?: Json; step_param: number; user_id_param: string }
        Returns: Json
      }
      atualizar_fatura_cartao: {
        Args: {
          p_cartao_id: number
          p_data: string
          p_operacao?: string
          p_valor: number
        }
        Returns: Json
      }
      atualizar_indicadores_mes: {
        Args: {
          p_ano?: number
          p_conta_id?: number
          p_mes?: number
          p_user_id: string
        }
        Returns: undefined
      }
      calcular_indicadores_mes: {
        Args: {
          p_ano: number
          p_conta_id?: number
          p_mes: number
          p_user_id: string
        }
        Returns: Json
      }
      calcular_indicadores_periodo: {
        Args: {
          p_ano_fim: number
          p_ano_inicio: number
          p_conta_id?: number
          p_mes_fim: number
          p_mes_inicio: number
          p_user_id: string
        }
        Returns: Json
      }
      calcular_periodo_fatura: {
        Args: { p_cartao_id: number; p_data_compra: string }
        Returns: {
          ano: number
          data_fechamento: string
          data_vencimento: string
          mes: number
        }[]
      }
      calcular_saldo_atual: {
        Args:
          | { conta_id_param: number; data_referencia?: string }
          | { p_conta_id?: number; p_data_limite?: string; p_user_id: string }
        Returns: number
      }
      calcular_saldo_conta: {
        Args: { p_conta_id: number }
        Returns: number
      }
      calcular_saldo_previsto: {
        Args:
          | { ano_param: number; conta_id_param: number; mes_param: number }
          | { p_conta_id?: number; p_data_limite?: string; p_user_id: string }
        Returns: number
      }
      calcular_saldo_previsto_conta: {
        Args: { p_conta_id: number }
        Returns: number
      }
      cancelar_parcelas_futuras: {
        Args: { p_grupo_id: string }
        Returns: Json
      }
      criar_parcelas_cartao: {
        Args: {
          p_cartao_id: number
          p_categoria_id: number
          p_data_primeira: string
          p_descricao: string
          p_observacoes?: string
          p_total_parcelas: number
          p_user_id: string
          p_valor_total: number
        }
        Returns: Json
      }
      criar_parcelas_transacao: {
        Args: {
          p_cartao_id?: number
          p_categoria_id: number
          p_conta_id?: number
          p_data_primeira: string
          p_descricao: string
          p_observacoes?: string
          p_tipo: string
          p_total_parcelas: number
          p_user_id: string
          p_valor_total: number
        }
        Returns: Json
      }
      executar_ajustes_automaticos: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      executar_ajustes_automaticos_global: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      finalizar_onboarding: {
        Args:
          | {
              meta_percentual?: number
              receita_mensal: number
              user_id_param: string
            }
          | { p_user_id: string }
        Returns: Json
      }
      gerar_transacoes_fixas_mes: {
        Args: { p_ano: number; p_mes: number; p_user_id: string }
        Returns: Json
      }
      iniciar_onboarding: {
        Args: { user_id_param: string }
        Returns: Json
      }
      listar_parcelas_grupo: {
        Args: { p_grupo_id: string }
        Returns: {
          ano_fatura: number
          data: string
          data_vencimento_fatura: string
          descricao: string
          id: number
          mes_fatura: number
          parcela_atual: number
          status: string
          total_parcelas: number
          valor: number
        }[]
      }
      obter_analise_categorias: {
        Args: { p_ano?: number; p_mes?: number; p_user_id?: string }
        Returns: Json
      }
      obter_dashboard_resumo: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      obter_historico_dashboard: {
        Args: { p_meses_anteriores?: number; p_user_id?: string }
        Returns: Json
      }
      obter_indicador_meta_mes: {
        Args: { ano_param?: number; mes_param?: number; user_id_param: string }
        Returns: Json
      }
      obter_metricas_financeiras: {
        Args: { p_ano: number; p_mes: number; p_user_id: string }
        Returns: {
          despesas_confirmadas: number
          despesas_pendentes: number
          fluxo_liquido: number
          receitas_confirmadas: number
          receitas_pendentes: number
          resultado_mes: number
          saldo_atual: number
          saldo_base_atual: number
          saldo_previsto: number
          saldo_previsto_fim_mes: number
          total_despesas_mes: number
          total_receitas_mes: number
        }[]
      }
      obter_proximas_transacoes_fixas: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      pagar_fatura: {
        Args: {
          p_conta_id: number
          p_data_pagamento?: string
          p_fatura_id: number
        }
        Returns: Json
      }
      processar_transacoes_fixas_automatico: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      refresh_indicadores: {
        Args: { ano_param: number; mes_param: number; user_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const