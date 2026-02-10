/**
 * Testes do AccountService
 * Testa operações CRUD de contas bancárias
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ========== MOCK SETUP ==========
// vi.hoisted() garante que este código roda antes do vi.mock()
const mockResponse = vi.hoisted(() => ({
  current: { data: null as any, error: null as any }
}))

const mockAuth = vi.hoisted(() => ({
  getSession: vi.fn()
}))

// Builder chainable que simula a query do Supabase
function createQueryBuilder() {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(mockResponse.current)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(mockResponse.current)),
    then: vi.fn().mockImplementation((resolve: any) => resolve(mockResponse.current)),
  }
  return builder
}

const mockFromFn = vi.hoisted(() => vi.fn())
const mockRpcFn = vi.hoisted(() => vi.fn())

// Mock do módulo supabase - usa referências hoisted
vi.mock('../../services/supabase/client', () => ({
  supabase: {
    from: mockFromFn,
    auth: mockAuth,
    functions: { invoke: vi.fn() },
    channel: vi.fn(),
    rpc: mockRpcFn,
  }
}))

// Mock das utils de validação (para simplificar os testes)
vi.mock('../../utils/dataValidation', () => ({
  sanitizeAccount: (account: any) => account,
  withFallback: async (fn: () => Promise<any>, fallback: any) => {
    try { return await fn() } catch { return fallback }
  },
  toSafeArray: (arr: any) => arr || [],
}))

import { AccountService } from './AccountService'

// ========== DADOS DE TESTE ==========
const mockAccount = {
  id: 1,
  nome: 'Nubank',
  tipo: 'conta_corrente',
  saldo_inicial: 1000,
  saldo_atual: 1500,
  cor: '#8A05BE',
  icone: 'bank',
  descricao: 'Conta principal',
  instituicao: 'Nubank',
  status: 'ativa',
  moeda: 'BRL',
  user_id: 'test-user-id-123',
  created_at: '2025-01-01T00:00:00.000Z',
  grupo_id: null,
}

const mockAccountsList = [
  { ...mockAccount, id: 1, nome: 'Nubank', saldo_atual: 1500 },
  { ...mockAccount, id: 2, nome: 'Itaú', saldo_atual: 3200, cor: '#FF6600' },
  { ...mockAccount, id: 3, nome: 'Poupança', saldo_atual: 10000, tipo: 'poupanca' },
]

// ========== HELPERS ==========
function setAuthenticated() {
  mockAuth.getSession.mockResolvedValue({
    data: {
      session: {
        user: { id: 'test-user-id-123', email: 'test@vitto.app' } as any,
        access_token: 'test-token',
      } as any
    },
    error: null
  })
}

function setUnauthenticated() {
  mockAuth.getSession.mockResolvedValue({
    data: { session: null },
    error: null
  })
}

function setResponse(resp: { data: any; error: any }) {
  mockResponse.current = resp
}

// ========== TESTES ==========
describe('AccountService', () => {
  let service: AccountService

  beforeEach(() => {
    service = new AccountService()
    vi.clearAllMocks()
    setAuthenticated()
    mockResponse.current = { data: null, error: null }
    mockFromFn.mockImplementation(() => createQueryBuilder())
    mockRpcFn.mockImplementation(() => Promise.resolve(mockResponse.current))
  })

  describe('fetchAccounts', () => {
    it('deve retornar lista de contas do usuário', async () => {
      setResponse({ data: mockAccountsList, error: null })

      const accounts = await service.fetchAccounts()

      expect(mockFromFn).toHaveBeenCalledWith('app_conta')
      expect(accounts).toHaveLength(3)
      expect(accounts[0].nome).toBe('Nubank')
    })

    it('deve retornar array vazio quando não autenticado', async () => {
      setUnauthenticated()

      const accounts = await service.fetchAccounts()

      expect(accounts).toEqual([])
    })

    it('deve retornar array vazio quando há erro', async () => {
      setResponse({ data: null, error: { message: 'Erro de rede' } })

      const accounts = await service.fetchAccounts()

      expect(accounts).toEqual([])
    })
  })

  describe('getAccount', () => {
    it('deve retornar conta por ID', async () => {
      setResponse({ data: mockAccount, error: null })

      const account = await service.getAccount(1)

      expect(mockFromFn).toHaveBeenCalledWith('app_conta')
      expect(account).not.toBeNull()
      expect(account?.id).toBe(1)
      expect(account?.nome).toBe('Nubank')
    })

    it('deve retornar null quando não autenticado', async () => {
      setUnauthenticated()

      const account = await service.getAccount(1)

      expect(account).toBeNull()
    })

    it('deve lançar erro quando conta não existe', async () => {
      setResponse({ data: null, error: { message: 'Row not found' } })

      await expect(service.getAccount(999)).rejects.toThrow()
    })
  })

  describe('createAccount', () => {
    it('deve criar conta com dados corretos', async () => {
      const newAccountData = {
        nome: 'Nova Conta',
        tipo: 'conta_corrente',
        saldo_inicial: 500,
        cor: '#FF0000',
        icone: 'bank',
        status: 'ativa' as const,
        moeda: 'BRL',
      }

      setResponse({
        data: { ...mockAccount, ...newAccountData, id: 10, saldo_atual: 500 },
        error: null
      })

      const account = await service.createAccount(newAccountData)

      expect(mockFromFn).toHaveBeenCalledWith('app_conta')
      expect(account).not.toBeNull()
      expect(account.nome).toBe('Nova Conta')
    })

    it('deve lançar erro quando não autenticado', async () => {
      setUnauthenticated()

      await expect(service.createAccount({
        nome: 'Teste',
        tipo: 'conta_corrente',
        saldo_inicial: 0,
        cor: null,
        icone: null,
        status: 'ativa',
        moeda: 'BRL',
      })).rejects.toThrow('Usuário não autenticado')
    })
  })

  describe('getTotalBalance', () => {
    it('deve calcular saldo total corretamente', async () => {
      setResponse({
        data: [
          { saldo_atual: 1500 },
          { saldo_atual: 3200 },
          { saldo_atual: 10000 },
        ],
        error: null
      })

      const total = await service.getTotalBalance()

      expect(total).toBe(14700)
    })

    it('deve lidar com saldos como string', async () => {
      setResponse({
        data: [
          { saldo_atual: '1500.50' },
          { saldo_atual: '2000.25' },
        ],
        error: null
      })

      const total = await service.getTotalBalance()

      expect(total).toBeCloseTo(3500.75)
    })

    it('deve lançar erro quando não autenticado', async () => {
      setUnauthenticated()

      await expect(service.getTotalBalance()).rejects.toThrow('Usuário não autenticado')
    })
  })

  describe('deleteAccount', () => {
    it('deve lançar erro quando conta tem transações', async () => {
      // Simula que há transações vinculadas
      setResponse({ data: [{ id: 100 }], error: null })

      await expect(service.deleteAccount(1)).rejects.toThrow('Não é possível excluir conta com transações associadas')
    })

    it('deve lançar erro quando não autenticado', async () => {
      setUnauthenticated()

      await expect(service.deleteAccount(1)).rejects.toThrow('Usuário não autenticado')
    })
  })
})
