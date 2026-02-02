import { supabase } from '../supabase/client';
import type { AdminMetrics } from '../../types/admin';

export class AdminMetricsService {
  /**
   * Fetch all admin dashboard metrics (SaaS focused, 7-day period)
   */
  static async getMetrics(): Promise<AdminMetrics> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Fetch all metrics in parallel
    const [
      totalUsersResult,
      newUsers7dResult,
      activeUsers7dResult,
      transactions7dResult,
      onboardingResult,
      aiSessions7dResult
    ] = await Promise.all([
      // Total users
      supabase
        .from('app_perfil')
        .select('id', { count: 'exact', head: true }),

      // New users in last 7 days
      supabase
        .from('app_perfil')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgoISO),

      // Active users (with transactions in last 7 days)
      supabase
        .from('app_transacoes')
        .select('user_id')
        .gte('created_at', sevenDaysAgoISO),

      // Transactions created in last 7 days
      supabase
        .from('app_transacoes')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgoISO),

      // Onboarding completed (for activation rate)
      supabase
        .from('app_perfil')
        .select('onboarding_completed'),

      // AI sessions - count user messages in last 7 days
      supabase
        .from('app_chat_mensagens')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user')
        .gte('created_at', sevenDaysAgoISO)
    ]);

    // Calculate unique active users
    const uniqueActiveUsers = activeUsers7dResult.data
      ? new Set(activeUsers7dResult.data.map(t => t.user_id)).size
      : 0;

    const totalUsers = totalUsersResult.count || 0;
    const newUsers7d = newUsers7dResult.count || 0;
    const activeUsers7d = uniqueActiveUsers;

    // Calculate retention rate (active / total)
    const retentionRate = totalUsers > 0
      ? Math.round((activeUsers7d / totalUsers) * 100)
      : 0;

    // Calculate activation rate (onboarding completed / total)
    const completedOnboarding = onboardingResult.data
      ? onboardingResult.data.filter(p => p.onboarding_completed).length
      : 0;
    const activationRate = totalUsers > 0
      ? Math.round((completedOnboarding / totalUsers) * 100)
      : 0;

    return {
      totalUsers,
      activeUsers7d,
      newUsers7d,
      retentionRate,
      activationRate,
      aiSessions7d: aiSessions7dResult.count || 0,
      transactions7d: transactions7dResult.count || 0,
      mrr: 0 // Placeholder for future monetization
    };
  }

  /**
   * Get Business Plan status summary
   */
  static async getBusinessPlanStatus(): Promise<{
    total: number;
    validated: number;
    validating: number;
    draft: number;
    progress: number;
    nextFocus: { submodule: string; title: string } | null;
  }> {
    const { data, error } = await supabase
      .from('app_admin_business_plan')
      .select('submodule, status, content');

    if (error || !data) {
      return {
        total: 7,
        validated: 0,
        validating: 0,
        draft: 7,
        progress: 0,
        nextFocus: null
      };
    }

    const validated = data.filter(p => p.status === 'validated').length;
    const validating = data.filter(p => p.status === 'validating').length;
    const draft = data.filter(p => p.status === 'draft').length;
    const total = data.length;

    // Progress = % of non-draft submodules
    const progress = total > 0
      ? Math.round(((validated + validating) / total) * 100)
      : 0;

    // Next focus = first draft submodule in priority order
    const priorityOrder = ['thesis', 'market', 'product', 'revenue', 'go_to_market', 'metrics', 'risks'];
    const draftSubmodules = data.filter(p => p.status === 'draft');
    const sortedDrafts = draftSubmodules.sort((a, b) =>
      priorityOrder.indexOf(a.submodule) - priorityOrder.indexOf(b.submodule)
    );

    const SUBMODULE_TITLES: Record<string, string> = {
      thesis: 'Tese do Negócio',
      market: 'Mercado e Concorrência',
      product: 'Produto e Diferenciais',
      revenue: 'Modelo de Receita',
      go_to_market: 'Go-to-Market',
      metrics: 'Métricas e Objetivos',
      risks: 'Riscos e Decisões'
    };

    const nextFocus = sortedDrafts.length > 0
      ? {
          submodule: sortedDrafts[0].submodule,
          title: SUBMODULE_TITLES[sortedDrafts[0].submodule] || sortedDrafts[0].submodule
        }
      : null;

    return {
      total,
      validated,
      validating,
      draft,
      progress,
      nextFocus
    };
  }

  /**
   * Get hypotheses from thesis submodule
   */
  static async getHypotheses(): Promise<Array<{ text: string; validated: boolean }>> {
    const { data, error } = await supabase
      .from('app_admin_business_plan')
      .select('content')
      .eq('submodule', 'thesis')
      .single();

    if (error || !data?.content) {
      return [];
    }

    const content = data.content as { hypotheses?: Array<{ text: string; validated: boolean }> };
    return content.hypotheses || [];
  }

  /**
   * Get period objectives from metrics submodule
   */
  static async getOKRs(): Promise<Array<{
    period: string;
    objectives: string[];
    status: 'pending' | 'in_progress' | 'achieved';
  }>> {
    const { data, error } = await supabase
      .from('app_admin_business_plan')
      .select('content')
      .eq('submodule', 'metrics')
      .single();

    if (error || !data?.content) {
      return [];
    }

    const content = data.content as {
      periodObjectives?: Array<{
        period: string;
        objectives: string[];
        status: 'pending' | 'in_progress' | 'achieved';
      }>
    };
    return content.periodObjectives || [];
  }
}
