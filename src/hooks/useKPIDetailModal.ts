import { useState, useCallback } from 'react';

export type KPIType = 'saldo_previsto' | 'saldo_conta' | 'receitas' | 'despesas' | 'economia';

interface UseKPIDetailModalReturn {
  isOpen: boolean;
  kpiType: KPIType | null;
  openModal: (type: KPIType) => void;
  closeModal: () => void;
}

export function useKPIDetailModal(): UseKPIDetailModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [kpiType, setKpiType] = useState<KPIType | null>(null);

  const openModal = useCallback((type: KPIType) => {
    setKpiType(type);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Delay para permitir animação de saída
    setTimeout(() => setKpiType(null), 200);
  }, []);

  return {
    isOpen,
    kpiType,
    openModal,
    closeModal,
  };
}
