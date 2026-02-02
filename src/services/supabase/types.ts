export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          ultima_atualizacao: string | null
          user_id: string
        }
        Insert: {
          ano?: number | null
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
          ultima_atualizacao?: string | null
          user_id: string
        }
        Update: {
          ano?: number | null
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
          ultima_atualizacao?: string | null
          user_id?: string
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
      app_lancamento: {
        Row: {
          cartao_id: number | null
          categoria_id: number
          conta_id: number | null
          created_at: string
          data: string
          descricao: string
          fatura_id: number | null
          id: number
          parcela_atual: number | null
          recorrente_id: number | null
          tipo: string
          total_parcelas: number | null
          user_id: string
          valor: number
        }
        Insert: {
          cartao_id?: number | null
          categoria_id: number
          conta_id?: number | null
          created_at?: string
          data: string
          descricao: string
          fatura_id?: number | null
          id?: number
          parcela_atual?: number | null
          recorrente_id?: number | null
          tipo: string
          total_parcelas?: number | null
          user_id: string
          valor: number
        }
        Update: {
          cartao_id?: number | null
          categoria_id?: number
          conta_id?: number | null
          created_at?: string
          data?: string
          descricao?: string
          fatura_id?: number | null
          id?: number
          parcela_atual?: number | null
          recorrente_id?: number | null
          tipo?: string
          total_parcelas?: number | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_lancamento_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "app_cartao_credito"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_lancamento_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "app_categoria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_lancamento_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "app_conta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_lancamento_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "app_fatura"
            referencedColumns: ["id"]
          },
        ]
      }
      app_lancamento_recorrente: {
        Row: {
          ativo: boolean | null
          cartao_id: number | null
          categoria_id: number
          conta_id: number | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string
          dia_vencimento: number | null
          id: number
          intervalo: string | null
          parcela_atual: number | null
          proxima_execucao: string
          tipo: string | null
          tipo_recorrencia: string | null
          total_parcelas: number | null
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
          dia_vencimento?: number | null
          id?: number
          intervalo?: string | null
          parcela_atual?: number | null
          proxima_execucao: string
          tipo?: string | null
          tipo_recorrencia?: string | null
          total_parcelas?: number | null
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
          dia_vencimento?: number | null
          id?: number
          intervalo?: string | null
          parcela_atual?: number | null
          proxima_execucao?: string
          tipo?: string | null
          tipo_recorrencia?: string | null
          total_parcelas?: number | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_lancamento_recorrente_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "app_cartao_credito"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_lancamento_recorrente_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "app_categoria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_lancamento_recorrente_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "app_conta"
            referencedColumns: ["id"]
          },
        ]
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
          nome: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nome: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      cartoes_credito: {
        Row: {
          apelido: string
          conta_id: string
          criado_em: string
          dia_fechamento: number
          dia_vencimento: number
          id: string
        }
        Insert: {
          apelido: string
          conta_id: string
          criado_em?: string
          dia_fechamento: number
          dia_vencimento: number
          id?: string
        }
        Update: {
          apelido?: string
          conta_id?: string
          criado_em?: string
          dia_fechamento?: number
          dia_vencimento?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartoes_credito_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas: {
        Row: {
          criado_em: string
          id: string
          nome: string
          saldo_atual: number | null
          tipo: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
          saldo_atual?: number | null
          tipo: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          saldo_atual?: number | null
          tipo?: string
        }
        Relationships: []
      }
      faturas: {
        Row: {
          cartao_credito_id: string
          criado_em: string
          data_vencimento: string
          id: string
          periodo_fim: string
          periodo_inicio: string
          status: string
          valor_total: number | null
        }
        Insert: {
          cartao_credito_id: string
          criado_em?: string
          data_vencimento: string
          id?: string
          periodo_fim: string
          periodo_inicio: string
          status?: string
          valor_total?: number | null
        }
        Update: {
          cartao_credito_id?: string
          criado_em?: string
          data_vencimento?: string
          id?: string
          periodo_fim?: string
          periodo_inicio?: string
          status?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "faturas_cartao_credito_id_fkey"
            columns: ["cartao_credito_id"]
            isOneToOne: false
            referencedRelation: "cartoes_credito"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_fluxo_mensal: {
        Row: {
          conta_id: string
          despesas_cartao: number
          despesas_simples: number
          gerado_em: string
          id: string
          mes: string
          pagamentos_faturas: number
          receitas: number
          saldo_final: number
          saldo_inicial: number
        }
        Insert: {
          conta_id: string
          despesas_cartao?: number
          despesas_simples?: number
          gerado_em?: string
          id?: string
          mes: string
          pagamentos_faturas?: number
          receitas?: number
          saldo_final?: number
          saldo_inicial?: number
        }
        Update: {
          conta_id?: string
          despesas_cartao?: number
          despesas_simples?: number
          gerado_em?: string
          id?: string
          mes?: string
          pagamentos_faturas?: number
          receitas?: number
          saldo_final?: number
          saldo_inicial?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_fluxo_mensal_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_transacao_despesa"]
          criado_em: string
          id: string
          periodo_fim: string
          periodo_inicio: string
          valor_limite: number
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_transacao_despesa"]
          criado_em?: string
          id?: string
          periodo_fim: string
          periodo_inicio: string
          valor_limite: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_transacao_despesa"]
          criado_em?: string
          id?: string
          periodo_fim?: string
          periodo_inicio?: string
          valor_limite?: number
        }
        Relationships: []
      }
      receitas: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_receita"] | null
          conta_id: string
          criado_em: string
          data_recebimento: string | null
          descricao: string | null
          id: string
          recorrencia: Database["public"]["Enums"]["tipo_recorrencia"]
          status: Database["public"]["Enums"]["status_receita"]
          valor: number
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_receita"] | null
          conta_id: string
          criado_em?: string
          data_recebimento?: string | null
          descricao?: string | null
          id?: string
          recorrencia: Database["public"]["Enums"]["tipo_recorrencia"]
          status?: Database["public"]["Enums"]["status_receita"]
          valor: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_receita"] | null
          conta_id?: string
          criado_em?: string
          data_recebimento?: string | null
          descricao?: string | null
          id?: string
          recorrencia?: Database["public"]["Enums"]["tipo_recorrencia"]
          status?: Database["public"]["Enums"]["status_receita"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "receitas_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_cartao: {
        Row: {
          cartao_credito_id: string | null
          categoria: Database["public"]["Enums"]["categoria_transacao_despesa"]
          conta_id: string
          criado_em: string
          data_movimento: string
          descricao: string | null
          id: string
          mes_fatura: string | null
          natureza: Database["public"]["Enums"]["natureza_lancamento"]
          parcela_atual: number | null
          parcelas_totais: number | null
          recorrencia: Database["public"]["Enums"]["tipo_recorrencia"]
          valor: number
        }
        Insert: {
          cartao_credito_id?: string | null
          categoria: Database["public"]["Enums"]["categoria_transacao_despesa"]
          conta_id: string
          criado_em?: string
          data_movimento: string
          descricao?: string | null
          id?: string
          mes_fatura?: string | null
          natureza: Database["public"]["Enums"]["natureza_lancamento"]
          parcela_atual?: number | null
          parcelas_totais?: number | null
          recorrencia: Database["public"]["Enums"]["tipo_recorrencia"]
          valor: number
        }
        Update: {
          cartao_credito_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_transacao_despesa"]
          conta_id?: string
          criado_em?: string
          data_movimento?: string
          descricao?: string | null
          id?: string
          mes_fatura?: string | null
          natureza?: Database["public"]["Enums"]["natureza_lancamento"]
          parcela_atual?: number | null
          parcelas_totais?: number | null
          recorrencia?: Database["public"]["Enums"]["tipo_recorrencia"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_cartao_credito_id_fkey"
            columns: ["cartao_credito_id"]
            isOneToOne: false
            referencedRelation: "cartoes_credito"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_despesas_simples: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_transacao_despesa"]
          conta_id: string
          criado_em: string
          data_movimento: string
          data_vencimento: string
          descricao: string | null
          id: string
          recorrencia: Database["public"]["Enums"]["tipo_recorrencia"]
          status: Database["public"]["Enums"]["status_despesa"]
          valor: number
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_transacao_despesa"]
          conta_id: string
          criado_em?: string
          data_movimento: string
          data_vencimento: string
          descricao?: string | null
          id?: string
          recorrencia: Database["public"]["Enums"]["tipo_recorrencia"]
          status?: Database["public"]["Enums"]["status_despesa"]
          valor: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_transacao_despesa"]
          conta_id?: string
          criado_em?: string
          data_movimento?: string
          data_vencimento?: string
          descricao?: string | null
          id?: string
          recorrencia?: Database["public"]["Enums"]["tipo_recorrencia"]
          status?: Database["public"]["Enums"]["status_despesa"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_despesas_simples_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          conta_padrao_id: string | null
          criado_em: string | null
          id: string
          nome: string | null
          numero_whatsapp: string
        }
        Insert: {
          conta_padrao_id?: string | null
          criado_em?: string | null
          id?: string
          nome?: string | null
          numero_whatsapp: string
        }
        Update: {
          conta_padrao_id?: string | null
          criado_em?: string | null
          id?: string
          nome?: string | null
          numero_whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_conta_padrao_id_fkey"
            columns: ["conta_padrao_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      app_resumo_dashboard: {
        Row: {
          net_balance: number | null
          total_expenses: number | null
          total_income: number | null
          user_id: string | null
        }
        Relationships: []
      }
      dashboard_summary: {
        Row: {
          net_balance: number | null
          total_expenses: number | null
          total_income: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      analise_categorizada_periodo: {
        Args: {
          conta_id_in: string
          tipo_analise?: string
          data_inicio?: string
          data_fim?: string
          categoria_filtro?: string
        }
        Returns: {
          categoria: string
          total_valor: number
          quantidade_transacoes: number
          percentual_total: number
        }[]
      }
      analise_parcelas_ativas: {
        Args: {
          conta_id_in?: string
          incluir_finalizadas?: boolean
          meses_projecao?: number
        }
        Returns: Json
      }
      calcular_provisionamento_mensal: {
        Args: { conta_id_in: string; ano_mes: string }
        Returns: Json
      }
      fechar_fatura_e_abrir_proxima: {
        Args: { cartao_id: string }
        Returns: undefined
      }
      get_chart_data_for_period: {
        Args: {
          p_user_id: string
          p_period: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          label: string
          income: number
          expense: number
        }[]
      }
      insights_financeiros_automaticos: {
        Args: {
          conta_id_in: string
          meses_historico?: number
          incluir_projecoes?: boolean
        }
        Returns: Json
      }
      obter_balanco_completo: {
        Args: { conta_id_in: string; data_inicio?: string; data_fim?: string }
        Returns: Json
      }
      processar_lancamentos_recorrentes: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      refresh_indicadores_conta: {
        Args: { p_conta_id: number; p_user_id: string }
        Returns: undefined
      }
      snapshot_mensal_fluxo: {
        Args: { conta_id_in?: string; ano_mes?: string }
        Returns: Json
      }
    }
    Enums: {
      categoria_receita:
        | "salario"
        | "autonomo"
        | "reembolso"
        | "cashback"
        | "emprestimo"
      categoria_transacao_despesa:
        | "casa"
        | "alimentacao"
        | "saude"
        | "ifood"
        | "restaurantes e bares"
        | "educacao"
        | "lazer"
        | "carro"
        | "presentes"
        | "outros"
        | "esporte"
        | "streaming"
      natureza_lancamento: "despesa" | "receita"
      status_despesa: "paga" | "pendente"
      status_receita: "recebida" | "a_receber"
      tipo_recorrencia: "unica" | "fixa" | "parcelada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      categoria_receita: [
        "salario",
        "autonomo",
        "reembolso",
        "cashback",
        "emprestimo",
      ],
      categoria_transacao_despesa: [
        "casa",
        "alimentacao",
        "saude",
        "ifood",
        "restaurantes e bares",
        "educacao",
        "lazer",
        "carro",
        "presentes",
        "outros",
        "esporte",
        "streaming",
      ],
      natureza_lancamento: ["despesa", "receita"],
      status_despesa: ["paga", "pendente"],
      status_receita: ["recebida", "a_receber"],
      tipo_recorrencia: ["unica", "fixa", "parcelada"],
    },
  },
} as const
