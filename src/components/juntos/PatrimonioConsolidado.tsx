import React from 'react';
import { motion } from 'framer-motion';
import type { MembroDadosFinanceiros } from '../../types/juntos';

interface PatrimonioConsolidadoProps {
  membros: MembroDadosFinanceiros[];
  patrimonioTotal: number;
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
 * Cores para os membros (design system Vitto)
 */
const CORES_MEMBROS = [
  { bg: 'bg-deep-blue', text: 'text-deep-blue', light: 'bg-slate-100' },
  { bg: 'bg-coral-500', text: 'text-coral-600', light: 'bg-coral-50' },
  { bg: 'bg-teal-600', text: 'text-teal-600', light: 'bg-teal-50' },
  { bg: 'bg-slate-500', text: 'text-slate-600', light: 'bg-slate-100' },
  { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' },
];

/**
 * Card mostrando o patrimônio consolidado com divisão visual
 */
export const PatrimonioConsolidado: React.FC<PatrimonioConsolidadoProps> = ({
  membros,
  patrimonioTotal,
}) => {
  const membrosComPercentual = membros
    .filter((m) => m.patrimonio !== null && m.patrimonio !== undefined)
    .map((membro, index) => ({
      ...membro,
      percentual: patrimonioTotal > 0 ? (membro.patrimonio! / patrimonioTotal) * 100 : 0,
      cor: CORES_MEMBROS[index % CORES_MEMBROS.length],
    }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 h-full">
      <h3 className="text-sm font-medium text-slate-700 mb-3">
        Divisão do Patrimônio
      </h3>

      {/* Barra de progresso */}
      <div className="h-3 rounded-full overflow-hidden bg-slate-100 flex mb-4">
        {membrosComPercentual.map((membro, index) => (
          <motion.div
            key={membro.user_id}
            initial={{ width: 0 }}
            animate={{ width: `${membro.percentual}%` }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`h-full ${membro.cor.bg} ${
              index > 0 ? 'border-l border-white' : ''
            }`}
            title={`${membro.apelido}: ${membro.percentual.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Legenda */}
      <div className="space-y-2.5">
        {membrosComPercentual.map((membro) => (
          <div
            key={membro.user_id}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${membro.cor.light}`}
              >
                {membro.avatar ? (
                  <img
                    src={membro.avatar}
                    alt={membro.apelido}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : (
                  <span className={`text-xs font-semibold ${membro.cor.text}`}>
                    {membro.apelido.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {membro.apelido}
                </p>
                <p className="text-xs text-slate-400">
                  {membro.percentual.toFixed(0)}%
                </p>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {formatCurrency(membro.patrimonio)}
            </p>
          </div>
        ))}
      </div>

      {membros.filter((m) => m.patrimonio === null).length > 0 && (
        <p className="text-xs text-slate-400 mt-3">
          Alguns membros optaram por não compartilhar
        </p>
      )}
    </div>
  );
};

export default PatrimonioConsolidado;
