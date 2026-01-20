import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, EyeOff } from 'lucide-react';
import type { MembroDadosFinanceiros } from '../../types/juntos';

interface MembroCardProps {
  membro: MembroDadosFinanceiros;
  index: number;
}

/**
 * Formata valor em moeda brasileira
 */
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Card que exibe os dados financeiros de um membro do grupo
 */
export const MembroCard: React.FC<MembroCardProps> = ({ membro, index }) => {
  const { apelido, avatar, papel, permissoes, patrimonio, receitas_mes, despesas_mes } = membro;

  const resultadoMes = receitas_mes !== null && despesas_mes !== null
    ? receitas_mes - despesas_mes
    : null;

  const patrimonioVisivel = permissoes?.patrimonio && patrimonio !== null;
  const receitasVisiveis = permissoes?.receitas && receitas_mes !== null;
  const despesasVisiveis = permissoes?.despesas && despesas_mes !== null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-3 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={apelido}
              className="w-9 h-9 rounded-lg object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-slate-600">
              {apelido.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-slate-800 truncate">{apelido}</h4>
            {papel === 'admin' && (
              <span className="px-1.5 py-0.5 bg-deep-blue text-white text-[10px] font-medium rounded">
                Admin
              </span>
            )}
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-3 mt-2">
            {/* Patrimônio */}
            <div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                Patrimônio
                {!patrimonioVisivel && <EyeOff className="w-2.5 h-2.5" />}
              </p>
              <p className="text-xs font-semibold text-slate-700">
                {patrimonioVisivel ? formatCurrency(patrimonio) : '***'}
              </p>
            </div>

            {/* Receitas */}
            <div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5 text-teal-500" />
                Receitas
              </p>
              <p className="text-xs font-semibold text-teal-600">
                {receitasVisiveis ? formatCurrency(receitas_mes) : '***'}
              </p>
            </div>

            {/* Despesas */}
            <div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <TrendingDown className="w-2.5 h-2.5 text-coral-500" />
                Despesas
              </p>
              <p className="text-xs font-semibold text-coral-600">
                {despesasVisiveis ? formatCurrency(despesas_mes) : '***'}
              </p>
            </div>
          </div>

          {/* Resultado */}
          {receitasVisiveis && despesasVisiveis && resultadoMes !== null && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Resultado</span>
                <span className={`text-xs font-semibold ${
                  resultadoMes >= 0 ? 'text-teal-600' : 'text-coral-600'
                }`}>
                  {formatCurrency(resultadoMes)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MembroCard;
