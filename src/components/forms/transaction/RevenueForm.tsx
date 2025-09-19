import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAccounts } from '../../../hooks/useAccounts';
import { useCategories } from '../../../hooks/useCategories';
import { ModernInput, ModernButton, ModernSelect, ModernSwitch } from '../../ui/modern';
import CurrencyInput from '../../ui/CurrencyInput';
import { AnimatePresence, motion } from 'framer-motion';

const revenueSchema = z.object({
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
    dia_vencimento: z.number().int().min(1).max(31).default(1),
    data_inicio: z.string().nonempty('Data de início é obrigatória.'),
  }).optional(),

  parcelamento: z.object({
    total_parcelas: z.number().int().min(2, 'Mínimo de 2 parcelas.').max(60, 'Máximo de 60 parcelas.'),
    data_primeira_parcela: z.string().nonempty('Data da 1ª parcela é obrigatória.'),
  }).optional(),
}).refine(data => {
  if (data.is_recorrente && data.is_parcelado) {
    return false; // Não pode ser ambos
  }
  return true;
}, {
  message: "Transação não pode ser recorrente e parcelada ao mesmo tempo"
}).refine(data => {
  if (data.is_recorrente && (!data.recorrencia || !data.recorrencia.data_inicio)) {
    return false; // Deve ter dados de recorrência
  }
  return true;
}, {
  message: "Para transações recorrentes, é necessário informar a data de início"
}).refine(data => {
  if (data.is_parcelado && (!data.parcelamento || !data.parcelamento.total_parcelas || !data.parcelamento.data_primeira_parcela)) {
    return false; // Deve ter dados de parcelamento
  }
  return true;
}, {
  message: "Para transações parceladas, é necessário informar o número de parcelas e a data da primeira parcela",
  path: ["parcelamento"],
});

type RevenueFormData = z.infer<typeof revenueSchema>;

interface RevenueFormProps {
  onSave: (data: RevenueFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const RevenueForm: React.FC<RevenueFormProps> = ({ onSave, onCancel, isSubmitting }) => {
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<RevenueFormData>({
    resolver: zodResolver(revenueSchema),
    defaultValues: {
      descricao: '',
      valor: undefined,
      data: new Date().toISOString().split('T')[0],
      status: 'pendente',
      is_recorrente: false,
      is_parcelado: false,
      recorrencia: {
        frequencia: 'mensal',
        dia_vencimento: 1,
        data_inicio: new Date().toISOString().split('T')[0],
      }
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
  
  const revenueCategories = categories.filter(c => c.tipo === 'receita' || c.tipo === 'ambos');

  const onSubmit = (data: RevenueFormData) => {
    console.log('[RevenueForm] Dados do formulário antes de salvar:', data);
    onSave(data);
  };

  const onError = (errors: any) => {
    console.error('[RevenueForm] Erros de validação:', errors);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
      {/* Grid compacto principal - 6 colunas */}
      <div className="grid grid-cols-6 gap-4">
        {/* Descrição - 3 colunas */}
        <div className="col-span-3">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Descrição</label>
          <input
            {...register('descricao')}
            placeholder="Ex: Salário, freelance, venda"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
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
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
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
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
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
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
          >
            <option value="">Selecione uma categoria</option>
            {revenueCategories.map(category => (
              <option key={category.id} value={category.id}>{category.nome}</option>
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
                className="w-4 h-4 text-green-500 border-slate-300 rounded focus:ring-green-500"
              />
              <span className="text-xs font-medium text-slate-700">Já recebido</span>
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
                className="w-4 h-4 text-green-500 border-slate-300 rounded focus:ring-green-500 disabled:opacity-50"
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
                className="w-4 h-4 text-green-500 border-slate-300 rounded focus:ring-green-500 disabled:opacity-50"
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
            className="grid grid-cols-3 gap-4 p-3 bg-green-50 rounded-lg border border-green-100"
          >
            <div>
              <label className="block text-xs font-medium text-green-700 mb-1.5">Frequência</label>
              <select
                {...register('recorrencia.frequencia')}
                className="w-full px-3 py-2 text-sm border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              >
                <option value="mensal">Mensal</option>
                <option value="semanal">Semanal</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-green-700 mb-1.5">Dia Recebimento</label>
              <input
                type="number"
                min="1"
                max="31"
                {...register('recorrencia.dia_vencimento', { valueAsNumber: true })}
                placeholder="5"
                className="w-full px-3 py-2 text-sm border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-green-700 mb-1.5">Data Início</label>
              <input
                type="date"
                {...register('recorrencia.data_inicio')}
                className="w-full px-3 py-2 text-sm border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
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
                placeholder="6"
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
          className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Receita'
          )}
        </button>
      </div>
    </form>
  );
};

export default RevenueForm; 