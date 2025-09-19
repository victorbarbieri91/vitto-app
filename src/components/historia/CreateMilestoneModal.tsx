import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Calendar, DollarSign, Tag, Palette, Save } from 'lucide-react';
import ModernCard from '../ui/modern/ModernCard';
import ModernButton from '../ui/modern/ModernButton';
import ModernInput from '../ui/modern/ModernInput';
import { useHistoriaService } from '../../hooks/useHistoriaService';
import type { NovoMarco, Marco } from '../../types/historia';
import { useForm, SubmitHandler } from 'react-hook-form';

type CreateMilestoneModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  milestone?: Marco | null;
  isReadOnly?: boolean;
};

type FormValues = {
  titulo: string;
  descricao: string;
  valor_alvo: number;
  cor: string;
};

const coresDisponiveis = [
  { valor: '#F87060', nome: 'Coral', classe: 'bg-coral-500' },
  { valor: '#10b981', nome: 'Verde', classe: 'bg-green-500' },
  { valor: '#3b82f6', nome: 'Azul', classe: 'bg-blue-500' },
  { valor: '#9333ea', nome: 'Roxo', classe: 'bg-purple-500' },
  { valor: '#f59e0b', nome: 'Amarelo', classe: 'bg-yellow-500' },
  { valor: '#ef4444', nome: 'Vermelho', classe: 'bg-red-500' }
];

const iconesDisponiveis = [
  { valor: 'target', nome: 'Alvo', emoji: '🎯' },
  { valor: 'piggy-bank', nome: 'Poupança', emoji: '🐷' },
  { valor: 'home', nome: 'Casa', emoji: '🏠' },
  { valor: 'car', nome: 'Carro', emoji: '🚗' },
  { valor: 'plane', nome: 'Viagem', emoji: '✈️' },
  { valor: 'graduation-cap', nome: 'Educação', emoji: '🎓' },
  { valor: 'heart', nome: 'Saúde', emoji: '❤️' },
  { valor: 'trophy', nome: 'Conquista', emoji: '🏆' },
  { valor: 'star', nome: 'Estrela', emoji: '⭐' },
  { valor: 'gift', nome: 'Presente', emoji: '🎁' }
];

export default function CreateMilestoneModal({
  isOpen,
  onClose,
  onSuccess,
  milestone,
  isReadOnly = false,
}: CreateMilestoneModalProps) {
  const { createMarco, updateMarco } = useHistoriaService();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      titulo: milestone?.nome || '',
      descricao: milestone?.descricao || '',
      valor_alvo: milestone?.valor_alvo || 0,
      cor: milestone?.cor || '#F87060',
    },
  });

  useEffect(() => {
    if (milestone) {
      setValue('titulo', milestone.nome);
      setValue('descricao', milestone.descricao || '');
      setValue('valor_alvo', milestone.valor_alvo || 0);
      setValue('cor', milestone.cor || '#F87060');
    }
  }, [milestone, setValue]);

  if (!isOpen) return null;

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      if (milestone) {
        await updateMarco(milestone.id, data);
      } else {
        await createMarco(data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar marco:', error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <ModernCard variant="default" padding="none">
              <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-deep-blue">
                      {milestone ? 'Editar Objetivo' : 'Criar Novo Objetivo'}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {milestone ? 'Edite as informações do seu objetivo' : 'Defina um novo marco para sua jornada'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                {/* Título */}
                <div className="mb-4">
                  <label htmlFor="titulo" className="block text-sm font-medium text-slate-700 mb-1">
                    Título do Objetivo
                  </label>
                  <input
                    id="titulo"
                    type="text"
                    {...register('titulo', { required: 'O título é obrigatório' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                    placeholder="Ex: Viagem para a Europa"
                    disabled={isReadOnly}
                  />
                  {errors.titulo && <p className="text-sm text-red-600 mt-1">{errors.titulo.message}</p>}
                </div>

                {/* Descrição */}
                <div className="mb-4">
                  <label htmlFor="descricao" className="block text-sm font-medium text-slate-700 mb-1">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    id="descricao"
                    {...register('descricao')}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                    placeholder="Detalhes sobre o seu objetivo"
                    disabled={isReadOnly}
                  />
                </div>

                {/* Valor Alvo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="valor_alvo" className="block text-sm font-medium text-slate-700 mb-1">
                      Valor Alvo
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">R$</span>
                      <input
                        id="valor_alvo"
                        type="number"
                        step="0.01"
                        {...register('valor_alvo', { valueAsNumber: true, min: 0 })}
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                        placeholder="0,00"
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                  {/* Seletor de Cor */}
                  <div>
                    <label htmlFor="cor" className="block text-sm font-medium text-slate-700 mb-1">
                      Cor do Marco
                    </label>
                    <input
                      id="cor"
                      type="color"
                      {...register('cor')}
                      className="w-full h-10 px-1 py-1 border border-slate-300 rounded-lg"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                
                {/* Botões */}
                <div className="flex gap-3">
                  <ModernButton
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isReadOnly ? 'Fechar' : 'Cancelar'}
                  </ModernButton>
                  {!isReadOnly && (
                    <ModernButton
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Salvando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          {milestone ? 'Atualizar Marco' : 'Criar Marco'}
                        </div>
                      )}
                    </ModernButton>
                  )}
                </div>
              </form>
            </ModernCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}