import { supabase } from '../supabase/client';
import type {
  AgendaTask,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  TaskPriority,
  BusinessPlanSubmodule
} from '../../types/admin';

// Use untyped client for admin tables (not yet in Database types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminClient = supabase as any;

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  responsible_user_id?: string;
  linked_submodule?: BusinessPlanSubmodule;
  search?: string;
}

/**
 *
 */
export class AgendaService {
  /**
   * Get all tasks with optional filters
   */
  static async getAll(filters?: TaskFilters): Promise<AgendaTask[]> {
    let query = adminClient
      .from('app_admin_agenda')
      .select('*')
      .order('deadline', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters.priority) {
        if (Array.isArray(filters.priority)) {
          query = query.in('priority', filters.priority);
        } else {
          query = query.eq('priority', filters.priority);
        }
      }

      if (filters.responsible_user_id) {
        query = query.eq('responsible_user_id', filters.responsible_user_id);
      }

      if (filters.linked_submodule) {
        query = query.eq('linked_submodule', filters.linked_submodule);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AgendaTask[];
  }

  /**
   * Get a single task by ID
   */
  static async getById(id: number): Promise<AgendaTask | null> {
    const { data, error } = await adminClient
      .from('app_admin_agenda')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as AgendaTask | null;
  }

  /**
   * Create a new task
   */
  static async create(input: CreateTaskInput, userId: string): Promise<AgendaTask> {
    const { data, error } = await adminClient
      .from('app_admin_agenda')
      .insert({
        ...input,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data as AgendaTask;
  }

  /**
   * Update a task
   */
  static async update(id: number, input: UpdateTaskInput): Promise<AgendaTask> {
    const updateData: Record<string, unknown> = { ...input };

    // Set completed_at when status changes to completed
    if (input.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else if (input.status) {
      updateData.completed_at = null;
    }

    const { data, error } = await adminClient
      .from('app_admin_agenda')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AgendaTask;
  }

  /**
   * Delete a task
   */
  static async delete(id: number): Promise<void> {
    const { error } = await adminClient
      .from('app_admin_agenda')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get task counts by status
   */
  static async getStatusCounts(): Promise<Record<TaskStatus, number>> {
    const { data, error } = await adminClient
      .from('app_admin_agenda')
      .select('status');

    if (error) throw error;

    const counts: Record<TaskStatus, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };

    (data || []).forEach((task: { status: string }) => {
      if (task.status in counts) {
        counts[task.status as TaskStatus]++;
      }
    });

    return counts;
  }

  /**
   * Get upcoming deadlines (next 7 days)
   */
  static async getUpcomingDeadlines(): Promise<AgendaTask[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const { data, error } = await adminClient
      .from('app_admin_agenda')
      .select('*')
      .gte('deadline', today.toISOString().split('T')[0])
      .lte('deadline', nextWeek.toISOString().split('T')[0])
      .in('status', ['pending', 'in_progress'])
      .order('deadline', { ascending: true });

    if (error) throw error;
    return (data || []) as AgendaTask[];
  }

  /**
   * Get overdue tasks
   */
  static async getOverdue(): Promise<AgendaTask[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await adminClient
      .from('app_admin_agenda')
      .select('*')
      .lt('deadline', today)
      .in('status', ['pending', 'in_progress'])
      .order('deadline', { ascending: true });

    if (error) throw error;
    return (data || []) as AgendaTask[];
  }
}
