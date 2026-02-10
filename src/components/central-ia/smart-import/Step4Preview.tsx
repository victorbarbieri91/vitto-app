/**
 * Step4Preview - Passo 4: Preview e confirmacao
 */

import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react';
import type { PreparedImportData } from '../../../types/smart-import';

interface Step4PreviewProps {
  preparedData: PreparedImportData | null;
  selectedIds: Set<number>;
  onChange: (selectedIds: Set<number>) => void;
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 10;

/**
 *
 */
export function Step4Preview({
  preparedData,
  selectedIds,
  onChange,
  isLoading,
}: Step4PreviewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  // Filtrar items
  const filteredItems = useMemo(() => {
    if (!preparedData) return [];

    let items = preparedData.items;

    if (showOnlySelected) {
      items = items.filter((i) => selectedIds.has(i.id));
    }

    if (showOnlyErrors) {
      items = items.filter((i) => !i.valid);
    }

    return items;
  }, [preparedData, showOnlySelected, showOnlyErrors, selectedIds]);

  // Paginacao
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Calcular totais
  const selectedCount = selectedIds.size;
  const selectedValue = useMemo(() => {
    if (!preparedData) return 0;
    return preparedData.items
      .filter((i) => selectedIds.has(i.id) && i.valid)
      .reduce((sum, i) => sum + (i.valor || 0), 0);
  }, [preparedData, selectedIds]);

  const toggleItem = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onChange(newSet);
  };

  const toggleAll = () => {
    if (!preparedData) return;

    const allValidIds = preparedData.items.filter((i) => i.valid).map((i) => i.id);
    const allSelected = allValidIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      // Desmarcar todos
      onChange(new Set());
    } else {
      // Marcar todos validos
      onChange(new Set(allValidIds));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-coral-500 animate-spin mb-3" />
        <p className="text-slate-500">Preparando dados para importacao...</p>
      </div>
    );
  }

  if (!preparedData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-600 font-medium">Erro ao preparar dados</p>
        <p className="text-slate-500 text-sm mt-1">Volte e verifique o mapeamento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          Revisar e Importar
        </h3>
        <p className="text-sm text-slate-500">
          Revise os dados e selecione os itens que deseja importar
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-blue-50 rounded-xl">
          <p className="text-xs text-blue-600 font-medium">Total de itens</p>
          <p className="text-xl font-bold text-blue-800">{preparedData.totalItems}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-xl">
          <p className="text-xs text-green-600 font-medium">Validos</p>
          <p className="text-xl font-bold text-green-800">{preparedData.validItems}</p>
        </div>
        <div className="p-3 bg-coral-50 rounded-xl">
          <p className="text-xs text-coral-600 font-medium">Selecionados</p>
          <p className="text-xl font-bold text-coral-800">{selectedCount}</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-xl">
          <p className="text-xs text-purple-600 font-medium">Valor total</p>
          <p className="text-lg font-bold text-purple-800">{formatCurrency(selectedValue)}</p>
        </div>
      </div>

      {/* Periodo */}
      {preparedData.dateRange && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4" />
          Periodo: {formatDate(preparedData.dateRange.start)} a {formatDate(preparedData.dateRange.end)}
        </div>
      )}

      {/* Erros */}
      {preparedData.invalidItems > 0 && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <span className="text-sm text-amber-700">
            {preparedData.invalidItems} itens com erros (nao serao importados)
          </span>
          <button
            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            className="ml-auto text-xs text-amber-600 hover:underline"
          >
            {showOnlyErrors ? 'Mostrar todos' : 'Ver erros'}
          </button>
        </div>
      )}

      {/* Filtros e selecao */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {selectedCount === preparedData.validItems ? (
              <CheckSquare className="w-4 h-4 text-coral-500" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {selectedCount === preparedData.validItems ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showOnlySelected}
            onChange={(e) => setShowOnlySelected(e.target.checked)}
            className="rounded border-slate-300 text-coral-500 focus:ring-coral-500"
          />
          Mostrar apenas selecionados
        </label>
      </div>

      {/* Tabela */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left w-10"></th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Data</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Descricao</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Valor</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Categoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  className={`${
                    !item.valid
                      ? 'bg-red-50 opacity-75'
                      : selectedIds.has(item.id)
                      ? 'bg-coral-50/50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-3 py-2">
                    {item.valid ? (
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="p-1 rounded hover:bg-slate-100"
                      >
                        {selectedIds.has(item.id) ? (
                          <CheckSquare className="w-4 h-4 text-coral-500" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    ) : (
                      <span title={item.validationErrors.join(', ')}>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                    {formatDate(item.data || item.dataInicio)}
                  </td>
                  <td className="px-3 py-2 text-slate-700 max-w-[200px] truncate" title={item.descricao || item.nome}>
                    {item.descricao || item.nome || '-'}
                  </td>
                  <td className="px-3 py-2 text-right font-medium whitespace-nowrap">
                    <span className={item.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                      {item.tipo === 'receita' ? '+' : '-'}
                      {formatCurrency(item.valor || item.valorAtual || 0)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                      <Tag className="w-3 h-3" />
                      {item.categoria || item.categoriaPatrimonio || 'Outros'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginacao */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
            <span className="text-sm text-slate-500">
              Mostrando {currentPage * ITEMS_PER_PAGE + 1}-
              {Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredItems.length)} de{' '}
              {filteredItems.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-slate-600">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resumo final */}
      <div className="p-4 bg-gradient-to-r from-coral-50 to-blue-50 rounded-xl border border-coral-200">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-coral-500" />
          <div>
            <p className="font-medium text-slate-800">
              {selectedCount} itens prontos para importar
            </p>
            <p className="text-sm text-slate-600">
              Valor total: {formatCurrency(selectedValue)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
