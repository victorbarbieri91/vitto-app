import React, { useState } from 'react';
import { ModernCard } from '../ui/modern';
import { ModernButton } from '../ui/modern';
import { ModernInput } from '../ui/modern';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import { useCreditCards } from '../../hooks/useCreditCards';
import { RecurrentTransactionService, CreateRecurrentTransactionRequest } from '../../services/api/RecurrentTransactionService';
import { 
  RotateCcw, 
  Repeat, 
  CreditCard, 
  Wallet, 
  Calendar, 
  FileText, 
  AlertCircle,
  Clock,
  Calculator,
  ChevronRight
} from 'lucide-react';

interface RecorrenciaConfigProps {
  onSuccess?: (recurrentTransaction: any) => void;
  onCancel?: () => void;
  className?: string;
}

interface FormData {
  descricao: string;
  valor: string;
  tipo: 'receita' | 'despesa';
  categoria_id: string;
  conta_id: string;
  cartao_id: string;
  tipo_recorrencia: 'fixo' | 'parcelado';
  
  // Para fixos
  intervalo: 'mensal' | 'quinzenal' | 'semanal' | 'anual';
  dia_vencimento: string;
  
  // Para parcelados
  total_parcelas: string;
  
  data_inicio: string;
  data_fim: string;
}

export function RecorrenciaConfig({ onSuccess, onCancel, className }: RecorrenciaConfigProps) {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { cards, loading: cardsLoading } = useCreditCards();
  const recurrentService = new RecurrentTransactionService();

  const [formData, setFormData] = useState<FormData>({
    descricao: '',
    valor: '',
    tipo: 'despesa',
    categoria_id: '',
    conta_id: '',
    cartao_id: '',
    tipo_recorrencia: 'fixo',
    intervalo: 'mensal',
    dia_vencimento: '1',
    total_parcelas: '12',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
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

    if (!formData.categoria_id) {
      newErrors.categoria_id = 'Categoria é obrigatória';
    }

    if (!formData.conta_id && !formData.cartao_id) {
      newErrors.conta_id = 'Selecione uma conta ou cartão';
    }

    if (!formData.data_inicio) {
      newErrors.data_inicio = 'Data de início é obrigatória';
    }

    if (formData.tipo_recorrencia === 'fixo') {
      const dia = parseInt(formData.dia_vencimento);
      if (!formData.dia_vencimento || isNaN(dia) || dia < 1 || dia > 31) {
        newErrors.dia_vencimento = 'Dia deve ser entre 1 e 31';
      }
    }

    if (formData.tipo_recorrencia === 'parcelado') {
      const parcelas = parseInt(formData.total_parcelas);
      if (!formData.total_parcelas || isNaN(parcelas) || parcelas < 1 || parcelas > 360) {
        newErrors.total_parcelas = 'Parcelas devem ser entre 1 e 360';
      }
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
      const request: CreateRecurrentTransactionRequest = {
        descricao: formData.descricao.trim(),
        valor: parseFloat(formData.valor),
        tipo: formData.tipo,
        categoria_id: parseInt(formData.categoria_id),
        conta_id: formData.conta_id ? parseInt(formData.conta_id) : undefined,
        cartao_id: formData.cartao_id ? parseInt(formData.cartao_id) : undefined,
        tipo_recorrencia: formData.tipo_recorrencia,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim || undefined,
      };

      if (formData.tipo_recorrencia === 'fixo') {
        request.intervalo = formData.intervalo;
        request.dia_vencimento = parseInt(formData.dia_vencimento);
      } else {
        request.total_parcelas = parseInt(formData.total_parcelas);
      }

      const recurrentTransaction = await recurrentService.createRecurrentTransaction(request);
      
      if (onSuccess) {
        onSuccess(recurrentTransaction);
      }

      setFormData({
        descricao: '',
        valor: '',
        tipo: 'despesa',
        categoria_id: '',
        conta_id: '',
        cartao_id: '',
        tipo_recorrencia: 'fixo',
        intervalo: 'mensal',
        dia_vencimento: '1',
        total_parcelas: '12',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: '',
      });
    } catch (error) {
      console.error('Erro ao criar lançamento recorrente:', error);
      setSubmitError(error instanceof Error ? error.message : 'Erro ao criar lançamento recorrente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contasDisponiveis = accounts.filter(account => account.ativo);
  const categoriasDisponiveis = categories.filter(cat => 
    cat.tipo === 'ambos' || cat.tipo === formData.tipo
  );

  const getRecurrencyPreview = () => {
    if (formData.tipo_recorrencia === 'fixo') {
      const intervalos = {
        mensal: 'todo mês',
        quinzenal: 'a cada 15 dias',
        semanal: 'toda semana',
        anual: 'todo ano'
      };
      return `${intervalos[formData.intervalo]} no dia ${formData.dia_vencimento}`;
    } else {
      return `${formData.total_parcelas} parcelas mensais`;
    }
  };

  return (
    <ModernCard variant="default" className={`p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-coral-500 rounded-2xl">
          <RotateCcw className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-deep-blue">Lançamento Recorrente</h2>
          <p className="text-slate-500">Configure receitas e despesas automáticas</p>
        </div>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-deep-blue">Tipo de Recorrência</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleInputChange('tipo_recorrencia', 'fixo')}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.tipo_recorrencia === 'fixo'
                  ? 'border-coral-500 bg-coral-50 text-coral-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Repeat className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Fixo</div>
                  <div className="text-xs opacity-75">Salário, aluguel, contas</div>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('tipo_recorrencia', 'parcelado')}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.tipo_recorrencia === 'parcelado'
                  ? 'border-coral-500 bg-coral-50 text-coral-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calculator className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Parcelado</div>
                  <div className="text-xs opacity-75">Financiamentos, empréstimos</div>
                </div>
              </div>
            </button>
          </div>
        </div>

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

        <ModernInput
          label="Descrição"
          value={formData.descricao}
          onChange={(e) => handleInputChange('descricao', e.target.value)}
          placeholder={
            formData.tipo_recorrencia === 'fixo' 
              ? "Ex: Salário, Aluguel, Conta de luz..."
              : "Ex: Financiamento do carro, Empréstimo..."
          }
          leftIcon={<FileText className="w-5 h-5" />}
          error={errors.descricao}
        />

        <ModernInput
          label="Valor"
          type="number"
          step="0.01"
          min="0"
          value={formData.valor}
          onChange={(e) => handleInputChange('valor', e.target.value)}
          placeholder="0,00"
          leftIcon={<span className="text-slate-500 font-medium">R$</span>}
          error={errors.valor}
        />

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

        <div className="space-y-4">
          <label className="text-sm font-medium text-deep-blue">Conta ou Cartão</label>
          
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

        {formData.tipo_recorrencia === 'fixo' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-deep-blue flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Configuração de Recorrência Fixa
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-deep-blue">Intervalo</label>
                <select
                  value={formData.intervalo}
                  onChange={(e) => handleInputChange('intervalo', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-coral-500 focus:outline-none transition-all"
                >
                  <option value="mensal">Mensal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="semanal">Semanal</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              <ModernInput
                label="Dia do Vencimento"
                type="number"
                min="1"
                max="31"
                value={formData.dia_vencimento}
                onChange={(e) => handleInputChange('dia_vencimento', e.target.value)}
                placeholder="1"
                leftIcon={<Calendar className="w-5 h-5" />}
                error={errors.dia_vencimento}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-deep-blue flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Configuração de Parcelamento
            </h3>
            
            <ModernInput
              label="Total de Parcelas"
              type="number"
              min="1"
              max="360"
              value={formData.total_parcelas}
              onChange={(e) => handleInputChange('total_parcelas', e.target.value)}
              placeholder="12"
              leftIcon={<Calculator className="w-5 h-5" />}
              error={errors.total_parcelas}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModernInput
            label="Data de Início"
            type="date"
            value={formData.data_inicio}
            onChange={(e) => handleInputChange('data_inicio', e.target.value)}
            leftIcon={<Calendar className="w-5 h-5" />}
            error={errors.data_inicio}
          />

          <ModernInput
            label="Data de Fim (opcional)"
            type="date"
            value={formData.data_fim}
            onChange={(e) => handleInputChange('data_fim', e.target.value)}
            leftIcon={<Calendar className="w-5 h-5" />}
            placeholder="Deixe vazio para recorrência indefinida"
          />
        </div>

        {formData.descricao && formData.valor && (
          <div className="p-4 bg-coral-50 border border-coral-200 rounded-xl">
            <div className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-coral-600 mt-0.5" />
              <div>
                <p className="text-sm text-coral-700 font-medium">Resumo da Recorrência</p>
                <p className="text-coral-600">
                  <span className="font-semibold">{formData.descricao}</span> - 
                  R$ {parseFloat(formData.valor || '0').toFixed(2).replace('.', ',')} - 
                  {getRecurrencyPreview()}
                </p>
              </div>
            </div>
          </div>
        )}

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
            {isSubmitting ? 'Criando Recorrência...' : 'Criar Lançamento Recorrente'}
          </ModernButton>
        </div>
      </form>
    </ModernCard>
  );
} 
