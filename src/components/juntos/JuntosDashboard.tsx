import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import { useJuntos } from '../../contexts/JuntosContext';
import { PatrimonioConsolidado } from './PatrimonioConsolidado';
import { MembroCard } from './MembroCard';
import { MetaCompartilhadaCard } from './MetaCompartilhadaCard';
import { useScreenDetection } from '../../hooks/useScreenDetection';
import { cn } from '../../utils/cn';

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
 * Dashboard principal do módulo Juntos
 * Design consistente com o dashboard principal do Vitto
 */
export const JuntosDashboard: React.FC = () => {
  const { dadosGrupo, loading } = useJuntos();
  const { size } = useScreenDetection();
  const isMobile = size === 'mobile';

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse border border-slate-200">
            <div className="h-3 bg-slate-200 rounded w-1/4 mb-3" />
            <div className="h-6 bg-slate-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!dadosGrupo || !dadosGrupo.success) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
        <p className="text-slate-500">
          Não foi possível carregar os dados do grupo
        </p>
      </div>
    );
  }

  const {
    patrimonio_total = 0,
    receitas_mes = 0,
    despesas_mes = 0,
    membros = [],
    metas_compartilhadas = [],
  } = dadosGrupo;

  const saldoMes = receitas_mes - despesas_mes;

  return (
    <div className="space-y-4">
      {/* Linha 1: 4 KPIs */}
      <div className={cn(
        "grid gap-3",
        isMobile ? "grid-cols-2" : "grid-cols-4"
      )}>
        {/* Patrimônio Total */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "bg-deep-blue rounded-xl p-4 text-white",
            isMobile ? "col-span-2" : "col-span-1"
          )}
        >
          <p className="text-xs text-slate-300 mb-1">Patrimônio Total</p>
          <p className="text-xl font-bold">{formatCurrency(patrimonio_total)}</p>
        </motion.div>

        {/* Receitas */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-teal-700 rounded-xl p-4 text-white"
        >
          <p className="text-xs text-teal-100 mb-1">Receitas</p>
          <p className="text-xl font-bold">{formatCurrency(receitas_mes)}</p>
        </motion.div>

        {/* Despesas */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-coral-500 rounded-xl p-4 text-white"
        >
          <p className="text-xs text-coral-100 mb-1">Despesas</p>
          <p className="text-xl font-bold">{formatCurrency(despesas_mes)}</p>
        </motion.div>

        {/* Resultado */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={cn(
            "rounded-xl p-4 border",
            isMobile && "col-span-2",
            saldoMes >= 0
              ? "bg-white border-slate-200"
              : "bg-white border-slate-200"
          )}
        >
          <p className="text-xs text-slate-500 mb-1">Resultado do Mês</p>
          <p className={cn(
            "text-xl font-bold",
            saldoMes >= 0 ? "text-teal-700" : "text-coral-600"
          )}>
            {formatCurrency(saldoMes)}
          </p>
        </motion.div>
      </div>

      {/* Linha 2: Patrimônio por membro + Membros */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-2"
      )}>
        {/* Patrimônio por membro */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PatrimonioConsolidado membros={membros} patrimonioTotal={patrimonio_total} />
        </motion.div>

        {/* Membros */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-medium text-slate-700">Visão por Membro</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {membros.map((membro, index) => (
              <MembroCard key={membro.user_id} membro={membro} index={index} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Linha 3: Metas compartilhadas */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700">Metas Compartilhadas</h3>
          {metas_compartilhadas.length > 0 && (
            <button className="text-coral-600 text-xs font-medium flex items-center hover:underline">
              Ver todas
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          )}
        </div>

        {metas_compartilhadas.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-slate-400 text-sm">Nenhuma meta compartilhada</p>
            <p className="text-slate-400 text-xs mt-1">
              Crie metas para acompanhar objetivos juntos
            </p>
          </div>
        ) : (
          <div className="p-3 grid gap-3 md:grid-cols-2">
            {metas_compartilhadas.slice(0, 4).map((meta, index) => (
              <MetaCompartilhadaCard key={meta.id} meta={meta} index={index} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default JuntosDashboard;
