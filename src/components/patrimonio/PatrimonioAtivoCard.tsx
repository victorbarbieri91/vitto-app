import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MoreVertical,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { PatrimonioAtivo } from '../../types/patrimonio';
import { CATEGORIAS_METADATA, calcularRentabilidade, ativoTemFinanciamento, getSaldoDevedor } from '../../types/patrimonio';
import { useState } from 'react';

interface PatrimonioAtivoCardProps {
  ativo: PatrimonioAtivo;
  onEdit?: (ativo: PatrimonioAtivo) => void;
  onDelete?: (ativo: PatrimonioAtivo) => void;
  onUpdateValor?: (ativo: PatrimonioAtivo) => void;
  showActions?: boolean;
}

/**
 *
 */
export default function PatrimonioAtivoCard({
  ativo,
  onEdit,
  onDelete,
  onUpdateValor,
  showActions = true
}: PatrimonioAtivoCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const categoriaInfo = CATEGORIAS_METADATA[ativo.categoria];
  const rentabilidade = calcularRentabilidade(ativo);
  const temFinanciamento = ativoTemFinanciamento(ativo);
  const saldoDevedor = getSaldoDevedor(ativo);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getTrendIcon = () => {
    if (rentabilidade.valor > 0) return <TrendingUp className="w-3 h-3" />;
    if (rentabilidade.valor < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (rentabilidade.valor > 0) return 'text-emerald-600 bg-emerald-50';
    if (rentabilidade.valor < 0) return 'text-red-600 bg-red-50';
    return 'text-slate-600 bg-slate-50';
  };

  // Informacao adicional baseada no tipo
  const getInfoAdicional = () => {
    const dados = ativo.dados_especificos as any;

    switch (ativo.categoria) {
      case 'renda_fixa':
        if (dados?.taxa_rentabilidade) {
          return `${dados.taxa_rentabilidade}% ${dados.tipo_rentabilidade?.toUpperCase() || ''}`;
        }
        break;
      case 'renda_variavel':
        if (dados?.ticker && dados?.quantidade) {
          return `${dados.ticker} · ${dados.quantidade} cotas`;
        }
        break;
      case 'cripto':
        if (dados?.ticker && dados?.quantidade) {
          return `${dados.ticker} · ${dados.quantidade}`;
        }
        break;
      case 'imoveis':
        if (dados?.tipo_imovel) {
          return dados.tipo_imovel + (dados.area_m2 ? ` · ${dados.area_m2}m²` : '');
        }
        break;
      case 'veiculos':
        if (dados?.marca && dados?.modelo) {
          return `${dados.marca} ${dados.modelo}` + (dados.ano ? ` ${dados.ano}` : '');
        }
        break;
      case 'previdencia':
        if (dados?.tipo_previdencia) {
          return dados.tipo_previdencia;
        }
        break;
    }

    return ativo.subcategoria || null;
  };

  const infoAdicional = getInfoAdicional();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-4"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icone e Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Indicador de cor da categoria */}
          <div
            className="w-1 h-12 rounded-full flex-shrink-0"
            style={{ backgroundColor: categoriaInfo?.corHex || '#6B7280' }}
          />

          <div className="flex-1 min-w-0">
            {/* Nome e instituicao */}
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-800 truncate">
                {ativo.nome}
              </h4>
              {ativo.instituicao && (
                <span className="text-xs text-slate-400 truncate hidden sm:inline">
                  · {ativo.instituicao}
                </span>
              )}
            </div>

            {/* Info adicional */}
            {infoAdicional && (
              <p className="text-xs text-slate-500 mb-2 truncate">
                {infoAdicional}
              </p>
            )}

            {/* Valor e rentabilidade */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-slate-800">
                {formatCurrency(ativo.valor_atual)}
              </span>

              {ativo.valor_aquisicao && ativo.valor_aquisicao > 0 && (
                <div className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
                  getTrendColor()
                )}>
                  {getTrendIcon()}
                  <span>
                    {rentabilidade.percentual >= 0 ? '+' : ''}
                    {rentabilidade.percentual.toFixed(1)}%
                  </span>
                </div>
              )}

              {temFinanciamento && (
                <span className="text-xs text-red-500">
                  Devedor: {formatCurrency(saldoDevedor)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acoes */}
        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </button>

            {/* Menu dropdown */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px]"
                >
                  {onUpdateValor && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onUpdateValor(ativo);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Atualizar valor
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(ativo);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(ativo);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
