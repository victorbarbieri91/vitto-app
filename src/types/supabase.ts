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
      app_admin_agenda: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          id: number
          linked_submodule: string | null
          priority: string | null
          responsible_user_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: number
          linked_submodule?: string | null
          priority?: string | null
          responsible_user_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: number
          linked_submodule?: string | null
          priority?: string | null
          responsible_user_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      app_admin_business_plan: {
        Row: {
          content: Json
          created_at: string | null
          created_by: string | null
          id: number
          status: string | null
          submodule: string
          updated_at: string | null
          updated_by: string | null
          version: number | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: number
          status?: string | null
          submodule: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: number
          status?: string | null
          submodule?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Relationships: []
      }
      app_admin_business_plan_history: {
        Row: {
          change_summary: string | null
          changed_at: string | null
          changed_by: string | null
          id: number
          new_content: Json | null
          plan_id: number | null
          previous_content: Json | null
          submodule: string
        }
        Insert: {
          change_summary?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          new_content?: Json | null
          plan_id?: number | null
          previous_content?: Json | null
          submodule: string
        }
        Update: {
          change_summary?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          new_content?: Json | null
          plan_id?: number | null
          previous_content?: Json | null
          submodule?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_admin_business_plan_history_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "app_admin_business_plan"
            referencedColumns: ["id"]
          },
        ]
      }
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
          ultimos_quatro_digitos: string | null
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
          ultimos_quatro_digitos?: string | null
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
          ultimos_quatro_digitos?: string | null
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
          overrides_default_id: number | null
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
          overrides_default_id?: number | null
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
          overrides_default_id?: number | null
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_categoria_overrides_default_id_fkey"
            columns: ["overrides_default_id"]
            isOneToOne: false
            referencedRelation: "app_categoria"
            referencedColumns: ["id"]
          },
        ]
      }
      app_chat_mensagens: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          sessao_id: string
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          sessao_id: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          sessao_id?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "app_chat_mensagens_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "app_chat_sessoes"
            referencedColumns: ["id"]
          },
        ]
      }
      app_chat_sessoes: {
        Row: {
          created_at: string | null
          id: string
          mensagem_count: number | null
          metadata: Json | null
          titulo: string | null
          ultima_mensagem: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mensagem_count?: number | null
          metadata?: Json | null
          titulo?: string | null
          ultima_mensagem?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mensagem_count?: number | null
          metadata?: Json | null
          titulo?: string | null
          ultima_mensagem?: string | null
          updated_at?: string | null
          user_id?: string
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
      app_convite_grupo: {
        Row: {
          convidado_email: string
          convidado_user_id: string | null
          created_at: string | null
          expira_em: string | null
          grupo_id: number
          id: number
          mensagem_convite: string | null
          status: string | null
          token: string
        }
        Insert: {
          convidado_email: string
          convidado_user_id?: string | null
          created_at?: string | null
          expira_em?: string | null
          grupo_id: number
          id?: number
          mensagem_convite?: string | null
          status?: string | null
          token?: string
        }
        Update: {
          convidado_email?: string
          convidado_user_id?: string | null
          created_at?: string | null
          expira_em?: string | null
          grupo_id?: number
          id?: number
          mensagem_convite?: string | null
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_convite_grupo_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "app_grupo_compartilhado"
            referencedColumns: ["id"]
          },
        ]
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
      app_grupo_compartilhado: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          criado_por: string
          id: number
          nome: string
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          criado_por: string
          id?: number
          nome: string
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          criado_por?: string
          id?: number
          nome?: string
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      app_grupo_membro: {
        Row: {
          aceito_em: string | null
          apelido: string | null
          created_at: string | null
          grupo_id: number
          id: number
          papel: string | null
          pode_ver_despesas: boolean | null
          pode_ver_metas: boolean | null
          pode_ver_patrimonio: boolean | null
          pode_ver_receitas: boolean | null
          pode_ver_transacoes: boolean | null
          user_id: string
        }
        Insert: {
          aceito_em?: string | null
          apelido?: string | null
          created_at?: string | null
          grupo_id: number
          id?: number
          papel?: string | null
          pode_ver_despesas?: boolean | null
          pode_ver_metas?: boolean | null
          pode_ver_patrimonio?: boolean | null
          pode_ver_receitas?: boolean | null
          pode_ver_transacoes?: boolean | null
          user_id: string
        }
        Update: {
          aceito_em?: string | null
          apelido?: string | null
          created_at?: string | null
          grupo_id?: number
          id?: number
          papel?: string | null
          pode_ver_despesas?: boolean | null
          pode_ver_metas?: boolean | null
          pode_ver_patrimonio?: boolean | null
          pode_ver_receitas?: boolean | null
          pode_ver_transacoes?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_grupo_membro_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "app_grupo_compartilhado"
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
      app_memoria_ia: {
        Row: {
          ativo: boolean | null
          conteudo: string
          contexto_financeiro: Json | null
          data_atualizacao: string | null
          data_criacao: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          relevancia_score: number | null
          resumo: string | null
          tipo_conteudo: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          conteudo: string
          contexto_financeiro?: Json | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          relevancia_score?: number | null
          resumo?: string | null
          tipo_conteudo: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          conteudo?: string
          contexto_financeiro?: Json | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          relevancia_score?: number | null
          resumo?: string | null
          tipo_conteudo?: string
          usuario_id?: string
        }
        Relationships: []
      }
      app_meta_compartilhada: {
        Row: {
          cor: string | null
          created_at: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          grupo_id: number
          icone: string | null
          id: number
          titulo: string
          updated_at: string | null
          valor_atual: number | null
          valor_meta: number
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          grupo_id: number
          icone?: string | null
          id?: number
          titulo: string
          updated_at?: string | null
          valor_atual?: number | null
          valor_meta: number
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          grupo_id?: number
          icone?: string | null
          id?: number
          titulo?: string
          updated_at?: string | null
          valor_atual?: number | null
          valor_meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_meta_compartilhada_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "app_grupo_compartilhado"
            referencedColumns: ["id"]
          },
        ]
      }
      app_meta_contribuicao: {
        Row: {
          created_at: string | null
          data: string | null
          id: number
          meta_id: number
          observacao: string | null
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          id?: number
          meta_id: number
          observacao?: string | null
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string | null
          data?: string | null
          id?: number
          meta_id?: number
          observacao?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_meta_contribuicao_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "app_meta_compartilhada"
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
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          ano: number
          categoria_id: number
          created_at?: string
          id?: number
          mes: number
          tipo?: string
          user_id: string
          valor: number
        }
        Update: {
          ano?: number
          categoria_id?: number
          created_at?: string
          id?: number
          mes?: number
          tipo?: string
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
      app_patrimonio_ativo: {
        Row: {
          ativo: boolean
          categoria: string
          conta_id: number | null
          created_at: string
          dados_especificos: Json | null
          data_aquisicao: string | null
          id: number
          instituicao: string | null
          nome: string
          observacoes: string | null
          subcategoria: string | null
          updated_at: string | null
          user_id: string
          valor_aquisicao: number | null
          valor_atual: number
        }
        Insert: {
          ativo?: boolean
          categoria: string
          conta_id?: number | null
          created_at?: string
          dados_especificos?: Json | null
          data_aquisicao?: string | null
          id?: number
          instituicao?: string | null
          nome: string
          observacoes?: string | null
          subcategoria?: string | null
          updated_at?: string | null
          user_id: string
          valor_aquisicao?: number | null
          valor_atual?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string
          conta_id?: number | null
          created_at?: string
          dados_especificos?: Json | null
          data_aquisicao?: string | null
          id?: number
          instituicao?: string | null
          nome?: string
          observacoes?: string | null
          subcategoria?: string | null
          updated_at?: string | null
          user_id?: string
          valor_aquisicao?: number | null
          valor_atual?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_patrimonio_ativo_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "app_conta"
            referencedColumns: ["id"]
          },
        ]
      }
      app_patrimonio_historico: {
        Row: {
          ano: number
          ativo_id: number | null
          categoria: string | null
          created_at: string
          id: number
          mes: number
          user_id: string
          valor_fim_mes: number | null
          valor_inicio_mes: number | null
          variacao_absoluta: number | null
          variacao_percentual: number | null
        }
        Insert: {
          ano: number
          ativo_id?: number | null
          categoria?: string | null
          created_at?: string
          id?: number
          mes: number
          user_id: string
          valor_fim_mes?: number | null
          valor_inicio_mes?: number | null
          variacao_absoluta?: number | null
          variacao_percentual?: number | null
        }
        Update: {
          ano?: number
          ativo_id?: number | null
          categoria?: string | null
          created_at?: string
          id?: number
          mes?: number
          user_id?: string
          valor_fim_mes?: number | null
          valor_inicio_mes?: number | null
          variacao_absoluta?: number | null
          variacao_percentual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "app_patrimonio_historico_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "app_patrimonio_ativo"
            referencedColumns: ["id"]
          },
        ]
      }
      app_pending_actions: {
        Row: {
          action_data: Json
          action_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          sessao_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          action_data: Json
          action_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          sessao_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          sessao_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_pending_actions_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "app_chat_sessoes"
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
          telefone: string | null
          tipo_usuario: string | null
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
          telefone?: string | null
          tipo_usuario?: string | null
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
          telefone?: string | null
          tipo_usuario?: string | null
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
      app_solicitacao_vinculo: {
        Row: {
          created_at: string | null
          destinatario_id: string
          grupo_id: number
          id: number
          mensagem: string | null
          respondido_em: string | null
          solicitante_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          destinatario_id: string
          grupo_id: number
          id?: number
          mensagem?: string | null
          respondido_em?: string | null
          solicitante_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          destinatario_id?: string
          grupo_id?: number
          id?: number
          mensagem?: string | null
          respondido_em?: string | null
          solicitante_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_solicitacao_vinculo_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "app_grupo_compartilhado"
            referencedColumns: ["id"]
          },
        ]
      }
      app_system_docs: {
        Row: {
          ativo: boolean | null
          categoria: string
          conteudo: string
          created_at: string | null
          id: string
          metadata: Json | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          conteudo: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          conteudo?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      feedback_tipo: "helpful" | "not_helpful"
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
    Enums: {
      feedback_tipo: ["helpful", "not_helpful"],
    },
  },
} as const
