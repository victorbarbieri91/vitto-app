/**
 * Testes do useAccounts
 * Testa o hook que gerencia estado de contas bancárias (CRUD + loading/error)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// ========== MOCKS HOISTED ==========
const mockUser = vi.hoisted(() => ({ current: null as any }))

const mockFetchAccounts = vi.hoisted(() => vi.fn())
const mockCreateAccount = vi.hoisted(() => vi.fn())
const mockUpdateAccount = vi.hoisted(() => vi.fn())
const mockDeleteAccount = vi.hoisted(() => vi.fn())
const mockCreateTransfer = vi.hoisted(() => vi.fn())

// Mock do useAuth
vi.mock('../store/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser.current,
    loading: false,
  }),
}))

// Mock do AccountService - precisa ser uma classe real pois é instanciada com `new`
vi.mock('../services/api/AccountService', () => {
  class MockAccountService {
    fetchAccounts = mockFetchAccounts
    createAccount = mockCreateAccount
    updateAccount = mockUpdateAccount
    deleteAccount = mockDeleteAccount
    createTransfer = mockCreateTransfer
  }
  return { AccountService: MockAccountService }
})

import { useAccounts } from './useAccounts'

// ========== DADOS DE TESTE ==========
const mockAccountsList = [
  {
    id: 1,
    nome: 'Nubank',
    tipo: 'conta_corrente',
    saldo_inicial: 1000,
    saldo_atual: 1500,
    cor: '#8A05BE',
    icone: 'bank',
    user_id: 'test-user-id-123',
    status: 'ativa',
    moeda: 'BRL',
    created_at: '2025-01-01T00:00:00.000Z',
    grupo_id: null,
    instituicao: 'Nubank',
    descricao: null,
  },
  {
    id: 2,
    nome: 'Itaú',
    tipo: 'conta_corrente',
    saldo_inicial: 3000,
    saldo_atual: 3200,
    cor: '#FF6600',
    icone: 'bank',
    user_id: 'test-user-id-123',
    status: 'ativa',
    moeda: 'BRL',
    created_at: '2025-01-01T00:00:00.000Z',
    grupo_id: null,
    instituicao: 'Itaú',
    descricao: null,
  },
]

// ========== TESTES ==========
describe('useAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser.current = { id: 'test-user-id-123', email: 'test@vitto.app' }
    mockFetchAccounts.mockResolvedValue(mockAccountsList)
    mockCreateAccount.mockResolvedValue(mockAccountsList[0])
    mockUpdateAccount.mockResolvedValue(true)
    mockDeleteAccount.mockResolvedValue(true)
    mockCreateTransfer.mockResolvedValue(true)
  })

  describe('Carregamento inicial', () => {
    it('deve iniciar em estado de loading', () => {
      const { result } = renderHook(() => useAccounts())

      // No primeiro render, loading deve ser true
      expect(result.current.loading).toBe(true)
    })

    it('deve carregar contas automaticamente quando há usuário', async () => {
      const { result } = renderHook(() => useAccounts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.accounts).toHaveLength(2)
      expect(result.current.accounts[0].nome).toBe('Nubank')
      expect(result.current.accounts[1].nome).toBe('Itaú')
      expect(result.current.error).toBeNull()
    })

    it('deve retornar array vazio quando não há usuário', async () => {
      mockUser.current = null

      const { result } = renderHook(() => useAccounts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.accounts).toEqual([])
    })

    it('deve setar erro quando fetch falha', async () => {
      mockFetchAccounts.mockRejectedValue(new Error('Erro de rede'))

      const { result } = renderHook(() => useAccounts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Erro de rede')
    })
  })

  describe('addAccount', () => {
    it('deve adicionar conta e atualizar lista', async () => {
      const newAccount = {
        ...mockAccountsList[0],
        id: 10,
        nome: 'Nova Conta',
        saldo_atual: 500,
      }
      mockCreateAccount.mockResolvedValue(newAccount)

      const { result } = renderHook(() => useAccounts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        const created = await result.current.addAccount({
          nome: 'Nova Conta',
          tipo: 'conta_corrente',
          saldo_inicial: 500,
          cor: '#FF0000',
          icone: 'bank',
          status: 'ativa',
          moeda: 'BRL',
        })
        expect(created).not.toBeNull()
        expect(created?.nome).toBe('Nova Conta')
      })
    })

    it('deve retornar null quando não tem usuário', async () => {
      mockUser.current = null

      const { result } = renderHook(() => useAccounts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        const created = await result.current.addAccount({
          nome: 'Teste',
          tipo: 'conta_corrente',
          saldo_inicial: 0,
          cor: null,
          icone: null,
          status: 'ativa',
          moeda: 'BRL',
        })
        expect(created).toBeNull()
      })
    })
  })

  describe('updateAccount', () => {
    it('deve atualizar conta e retornar true', async () => {
      const { result } = renderHook(() => useAccounts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let success: boolean
      await act(async () => {
        success = await result.current.updateAccount(1, { nome: 'Nubank Atualizado' })
      })

      expect(success!).toBe(true)
      expect(mockUpdateAccount).toHaveBeenCalledWith(1, { nome: 'Nubank Atualizado' })
    })

    it('deve retornar false quando update falha', async () => {
      mockUpdateAccount.mockRejectedValue(new Error('Erro ao atualizar'))

      const { result } = renderHook(() => useAccounts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let success: boolean
      await act(async () => {
        success = await result.current.updateAccount(1, { nome: 'Falha' })
      })

      expect(success!).toBe(false)
      expect(result.current.error).toBe('Erro ao atualizar')
    })
  })

  describe('deleteAccount', () => {
    it('deve remover conta da lista local', async () => {
      const { result } = renderHook(() => useAccounts())

      await waitFor(() => {
        expect(result.current.accounts).toHaveLength(2)
      })

      await act(async () => {
        const success = await result.current.deleteAccount(1)
        expect(success).toBe(true)
      })

      // Conta com id=1 deve ter sido removida
      expect(result.current.accounts.find(a => a.id === 1)).toBeUndefined()
    })

    it('deve retornar false quando delete falha', async () => {
      mockDeleteAccount.mockRejectedValue(new Error('Não é possível excluir'))

      const { result } = renderHook(() => useAccounts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let success: boolean
      await act(async () => {
        success = await result.current.deleteAccount(1)
      })

      expect(success!).toBe(false)
      expect(result.current.error).toBe('Não é possível excluir')
    })
  })

  describe('createTransfer', () => {
    it('deve chamar createTransfer e re-fetch contas', async () => {
      const { result } = renderHook(() => useAccounts())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let success: boolean
      await act(async () => {
        success = await result.current.createTransfer({
          from_account_id: 1,
          to_account_id: 2,
          amount: 100,
          date: '2025-06-15',
          description: 'Transferência teste',
        })
      })

      expect(success!).toBe(true)
      expect(mockCreateTransfer).toHaveBeenCalled()
      // fetchAccounts é chamado 1x no mount + 1x após transferência
      expect(mockFetchAccounts).toHaveBeenCalledTimes(2)
    })
  })
})
