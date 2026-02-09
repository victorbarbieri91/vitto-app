import React, { useState } from 'react';
import { ModernCard } from '../ui/modern';
import { ModernButton } from '../ui/modern';
import { ModernInput } from '../ui/modern';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import { useCreditCards } from '../../hooks/useCreditCards';
import { TransactionService, CreateInstallmentTransactionRequest } from '../../services/api/TransactionService';
import { CreditCard, Wallet, Calendar, Calculator, FileText, AlertCircle } from 'lucide-react';

interface ParcelamentoFormProps {
  onSuccess?: (transactions: any[]) => void;
  onCancel?: () => void;
  className?: string;
}

interface FormData {
  descricao: string;
  valor_total: string;
  tipo: 'receita' | 'despesa';
  categoria_id: string;
  conta_id: string;
  cartao_id: string;
  total_parcelas: string;
  parcela_atual: string;
  data_primeira_parcela: string;
  observacoes: string;
}

export function ParcelamentoForm({ onSuccess, onCancel, className }: ParcelamentoFormProps) {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { cards, loading: cardsLoading } = useCreditCards();
  const transactionService = new TransactionService();

  const [formData, setFormData] = useState<FormData>({
    descricao: '',
    valor_total: '',
    tipo: 'despesa',
    categoria_id: '',
    conta_id: '',
    cartao_id: '',
    total_parcelas: '2',
    parcela_atual: '1',
    data_primeira_parcela: new Date().toISOString().split('T')[0],
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

    const valor = parseFloat(formData.valor_total);
    if (!formData.valor_total || isNaN(valor) || valor <= 0) {
      newErrors.valor_total = 'Valor deve ser maior que zero';
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = 'Categoria é obrigatória';
    }

    // Verificar se conta ou cartão foi selecionado
    if (!formData.conta_id && !formData.cartao_id) {
      newErrors.conta_id = 'Selecione uma conta ou cartão';
    }

    const parcelas = parseInt(formData.total_parcelas);
    if (!formData.total_parcelas || isNaN(parcelas) || parcelas < 2 || parcelas > 60) {
      newErrors.total_parcelas = 'Número de parcelas deve ser entre 2 e 60';
    }

    if (!formData.data_primeira_parcela) {
      newErrors.data_primeira_parcela = 'Data da primeira parcela é obrigatória';
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
      const parcelaAtual = parseInt(formData.parcela_atual) || 1;
      const request: CreateInstallmentTransactionRequest = {
        descricao: formData.descricao.trim(),
        valor_total: parseFloat(formData.valor_total),
        tipo: formData.tipo,
        categoria_id: parseInt(formData.categoria_id),
        conta_id: formData.conta_id ? parseInt(formData.conta_id) : undefined,
        cartao_id: formData.cartao_id ? parseInt(formData.cartao_id) : undefined,
        total_parcelas: parseInt(formData.total_parcelas),
        parcela_inicial: parcelaAtual > 1 ? parcelaAtual : undefined,
        data_primeira_parcela: formData.data_primeira_parcela,
        observacoes: formData.observacoes.trim() || undefined,
      };

      const response = await transactionService.createInstallments(request);
      const transactions = response.data || [];
      
      if (onSuccess) {
        onSuccess(transactions);
      }

      // Reset form
      setFormData({
        descricao: '',
        valor_total: '',
        tipo: 'despesa',
        categoria_id: '',
        conta_id: '',
        cartao_id: '',
        total_parcelas: '2',
        parcela_atual: '1',
        data_primeira_parcela: new Date().toISOString().split('T')[0],
        observacoes: '',
      });
    } catch (error) {
      console.error('Erro ao criar parcelamento:', error);
      setSubmitError(error instanceof Error ? error.message : 'Erro ao criar parcelamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contasDisponiveis = accounts.filter(account => account.status === 'ativa');
  const categoriasDisponiveis = categories.filter(cat => 
    cat.tipo === 'ambos' || cat.tipo === formData.tipo
  );

  const valorParcela = formData.valor_total && formData.total_parcelas
    ? (parseFloat(formData.valor_total) / parseInt(formData.total_parcelas))
    : 0;

  return (
    <ModernCard variant="default" className={`p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-coral-500 rounded-2xl">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-deep-blue">Lançamento Parcelado</h2>
          <p className="text-slate-500">Divida uma compra ou receita em várias parcelas</p>
        </div>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Transação */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-deep-blue">Tipo de Transação</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleInputChange('tipo', 'receita')}
              className={`p-3 rounded-xl border-2 transition-all ${
                formData.tipo === 'receita'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-semibold">Receita</div>
                <div className="text-xs">Entrada de dinheiro</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('tipo', 'despesa')}
              className={`p-3 rounded-xl border-2 transition-all ${
                formData.tipo === 'despesa'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-semibold">Despesa</div>
                <div className="text-xs">Saída de dinheiro</div>
              </div>
            </button>
          </div>
        </div>

        {/* Descrição */}
        <ModernInput
          label="Descrição"
          value={formData.descricao}
          onChange={(e) => handleInputChange('descricao', e.target.value)}
          placeholder="Ex: Compra parcelada no cartão, Vendas a prazo..."
          leftIcon={<FileText className="w-5 h-5" />}
          error={errors.descricao}
        />

        {/* Valor Total e Parcelas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModernInput
            label="Valor Total"
            type="number"
            step="0.01"
            min="0"
            value={formData.valor_total}
            onChange={(e) => handleInputChange('valor_total', e.target.value)}
            placeholder="0,00"
            leftIcon={<span className="text-slate-500 font-medium">R$</span>}
            error={errors.valor_total}
          />

          <ModernInput
            label="Total de Parcelas"
            type="number"
            min="2"
            max="60"
            value={formData.total_parcelas}
            onChange={(e) => handleInputChange('total_parcelas', e.target.value)}
            placeholder="2"
            leftIcon={<Calculator className="w-5 h-5" />}
            error={errors.total_parcelas}
          />
          <ModernInput
            label="Qual parcela?"
            type="number"
            min="1"
            max="60"
            value={formData.parcela_atual}
            onChange={(e) => handleInputChange('parcela_atual', e.target.value)}
            placeholder="1"
            leftIcon={<span className="text-slate-500 text-xs font-medium">N°</span>}
          />
        </div>

        {/* Valor da Parcela (Preview) */}
        {valorParcela > 0 && (
          <div className="p-4 bg-coral-50 border border-coral-200 rounded-xl">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-coral-600" />
              <div>
                <p className="text-sm text-coral-700">Valor de cada parcela</p>
                <p className="text-xl font-bold text-coral-600">
                  R$ {valorParcela.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Categoria */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-deep-blue">Categoria</label>
          <select
            value={formData.categoria_id}
            onChange={(e) => handleInputChange('categoria_id', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
              errors.categoria_id
                ? 'border-red-300 focus:border-red-500'
                : 'border-slate-200 focus:border-coral-500'
            } focus:outline-none`}
            disabled={categoriesLoading}
          >
            <option value="">Selecione uma categoria</option>
            {categoriasDisponiveis.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
          {errors.categoria_id && (
            <p className="text-sm text-red-500">{errors.categoria_id}</p>
          )}
        </div>

        {/* Conta ou Cartão */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-deep-blue">Conta ou Cartão</label>
          
          {/* Conta */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Conta Bancária
            </label>
            <select
              value={formData.conta_id}
              onChange={(e) => {
                handleInputChange('conta_id', e.target.value);
                if (e.target.value) handleInputChange('cartao_id', '');
              }}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-coral-500 focus:outline-none transition-all"
              disabled={accountsLoading}
            >
              <option value="">Selecione uma conta</option>
              {contasDisponiveis.map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome} - R$ {conta.saldo_atual.toFixed(2).replace('.', ',')}
                </option>
              ))}
            </select>
          </div>

          {/* Cartão de Crédito */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Cartão de Crédito
            </label>
            <select
              value={formData.cartao_id}
              onChange={(e) => {
                handleInputChange('cartao_id', e.target.value);
                if (e.target.value) handleInputChange('conta_id', '');
              }}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-coral-500 focus:outline-none transition-all"
              disabled={cardsLoading}
            >
              <option value="">{cardsLoading ? 'Carregando cartões...' : 'Selecione um cartão'}</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.nome} - Limite: R$ {card.limite.toFixed(2).replace('.', ',')}
                </option>
              ))}
            </select>
          </div>

          {errors.conta_id && (
            <p className="text-sm text-red-500">{errors.conta_id}</p>
          )}
        </div>

        {/* Data da Primeira Parcela */}
        <ModernInput
          label="Data da Primeira Parcela"
          type="date"
          value={formData.data_primeira_parcela}
          onChange={(e) => handleInputChange('data_primeira_parcela', e.target.value)}
          leftIcon={<Calendar className="w-5 h-5" />}
          error={errors.data_primeira_parcela}
        />

        {/* Observações */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-deep-blue">Observações (opcional)</label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => handleInputChange('observacoes', e.target.value)}
            placeholder="Observações adicionais sobre este parcelamento..."
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
            disabled={isSubmitting || accountsLoading || categoriesLoading}
          >
            {isSubmitting ? 'Criando Parcelas...' : 'Criar Parcelamento'}
          </ModernButton>
        </div>
      </form>
    </ModernCard>
  );
} 
