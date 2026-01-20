import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { ModernButton } from '../ui/modern';

interface SemGrupoCardProps {
  onCriarGrupo: () => void;
}

/**
 * Card exibido quando o usuário ainda não tem nenhum grupo Juntos
 * Design minimalista seguindo o design system do Vitto
 */
export const SemGrupoCard: React.FC<SemGrupoCardProps> = ({ onCriarGrupo }) => {
  const beneficios = [
    {
      titulo: 'Patrimônio Consolidado',
      descricao: 'Visualize o patrimônio total do grupo',
    },
    {
      titulo: 'Metas Compartilhadas',
      descricao: 'Acompanhem objetivos financeiros juntos',
    },
    {
      titulo: 'Controle de Privacidade',
      descricao: 'Defina o que cada pessoa pode ver',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-8"
    >
      {/* Card principal */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-deep-blue px-6 py-8 text-center">
          <div className="w-14 h-14 bg-white/10 rounded-xl mx-auto flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-1">
            Finanças Compartilhadas
          </h1>
          <p className="text-slate-300 text-sm">
            Gerencie finanças em grupo
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* Benefícios */}
          <div className="space-y-4 mb-6">
            {beneficios.map((beneficio, index) => (
              <motion.div
                key={beneficio.titulo}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 bg-coral-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-800 text-sm">
                    {beneficio.titulo}
                  </p>
                  <p className="text-xs text-slate-500">
                    {beneficio.descricao}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Botão de criar */}
          <ModernButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={onCriarGrupo}
          >
            Criar grupo
          </ModernButton>

          <p className="text-center text-xs text-slate-400 mt-3">
            Você poderá convidar outros membros depois
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SemGrupoCard;
