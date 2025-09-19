import { useEffect } from 'react';

interface ErrorLog {
  timestamp: string;
  error: string;
  stack?: string;
  userAgent: string;
  url: string;
  component?: string;
}

export const useErrorMonitoring = () => {
  useEffect(() => {
    // Monitor erros globais não capturados
    const handleError = (event: ErrorEvent) => {
      const errorLog: ErrorLog = {
        timestamp: new Date().toISOString(),
        error: event.message,
        stack: event.error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Log no console para debug
      console.group('🚨 Unhandled Error');
      console.error('Message:', event.message);
      console.error('File:', event.filename);
      console.error('Line:', event.lineno);
      console.error('Column:', event.colno);
      console.error('Stack:', event.error?.stack);
      console.groupEnd();

      // Salvar no localStorage para debug
      try {
        const errors = JSON.parse(localStorage.getItem('vitto_errors') || '[]');
        errors.push(errorLog);
        // Manter apenas os últimos 50 erros
        if (errors.length > 50) errors.shift();
        localStorage.setItem('vitto_errors', JSON.stringify(errors));
      } catch (e) {
        console.warn('Não foi possível salvar erro no localStorage');
      }
    };

    // Monitor promise rejections não capturadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorLog: ErrorLog = {
        timestamp: new Date().toISOString(),
        error: `Promise Rejection: ${event.reason}`,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      console.group('🚨 Unhandled Promise Rejection');
      console.error('Reason:', event.reason);
      console.groupEnd();

      try {
        const errors = JSON.parse(localStorage.getItem('vitto_errors') || '[]');
        errors.push(errorLog);
        if (errors.length > 50) errors.shift();
        localStorage.setItem('vitto_errors', JSON.stringify(errors));
      } catch (e) {
        console.warn('Não foi possível salvar erro no localStorage');
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Função para log manual de erros
  const logError = (error: Error, component?: string) => {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      component
    };

    console.group('🚨 Component Error');
    console.error('Component:', component || 'Unknown');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.groupEnd();

    try {
      const errors = JSON.parse(localStorage.getItem('vitto_errors') || '[]');
      errors.push(errorLog);
      if (errors.length > 50) errors.shift();
      localStorage.setItem('vitto_errors', JSON.stringify(errors));
    } catch (e) {
      console.warn('Não foi possível salvar erro no localStorage');
    }
  };

  // Função para obter logs de erro
  const getErrorLogs = (): ErrorLog[] => {
    try {
      return JSON.parse(localStorage.getItem('vitto_errors') || '[]');
    } catch {
      return [];
    }
  };

  // Função para limpar logs
  const clearErrorLogs = () => {
    localStorage.removeItem('vitto_errors');
  };

  return {
    logError,
    getErrorLogs,
    clearErrorLogs
  };
};

export default useErrorMonitoring;