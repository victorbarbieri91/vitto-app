/**
 * Mock do cliente Supabase para testes
 *
 * Simula a API chainable do Supabase:
 * supabase.from('table').select().eq().single()
 *
 * Uso em testes:
 * vi.mock('../../services/supabase/client', () => ({
 *   supabase: mockSupabase
 * }))
 */
import { vi } from 'vitest'

// Tipo para os dados mockados que serão retornados
type MockResponse = {
  data: any
  error: any
  count?: number
}

// Estado interno do mock - permite configurar respostas por teste
let mockResponse: MockResponse = { data: null, error: null }

/**
 * Define a resposta que o mock vai retornar
 *
 * @example
 * setMockResponse({ data: [{ id: 1, nome: 'Conta' }], error: null })
 */
export function setMockResponse(response: MockResponse) {
  mockResponse = response
}

/**
 * Reseta o mock para estado inicial
 */
export function resetMockResponse() {
  mockResponse = { data: null, error: null }
}

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
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(mockResponse)),
    single: vi.fn().mockImplementation(() => Promise.resolve(mockResponse)),
    // Quando a chain resolve (await), retorna mockResponse
    then: vi.fn().mockImplementation((resolve: any) => resolve(mockResponse)),
  }

  return builder
}

// Mock do módulo auth do Supabase
const mockAuth = {
  getSession: vi.fn().mockResolvedValue({
    data: {
      session: {
        user: {
          id: 'test-user-id-123',
          email: 'test@vitto.app',
          user_metadata: { nome: 'Usuário Teste' }
        },
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      }
    },
    error: null
  }),
  getUser: vi.fn().mockResolvedValue({
    data: {
      user: {
        id: 'test-user-id-123',
        email: 'test@vitto.app',
      }
    },
    error: null
  }),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } }
  }),
  refreshSession: vi.fn(),
}

// Mock do módulo functions do Supabase
const mockFunctions = {
  invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
}

// Mock do módulo realtime do Supabase
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
  unsubscribe: vi.fn(),
}

/**
 * Mock principal do cliente Supabase
 * Importado nos testes via vi.mock()
 */
export const mockSupabase = {
  from: vi.fn().mockImplementation(() => createQueryBuilder()),
  auth: mockAuth,
  functions: mockFunctions,
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn(),
  rpc: vi.fn().mockImplementation(() => Promise.resolve(mockResponse)),
}

// Helper para configurar auth como "não logado"
/**
 *
 */
export function setMockUnauthenticated() {
  mockAuth.getSession.mockResolvedValue({
    data: { session: null },
    error: null
  })
}

// Helper para configurar auth como "logado"
/**
 *
 */
export function setMockAuthenticated(userId = 'test-user-id-123') {
  mockAuth.getSession.mockResolvedValue({
    data: {
      session: {
        user: {
          id: userId,
          email: 'test@vitto.app',
          user_metadata: { nome: 'Usuário Teste' }
        },
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      }
    },
    error: null
  })
}
