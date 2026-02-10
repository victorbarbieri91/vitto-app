import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  Check,
  Ban,
  ArrowDownCircle,
  Target,
  PiggyBank,
  Trash2,
  Edit,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { PendingAction } from '../../types/central-ia';

interface ActionConfirmModalProps {
  isOpen: boolean;
  pendingAction: PendingAction | null;
  onConfirm: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  create_transaction: ArrowDownCircle,
  update_transaction: Edit,
  delete_transaction: Trash2,
  create_goal: Target,
  create_budget: PiggyBank,
};

const ACTION_TITLES: Record<string, string> = {
  create_transaction: 'Criar Transação',
  update_transaction: 'Atualizar Transação',
  delete_transaction: 'Excluir Transação',
  create_goal: 'Criar Meta',
  create_budget: 'Criar Orçamento',
};

/**
 *
 */
export function ActionConfirmModal({
  isOpen,
  pendingAction,
  onConfirm,
  onReject,
  isLoading,
}: ActionConfirmModalProps) {
  if (!pendingAction) return null;

  const Icon = ACTION_ICONS[pendingAction.action_type] || AlertTriangle;
  const title = ACTION_TITLES[pendingAction.action_type] || 'Confirmar Ação';
  const isDestructive = pendingAction.action_type === 'delete_transaction';

  // Formata os dados para exibição
  const formattedFields = formatActionData(pendingAction.action_type, pendingAction.action_data);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onReject}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div
                className={cn(
                  'flex items-center gap-3 px-6 py-4',
                  isDestructive ? 'bg-red-50' : 'bg-coral-50'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    isDestructive ? 'bg-red-100 text-red-600' : 'bg-coral-100 text-coral-600'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500">Confirme os dados abaixo</p>
                </div>
                <button
                  onClick={onReject}
                  disabled={isLoading}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="p-6">
                {/* Campos formatados */}
                <div className="space-y-3 mb-6">
                  {formattedFields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-sm text-gray-500">{field.label}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Aviso para ações destrutivas */}
                {isDestructive && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl mb-6">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      Esta ação não pode ser desfeita. O registro será permanentemente removido.
                    </p>
                  </div>
                )}

                {/* Botões */}
                <div className="flex gap-3">
                  <button
                    onClick={onReject}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2',
                      'px-4 py-2.5 rounded-xl',
                      'bg-gray-100 text-gray-700 font-medium',
                      'hover:bg-gray-200 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <Ban className="w-4 h-4" />
                    Cancelar
                  </button>

                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2',
                      'px-4 py-2.5 rounded-xl font-medium',
                      'transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isDestructive
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-coral-500 text-white hover:bg-coral-600'
                    )}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Confirmar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Formata os dados da ação para exibição
function formatActionData(
  actionType: string,
  data: Record<string, unknown>
): { label: string; value: string }[] {
  const fields: { label: string; value: string }[] = [];

  switch (actionType) {
    case 'create_transaction':
      if (data.tipo) {
        fields.push({
          label: 'Tipo',
          value: data.tipo === 'receita' ? 'Receita' : 'Despesa',
        });
      }
      if (data.descricao) {
        fields.push({ label: 'Descrição', value: String(data.descricao) });
      }
      if (data.valor) {
        fields.push({
          label: 'Valor',
          value: formatCurrency(Number(data.valor)),
        });
      }
      if (data.data) {
        fields.push({
          label: 'Data',
          value: formatDate(String(data.data)),
        });
      }
      break;

    case 'update_transaction':
      if (data.id) {
        fields.push({ label: 'ID', value: `#${data.id}` });
      }
      if (data.descricao) {
        fields.push({ label: 'Nova descrição', value: String(data.descricao) });
      }
      if (data.valor) {
        fields.push({
          label: 'Novo valor',
          value: formatCurrency(Number(data.valor)),
        });
      }
      break;

    case 'delete_transaction':
      if (data.id) {
        fields.push({ label: 'ID da transação', value: `#${data.id}` });
      }
      break;

    case 'create_goal':
      if (data.titulo) {
        fields.push({ label: 'Título', value: String(data.titulo) });
      }
      if (data.valor_meta) {
        fields.push({
          label: 'Valor da meta',
          value: formatCurrency(Number(data.valor_meta)),
        });
      }
      if (data.data_fim) {
        fields.push({
          label: 'Prazo',
          value: formatDate(String(data.data_fim)),
        });
      }
      break;

    case 'create_budget':
      if (data.categoria_id) {
        fields.push({ label: 'Categoria', value: `ID #${data.categoria_id}` });
      }
      if (data.valor) {
        fields.push({
          label: 'Limite',
          value: formatCurrency(Number(data.valor)),
        });
      }
      if (data.mes && data.ano) {
        fields.push({
          label: 'Período',
          value: `${String(data.mes).padStart(2, '0')}/${data.ano}`,
        });
      }
      break;

    default:
      // Mostra todos os campos genericamente
      Object.entries(data).forEach(([key, value]) => {
        fields.push({
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          value: String(value),
        });
      });
  }

  return fields;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
