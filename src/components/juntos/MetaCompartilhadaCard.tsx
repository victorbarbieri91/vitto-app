import React from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Home,
  Car,
  Plane,
  GraduationCap,
  Heart,
  Smartphone,
  Laptop,
  Gift,
  Briefcase,
  Umbrella,
  Wallet,
  PiggyBank,
  TrendingUp,
  Star,
  Trophy,
} from 'lucide-react';
import type { MetaCompartilhada } from '../../types/juntos';

interface MetaCompartilhadaCardProps {
  meta: MetaCompartilhada;
  index: number;
  onClick?: () => void;
}

/**
 * Formata valor em moeda brasileira
 */
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Mapa de ícones disponíveis
 */
const ICONES_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Target,
  Home,
  Car,
  Plane,
  GraduationCap,
  Heart,
  Smartphone,
  Laptop,
  Gift,
  Briefcase,
  Umbrella,
  Wallet,
  PiggyBank,
  TrendingUp,
  Star,
  Trophy,
};

/**
 * Card que exibe uma meta compartilhada com progresso
 */
export const MetaCompartilhadaCard: React.FC<MetaCompartilhadaCardProps> = ({
  meta,
  index,
  onClick,
}) => {
  const {
    titulo,
    descricao,
    valor_meta,
    valor_atual,
    percentual,
    data_fim,
    cor,
    icone,
  } = meta;

  // Busca o ícone ou usa o padrão
  const IconComponent = icone && ICONES_MAP[icone] ? ICONES_MAP[icone] : Target;

  // Cor padrão se não definida
  const corFundo = cor || '#F87060';

  // Formata data de fim
  const dataFimFormatada = new Date(data_fim).toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  });

  // Verifica se está próximo do prazo (menos de 30 dias)
  const diasRestantes = Math.ceil(
    (new Date(data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const proximoPrazo = diasRestantes > 0 && diasRestantes <= 30;
  const atrasado = diasRestantes < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-slate-200 p-4 transition-all
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${corFundo}20` }}
        >
          <IconComponent className="w-5 h-5" style={{ color: corFundo }} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 truncate">{titulo}</h4>
          {descricao && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{descricao}</p>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-500">
            {formatCurrency(valor_atual)} de {formatCurrency(valor_meta)}
          </span>
          <span className="font-semibold" style={{ color: corFundo }}>
            {percentual?.toFixed(0) || 0}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentual || 0, 100)}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-full rounded-full"
            style={{ backgroundColor: corFundo }}
          />
        </div>
      </div>

      {/* Prazo */}
      <div className="mt-3 flex items-center justify-between">
        <span className={`text-xs ${
          atrasado ? 'text-red-600' :
          proximoPrazo ? 'text-amber-600' :
          'text-slate-500'
        }`}>
          {atrasado
            ? `Vencido há ${Math.abs(diasRestantes)} dias`
            : proximoPrazo
            ? `${diasRestantes} dias restantes`
            : `Prazo: ${dataFimFormatada}`
          }
        </span>
        {percentual >= 100 && (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            Concluída
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default MetaCompartilhadaCard;
