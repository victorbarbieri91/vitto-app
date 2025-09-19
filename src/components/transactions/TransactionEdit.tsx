import React, { useState, useEffect } from 'react';
import { ModernCard, ModernButton, ModernInput } from '../ui/modern';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import { TransactionService } from '../../services/api/TransactionService';
import type { Transaction } from '../../services/api/AccountService';
import {
  Save,
  X,
  Calendar,
  DollarSign,
  FileText,
  Tag,
  Wallet,
  CreditCard,
  AlertCircle,
  Check,
  Edit3
} from 'lucide-react';

interface TransactionEditProps {
  transaction: Transaction;
  onSave: (updatedTransaction: Transaction) => void;
  onCancel: () => void;
  inline?: boolean;
  className?: string;
}

interface EditFormData {
  descricao: string;
  valor: string;
  data: string;
  tipo: 'receita' | 'despesa' | 'transferencia';
  categoria_id: string;
  conta_id: string;
  cartao_id: string;
  observacoes?: string;
}

interface ValidationErrors {
  descricao?: string;
  valor?: string;
  data?: string;
  categoria_id?: string;
  conta_id?: string;
}

export function TransactionEdit({
  transaction,
  onSave,
  onCancel,
  inline = false,
  className
}: TransactionEditProps) {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories, loading: categoriesLoading } = useCategories();
  const transactionService = new TransactionService();

  const [formData, setFormData] = useState<EditFormData>({
    descricao: transaction.descricao,
    valor: transaction.valor.toString(),
    data: transaction.data.split('T')[0], // Remove time portion
    tipo: transaction.tipo as 'receita' | 'despesa' | 'transferencia',
    categoria_id: transaction.categoria_id?.toString() || '',
    conta_id: transaction.conta_id?.toString() || '',
    cartao_id: transaction.cartao_id?.toString() || '',
    observacoes: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [isChanged, setIsChanged] = useState(false);

  // Track changes
  useEffect(() => {
    const hasChanges = 
      formData.descricao !== transaction.descricao ||
      parseFloat(formData.valor) !== transaction.valor ||
      formData.data !== transaction.data.split('T')[0] ||
      formData.tipo !== transaction.tipo ||
      parseInt(formData.categoria_id) !== transaction.categoria_id ||
      parseInt(formData.conta_id) !== transaction.conta_id ||
      parseInt(formData.cartao_id) !== (transaction.cartao_id || 0);
    
    setIsChanged(hasChanges);
  }, [formData, transaction]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.valor.trim()) {
      newErrors.valor = 'Valor é obrigatório';
    } else {
      const valor = parseFloat(formData.valor);
      if (isNaN(valor) || valor <= 0) {
        newErrors.valor = 'Valor deve ser um número positivo';
      }
    }

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória';
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = 'Categoria é obrigatória';
    }

    if (formData.tipo !== 'transferencia' && !formData.conta_id) {
      newErrors.conta_id = 'Conta é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof EditFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific error when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updateData = {
        descricao: formData.descricao.trim(),
        valor: parseFloat(formData.valor),
        data: formData.data,
        tipo: formData.tipo,
        categoria_id: parseInt(formData.categoria_id),
        conta_id: formData.conta_id ? parseInt(formData.conta_id) : null,
        cartao_id: formData.cartao_id ? parseInt(formData.cartao_id) : null,
      };

      const success = await transactionService.updateTransaction(transaction.id, updateData);
      
      if (success) {
        // Create updated transaction object for callback
        const updatedTransaction: Transaction = {
          ...transaction,
          ...updateData,
        };
        
        onSave(updatedTransaction);
      }
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      // You might want to show a toast/notification here
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isChanged) {
      const confirm = window.confirm('Descartar alterações?');
      if (!confirm) return;
    }
    onCancel();
  };

  const filteredCategories = categories.filter(cat => cat.tipo === formData.tipo);

  if (inline) {
    return (
      <div className={`bg-slate-50 border-2 border-slate-200 rounded-xl p-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-deep-blue">
              <FileText className="w-4 h-4 inline mr-2" />
              Descrição
            </label>
            <ModernInput
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              error={errors.descricao}
              placeholder="Digite a descrição..."
            />
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-deep-blue">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Valor
            </label>
            <ModernInput
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => handleInputChange('valor', e.target.value)}
              error={errors.valor}
              placeholder="0,00"
            />
          </div>

          {/* Data */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-deep-blue">
              <Calendar className="w-4 h-4 inline mr-2" />
              Data
            </label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => handleInputChange('data', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
                errors.data 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-slate-200 focus:border-coral-500'
              }`}
            />
            {errors.data && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.data}
              </p>
            )}
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-deep-blue">Tipo</label>
            <select
              value={formData.tipo}
              onChange={(e) => handleInputChange('tipo', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-coral-500 focus:outline-none transition-all"
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-deep-blue">
              <Tag className="w-4 h-4 inline mr-2" />
              Categoria
            </label>
            <select
              value={formData.categoria_id}
              onChange={(e) => handleInputChange('categoria_id', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
                errors.categoria_id 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-slate-200 focus:border-coral-500'
              }`}
              disabled={categoriesLoading}
            >
              <option value="">Selecione uma categoria</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nome}
                </option>
              ))}
            </select>
            {errors.categoria_id && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.categoria_id}
              </p>
            )}
          </div>

          {/* Conta */}
          {formData.tipo !== 'transferencia' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-deep-blue">
                <Wallet className="w-4 h-4 inline mr-2" />
                Conta
              </label>
              <select
                value={formData.conta_id}
                onChange={(e) => handleInputChange('conta_id', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
                  errors.conta_id 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-slate-200 focus:border-coral-500'
                }`}
                disabled={accountsLoading}
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.nome}
                  </option>
                ))}
              </select>
              {errors.conta_id && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.conta_id}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Inline Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
          <ModernButton
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="w-4 h-4" />
            Cancelar
          </ModernButton>
          
          <ModernButton
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={loading || !isChanged}
            isLoading={loading}
          >
            <Save className="w-4 h-4" />
            Salvar
          </ModernButton>
        </div>
      </div>
    );
  }

  // Full form layout (not inline)
  return (
    <ModernCard variant="default" className={`p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-coral-100 rounded-lg">
          <Edit3 className="w-5 h-5 text-coral-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-deep-blue">Editar Transação</h3>
          <p className="text-slate-500">Modifique os detalhes da transação</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Primeira linha: Descrição e Valor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-deep-blue">
              <FileText className="w-4 h-4 inline mr-2" />
              Descrição
            </label>
            <ModernInput
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              error={errors.descricao}
              placeholder="Digite a descrição..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-deep-blue">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Valor
            </label>
            <ModernInput
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => handleInputChange('valor', e.target.value)}
              error={errors.valor}
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Segunda linha: Data e Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-deep-blue">
              <Calendar className="w-4 h-4 inline mr-2" />
              Data
            </label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => handleInputChange('data', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
                errors.data 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-slate-200 focus:border-coral-500'
              }`}
            />
            {errors.data && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.data}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-deep-blue">Tipo</label>
            <select
              value={formData.tipo}
              onChange={(e) => handleInputChange('tipo', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-coral-500 focus:outline-none transition-all"
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>
        </div>

        {/* Terceira linha: Categoria e Conta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-deep-blue">
              <Tag className="w-4 h-4 inline mr-2" />
              Categoria
            </label>
            <select
              value={formData.categoria_id}
              onChange={(e) => handleInputChange('categoria_id', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
                errors.categoria_id 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-slate-200 focus:border-coral-500'
              }`}
              disabled={categoriesLoading}
            >
              <option value="">Selecione uma categoria</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nome}
                </option>
              ))}
            </select>
            {errors.categoria_id && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.categoria_id}
              </p>
            )}
          </div>

          {formData.tipo !== 'transferencia' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-deep-blue">
                <Wallet className="w-4 h-4 inline mr-2" />
                Conta
              </label>
              <select
                value={formData.conta_id}
                onChange={(e) => handleInputChange('conta_id', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
                  errors.conta_id 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-slate-200 focus:border-coral-500'
                }`}
                disabled={accountsLoading}
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.nome}
                  </option>
                ))}
              </select>
              {errors.conta_id && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.conta_id}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Status indicator */}
        {isChanged && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Você tem alterações não salvas
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <ModernButton
            variant="outline"
            size="md"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="w-4 h-4" />
            Cancelar
          </ModernButton>
          
          <ModernButton
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={loading || !isChanged}
            isLoading={loading}
          >
            <Save className="w-4 h-4" />
            Salvar Alterações
          </ModernButton>
        </div>
      </div>
    </ModernCard>
  );
}
