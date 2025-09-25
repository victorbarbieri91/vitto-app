import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreditCards } from '../../../hooks/useCreditCards';
import { useCategories } from '../../../hooks/useCategories';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { ModernInput, ModernButton, ModernSelect, ModernSwitch } from '../../ui/modern';
import CurrencyInput from '../../ui/CurrencyInput';
import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard, DollarSign, Calendar, Info, Edit3 } from 'lucide-react';

const creditCardExpenseSchema = z.object({
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres.'),
  valor: z.number().positive('O valor deve ser maior que zero.'),
  data: z.string().nonempty('A data é obrigatória.'),
  cartao_id: z.number().int().positive('Selecione um cartão de crédito.'),
  categoria_id: z.number().int().positive('Selecione uma categoria.'),
  is_recorrente: z.boolean().default(false),
  is_parcelado: z.boolean().default(false),
  mes_fatura: z.number().int().min(1).max(12).optional(),
  ano_fatura: z.number().int().min(2020).max(2030).optional(),
  recorrencia: z.object({
    frequencia: z.enum(['mensal', 'semanal', 'anual']).default('mensal'),
    dia_cobranca: z.number().int().min(1).max(31).default(1),
  }).optional(),
  parcelamento: z.object({
    total_parcelas: z.number().int().min(2, 'Mínimo de 2 parcelas.').max(60, 'Máximo de 60 parcelas.'),
  }).optional(),
}).refine(data => {
  if (data.is_recorrente && data.is_parcelado) return false;
  if (data.is_recorrente && !data.recorrencia) return false;
  if (data.is_parcelado && !data.parcelamento) return false;
  return true;
}, {
  message: "A despesa não pode ser recorrente e parcelada ao mesmo tempo.",
  path: ["is_recorrente"],
});

type CreditCardExpenseFormData = z.infer<typeof creditCardExpenseSchema>;

interface CreditCardExpenseFormProps {
  onSave: (data: CreditCardExpenseFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  defaultCardId?: number;
}

const CreditCardExpenseForm: React.FC<CreditCardExpenseFormProps> = ({ onSave, onCancel, isSubmitting, defaultCardId }) => {
  const { cards, loading: loadingCards } = useCreditCards();
  const { categories } = useCategories();
  const isMobile = useIsMobile();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  // Estados para controle de fatura (simplificado)
  const [faturaCalculada, setFaturaCalculada] = useState<{
    mes: number;
    ano: number;
  } | null>(null);

  // Função para calcular período sugerido da fatura
  const calcularPeriodoSugerido = (dataCompra: string, diaFechamento: number) => {
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const mesAtual = hoje.getMonth() + 1; // getMonth() é 0-indexed (setembro = 8, então +1 = 9)
    const anoAtual = hoje.getFullYear();

    console.log(`🔍 Debug período fatura:`, {
      dataCompra,
      diaFechamento,
      hoje: hoje.toISOString().split('T')[0],
      diaHoje,
      mesAtual,
      anoAtual
    });

    // LÓGICA SIMPLIFICADA: Se hoje já passou do fechamento, próxima compra vai para próximo mês
    if (diaHoje > diaFechamento) {
      // Já passou do fechamento, próxima compra vai para próximo mês
      const proximoMes = mesAtual === 12 ? 1 : mesAtual + 1;
      const proximoAno = mesAtual === 12 ? anoAtual + 1 : anoAtual;

      console.log(`✅ Já passou do fechamento (hoje ${diaHoje} > ${diaFechamento}) → próximo mês: ${proximoMes}/${proximoAno}`);
      return { mes: proximoMes, ano: proximoAno };
    } else {
      // Ainda não passou do fechamento, vai para mês atual
      console.log(`✅ Ainda não passou do fechamento (hoje ${diaHoje} <= ${diaFechamento}) → mês atual: ${mesAtual}/${anoAtual}`);
      return { mes: mesAtual, ano: anoAtual };
    }
  };

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<CreditCardExpenseFormData>({
    resolver: zodResolver(creditCardExpenseSchema),
    mode: 'onChange',
    defaultValues: {
      is_recorrente: false,
      is_parcelado: false,
      data: new Date().toISOString().split('T')[0],
      cartao_id: defaultCardId,
    },
  });

  const isRecorrente = watch('is_recorrente');
  const isParcelado = watch('is_parcelado');
  const watchedCardId = watch('cartao_id');
  const watchedData = watch('data');

  useEffect(() => {
    if (isRecorrente) setValue('is_parcelado', false);
  }, [isRecorrente, setValue]);

  useEffect(() => {
    if (isParcelado) setValue('is_recorrente', false);
  }, [isParcelado, setValue]);
  
  useEffect(() => {
    setSelectedCardId(watchedCardId);
  }, [watchedCardId]);

  const selectedCard = useMemo(() => cards.find(c => c.id === selectedCardId), [cards, selectedCardId]);

  // Atualizar sugestão de fatura quando mudar data ou cartão
  useEffect(() => {
    if (selectedCard && watchedData) {
      const sugestao = calcularPeriodoSugerido(watchedData, selectedCard.dia_fechamento);
      setFaturaCalculada(sugestao);

      // Sempre atualizar os valores para manter sincronia
      setValue('mes_fatura', sugestao.mes);
      setValue('ano_fatura', sugestao.ano);
    } else if (!selectedCard) {
      // Se não tem cartão selecionado, usar mês atual
      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1;
      const anoAtual = hoje.getFullYear();
      setValue('mes_fatura', mesAtual);
      setValue('ano_fatura', anoAtual);
      setFaturaCalculada(null);
    }
  }, [watchedData, selectedCard, setValue]);
  const expenseCategories = useMemo(() => categories.filter(c => c.tipo === 'despesa' || c.tipo === 'ambos'), [categories]);

  // Gerar opções de mês/ano combinadas
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const faturaOpcoes = useMemo(() => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    const opcoes = [];

    // Gerar opções para 6 meses (2 anteriores, atual, 3 próximos)
    for (let i = -2; i <= 3; i++) {
      let mes = mesAtual + i;
      let ano = anoAtual;

      if (mes <= 0) {
        mes += 12;
        ano -= 1;
      } else if (mes > 12) {
        mes -= 12;
        ano += 1;
      }

      opcoes.push({
        mes,
        ano,
        label: `${nomesMeses[mes - 1]} de ${ano}`,
        value: `${mes}-${ano}`
      });
    }

    return opcoes;
  }, []);

  // Determinar o valor padrão do dropdown
  const valorPadrao = useMemo(() => {
    if (faturaCalculada) {
      return `${faturaCalculada.mes}-${faturaCalculada.ano}`;
    }

    // Se não tem cartão selecionado, usar mês atual
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    return `${mesAtual}-${anoAtual}`;
  }, [faturaCalculada]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      {/* Seleção de cartão */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Cartão de Crédito</label>
        <select
          {...register('cartao_id', { valueAsNumber: true })}
          disabled={loadingCards}
          className={`w-full px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
            isMobile ? 'py-4 text-base' : 'py-3 text-sm'
          }`}
        >
          <option value="">{loadingCards ? 'Carregando cartões...' : 'Selecione um cartão'}</option>
          {cards.map(card => (
            <option key={card.id} value={card.id}>{card.nome}</option>
          ))}
        </select>
        {errors.cartao_id && (
          <p className="text-sm text-red-500 mt-1">{errors.cartao_id.message}</p>
        )}
      </div>

      {/* Informações do cartão compactas */}
      {selectedCard && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`grid gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl ${
            isMobile ? 'grid-cols-1 text-sm' : 'grid-cols-3 text-xs'
          }`}
        >
          <div className="text-center">
            <p className="text-slate-600 font-medium">Limite Disponível</p>
            <p className="text-slate-800 font-bold">{formatCurrency(selectedCard.limite - selectedCard.limite_usado)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-600 font-medium">Fatura Atual</p>
            <p className="text-slate-800 font-bold">{formatCurrency(selectedCard.fatura_atual)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-600 font-medium">Fecha</p>
            <p className="text-slate-800 font-bold">Dia {selectedCard.dia_fechamento}</p>
          </div>
        </motion.div>
      )}


      {/* Descrição - Full width em mobile */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
        <input
          {...register('descricao')}
          placeholder="Ex: Jantar, roupas, mercado"
          autoFocus={!isMobile}
          autoComplete="off"
          className={`w-full px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
            isMobile ? 'py-4 text-base' : 'py-3 text-sm'
          }`}
        />
        {errors.descricao && (
          <p className="text-sm text-red-500 mt-1">{errors.descricao.message}</p>
        )}
      </div>

      {/* Valor e Data - Responsivo */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>

        {/* Valor - 4 colunas */}
        <div className="col-span-4">
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

        {/* Data - 3 colunas */}
        <div className="col-span-3">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Data</label>
          <input
            type="date"
            {...register('data')}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 transition-colors"
          />
          {errors.data && (
            <p className="text-xs text-red-500 mt-1">{errors.data.message}</p>
          )}
        </div>
      </div>

      {/* Linha da fatura - separada */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Fatura</label>
        <select
          value={valorPadrao}
          onChange={(e) => {
            const [mes, ano] = e.target.value.split('-').map(Number);
            setValue('mes_fatura', mes);
            setValue('ano_fatura', ano);
          }}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 transition-colors"
        >
          {faturaOpcoes.map(opcao => (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categoria */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoria</label>
        <select
          {...register('categoria_id', { valueAsNumber: true })}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 transition-colors"
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

      {/* Opções compactas em linha */}
      <div className="grid grid-cols-2 gap-4 py-3 bg-slate-50 rounded-lg px-4">
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
                className="w-4 h-4 text-blue-500 border-slate-300 rounded focus:ring-blue-500 disabled:opacity-50"
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
                className="w-4 h-4 text-blue-500 border-slate-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-xs font-medium text-slate-700">Parcelado</span>
            </label>
          )}
        />
      </div>

      {/* Seção condicional compacta */}
      <AnimatePresence>
        {isParcelado && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-blue-50 rounded-lg border border-blue-100"
          >
            <label className="block text-xs font-medium text-blue-700 mb-1.5">Número de Parcelas</label>
            <input
              type="number"
              min="2"
              max="60"
              {...register('parcelamento.total_parcelas', { valueAsNumber: true })}
              placeholder="12"
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.parcelamento?.total_parcelas && (
              <p className="text-xs text-red-500 mt-1">{errors.parcelamento.total_parcelas.message}</p>
            )}
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
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 rounded-lg hover:from-blue-500 hover:via-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Compra'
          )}
        </button>
      </div>
    </form>
  );
};

export default CreditCardExpenseForm; 