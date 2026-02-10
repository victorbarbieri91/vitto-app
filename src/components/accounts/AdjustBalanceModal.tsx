import { useState, useEffect } from 'react';
import { ModernCard, ModernButton, ModernInput } from '../ui/modern';
import { DollarSign, AlertCircle, Calculator } from 'lucide-react';
import { saldoService, type DadosAjusteSaldo } from '../../services/api/SaldoService';
import type { Account } from '../../services/api/AccountService';

interface AdjustBalanceModalProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
};

/**
 *
 */
export default function AdjustBalanceModal({ 
  account, 
  isOpen, 
  onClose, 
  onSuccess 
}: AdjustBalanceModalProps) {
  const [saldoCalculado, setSaldoCalculado] = useState<number>(0);
  const [novoSaldo, setNovoSaldo] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingCalculated, setLoadingCalculated] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar saldo calculado atual quando o modal abrir
  useEffect(() => {
    if (isOpen && account) {
      fetchSaldoCalculado();
    }
  }, [isOpen, account]);

  const fetchSaldoCalculado = async () => {
    try {
      setLoadingCalculated(true);
      const saldo = await saldoService.calcularSaldoConta(account.id);
      setSaldoCalculado(saldo);
      setNovoSaldo(saldo.toFixed(2).replace('.', ','));
    } catch (error) {
      console.error('Erro ao calcular saldo:', error);
      setSaldoCalculado(account.saldo_atual);
      setNovoSaldo(account.saldo_atual.toFixed(2).replace('.', ','));
    } finally {
      setLoadingCalculated(false);
    }
  };

  const diferenca = parseCurrency(novoSaldo) - saldoCalculado;
  const hasDiferenca = Math.abs(diferenca) > 0.01; // Tolerância de 1 centavo

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasDiferenca) {
      setError('Não há diferença para ajustar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dadosAjuste: DadosAjusteSaldo = {
        conta_id: account.id,
        saldo_atual_calculado: saldoCalculado,
        novo_saldo: parseCurrency(novoSaldo),
        diferenca,
        observacoes: observacoes || undefined
      };

      await saldoService.ajustarSaldoConta(dadosAjuste);
      
      // Chamar callbacks de sucesso
      onSuccess();
      onClose();
      
      // Resetar form
      setNovoSaldo('');
      setObservacoes('');
      
    } catch (error: any) {
      setError(error.message || 'Erro ao ajustar saldo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNovoSaldo('');
    setObservacoes('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModernCard variant="glass" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <ModernCard className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-coral-50 rounded-lg">
              <Calculator className="w-5 h-5 text-coral-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-deep-blue">Ajustar Saldo</h2>
              <p className="text-sm text-slate-500">Conta: {account.nome}</p>
            </div>
          </div>

          {/* Informações de Saldo */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <ModernCard variant="metric" className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-slate-500 mb-1">Saldo Registrado</p>
                <p className="text-lg font-bold text-deep-blue">
                  {formatCurrency(account.saldo_atual)}
                </p>
              </div>
            </ModernCard>
            
            <ModernCard variant="metric" className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-slate-500 mb-1">Saldo Calculado</p>
                {loadingCalculated ? (
                  <div className="h-6 bg-slate-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-lg font-bold text-coral-500">
                    {formatCurrency(saldoCalculado)}
                  </p>
                )}
              </div>
            </ModernCard>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Novo Saldo Real
              </label>
              <ModernInput
                type="text"
                value={novoSaldo}
                onChange={(e) => setNovoSaldo(e.target.value)}
                placeholder="0,00"
                required
                disabled={loadingCalculated}
                className="text-right"
              />
            </div>

            {/* Mostrar diferença se houver */}
            {hasDiferenca && !loadingCalculated && (
              <ModernCard 
                variant="metric" 
                className={`p-4 ${diferenca > 0 ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className={`w-4 h-4 ${diferenca > 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Diferença: {diferenca > 0 ? '+' : ''}{formatCurrency(diferenca)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Será criado um lançamento de {diferenca > 0 ? 'receita' : 'despesa'} de ajuste
                    </p>
                  </div>
                </div>
              </ModernCard>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Motivo do ajuste, ex: conciliação bancária, correção de erro, etc."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <ModernButton
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </ModernButton>
              <ModernButton
                type="submit"
                variant="primary"
                disabled={loading || loadingCalculated || !hasDiferenca}
                className="flex-1"
              >
                {loading ? 'Ajustando...' : 'Confirmar Ajuste'}
              </ModernButton>
            </div>
          </form>
        </ModernCard>
      </div>
    </ModernCard>
  );
}