import { supabase } from '../supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * Base API class to handle common functionality for all API services
 */
export class BaseApi {
  protected supabase = supabase;
  
  /**
   * Get the current authenticated user
   */
  protected async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session?.user || null;
  }
  
  /**
   * Check if current user is authenticated
   */
  protected async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }
  
  /**
   * Handle API errors consistently
   */
  protected handleError(error: any, fallbackMessage: string = 'Ocorreu um erro inesperado'): Error {
    console.error(error);
    if (error.message) {
      return new Error(error.message);
    }
    return new Error(fallbackMessage);
  }
  
  /**
   * Format dates to ISO string, but only the date portion
   */
  protected formatDateToISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Get the first and last day of the current month
   */
  protected getCurrentMonthRange(): { startDate: string, endDate: string } {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      startDate: this.formatDateToISO(firstDayOfMonth),
      endDate: this.formatDateToISO(lastDayOfMonth)
    };
  }
  
  /**
   * Get date range based on period
   */
  protected getDateRangeByPeriod(period: 'week' | 'month' | 'year'): { startDate: string, endDate: string } {
    const now = new Date();
    const endDate = this.formatDateToISO(now);
    let startDate: string;
    
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = this.formatDateToISO(weekAgo);
    } else if (period === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = this.formatDateToISO(monthAgo);
    } else { // year
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      startDate = this.formatDateToISO(yearAgo);
    }
    
    return { startDate, endDate };
  }
}
