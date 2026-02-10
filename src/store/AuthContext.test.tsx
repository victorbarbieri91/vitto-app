/**
 * Testes do AuthContext
 * Verifica login, logout, estado de autenticação e persistência de sessão
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'

// ========== MOCKS HOISTED ==========
const mockGetSession = vi.hoisted(() => vi.fn())
const mockSignInWithPassword = vi.hoisted(() => vi.fn())
const mockSignUp = vi.hoisted(() => vi.fn())
const mockSignOut = vi.hoisted(() => vi.fn())
const mockOnAuthStateChange = vi.hoisted(() => vi.fn())
const mockResetPasswordForEmail = vi.hoisted(() => vi.fn())
const mockUpdateUser = vi.hoisted(() => vi.fn())
const mockRefreshSession = vi.hoisted(() => vi.fn())
const mockFromFn = vi.hoisted(() => vi.fn())

// Armazena o callback do onAuthStateChange para simular eventos
let authChangeCallback: ((event: string, session: any) => void) | null = null

vi.mock('../services/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
      refreshSession: mockRefreshSession,
    },
    from: mockFromFn,
  },
}))

// Mock do useUserProfile (simplifica o teste)
vi.mock('../hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    userProfile: null,
    loading: false,
    error: null,
    refreshProfile: vi.fn(),
  }),
}))

import { AuthProvider, useAuth } from './AuthContext'

// ========== COMPONENTE DE TESTE ==========
// Componente que expõe o estado do AuthContext para os testes
function TestConsumer() {
  const { user, loading, signIn, signOut } = useAuth()
  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <button data-testid="sign-in-btn" onClick={() => signIn('test@vitto.app', 'password123')}>
        Sign In
      </button>
      <button data-testid="sign-out-btn" onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  )
}

// ========== HELPERS ==========
function renderAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  )
}

const mockUser = {
  id: 'test-user-id-123',
  email: 'test@vitto.app',
  user_metadata: { nome: 'Teste' },
}

const mockSession = {
  user: mockUser,
  access_token: 'test-token',
  refresh_token: 'test-refresh',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
}

// ========== TESTES ==========
describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authChangeCallback = null

    // Setup padrão: sem sessão
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    // Captura o callback do onAuthStateChange
    mockOnAuthStateChange.mockImplementation((callback: any) => {
      authChangeCallback = callback
      return {
        data: {
          subscription: { unsubscribe: vi.fn() },
        },
      }
    })

    mockSignOut.mockResolvedValue({ error: null })
    mockRefreshSession.mockResolvedValue({ data: { session: null }, error: null })

    // Mock do from (para checkAndCreateUserProfile)
    const mockBuilder: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      then: vi.fn().mockImplementation((resolve: any) => resolve({ data: null, error: null })),
    }
    mockFromFn.mockReturnValue(mockBuilder)
  })

  describe('useAuth fora do provider', () => {
    it('deve lançar erro quando usado fora do AuthProvider', () => {
      // Suprime console.error do React para este teste
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestConsumer />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('Estado inicial', () => {
    it('deve iniciar em estado de loading', () => {
      // getSession nunca resolve neste teste
      mockGetSession.mockReturnValue(new Promise(() => {}))

      renderAuth()

      expect(screen.getByTestId('loading').textContent).toBe('true')
    })

    it('deve resolver loading após getSession retornar', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false')
      })
    })

    it('deve definir user como null quando sem sessão', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('null')
      })
    })

    it('deve definir user quando há sessão existente', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@vitto.app')
      })
    })
  })

  describe('signIn', () => {
    it('deve chamar signInWithPassword do supabase', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false')
      })

      await act(async () => {
        screen.getByTestId('sign-in-btn').click()
      })

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@vitto.app',
        password: 'password123',
      })
    })

    it('deve retornar error quando signIn falha', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      })

      // Renderizar e verificar que signIn retorna o erro
      let signInResult: any
      function TestSignInResult() {
        const { signIn, loading } = useAuth()
        return (
          <div>
            <div data-testid="load">{loading ? 'true' : 'false'}</div>
            <button
              data-testid="do-signin"
              onClick={async () => {
                signInResult = await signIn('test@vitto.app', 'wrong')
              }}
            >
              Login
            </button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestSignInResult />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('load').textContent).toBe('false')
      })

      await act(async () => {
        screen.getByTestId('do-signin').click()
      })

      expect(signInResult.error).toBeDefined()
      expect(signInResult.error.message).toBe('Invalid credentials')
    })
  })

  describe('signOut', () => {
    it('deve chamar signOut do supabase', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@vitto.app')
      })

      await act(async () => {
        screen.getByTestId('sign-out-btn').click()
      })

      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('onAuthStateChange listener', () => {
    it('deve registrar listener ao montar', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      renderAuth()

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled()
      })
    })

    it('deve atualizar user quando evento de login é disparado', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('null')
      })

      // Simula evento de login
      await act(async () => {
        authChangeCallback?.('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@vitto.app')
      })
    })

    it('deve limpar user quando evento de logout é disparado', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      renderAuth()

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@vitto.app')
      })

      // Simula evento de logout
      await act(async () => {
        authChangeCallback?.('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('null')
      })
    })
  })
})
