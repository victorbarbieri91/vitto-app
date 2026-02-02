import { supabase } from '../supabase/client';
import type {
  AdminFinanceEntry,
  CreateFinanceEntryInput,
  UpdateFinanceEntryInput,
  FinanceType,
  FinanceCategory
} from '../../types/admin';

// Use untyped client for admin tables (not yet in Database types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminClient = supabase as any;

export interface FinanceFilters {
  tipo?: FinanceType;
  categoria?: FinanceCategory;
  recorrente?: boolean;
  dataInicio?: string;
  dataFim?: string;
  search?: string;
}

export interface FinanceSummary {
  totalDespesas: number;
  totalReceitas: number;
  saldo: number;
  despesasRecorrentes: number;
  despesasPorCategoria: Record<string, number>;
}

export class AdminFinanceService {
  /**
   * Get all finance entries with optional filters
   */
  static async getAll(filters?: FinanceFilters): Promise<AdminFinanceEntry[]> {
    let query = adminClient
      .from('app_admin_financeiro')
      .select('*')
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.tipo) {
        query = query.eq('tipo', filters.tipo);
      }

      if (filters.categoria) {
        query = query.eq('categoria', filters.categoria);
      }

      if (filters.recorrente !== undefined) {
        query = query.eq('recorrente', filters.recorrente);
      }

      if (filters.dataInicio) {
        query = query.gte('data', filters.dataInicio);
      }

      if (filters.dataFim) {
        query = query.lte('data', filters.dataFim);
      }

      if (filters.search) {
        query = query.or(`descricao.ilike.%${filters.search}%,observacoes.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AdminFinanceEntry[];
  }

  /**
   * Get a single entry by ID
   */
  static async getById(id: number): Promise<AdminFinanceEntry | null> {
    const { data, error } = await adminClient
      .from('app_admin_financeiro')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as AdminFinanceEntry | null;
  }

  /**
   * Create a new finance entry
   */
  static async create(input: CreateFinanceEntryInput, userId: string): Promise<AdminFinanceEntry> {
    const { data, error } = await adminClient
      .from('app_admin_financeiro')
      .insert({
        ...input,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data as AdminFinanceEntry;
  }

  /**
   * Update a finance entry
   */
  static async update(id: number, input: UpdateFinanceEntryInput): Promise<AdminFinanceEntry> {
    const { data, error } = await adminClient
      .from('app_admin_financeiro')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminFinanceEntry;
  }

  /**
   * Delete a finance entry
   */
  static async delete(id: number): Promise<void> {
    const { error } = await adminClient
      .from('app_admin_financeiro')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get financial summary
   */
  static async getSummary(month?: string): Promise<FinanceSummary> {
    let query = adminClient.from('app_admin_financeiro').select('*');

    // Filter by month if provided (format: YYYY-MM)
    if (month) {
      const startDate = `${month}-01`;
      const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
        .toISOString()
        .split('T')[0];
      query = query.gte('data', startDate).lte('data', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const entries = (data || []) as AdminFinanceEntry[];

    const totalDespesas = entries
      .filter(e => e.tipo === 'despesa')
      .reduce((sum, e) => sum + Number(e.valor), 0);

    const totalReceitas = entries
      .filter(e => e.tipo === 'receita')
      .reduce((sum, e) => sum + Number(e.valor), 0);

    const despesasRecorrentes = entries
      .filter(e => e.tipo === 'despesa' && e.recorrente)
      .reduce((sum, e) => sum + Number(e.valor), 0);

    const despesasPorCategoria: Record<string, number> = {};
    entries
      .filter(e => e.tipo === 'despesa')
      .forEach(e => {
        despesasPorCategoria[e.categoria] = (despesasPorCategoria[e.categoria] || 0) + Number(e.valor);
      });

    return {
      totalDespesas,
      totalReceitas,
      saldo: totalReceitas - totalDespesas,
      despesasRecorrentes,
      despesasPorCategoria
    };
  }

  /**
   * Get monthly totals for the current year
   */
  static async getMonthlyTotals(): Promise<Array<{
    month: string;
    despesas: number;
    receitas: number;
  }>> {
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;

    const { data, error } = await adminClient
      .from('app_admin_financeiro')
      .select('*')
      .gte('data', startDate)
      .lte('data', endDate);

    if (error) throw error;

    const entries = (data || []) as AdminFinanceEntry[];
    const monthlyData: Record<string, { despesas: number; receitas: number }> = {};

    // Initialize all months
    for (let i = 1; i <= 12; i++) {
      const month = `${currentYear}-${String(i).padStart(2, '0')}`;
      monthlyData[month] = { despesas: 0, receitas: 0 };
    }

    // Aggregate data
    entries.forEach(entry => {
      const month = entry.data.substring(0, 7);
      if (monthlyData[month]) {
        if (entry.tipo === 'despesa') {
          monthlyData[month].despesas += Number(entry.valor);
        } else {
          monthlyData[month].receitas += Number(entry.valor);
        }
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }));
  }
}
