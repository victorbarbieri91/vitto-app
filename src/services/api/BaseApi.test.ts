/**
 * Testes do BaseApi
 * Testa métodos utilitários compartilhados por todos os serviços
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do módulo supabase - factory sem variáveis externas (hoisted)
vi.mock('../../services/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-id-123', email: 'test@vitto.app' },
            access_token: 'test-token',
          }
        },
        error: null
      }),
    },
    functions: { invoke: vi.fn() },
    channel: vi.fn(),
    rpc: vi.fn(),
  }
}))

import { BaseApi } from './BaseApi'
import { supabase } from '../../services/supabase/client'

// Classe concreta para testar BaseApi (que é usada via herança)
class TestApi extends BaseApi {
  public testGetCurrentUser() { return this.getCurrentUser() }
  public testIsAuthenticated() { return this.isAuthenticated() }
  public testHandleError(error: any, msg?: string) { return this.handleError(error, msg) }
  public testFormatDateToISO(date: Date) { return this.formatDateToISO(date) }
  public testGetCurrentMonthRange() { return this.getCurrentMonthRange() }
  public testGetDateRangeByPeriod(period: 'week' | 'month' | 'year') { return this.getDateRangeByPeriod(period) }
}

describe('BaseApi', () => {
  let api: TestApi

  beforeEach(() => {
    api = new TestApi()
    vi.clearAllMocks()
    // Reset auth mock para estado padrão (autenticado)
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user-id-123', email: 'test@vitto.app' } as any,
          access_token: 'test-token',
        } as any
      },
      error: null
    })
  })

  describe('getCurrentUser', () => {
    it('deve retornar o usuário quando autenticado', async () => {
      const user = await api.testGetCurrentUser()
      expect(user).not.toBeNull()
      expect(user?.id).toBe('test-user-id-123')
      expect(user?.email).toBe('test@vitto.app')
    })

    it('deve retornar null quando não autenticado', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      })
      const user = await api.testGetCurrentUser()
      expect(user).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('deve retornar true quando logado', async () => {
      const result = await api.testIsAuthenticated()
      expect(result).toBe(true)
    })

    it('deve retornar false quando não logado', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      })
      const result = await api.testIsAuthenticated()
      expect(result).toBe(false)
    })
  })

  describe('handleError', () => {
    it('deve usar a mensagem do erro quando disponível', () => {
      const error = api.testHandleError({ message: 'Erro do banco' })
      expect(error.message).toBe('Erro do banco')
    })

    it('deve usar mensagem de fallback quando erro não tem message', () => {
      const error = api.testHandleError({})
      expect(error.message).toBe('Ocorreu um erro inesperado')
    })

    it('deve aceitar mensagem de fallback customizada', () => {
      const error = api.testHandleError({}, 'Falha personalizada')
      expect(error.message).toBe('Falha personalizada')
    })
  })

  describe('formatDateToISO', () => {
    it('deve formatar data corretamente (YYYY-MM-DD)', () => {
      const date = new Date(2025, 0, 15)
      const result = api.testFormatDateToISO(date)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('não deve incluir hora na formatação', () => {
      const date = new Date(2025, 5, 20, 14, 30, 0)
      const result = api.testFormatDateToISO(date)
      expect(result).not.toContain('T')
      expect(result).not.toContain(':')
    })
  })

  describe('getCurrentMonthRange', () => {
    it('deve retornar startDate e endDate no formato correto', () => {
      const range = api.testGetCurrentMonthRange()
      expect(range.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(range.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('startDate deve ser dia 1 do mês', () => {
      const range = api.testGetCurrentMonthRange()
      expect(range.startDate).toMatch(/-01$/)
    })

    it('endDate deve ser posterior a startDate', () => {
      const range = api.testGetCurrentMonthRange()
      expect(new Date(range.endDate).getTime()).toBeGreaterThan(new Date(range.startDate).getTime())
    })
  })

  describe('getDateRangeByPeriod', () => {
    it('deve retornar range de 7 dias para "week"', () => {
      const range = api.testGetDateRangeByPeriod('week')
      const diffDays = (new Date(range.endDate).getTime() - new Date(range.startDate).getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThanOrEqual(6)
      expect(diffDays).toBeLessThanOrEqual(8)
    })

    it('deve retornar range de ~30 dias para "month"', () => {
      const range = api.testGetDateRangeByPeriod('month')
      const diffDays = (new Date(range.endDate).getTime() - new Date(range.startDate).getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThanOrEqual(27)
      expect(diffDays).toBeLessThanOrEqual(32)
    })

    it('deve retornar range de ~365 dias para "year"', () => {
      const range = api.testGetDateRangeByPeriod('year')
      const diffDays = (new Date(range.endDate).getTime() - new Date(range.startDate).getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThanOrEqual(364)
      expect(diffDays).toBeLessThanOrEqual(367)
    })
  })
})
