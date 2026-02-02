import { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

type TransactionChangeType = 'create' | 'update' | 'delete' | 'confirm' | 'all';

interface TransactionChangeEvent {
  type: TransactionChangeType;
  transactionType?: 'receita' | 'despesa' | 'despesa_cartao' | 'fixed';
  timestamp: number;
}

type TransactionContextType = {
  // Contador que incrementa a cada mudança - componentes podem usar para detectar mudanças
  changeVersion: number;
  // Último evento de mudança
  lastChange: TransactionChangeEvent | null;
  // Função para notificar que houve uma mudança
  notifyChange: (type?: TransactionChangeType, transactionType?: TransactionChangeEvent['transactionType']) => void;
  // Função para registrar um callback que será chamado quando houver mudança
  onTransactionChange: (callback: (event: TransactionChangeEvent) => void) => () => void;
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [changeVersion, setChangeVersion] = useState(0);
  const [lastChange, setLastChange] = useState<TransactionChangeEvent | null>(null);

  // Armazena os callbacks registrados
  const listenersRef = useRef<Set<(event: TransactionChangeEvent) => void>>(new Set());

  const notifyChange = useCallback((
    type: TransactionChangeType = 'all',
    transactionType?: TransactionChangeEvent['transactionType']
  ) => {
    const event: TransactionChangeEvent = {
      type,
      transactionType,
      timestamp: Date.now()
    };

    console.log('[TransactionContext] Notificando mudança:', event);

    // Atualiza o estado
    setChangeVersion(v => v + 1);
    setLastChange(event);

    // Notifica todos os listeners
    listenersRef.current.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[TransactionContext] Erro ao executar listener:', error);
      }
    });
  }, []);

  const onTransactionChange = useCallback((callback: (event: TransactionChangeEvent) => void) => {
    // Adiciona o callback aos listeners
    listenersRef.current.add(callback);

    // Retorna função para remover o listener
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  return (
    <TransactionContext.Provider value={{
      changeVersion,
      lastChange,
      notifyChange,
      onTransactionChange
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactionContext() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactionContext must be used within a TransactionProvider');
  }
  return context;
}

// Hook opcional para componentes que só precisam reagir a mudanças
export function useTransactionRefresh(callback: () => void, deps: any[] = []) {
  const { onTransactionChange } = useTransactionContext();

  // Registra o callback quando o componente monta
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Efeito para registrar/desregistrar o listener
  const effectCallback = useCallback(() => {
    const unsubscribe = onTransactionChange(() => {
      callbackRef.current();
    });
    return unsubscribe;
  }, [onTransactionChange, ...deps]);

  return effectCallback;
}
