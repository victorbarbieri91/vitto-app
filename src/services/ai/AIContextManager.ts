import type {
  FinancialContext,
  ContextChange,
  RelevantData,
  UserPreferences,
  UserSettings,
  IndicadoresMes,
  TendenciaGastos,
  SaudeFinanceira,
  ComparacaoMensal
} from '../../types/ai';
import { AccountService } from '../api/AccountService';
import { CategoryService } from '../api/CategoryService';
import { GoalService } from '../api/GoalService';
import { BudgetService } from '../api/BudgetService';
import { IndicatorsService } from '../api/IndicatorsService';
import { TransactionService } from '../api/TransactionService';
import { supabase } from '../supabase/client';

/**
 * AIContextManager
 * 
 * Gerenciador inteligente de contexto financeiro para IA.
 * Coleta e organiza dados relevantes de todas as fontes.
 */
export class AIContextManager {
  private static instance: AIContextManager;
  private cache: Map<string, { data: FinancialContext; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // Instâncias dos serviços
  private accountService = new AccountService();
  private categoryService = new CategoryService();
  private goalService = new GoalService();
  private budgetService = new BudgetService();
  private indicatorsService = new IndicatorsService();
  private transactionService = new TransactionService();

  static getInstance(): AIContextManager {
    if (!AIContextManager.instance) {
      AIContextManager.instance = new AIContextManager();
    }
    return AIContextManager.instance;
  }

  /**
   * Constrói o contexto financeiro completo do usuário
   */
  async buildContext(userId: string): Promise<FinancialContext> {
    console.log('🧠 AIContextManager: Construindo contexto para usuário', userId);

    try {
      // Verificar cache primeiro
      const cached = this.cache.get(userId);
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log('📝 Usando contexto do cache');
        return cached.data;
      }

      // Buscar dados em paralelo para otimizar performance
      const [
        userProfile,
        accounts,
        categories,
        indicators,
        recentTransactions,
        activeGoals,
        activeBudgets,
        tendencies
      ] = await Promise.all([
        this.getUserProfile(userId),
        this.accountService.list(),
        this.categoryService.list(),
        this.indicatorsService.getIndicators(),
        this.transactionService.list({ limit: 20 }),
        this.goalService.list(),
        this.budgetService.list(),
        this.getTendencies(userId)
      ]);

      // Calcular dados agregados
      const patrimonio = this.calculatePatrimonio(accounts);
      const saudeFinanceira = this.calculateSaudeFinanceira(indicators, patrimonio);
      const comparacaoMensal = await this.getComparacaoMensal(userId);
      const padroes = await this.getPadroesGastos(userId);
      const projecoes = await this.getProjecoes(userId);

      // Construir contexto completo
      const context: FinancialContext = {
        usuario: {
          id: userId,
          nome: userProfile.nome || 'Usuário',
          preferencias: this.getDefaultPreferences(),
          configuracoes: this.getDefaultSettings()
        },

        patrimonio: {
          saldo_total: patrimonio.saldo_total,
          saldo_previsto: patrimonio.saldo_previsto,
          contas: accounts.map(conta => ({
            id: conta.id,
            nome: conta.nome,
            tipo: conta.tipo,
            saldo_atual: conta.saldo_atual || 0,
            saldo_previsto: conta.saldo_atual || 0, // TODO: Implementar cálculo previsto por conta
            instituicao: conta.instituicao
          })),
          investimentos: [] // TODO: Implementar quando tivermos módulo de investimentos
        },

        indicadores: {
          mes_atual: this.buildIndicadoresMes(indicators, patrimonio),
          tendencias: tendencies,
          saude_financeira: saudeFinanceira,
          comparacao_mensal: comparacaoMensal
        },

        historico: {
          lancamentos_recentes: recentTransactions,
          padroes_gastos: padroes.gastos,
          categorias_preferidas: padroes.categorias,
          horarios_transacoes: padroes.horarios
        },

        planejamento: {
          lancamentos_futuros: await this.getLancamentosFuturos(userId),
          metas_ativas: activeGoals,
          orcamentos_ativos: activeBudgets,
          projecoes: projecoes
        },

        conversa: {
          mensagens_recentes: await this.getMensagensRecentes(userId),
          intencoes_anteriores: await this.getIntencoesAnteriores(userId),
          operacoes_realizadas: await this.getOperacoesRealizadas(userId),
          preferencias_contextuais: await this.getPreferenciasContextuais(userId)
        }
      };

      // Armazenar no cache
      this.cache.set(userId, {
        data: context,
        timestamp: Date.now()
      });

      console.log('✅ Contexto construído com sucesso');
      return context;

    } catch (error) {
      console.error('❌ Erro ao construir contexto:', error);
      throw new Error('Erro ao preparar contexto financeiro');
    }
  }

  /**
   * Atualiza o contexto quando algo muda
   */
  async updateContext(userId: string, changes: ContextChange[]): Promise<void> {
    console.log('🔄 Atualizando contexto para usuário', userId, 'mudanças:', changes.length);

    try {
      // Invalidar cache para forçar reconstrução
      this.cache.delete(userId);

      // Log das mudanças para auditoria
      for (const change of changes) {
        await this.logContextChange(userId, change);
      }

      console.log('✅ Contexto atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar contexto:', error);
    }
  }

  /**
   * Busca dados relevantes baseados em uma query
   */
  async getRelevantHistory(userId: string, query: string): Promise<RelevantData> {
    console.log('🔍 Buscando dados relevantes para:', query);

    try {
      // Buscar transações relacionadas
      const transactions = await this.transactionService.search({
        query: query,
        limit: 10
      });

      // Buscar outros dados relevantes baseados na query
      const [accounts, categories, goals, budgets] = await Promise.all([
        this.accountService.list(),
        this.categoryService.list(),
        this.goalService.list(),
        this.budgetService.list()
      ]);

      // Gerar insights relevantes
      const insights = await this.generateRelevantInsights(userId, query);

      return {
        transactions,
        accounts,
        categories,
        goals,
        budgets,
        insights
      };

    } catch (error) {
      console.error('❌ Erro ao buscar dados relevantes:', error);
      return {
        transactions: [],
        accounts: [],
        categories: [],
        goals: [],
        budgets: [],
        insights: []
      };
    }
  }

  // Métodos privados auxiliares

  private async getUserProfile(userId: string) {
    try {
      const { data } = await supabase
        .from('app_perfil')
        .select('*')
        .eq('id', userId)
        .single();
      
      return data || { nome: 'Usuário' };
    } catch (error) {
      console.warn('Perfil não encontrado, usando padrão');
      return { nome: 'Usuário' };
    }
  }

  private calculatePatrimonio(accounts: any[]) {
    const saldo_total = accounts.reduce((total, account) => total + (account.saldo_atual || 0), 0);
    
    return {
      saldo_total,
      saldo_previsto: saldo_total, // TODO: Implementar cálculo com lançamentos futuros
    };
  }

  private calculateSaudeFinanceira(indicators: any, patrimonio: any): SaudeFinanceira {
    // Algoritmo simples de saúde financeira
    let score = 50; // Base
    const fatores_positivos: string[] = [];
    const fatores_negativos: string[] = [];
    const recomendacoes: string[] = [];

    // Avaliar saldo positivo
    if (patrimonio.saldo_total > 0) {
      score += 20;
      fatores_positivos.push('Saldo positivo nas contas');
    } else {
      score -= 30;
      fatores_negativos.push('Saldo negativo ou zero');
      recomendacoes.push('Foque em aumentar sua receita ou reduzir gastos');
    }

    // Avaliar reserva de emergência (estimativa)
    if (patrimonio.saldo_total > 3000) { // 3x salário mínimo aproximado
      score += 15;
      fatores_positivos.push('Boa reserva financeira');
    } else {
      fatores_negativos.push('Reserva de emergência insuficiente');
      recomendacoes.push('Construa uma reserva de emergência');
    }

    // Definir nível baseado no score
    let nivel: SaudeFinanceira['nivel'];
    if (score >= 80) nivel = 'excelente';
    else if (score >= 60) nivel = 'boa';
    else if (score >= 40) nivel = 'moderada';
    else nivel = 'preocupante';

    return {
      score: Math.max(0, Math.min(100, score)),
      nivel,
      fatores_positivos,
      fatores_negativos,
      recomendacoes
    };
  }

  private buildIndicadoresMes(indicators: any, patrimonio: any): IndicadoresMes {
    return {
      saldo_total: patrimonio.saldo_total,
      saldo_previsto: patrimonio.saldo_previsto,
      receitas_mes: indicators?.receitas_confirmadas || 0,
      despesas_mes: indicators?.despesas_confirmadas || 0,
      fluxo_liquido: (indicators?.receitas_confirmadas || 0) - (indicators?.despesas_confirmadas || 0),
      score_saude_financeira: indicators?.score_saude_financeira || 50,
      meta_orcamento_cumprida: 0 // TODO: Calcular baseado nas metas e orçamentos
    };
  }

  private async getTendencies(userId: string): Promise<TendenciaGastos[]> {
    // TODO: Implementar análise de tendências real
    // Por enquanto retorna array vazio
    return [];
  }

  private async getComparacaoMensal(userId: string): Promise<ComparacaoMensal> {
    // TODO: Implementar comparação real com mês anterior
    return {
      mes_anterior: { receitas: 0, despesas: 0, economia: 0 },
      mes_atual: { receitas: 0, despesas: 0, economia: 0 },
      variacao: { receitas_percentual: 0, despesas_percentual: 0, economia_percentual: 0 }
    };
  }

  private async getPadroesGastos(userId: string) {
    // TODO: Implementar análise de padrões real
    return {
      gastos: [],
      categorias: [],
      horarios: []
    };
  }

  private async getProjecoes(userId: string) {
    // TODO: Implementar projeções reais
    return [];
  }

  private async getLancamentosFuturos(userId: string) {
    // TODO: Implementar busca de lançamentos futuros (recorrentes + parcelados)
    return [];
  }

  private async getMensagensRecentes(userId: string) {
    // TODO: Implementar busca do histórico de chat
    return [];
  }

  private async getIntencoesAnteriores(userId: string) {
    // TODO: Implementar busca de intenções anteriores
    return [];
  }

  private async getOperacoesRealizadas(userId: string) {
    // TODO: Implementar busca de operações realizadas
    return [];
  }

  private async getPreferenciasContextuais(userId: string) {
    // TODO: Implementar sistema de aprendizado de preferências
    return [];
  }

  private async generateRelevantInsights(userId: string, query: string) {
    // TODO: Implementar geração de insights relevantes
    return [];
  }

  private async logContextChange(userId: string, change: ContextChange) {
    try {
      await supabase
        .from('app_ai_context_log')
        .insert({
          user_id: userId,
          change_type: change.type,
          change_data: change.data,
          timestamp: change.timestamp
        });
    } catch (error) {
      console.warn('Não foi possível logar mudança de contexto:', error);
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      default_account_id: undefined,
      default_categories: {},
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      notification_settings: {
        budget_alerts: true,
        goal_reminders: true,
        transaction_confirmations: true,
        insights_weekly: true
      }
    };
  }

  private getDefaultSettings(): UserSettings {
    return {
      currency: 'BRL',
      date_format: 'DD/MM/YYYY',
      number_format: 'pt-BR',
      dark_mode: false
    };
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }
}

// Instância única exportada
export const aiContextManager = AIContextManager.getInstance(); 