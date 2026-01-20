import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Briefcase, Home } from 'lucide-react';
import { useJuntos } from '../../contexts/JuntosContext';
import { ModernButton, ModernInput } from '../ui/modern';
import type { TipoGrupo } from '../../types/juntos';
import { cn } from '../../utils/cn';

interface CriarGrupoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TipoOption {
  value: TipoGrupo;
  label: string;
  descricao: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TIPOS_GRUPO: TipoOption[] = [
  {
    value: 'casal',
    label: 'Casal',
    descricao: 'Para duas pessoas',
    icon: Users,
  },
  {
    value: 'familia',
    label: 'Família',
    descricao: 'Para toda a família',
    icon: Home,
  },
  {
    value: 'parceiros',
    label: 'Parceiros',
    descricao: 'Sócios ou parceiros',
    icon: Briefcase,
  },
];

/**
 * Modal para criar um novo grupo Juntos
 */
export const CriarGrupoModal: React.FC<CriarGrupoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { criarGrupo, loading } = useJuntos();

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoGrupo>('casal');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('Digite um nome para o grupo');
      return;
    }

    const response = await criarGrupo({ nome: nome.trim(), tipo });

    if (response.success) {
      setNome('');
      setTipo('casal');
      onSuccess();
    } else {
      setError(response.error || 'Erro ao criar grupo');
    }
  };

  const handleClose = () => {
    setNome('');
    setTipo('casal');
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-deep-blue px-5 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">
                  Criar Grupo
                </h2>
                <button
                  onClick={handleClose}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="p-5">
              {/* Nome do grupo */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nome do Grupo
                </label>
                <ModernInput
                  type="text"
                  placeholder="Ex: Família Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Tipo de grupo */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TIPOS_GRUPO.map((option) => {
                    const Icon = option.icon;
                    const isSelected = tipo === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTipo(option.value)}
                        className={cn(
                          "p-3 rounded-lg border transition-all text-center",
                          isSelected
                            ? "border-deep-blue bg-slate-50"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5 mx-auto mb-1.5",
                            isSelected ? "text-deep-blue" : "text-slate-400"
                          )}
                        />
                        <p className={cn(
                          "text-xs font-medium",
                          isSelected ? "text-slate-900" : "text-slate-600"
                        )}>
                          {option.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3">
                <ModernButton
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancelar
                </ModernButton>
                <ModernButton
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  className="flex-1"
                >
                  Criar
                </ModernButton>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CriarGrupoModal;
