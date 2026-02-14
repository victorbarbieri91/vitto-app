/**
 * Testes do PrivateRoute
 * Verifica proteção de rotas: redireciona para login quando não autenticado,
 * redireciona para entrevista quando necessário, e renderiza conteúdo quando OK.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// ========== MOCKS ==========
// Mock do useAuth
const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../store/AuthContext', () => ({
  useAuth: mockUseAuth,
}))

// Mock do useOnboarding
const mockUseOnboarding = vi.hoisted(() => vi.fn())
vi.mock('../../contexts/OnboardingContext', () => ({
  useOnboarding: mockUseOnboarding,
}))

// Mock do ModernAppLayout (simplificado - não precisamos testar o layout aqui)
vi.mock('../layout/ModernAppLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}))

import PrivateRoute from './PrivateRoute'

// ========== HELPERS ==========
function renderPrivateRoute(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        <Route path="/entrevista" element={<div data-testid="interview-page">Entrevista</div>} />
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
          <Route path="/contas" element={<div data-testid="accounts-page">Contas</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

// ========== TESTES ==========
describe('PrivateRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Estado de carregamento', () => {
    it('deve mostrar spinner enquanto auth está carregando', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      })
      mockUseOnboarding.mockReturnValue({
        isOnboardingRequired: false,
        loading: false,
      })

      renderPrivateRoute()

      // Deve ter o spinner de loading (animate-spin)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).not.toBeNull()
      // Não deve mostrar login nem dashboard
      expect(screen.queryByTestId('login-page')).toBeNull()
      expect(screen.queryByTestId('dashboard-page')).toBeNull()
    })

    it('deve mostrar spinner enquanto onboarding está carregando', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@vitto.app' },
        loading: false,
      })
      mockUseOnboarding.mockReturnValue({
        isOnboardingRequired: false,
        loading: true,
      })

      renderPrivateRoute()

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).not.toBeNull()
    })
  })

  describe('Redirecionamento para login', () => {
    it('deve redirecionar para /login quando não autenticado', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      })
      mockUseOnboarding.mockReturnValue({
        isOnboardingRequired: false,
        loading: false,
      })

      renderPrivateRoute()

      expect(screen.getByTestId('login-page')).toBeDefined()
      expect(screen.queryByTestId('dashboard-page')).toBeNull()
    })
  })

  describe('Redirecionamento para entrevista', () => {
    it('deve redirecionar para /entrevista quando onboarding necessário', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@vitto.app' },
        loading: false,
      })
      mockUseOnboarding.mockReturnValue({
        isOnboardingRequired: true,
        loading: false,
      })

      renderPrivateRoute()

      expect(screen.getByTestId('interview-page')).toBeDefined()
      expect(screen.queryByTestId('dashboard-page')).toBeNull()
    })
  })

  describe('Renderização de conteúdo protegido', () => {
    it('deve renderizar o dashboard quando autenticado e onboarding completo', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@vitto.app' },
        loading: false,
      })
      mockUseOnboarding.mockReturnValue({
        isOnboardingRequired: false,
        loading: false,
      })

      renderPrivateRoute('/dashboard')

      expect(screen.getByTestId('app-layout')).toBeDefined()
      expect(screen.getByTestId('dashboard-page')).toBeDefined()
    })

    it('deve renderizar dentro do ModernAppLayout', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@vitto.app' },
        loading: false,
      })
      mockUseOnboarding.mockReturnValue({
        isOnboardingRequired: false,
        loading: false,
      })

      renderPrivateRoute('/contas')

      expect(screen.getByTestId('app-layout')).toBeDefined()
      expect(screen.getByTestId('accounts-page')).toBeDefined()
    })
  })
})
