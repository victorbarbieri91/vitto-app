/**
 * Wrapper de teste para componentes React
 * Fornece providers necessários (Router, Auth simulado, etc.)
 */
import React from 'react'
import { BrowserRouter } from 'react-router-dom'

type TestWrapperProps = {
  children: React.ReactNode
}

/**
 * Wrapper básico com Router para testar componentes que usam react-router
 */
export const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}
