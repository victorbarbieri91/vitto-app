import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import type { CategoriaAtivo, PatrimonioPorCategoria } from '../../types/patrimonio';
import { CATEGORIAS_METADATA } from '../../types/patrimonio';
import {
  Wallet,
  TrendingUp,
  BarChart3,
  Bitcoin,
  Home,
  Car,
  Shield,
  Package
} from 'lucide-react';

interface PatrimonioCategoriaFilterProps {
  categoriaAtiva: CategoriaAtivo | null;
  onCategoriaChange: (categoria: CategoriaAtivo | null) => void;
  dadosPorCategoria?: PatrimonioPorCategoria[];
  isLoading?: boolean;
}

// Mapear icones para cada categoria
const ICONES_CATEGORIA: Record<CategoriaAtivo, React.ReactNode> = {
  liquidez: <Wallet className="w-4 h-4" />,
  renda_fixa: <TrendingUp className="w-4 h-4" />,
  renda_variavel: <BarChart3 className="w-4 h-4" />,
  cripto: <Bitcoin className="w-4 h-4" />,
  imoveis: <Home className="w-4 h-4" />,
  veiculos: <Car className="w-4 h-4" />,
  previdencia: <Shield className="w-4 h-4" />,
  outros: <Package className="w-4 h-4" />
};

/**
 *
 */
export default function PatrimonioCategoriaFilter({
  categoriaAtiva,
  onCategoriaChange,
  dadosPorCategoria = [],
  isLoading = false
}: PatrimonioCategoriaFilterProps) {
  const { size } = useResponsiveClasses();
  const isMobile = size === 'mobile';

  const categorias = Object.keys(CATEGORIAS_METADATA) as CategoriaAtivo[];

  // Criar mapa de dados por categoria
  const dadosMap = dadosPorCategoria.reduce((acc, item) => {
    acc[item.categoria] = item;
    return acc;
  }, {} as Record<CategoriaAtivo, PatrimonioPorCategoria>);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toFixed(0);
  };

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
      {/* Botao "Todos" */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onCategoriaChange(null)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all flex-shrink-0",
          "border text-sm font-medium",
          categoriaAtiva === null
            ? "bg-deep-blue text-white border-deep-blue"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
        )}
      >
        <span>Todos</span>
      </motion.button>

      {/* Botoes de categoria */}
      {categorias.map((categoria) => {
        const info = CATEGORIAS_METADATA[categoria];
        const dados = dadosMap[categoria];
        const temDados = dados && dados.valor_total > 0;
        const isActive = categoriaAtiva === categoria;

        return (
          <motion.button
            key={categoria}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCategoriaChange(isActive ? null : categoria)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-all flex-shrink-0",
              "border text-sm font-medium",
              isActive
                ? "text-white border-transparent"
                : temDados
                  ? "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  : "bg-slate-50 text-slate-400 border-slate-100"
            )}
            style={isActive ? { backgroundColor: info.corHex } : undefined}
          >
            <span className={cn(
              isActive ? "text-white" : temDados ? "text-slate-500" : "text-slate-300"
            )}>
              {ICONES_CATEGORIA[categoria]}
            </span>
            <span className={isMobile ? "hidden" : ""}>
              {info.nome}
            </span>
            {temDados && !isMobile && (
              <span className={cn(
                "text-xs",
                isActive ? "text-white/80" : "text-slate-400"
              )}>
                R$ {formatCurrency(dados.valor_total)}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
