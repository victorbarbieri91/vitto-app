import React, { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAccounts } from '../../../hooks/useAccounts';
import { useCategories } from '../../../hooks/useCategories';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { ModernInput, ModernButton, ModernSelect, ModernSwitch } from '../../ui/modern';
import CurrencyInput from '../../ui/CurrencyInput';
import { AnimatePresence, motion } from 'framer-motion';

const expenseSchema = z.object({
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres.'),
  valor: z.number().positive('Valor deve ser maior que zero.'),
  data: z.string().nonempty('Data é obrigatória.'),
  conta_id: z.number().int().positive('Selecione uma conta.'),
  categoria_id: z.number().int().positive('Selecione uma categoria.'),
  status: z.enum(['confirmado', 'pendente']).default('pendente'),

  // Controles de tipo
  is_recorrente: z.boolean().default(false),
  is_parcelado: z.boolean().default(false),

  recorrencia: z.object({
    frequencia: z.enum(['mensal', 'semanal', 'anual']).default('mensal'),
    dia_cobranca: z.number().int().min(1).max(31).default(1),
  }).optional(),

  parcelamento: z.object({
    total_parcelas: z.number().int().min(2, 'Mínimo de 2 parcelas.').max(60, 'Máximo de 60 parcelas.'),
    data_primeira_parcela: z.string().nonempty('Data da 1ª parcela é obrigatória.'),
  }).optional(),
}).refine(data => {
  if (data.is_recorrente && data.is_parcelado) {
    return false; // Não pode ser ambos
  }
  if (data.is_recorrente && !data.recorrencia) {
    return false; // Deve ter dados de recorrência
  }
  if (data.is_parcelado && !data.parcelamento) {
    return false; // Deve ter dados de parcelamento
  }
  return true;
}, {
  message: "Despesa não pode ser recorrente e parcelada ao mesmo tempo.",
  path: ["is_recorrente"],
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  onSave: (data: ExpenseFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSave, onCancel, isSubmitting }) => {
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const isMobile = useIsMobile();
  const formRef = useRef<HTMLFormElement>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    // No mobile, validação apenas no submit para evitar re-renders
    mode: isMobile ? 'onSubmit' : 'onChange',
    defaultValues: {
      status: 'pendente',
      is_recorrente: false,
      is_parcelado: false,
      data: new Date().toISOString().split('T')[0],
    },
  });

  const isRecorrente = watch('is_recorrente');
  const isParcelado = watch('is_parcelado');

  useEffect(() => {
    if (isRecorrente) setValue('is_parcelado', false);
  }, [isRecorrente, setValue]);

  useEffect(() => {
    if (isParcelado) setValue('is_recorrente', false);
  }, [isParcelado, setValue]);

  const expenseCategories = categories.filter(c => c.tipo === 'despesa' || c.tipo === 'ambos');

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      {/* Grid compacto principal - 6 colunas */}
      <div className="grid grid-cols-6 gap-4">
        {/* Descrição - 3 colunas */}
        <div className="col-span-3">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Descrição</label>
          <input
            {...register('descricao')}
            placeholder="Ex: Almoço no restaurante"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
          />
          {errors.descricao && (
            <p className="text-xs text-red-500 mt-1">{errors.descricao.message}</p>
          )}
        </div>

        {/* Valor - 2 colunas */}
        <div className="col-span-2">
          <Controller
            name="valor"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label="Valor"
                value={field.value}
                onChange={field.onChange}
                error={errors.valor?.message}
                className="text-sm py-2.5"
              />
            )}
          />
        </div>

        {/* Data - 1 coluna */}
        <div className="col-span-1">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Data</label>
          <input
            type="date"
            {...register('data')}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
          />
          {errors.data && (
            <p className="text-xs text-red-500 mt-1">{errors.data.message}</p>
          )}
        </div>
      </div>

      {/* Segunda linha - Conta e Categoria */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Conta</label>
          <select
            {...register('conta_id', { valueAsNumber: true })}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
          >
            <option value="">Selecione uma conta</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>{account.nome}</option>
            ))}
          </select>
          {errors.conta_id && (
            <p className="text-xs text-red-500 mt-1">{errors.conta_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoria</label>
          <select
            {...register('categoria_id', { valueAsNumber: true })}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
          >
            <option value="">Selecione uma categoria</option>
            {expenseCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
          {errors.categoria_id && (
            <p className="text-xs text-red-500 mt-1">{errors.categoria_id.message}</p>
          )}
        </div>
      </div>

      {/* Opções compactas em linha */}
      <div className="grid grid-cols-3 gap-4 py-3 bg-slate-50 rounded-lg px-4">
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.value === 'confirmado'}
                onChange={(e) => field.onChange(e.target.checked ? 'confirmado' : 'pendente')}
                className="w-4 h-4 text-red-500 border-slate-300 rounded focus:ring-red-500"
              />
              <span className="text-xs font-medium text-slate-700">Já pago</span>
            </label>
          )}
        />

        <Controller
          name="is_recorrente"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                disabled={isParcelado}
                className="w-4 h-4 text-red-500 border-slate-300 rounded focus:ring-red-500 disabled:opacity-50"
              />
              <span className="text-xs font-medium text-slate-700">Recorrente</span>
            </label>
          )}
        />

        <Controller
          name="is_parcelado"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                disabled={isRecorrente}
                className="w-4 h-4 text-red-500 border-slate-300 rounded focus:ring-red-500 disabled:opacity-50"
              />
              <span className="text-xs font-medium text-slate-700">Parcelado</span>
            </label>
          )}
        />
      </div>

      {/* Seções condicionais compactas */}
      <AnimatePresence>
        {isRecorrente && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-4 p-3 bg-red-50 rounded-lg border border-red-100"
          >
            <div>
              <label className="block text-xs font-medium text-red-700 mb-1.5">Frequência</label>
              <select
                {...register('recorrencia.frequencia')}
                className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="mensal">Mensal</option>
                <option value="semanal">Semanal</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-red-700 mb-1.5">Dia Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                {...register('recorrencia.dia_cobranca', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </motion.div>
        )}

        {isParcelado && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100"
          >
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1.5">Total Parcelas</label>
              <input
                type="number"
                min="2"
                max="60"
                {...register('parcelamento.total_parcelas', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1.5">1ª Parcela</label>
              <input
                type="date"
                {...register('parcelamento.data_primeira_parcela')}
                className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botões compactos */}
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Despesa'
          )}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm; 