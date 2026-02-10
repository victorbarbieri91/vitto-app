import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  /** Se true, mostra fallback de página inteira (para erro global) */
  fullPage?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 *
 */
class ErrorBoundary extends Component<Props, State> {
  /**
   *
   */
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   *
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   *
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Enviar para Sentry com contexto do componente
    Sentry.captureException(error, {
      tags: {
        component: this.props.componentName || 'unknown',
        errorBoundary: 'true',
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack || '',
        },
      },
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  /**
   *
   */
  render() {
    if (this.state.hasError) {
      // Fallback personalizado fornecido via props
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback de página inteira (para ErrorBoundary global)
      if (this.props.fullPage) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Algo deu errado
              </h1>
              <p className="text-gray-600 mb-6">
                Encontramos um erro inesperado. Nossa equipe foi notificada automaticamente.
              </p>
              {this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    Detalhes técnicos
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-gray-700 overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Tentar novamente
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Voltar ao Dashboard
                </button>
              </div>
            </div>
          </div>
        );
      }

      // Fallback padrão (inline, para componentes individuais)
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Erro no componente</span>
          </div>
          <p className="text-sm text-red-600 mb-3">
            {this.props.componentName ? `Componente "${this.props.componentName}" encontrou um erro.` : 'Algo deu errado neste componente.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
