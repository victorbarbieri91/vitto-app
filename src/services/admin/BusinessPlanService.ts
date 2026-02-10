import { supabase } from '../supabase/client';
import type {
  BusinessPlan,
  BusinessPlanHistory,
  BusinessPlanSubmodule,
  BusinessPlanContent,
  UpdateBusinessPlanInput
} from '../../types/admin';

// Use untyped client for admin tables (not yet in Database types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminClient = supabase as any;

/**
 *
 */
export class BusinessPlanService {
  /**
   * Get all business plan submodules
   */
  static async getAll(): Promise<BusinessPlan[]> {
    const { data, error } = await adminClient
      .from('app_admin_business_plan')
      .select('*')
      .order('submodule');

    if (error) throw error;
    return (data || []) as BusinessPlan[];
  }

  /**
   * Get a specific submodule
   */
  static async getBySubmodule(submodule: BusinessPlanSubmodule): Promise<BusinessPlan | null> {
    const { data, error } = await adminClient
      .from('app_admin_business_plan')
      .select('*')
      .eq('submodule', submodule)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as BusinessPlan | null;
  }

  /**
   * Update a submodule's content
   */
  static async update(
    submodule: BusinessPlanSubmodule,
    input: UpdateBusinessPlanInput,
    userId: string,
    changeSummary?: string
  ): Promise<BusinessPlan> {
    // Get current content for history
    const current = await this.getBySubmodule(submodule);

    // Update the plan
    const { data, error } = await adminClient
      .from('app_admin_business_plan')
      .update({
        content: input.content,
        status: input.status || current?.status || 'draft',
        updated_by: userId,
        version: (current?.version || 0) + 1
      })
      .eq('submodule', submodule)
      .select()
      .single();

    if (error) throw error;

    // Record history
    if (current && data) {
      await adminClient.from('app_admin_business_plan_history').insert({
        plan_id: data.id,
        submodule,
        previous_content: current.content,
        new_content: input.content,
        change_summary: changeSummary || 'Atualização do conteúdo',
        changed_by: userId
      });
    }

    return data as BusinessPlan;
  }

  /**
   * Update submodule status only
   */
  static async updateStatus(
    submodule: BusinessPlanSubmodule,
    status: 'draft' | 'validating' | 'validated',
    userId: string
  ): Promise<BusinessPlan> {
    const { data, error } = await adminClient
      .from('app_admin_business_plan')
      .update({
        status,
        updated_by: userId
      })
      .eq('submodule', submodule)
      .select()
      .single();

    if (error) throw error;
    return data as BusinessPlan;
  }

  /**
   * Get history for a submodule
   */
  static async getHistory(submodule: BusinessPlanSubmodule, limit: number = 10): Promise<BusinessPlanHistory[]> {
    const { data, error } = await adminClient
      .from('app_admin_business_plan_history')
      .select('*')
      .eq('submodule', submodule)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as BusinessPlanHistory[];
  }

  /**
   * Get a specific content type with type safety
   */
  static getTypedContent<T extends BusinessPlanContent>(plan: BusinessPlan): T {
    return plan.content as T;
  }
}
