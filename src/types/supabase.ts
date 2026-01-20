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
      app_agente_config: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          atualizado_por: string | null
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          nome: string
          parametros: Json | null
          prompt_system: string
          tipo: string
          versao: number | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nome: string
          parametros?: Json | null
          prompt_system: string
          tipo: string
          versao?: number | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          parametros?: Json | null
          prompt_system?: string
          tipo?: string
          versao?: number | null
        }
        Relationships: []
      }
      app_agente_metricas: {
        Row: {
          agente_tipo: string
          atualizado_em: string | null
          data_metricas: string | null
          erros_comuns: Json | null
          feedback_medio: number | null
          id: string
          tempo_max_ms: number | null
          tempo_medio_ms: number | null
          tempo_min_ms: number | null
          total_execucoes: number | null
          total_falhas: number | null
          total_feedbacks: number | null
          total_sucessos: number | null
        }
        Insert: {
          agente_tipo: string
          atualizado_em?: string | null
          data_metricas?: string | null
          erros_comuns?: Json | null
          feedback_medio?: number | null
          id?: string
          tempo_max_ms?: number | null
          tempo_medio_ms?: number | null
          tempo_min_ms?: number | null
          total_execucoes?: number | null
          total_falhas?: number | null
          total_feedbacks?: number | null
          total_sucessos?: number | null
        }
        Update: {
          agente_tipo?: string
          atualizado_em?: string | null
          data_metricas?: string | null
          erros_comuns?: Json | null
          feedback_medio?: number | null
          id?: string
          tempo_max_ms?: number | null
          tempo_medio_ms?: number | null
          tempo_min_ms?: number | null
          total_execucoes?: number | null
          total_falhas?: number | null
          total_feedbacks?: number | null
          total_sucessos?: number | null
        }
        Relationships: []
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
          tipo_usuario?: string | null
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      app_knowledge_base: {
        Row: {
          approved_by: string | null
          category: string
          chunk_index: number | null
          content: string
          created_at: string | null
          created_by: string | null
          embedding: string | null
          file_name: string | null
          id: string
          metadata: Json | null
          source: string
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          category: string
          chunk_index?: number | null
          content: string
          created_at?: string | null
          created_by?: string | null
          embedding?: string | null
          file_name?: string | null
          id?: string
          metadata?: Json | null
          source: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          category?: string
          chunk_index?: number | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          embedding?: string | null
          file_name?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      app_conversas_log: {
        Row: {
          agentes_utilizados: string[] | null
          area_conhecimento: string | null
          conversa_completa: Json | null
          criado_em: string | null
          feedback_usuario: number | null
          id: string
          problema_identificado: string | null
          status_revisao: string | null
          tags: string[] | null
          tempo_resposta_ms: number | null
          tipo_processamento: string | null
          user_id: string | null
        }
        Insert: {
          agentes_utilizados?: string[] | null
          area_conhecimento?: string | null
          conversa_completa?: Json | null
          criado_em?: string | null
          feedback_usuario?: number | null
          id?: string
          problema_identificado?: string | null
          status_revisao?: string | null
          tags?: string[] | null
          tempo_resposta_ms?: number | null
          tipo_processamento?: string | null
          user_id?: string | null
        }
        Update: {
          agentes_utilizados?: string[] | null
          area_conhecimento?: string | null
          conversa_completa?: Json | null
          criado_em?: string | null
          feedback_usuario?: number | null
          id?: string
          problema_identificado?: string | null
          status_revisao?: string | null
          tags?: string[] | null
          tempo_resposta_ms?: number | null
          tipo_processamento?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_sessao_treinamento: {
        Row: {
          area_conhecimento: string
          conversa_log_id: string | null
          correcao_especialista: string
          criado_em: string | null
          especialista_id: string | null
          explicacao_correcao: string | null
          id: string
          incorporado_em: string | null
          incorporado_rag: boolean | null
          nivel_impacto: string | null
          resposta_original: string | null
          status: string | null
          validado_por: string | null
        }
        Insert: {
          area_conhecimento: string
          conversa_log_id?: string | null
          correcao_especialista: string
          criado_em?: string | null
          especialista_id?: string | null
          explicacao_correcao?: string | null
          id?: string
          incorporado_em?: string | null
          incorporado_rag?: boolean | null
          nivel_impacto?: string | null
          resposta_original?: string | null
          status?: string | null
          validado_por?: string | null
        }
        Update: {
          area_conhecimento?: string
          conversa_log_id?: string | null
          correcao_especialista?: string
          criado_em?: string | null
          especialista_id?: string | null
          explicacao_correcao?: string | null
          id?: string
          incorporado_em?: string | null
          incorporado_rag?: boolean | null
          nivel_impacto?: string | null
          resposta_original?: string | null
          status?: string | null
          validado_por?: string | null
        }
        Relationships: []
      }
      app_prompt_historico: {
        Row: {
          agente_config_id: string | null
          alterado_por: string | null
          criado_em: string | null
          id: string
          motivo_alteracao: string | null
          prompt_anterior: string | null
          prompt_novo: string | null
        }
        Insert: {
          agente_config_id?: string | null
          alterado_por?: string | null
          criado_em?: string | null
          id?: string
          motivo_alteracao?: string | null
          prompt_anterior?: string | null
          prompt_novo?: string | null
        }
        Update: {
          agente_config_id?: string | null
          alterado_por?: string | null
          criado_em?: string | null
          id?: string
          motivo_alteracao?: string | null
          prompt_anterior?: string | null
          prompt_novo?: string | null
        }
        Relationships: []
      }
      app_training_conversations: {
        Row: {
          approved_by: string | null
          category: string | null
          context: string | null
          created_at: string | null
          created_by: string | null
          difficulty_level: string | null
          id: string
          ideal_answer: string
          question: string
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          category?: string | null
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: string | null
          id?: string
          ideal_answer: string
          question: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          category?: string | null
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: string | null
          id?: string
          ideal_answer?: string
          question?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      app_training_sessions: {
        Row: {
          completed_at: string | null
          description: string | null
          id: string
          items_approved: number | null
          items_processed: number | null
          items_rejected: number | null
          session_name: string | null
          specialist_id: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          description?: string | null
          id?: string
          items_approved?: number | null
          items_processed?: number | null
          items_rejected?: number | null
          session_name?: string | null
          specialist_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          description?: string | null
          id?: string
          items_approved?: number | null
          items_processed?: number | null
          items_rejected?: number | null
          session_name?: string | null
          specialist_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      app_document_uploads: {
        Row: {
          chunks_created: number | null
          created_at: string | null
          error_message: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          processed_at: string | null
          processing_status: string | null
          upload_path: string | null
          uploaded_by: string | null
        }
        Insert: {
          chunks_created?: number | null
          created_at?: string | null
          error_message?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          processed_at?: string | null
          processing_status?: string | null
          upload_path?: string | null
          uploaded_by?: string | null
        }
        Update: {
          chunks_created?: number | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          processed_at?: string | null
          processing_status?: string | null
          upload_path?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      app_rag_feedback: {
        Row: {
          comentario: string | null
          confidence_score: number | null
          contexto_rag: Json | null
          created_at: string | null
          feedback: string
          id: string
          mensagem_id: string
          query_original: string
          resposta: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          comentario?: string | null
          confidence_score?: number | null
          contexto_rag?: Json | null
          created_at?: string | null
          feedback: string
          id?: string
          mensagem_id: string
          query_original: string
          resposta: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          comentario?: string | null
          confidence_score?: number | null
          contexto_rag?: Json | null
          created_at?: string | null
          feedback?: string
          id?: string
          mensagem_id?: string
          query_original?: string
          resposta?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: []
      }
      app_rag_learning_patterns: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          pattern_data: Json
          pattern_type: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          pattern_data: Json
          pattern_type: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          pattern_data?: Json
          pattern_type?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      app_rag_metrics: {
        Row: {
          created_at: string | null
          id: string
          query_text: string
          relevance_score: number | null
          response_quality_score: number | null
          retrieved_chunks: number | null
          session_id: string | null
          user_feedback: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          query_text: string
          relevance_score?: number | null
          response_quality_score?: number | null
          retrieved_chunks?: number | null
          session_id?: string | null
          user_feedback?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          query_text?: string
          relevance_score?: number | null
          response_quality_score?: number | null
          retrieved_chunks?: number | null
          session_id?: string | null
          user_feedback?: string | null
        }
        Relationships: []
      }
      app_rag_quality_metrics: {
        Row: {
          average_confidence: number | null
          created_at: string | null
          data_snapshot: string | null
          helpful_responses: number | null
          id: string
          improvement_suggestions: Json | null
          top_categories: string[] | null
          total_queries: number | null
          unhelpful_responses: number | null
        }
        Insert: {
          average_confidence?: number | null
          created_at?: string | null
          data_snapshot?: string | null
          helpful_responses?: number | null
          id?: string
          improvement_suggestions?: Json | null
          top_categories?: string[] | null
          total_queries?: number | null
          unhelpful_responses?: number | null
        }
        Update: {
          average_confidence?: number | null
          created_at?: string | null
          data_snapshot?: string | null
          helpful_responses?: number | null
          id?: string
          improvement_suggestions?: Json | null
          top_categories?: string[] | null
          total_queries?: number | null
          unhelpful_responses?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_patrimonio_por_categoria: {
        Args: { p_user_id: string }
        Returns: {
          categoria: string
          percentual: number
          quantidade_ativos: number
          valor_total: number
        }[]
      }
      obter_evolucao_patrimonial: {
        Args: { p_meses?: number; p_user_id: string }
        Returns: {
          ano: number
          mes: number
          patrimonio_total: number
          variacao_mensal: number
          variacao_percentual: number
        }[]
      }
      snapshot_patrimonio_mensal: {
        Args: { p_user_id?: string }
        Returns: number
      }
      obter_patrimonio_consolidado: {
        Args: { p_user_id: string }
        Returns: {
          patrimonio_liquido: number
          patrimonio_total: number
          quantidade_ativos: number
          total_dividas: number
          variacao_mes_percentual: number
          variacao_mes_valor: number
        }[]
      }
      obter_dashboard_resumo: {
        Args: { p_ano?: number; p_mes?: number; p_user_id: string }
        Returns: Json
      }
      obter_transacoes_mes_atual: {
        Args: { p_ano?: number; p_mes?: number; p_user_id: string }
        Returns: {
          cartao_id: number
          cartao_nome: string
          categoria_cor: string
          categoria_icone: string
          categoria_id: number
          categoria_nome: string
          conta_id: number
          conta_nome: string
          data: string
          descricao: string
          fatura_details: Json
          fixo_id: number
          id: number
          is_fatura: boolean
          origem: string
          status: string
          tipo: string
          tipo_recorrencia: string
          valor: number
        }[]
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
      calcular_saldo_atual: {
        Args: { p_conta_id?: number; p_data_limite?: string; p_user_id: string }
        Returns: number
      }
      calcular_saldo_previsto: {
        Args: { p_conta_id?: number; p_data_limite?: string; p_user_id: string }
        Returns: number
      }
      obter_indicador_meta_mes: {
        Args: { ano_param?: number; mes_param?: number; user_id_param: string }
        Returns: Json
      }
      atualizar_indicadores_mes: {
        Args: { p_ano?: number; p_conta_id?: number; p_mes?: number; p_user_id: string }
        Returns: undefined
      }
      gerar_transacoes_fixas_mes: {
        Args: { p_ano: number; p_mes: number; p_user_id: string }
        Returns: Json
      }
      criar_grupo_juntos: {
        Args: { p_nome: string; p_tipo?: string }
        Returns: Json
      }
      obter_grupos_usuario: {
        Args: Record<string, never>
        Returns: Json
      }
      obter_dados_grupo_juntos: {
        Args: { p_ano?: number; p_grupo_id: number; p_mes?: number }
        Returns: Json
      }
      enviar_convite_grupo: {
        Args: { p_email: string; p_grupo_id: number; p_mensagem?: string }
        Returns: Json
      }
      aceitar_convite_grupo: {
        Args: { p_token: string }
        Returns: Json
      }
      buscar_convite_por_token: {
        Args: { p_token: string }
        Returns: Json
      }
      sair_grupo_juntos: {
        Args: { p_grupo_id: number }
        Returns: Json
      }
      criar_meta_compartilhada: {
        Args: {
          p_cor?: string
          p_data_fim: string
          p_descricao?: string
          p_grupo_id: number
          p_icone?: string
          p_titulo: string
          p_valor_meta: number
        }
        Returns: Json
      }
      contribuir_meta_compartilhada: {
        Args: { p_meta_id: number; p_observacao?: string; p_valor: number }
        Returns: Json
      }
      atualizar_permissoes_membro: {
        Args: {
          p_grupo_id: number
          p_membro_user_id: string
          p_pode_ver_despesas?: boolean
          p_pode_ver_metas?: boolean
          p_pode_ver_patrimonio?: boolean
          p_pode_ver_receitas?: boolean
          p_pode_ver_transacoes?: boolean
        }
        Returns: Json
      }
    }
    Enums: {
      feedback_tipo: "helpful" | "not_helpful"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables" & keyof Database[PublicTableNameOrOptions["schema"]]]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables" & keyof Database[PublicTableNameOrOptions["schema"]]][TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables" & keyof Database[PublicTableNameOrOptions["schema"]]]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables" & keyof Database[PublicTableNameOrOptions["schema"]]][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables" & keyof Database[PublicTableNameOrOptions["schema"]]]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables" & keyof Database[PublicTableNameOrOptions["schema"]]][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums" & keyof Database[PublicEnumNameOrOptions["schema"]]]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums" & keyof Database[PublicEnumNameOrOptions["schema"]]][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
