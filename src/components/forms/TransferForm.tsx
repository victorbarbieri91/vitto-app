import React, { useState } from 'react';
import { ModernCard, ModernButton, ModernInput } from '../ui/modern';
import { useAccounts } from '../../hooks/useAccounts';
import { TransactionService, TransferTransactionRequest } from '../../services/api/TransactionService';
import { 
  ArrowLeftRight,
  Wallet,
  Calendar,
  FileText,
  AlertCircle,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

interface TransferFormProps {
  onSuccess?: (transfers: { origem: any; destino: any }) => void;
  onCancel?: () => void;
  className?: string;
}

interface FormData {
  descricao: string;
  valor: string;
  conta_origem_id: string;
  conta_destino_id: string;
  data: string;
  observacoes: string;
}

export function TransferForm({ onSuccess, onCancel, className }: TransferFormProps) {
  const { accounts, loading: accountsLoading } = useAccounts();
  const transactionService = new TransactionService();

  const [formData, setFormData] = useState<FormData>({
    descricao: '',
    valor: '',
    conta_origem_id: '',
    conta_destino_id: '',
    data: new Date().toISOString().split('T')[0],
    observacoes: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    const valor = parseFloat(formData.valor);
    if (!formData.valor || isNaN(valor) || valor <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (!formData.conta_origem_id) {
      newErrors.conta_origem_id = 'Conta de origem é obrigatória';
    }

    if (!formData.conta_destino_id) {
      newErrors.conta_destino_id = 'Conta de destino é obrigatória';
    }

    if (formData.conta_origem_id === formData.conta_destino_id) {
      newErrors.conta_destino_id = 'Conta de destino deve ser diferente da origem';
    }

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória';
    }

    // Verificar se a conta de origem tem saldo suficiente
    const contaOrigem = accounts.find(acc => acc.id === parseInt(formData.conta_origem_id));
    if (contaOrigem && valor > contaOrigem.saldo_atual) {
      newErrors.valor = `Saldo insuficiente. Disponível: R$ ${contaOrigem.saldo_atual.toFixed(2).replace('.', ',')}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const request: TransferTransactionRequest = {
        descricao: formData.descricao.trim(),
        valor: parseFloat(formData.valor),
        conta_origem_id: parseInt(formData.conta_origem_id),
        conta_destino_id: parseInt(formData.conta_destino_id),
        data: formData.data,
        observacoes: formData.observacoes.trim() || undefined,
      };

      const transfers = await transactionService.createTransferTransaction(request);
      
      if (onSuccess) {
        onSuccess(transfers);
      }

      // Reset form
      setFormData({
        descricao: '',
        valor: '',
        conta_origem_id: '',
        conta_destino_id: '',
        data: new Date().toISOString().split('T')[0],
        observacoes: '',
      });
    } catch (error) {
      console.error('Erro ao criar transferência:', error);
      setSubmitError(error instanceof Error ? error.message : 'Erro ao criar transferência');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contasDisponiveis = accounts.filter(account => account.ativo);
  const contaOrigem = accounts.find(acc => acc.id === parseInt(formData.conta_origem_id));
  const contaDestino = accounts.find(acc => acc.id === parseInt(formData.conta_destino_id));

  // Contas disponíveis para destino (excluindo a origem)
  const contasDestino = contasDisponiveis.filter(
    acc => acc.id !== parseInt(formData.conta_origem_id)
  );

  return (
    <ModernCard variant="default" className={`p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-coral-500 rounded-2xl">
          <ArrowLeftRight className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-deep-blue">Transferência entre Contas</h2>
          <p className="text-slate-500">Mova dinheiro entre suas contas bancárias</p>
        </div>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Descrição */}
        <ModernInput
          label="Descrição"
          value={formData.descricao}
          onChange={(e) => handleInputChange('descricao', e.target.value)}
          placeholder="Ex: Transferência para poupança, Ajuste de saldos..."
          leftIcon={<FileText className="w-5 h-5" />}
          error={errors.descricao}
        />

        {/* Valor */}
        <ModernInput
          label="Valor da Transferência"
          type="number"
          step="0.01"
          min="0"
          value={formData.valor}
          onChange={(e) => handleInputChange('valor', e.target.value)}
          placeholder="0,00"
          leftIcon={<span className="text-slate-500 font-medium">R$</span>}
          error={errors.valor}
        />

        {/* Seleção de Contas */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-deep-blue">Contas para Transferência</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Conta de Origem */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-deep-blue flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Conta de Origem (Debitar)
              </label>
              <select
                value={formData.conta_origem_id}
                onChange={(e) => handleInputChange('conta_origem_id', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                  errors.conta_origem_id
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-slate-200 focus:border-coral-500'
                } focus:outline-none`}
                disabled={accountsLoading}
              >
                <option value="">Selecione a conta de origem</option>
                {contasDisponiveis.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome} - R$ {conta.saldo_atual.toFixed(2).replace('.', ',')}
                  </option>
                ))}
              </select>
              {errors.conta_origem_id && (
                <p className="text-sm text-red-500">{errors.conta_origem_id}</p>
              )}
              
              {/* Preview da Conta de Origem */}
              {contaOrigem && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-deep-blue">{contaOrigem.nome}</p>
                      <p className="text-sm text-slate-500">
                        Saldo: R$ {contaOrigem.saldo_atual.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Seta de Transferência */}
            <div className="hidden md:flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <ArrowRight className="w-8 h-8 text-coral-500" />
                <span className="text-xs text-slate-500">Transferir</span>
              </div>
            </div>

            {/* Conta de Destino */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-deep-blue flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Conta de Destino (Creditar)
              </label>
              <select
                value={formData.conta_destino_id}
                onChange={(e) => handleInputChange('conta_destino_id', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                  errors.conta_destino_id
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-slate-200 focus:border-coral-500'
                } focus:outline-none`}
                disabled={accountsLoading || !formData.conta_origem_id}
              >
                <option value="">
                  {!formData.conta_origem_id 
                    ? "Primeiro selecione a conta de origem" 
                    : "Selecione a conta de destino"
                  }
                </option>
                {contasDestino.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome} - R$ {conta.saldo_atual.toFixed(2).replace('.', ',')}
                  </option>
                ))}
              </select>
              {errors.conta_destino_id && (
                <p className="text-sm text-red-500">{errors.conta_destino_id}</p>
              )}
              
              {/* Preview da Conta de Destino */}
              {contaDestino && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-deep-blue">{contaDestino.nome}</p>
                      <p className="text-sm text-slate-500">
                        Saldo: R$ {contaDestino.saldo_atual.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview da Transferência */}
        {contaOrigem && contaDestino && formData.valor && (
          <div className="p-4 bg-coral-50 border border-coral-200 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-coral-600" />
              <p className="text-sm text-coral-700 font-medium">Preview da Transferência</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Valor:</span>
                <span className="font-semibold text-coral-600">
                  R$ {parseFloat(formData.valor).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">De:</span>
                <span className="text-deep-blue">{contaOrigem.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Para:</span>
                <span className="text-deep-blue">{contaDestino.nome}</span>
              </div>
              <hr className="my-2 border-coral-200" />
              <div className="flex justify-between text-xs">
                <span>Saldo {contaOrigem.nome} após:</span>
                <span className="font-medium">
                  R$ {(contaOrigem.saldo_atual - parseFloat(formData.valor)).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Saldo {contaDestino.nome} após:</span>
                <span className="font-medium">
                  R$ {(contaDestino.saldo_atual + parseFloat(formData.valor)).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Data */}
        <ModernInput
          label="Data da Transferência"
          type="date"
          value={formData.data}
          onChange={(e) => handleInputChange('data', e.target.value)}
          leftIcon={<Calendar className="w-5 h-5" />}
          error={errors.data}
        />

        {/* Observações */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-deep-blue">Observações (opcional)</label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => handleInputChange('observacoes', e.target.value)}
            placeholder="Observações adicionais sobre esta transferência..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-coral-500 focus:outline-none transition-all resize-none"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-4 pt-4">
          {onCancel && (
            <ModernButton
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </ModernButton>
          )}
          
          <ModernButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting || accountsLoading}
          >
            {isSubmitting ? 'Realizando Transferência...' : 'Realizar Transferência'}
          </ModernButton>
        </div>
      </form>
    </ModernCard>
  );
}
