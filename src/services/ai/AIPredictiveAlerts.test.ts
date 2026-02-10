/**
 * Testes do AIPredictiveAlerts
 * Testa alertas preditivos baseados em dados financeiros
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AIPredictiveAlerts } from './AIPredictiveAlerts'
import type { FinancialContext } from '../../types/ai'

// Contexto financeiro base para testes
const createMockContext = (overrides: Partial<any> = {}): FinancialContext => ({
  patrimonio: {
    saldo_total: 5000,
    total_investimentos: 0,
    total_dividas: 0,
    patrimonio_liquido: 5000,
    ...overrides.patrimonio,
  },
  indicadores: {
    mes_atual: {
      receitas_mes: 5000,
      despesas_mes: 3000,
      fluxo_liquido: 2000,
      economia_percentual: 40,
      ...overrides.mes_atual,
    },
    saude_financeira: {
      score: 75,
      nivel: 'bom',
      ...overrides.saude_financeira,
    },
    ...overrides.indicadores,
  },
  contas: [],
  transacoes_recentes: [],
  ...overrides,
} as any)

describe('AIPredictiveAlerts', () => {
  let alertService: AIPredictiveAlerts

  beforeEach(() => {
    alertService = AIPredictiveAlerts.getInstance()
  })

  describe('getInstance', () => {
    it('deve retornar sempre a mesma instância (singleton)', () => {
      const instance1 = AIPredictiveAlerts.getInstance()
      const instance2 = AIPredictiveAlerts.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('generatePredictiveAlerts', () => {
    it('deve retornar array de alertas', async () => {
      const context = createMockContext()
      const alerts = await alertService.generatePredictiveAlerts(context)
      expect(Array.isArray(alerts)).toBe(true)
    })

    it('deve retornar no máximo 10 alertas', async () => {
      const context = createMockContext()
      const alerts = await alertService.generatePredictiveAlerts(context)
      expect(alerts.length).toBeLessThanOrEqual(10)
    })

    it('alertas devem ter estrutura correta', async () => {
      const context = createMockContext({
        patrimonio: { saldo_total: 500 },
        mes_atual: { fluxo_liquido: -300, despesas_mes: 3000 },
      })
      const alerts = await alertService.generatePredictiveAlerts(context)

      if (alerts.length > 0) {
        const alert = alerts[0]
        expect(alert).toHaveProperty('id')
        expect(alert).toHaveProperty('type')
        expect(alert).toHaveProperty('title')
        expect(alert).toHaveProperty('message')
        expect(alert).toHaveProperty('confidence')
        expect(alert).toHaveProperty('suggestedActions')
        expect(['warning', 'opportunity', 'critical', 'info']).toContain(alert.type)
      }
    })

    it('deve gerar alerta de risco quando saldo baixo e fluxo negativo', async () => {
      const context = createMockContext({
        patrimonio: { saldo_total: 500 },
        mes_atual: { fluxo_liquido: -1000, despesas_mes: 3000, receitas_mes: 2000 },
      })
      const alerts = await alertService.generatePredictiveAlerts(context)

      const cashFlowAlert = alerts.find(a => a.category === 'cash_flow')
      expect(cashFlowAlert).toBeDefined()
      expect(cashFlowAlert?.type).toMatch(/critical|warning/)
    })

    it('deve gerar alerta de recuperação quando saldo negativo mas fluxo positivo', async () => {
      const context = createMockContext({
        patrimonio: { saldo_total: -1000 },
        mes_atual: { fluxo_liquido: 500, despesas_mes: 2000, receitas_mes: 2500 },
      })
      const alerts = await alertService.generatePredictiveAlerts(context)

      const recoveryAlert = alerts.find(a =>
        a.category === 'cash_flow' && a.type === 'opportunity'
      )
      expect(recoveryAlert).toBeDefined()
      expect(recoveryAlert?.title).toContain('Recuperação')
    })

    it('deve gerar alerta de oportunidade quando tem superávit', async () => {
      const context = createMockContext({
        patrimonio: { saldo_total: 5000 },
        mes_atual: { fluxo_liquido: 2000, despesas_mes: 3000, receitas_mes: 5000 },
      })
      const alerts = await alertService.generatePredictiveAlerts(context)

      const opportunityAlert = alerts.find(a => a.category === 'opportunity')
      expect(opportunityAlert).toBeDefined()
    })

    it('alertas devem estar ordenados por prioridade (mais urgentes primeiro)', async () => {
      const context = createMockContext({
        patrimonio: { saldo_total: 500 },
        mes_atual: { fluxo_liquido: -300, despesas_mes: 5000, receitas_mes: 4700 },
        saude_financeira: { score: 40, nivel: 'ruim' },
      })
      const alerts = await alertService.generatePredictiveAlerts(context)

      if (alerts.length >= 2) {
        // Primeiro alerta deve ter prioridade maior ou igual ao segundo
        const priorityOrder = ['critical', 'warning', 'opportunity', 'info']
        const idx1 = priorityOrder.indexOf(alerts[0].type)
        const idx2 = priorityOrder.indexOf(alerts[1].type)
        expect(idx1).toBeLessThanOrEqual(idx2)
      }
    })
  })

  describe('generateCustomAlert (desativado)', () => {
    it('deve retornar null (recurso desativado)', async () => {
      const context = createMockContext()
      const result = await alertService.generateCustomAlert(context, 'test', {})
      expect(result).toBeNull()
    })
  })

  describe('hasAIEnabled', () => {
    it('deve retornar boolean', () => {
      const result = alertService.hasAIEnabled()
      expect(typeof result).toBe('boolean')
    })
  })
})
