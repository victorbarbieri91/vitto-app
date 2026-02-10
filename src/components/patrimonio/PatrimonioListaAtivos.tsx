import { motion } from 'framer-motion';
import { Plus, Package } from 'lucide-react';
import type { PatrimonioAtivo, CategoriaAtivo } from '../../types/patrimonio';
import { CATEGORIAS_METADATA } from '../../types/patrimonio';
import PatrimonioAtivoCard from './PatrimonioAtivoCard';

interface PatrimonioListaAtivosProps {
  ativos: PatrimonioAtivo[];
  categoriaFiltro?: CategoriaAtivo | null;
  isLoading?: boolean;
  onAddAtivo?: (categoria?: CategoriaAtivo) => void;
  onEditAtivo?: (ativo: PatrimonioAtivo) => void;
  onDeleteAtivo?: (ativo: PatrimonioAtivo) => void;
  onUpdateValor?: (ativo: PatrimonioAtivo) => void;
}

/**
 *
 */
export default function PatrimonioListaAtivos({
  ativos,
  categoriaFiltro,
  isLoading = false,
  onAddAtivo,
  onEditAtivo,
  onDeleteAtivo,
  onUpdateValor
}: PatrimonioListaAtivosProps) {
  // Agrupar ativos por categoria
  const ativosPorCategoria = ativos.reduce((acc, ativo) => {
    const categoria = ativo.categoria;
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(ativo);
    return acc;
  }, {} as Record<CategoriaAtivo, PatrimonioAtivo[]>);

  // Se tem filtro, mostrar apenas essa categoria
  const categoriasExibir = categoriaFiltro
    ? [categoriaFiltro]
    : (Object.keys(ativosPorCategoria) as CategoriaAtivo[]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-16 bg-slate-100 rounded" />
              <div className="h-16 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (ativos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-8"
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            Nenhum ativo cadastrado
          </h3>
          <p className="text-slate-500 mb-6 max-w-sm">
            Comece adicionando seus ativos para ter uma visao completa do seu patrimonio.
          </p>
          {onAddAtivo && (
            <button
              onClick={() => onAddAtivo()}
              className="flex items-center gap-2 px-4 py-2 bg-deep-blue text-white rounded-lg hover:bg-deep-blue/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar primeiro ativo
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {categoriasExibir.map((categoria, index) => {
        const ativosDaCategoria = ativosPorCategoria[categoria] || [];
        if (ativosDaCategoria.length === 0 && !categoriaFiltro) return null;

        const categoriaInfo = CATEGORIAS_METADATA[categoria];
        const totalCategoria = ativosDaCategoria.reduce(
          (sum, a) => sum + a.valor_atual, 0
        );

        return (
          <motion.div
            key={categoria}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {/* Header da categoria */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: categoriaInfo?.corHex || '#6B7280' }}
                />
                <h3 className="font-semibold text-slate-800">
                  {categoriaInfo?.nome || categoria}
                </h3>
                <span className="text-xs text-slate-400">
                  ({ativosDaCategoria.length})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">
                  {formatCurrency(totalCategoria)}
                </span>
                {onAddAtivo && (
                  <button
                    onClick={() => onAddAtivo(categoria)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de ativos */}
            <div className="space-y-2">
              {ativosDaCategoria.length === 0 ? (
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-slate-500">
                    Nenhum ativo nesta categoria
                  </p>
                  {onAddAtivo && (
                    <button
                      onClick={() => onAddAtivo(categoria)}
                      className="text-sm text-deep-blue hover:underline mt-1"
                    >
                      Adicionar ativo
                    </button>
                  )}
                </div>
              ) : (
                ativosDaCategoria.map((ativo) => (
                  <PatrimonioAtivoCard
                    key={ativo.id}
                    ativo={ativo}
                    onEdit={onEditAtivo}
                    onDelete={onDeleteAtivo}
                    onUpdateValor={onUpdateValor}
                  />
                ))
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
