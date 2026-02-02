import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  DollarSign,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Repeat,
  Cpu,
  Code,
  Server,
  Megaphone,
  Settings,
  Scale,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { AdminFinanceService, FinanceSummary } from '../../services/admin/AdminFinanceService';
import type {
  AdminFinanceEntry,
  CreateFinanceEntryInput,
  FinanceType,
  FinanceCategory
} from '../../types/admin';
import { FINANCE_CATEGORY_INFO, FINANCE_TYPE_INFO } from '../../types/admin';

// Icon mapping
const CATEGORY_ICONS: Record<FinanceCategory, React.ReactNode> = {
  tecnologia: <Cpu size={16} />,
  desenvolvimento: <Code size={16} />,
  infraestrutura: <Server size={16} />,
  marketing: <Megaphone size={16} />,
  operacional: <Settings size={16} />,
  juridico: <Scale size={16} />,
  outros: <MoreHorizontal size={16} />
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
}

// Summary Cards Component
function SummaryCards({ summary, loading }: { summary: FinanceSummary | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const cards = [
    {
      label: 'Despesas',
      value: summary.totalDespesas,
      color: 'bg-[#7d4e57]',
      icon: <TrendingDown size={20} />
    },
    {
      label: 'Receitas',
      value: summary.totalReceitas,
      color: 'bg-[#3d6b59]',
      icon: <TrendingUp size={20} />
    },
    {
      label: 'Saldo',
      value: summary.saldo,
      color: summary.saldo >= 0 ? 'bg-[#2d6a6a]' : 'bg-[#b85450]',
      icon: <DollarSign size={20} />
    },
    {
      label: 'Recorrentes',
      value: summary.despesasRecorrentes,
      color: 'bg-[#4a5568]',
      icon: <Repeat size={20} />
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, i) => (
        <div key={i} className={`${card.color} rounded-xl p-4`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
              {card.label}
            </span>
            <div className="p-1.5 rounded-lg bg-white/10 text-white/80">
              {card.icon}
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrency(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

// Entry Form Modal
function EntryFormModal({
  isOpen,
  onClose,
  onSave,
  editingEntry
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateFinanceEntryInput) => Promise<void>;
  editingEntry: AdminFinanceEntry | null;
}) {
  const [formData, setFormData] = useState<CreateFinanceEntryInput>({
    tipo: 'despesa',
    categoria: 'tecnologia',
    descricao: '',
    valor: 0,
    recorrente: false,
    data: new Date().toISOString().split('T')[0],
    observacoes: ''
  });
  const [valorDisplay, setValorDisplay] = useState('');
  const [saving, setSaving] = useState(false);

  // Format number to currency display
  const formatToCurrency = (value: number): string => {
    if (value === 0) return '';
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Parse currency string to number
  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    // Remove everything except digits and comma
    const cleaned = value.replace(/[^\d,]/g, '');
    // Replace comma with dot for parsing
    const normalized = cleaned.replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  // Handle currency input
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Allow only digits, comma and dot
    value = value.replace(/[^\d.,]/g, '');

    // Replace dot with comma for Brazilian format
    value = value.replace('.', ',');

    // Ensure only one comma
    const parts = value.split(',');
    if (parts.length > 2) {
      value = parts[0] + ',' + parts.slice(1).join('');
    }

    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + ',' + parts[1].substring(0, 2);
    }

    setValorDisplay(value);
    setFormData(d => ({ ...d, valor: parseCurrency(value) }));
  };

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        tipo: editingEntry.tipo,
        categoria: editingEntry.categoria,
        descricao: editingEntry.descricao,
        valor: editingEntry.valor,
        recorrente: editingEntry.recorrente,
        data: editingEntry.data,
        observacoes: editingEntry.observacoes || ''
      });
      setValorDisplay(formatToCurrency(editingEntry.valor));
    } else {
      setFormData({
        tipo: 'despesa',
        categoria: 'tecnologia',
        descricao: '',
        valor: 0,
        recorrente: false,
        data: new Date().toISOString().split('T')[0],
        observacoes: ''
      });
      setValorDisplay('');
    }
  }, [editingEntry, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">
            {editingEntry ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Tipo */}
          <div className="flex gap-2">
            {(['despesa', 'receita'] as FinanceType[]).map(tipo => (
              <button
                key={tipo}
                type="button"
                onClick={() => setFormData(d => ({ ...d, tipo }))}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  formData.tipo === tipo
                    ? tipo === 'despesa'
                      ? 'bg-[#7d4e57] text-white'
                      : 'bg-[#3d6b59] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {FINANCE_TYPE_INFO[tipo].label}
              </button>
            ))}
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Categoria
            </label>
            <select
              value={formData.categoria}
              onChange={e => setFormData(d => ({ ...d, categoria: e.target.value as FinanceCategory }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              {Object.entries(FINANCE_CATEGORY_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Descrição
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={e => setFormData(d => ({ ...d, descricao: e.target.value }))}
              placeholder="Ex: Vercel Pro, GitHub Copilot..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              required
            />
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Valor
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorDisplay}
                  onChange={handleValorChange}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Data
              </label>
              <input
                type="date"
                value={formData.data}
                onChange={e => setFormData(d => ({ ...d, data: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                required
              />
            </div>
          </div>

          {/* Recorrente */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.recorrente}
              onChange={e => setFormData(d => ({ ...d, recorrente: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-300"
            />
            <span className="text-sm text-slate-600">Despesa recorrente (mensal)</span>
          </label>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Observações (opcional)
            </label>
            <textarea
              value={formData.observacoes}
              onChange={e => setFormData(d => ({ ...d, observacoes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 px-3 bg-[#3d4f5f] text-white rounded-lg text-sm font-medium hover:bg-[#2d3f4f] transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Page Component
export default function AdminFinancePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AdminFinanceEntry[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AdminFinanceEntry | null>(null);
  const [filterTipo, setFilterTipo] = useState<FinanceType | ''>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [entriesData, summaryData] = await Promise.all([
        AdminFinanceService.getAll(filterTipo ? { tipo: filterTipo } : undefined),
        AdminFinanceService.getSummary()
      ]);
      setEntries(entriesData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterTipo]);

  const handleSave = async (data: CreateFinanceEntryInput) => {
    if (!user) return;

    if (editingEntry) {
      await AdminFinanceService.update(editingEntry.id, data);
    } else {
      await AdminFinanceService.create(data, user.id);
    }
    setEditingEntry(null);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;
    await AdminFinanceService.delete(id);
    fetchData();
  };

  const openEditModal = (entry: AdminFinanceEntry) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  const openNewModal = () => {
    setEditingEntry(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Financeiro</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Despesas e receitas da empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-slate-400' : 'text-slate-600'} />
          </button>
          <button
            onClick={openNewModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#3d4f5f] text-white rounded-lg text-sm font-medium hover:bg-[#2d3f4f] transition-colors"
          >
            <Plus size={16} />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} loading={loading} />

      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterTipo('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterTipo === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterTipo('despesa')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterTipo === 'despesa' ? 'bg-[#7d4e57] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Despesas
        </button>
        <button
          onClick={() => setFilterTipo('receita')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterTipo === 'receita' ? 'bg-[#3d6b59] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Receitas
        </button>
      </div>

      {/* Entries List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
            <p className="text-sm">Carregando...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-500">Nenhum lançamento encontrado</p>
            <button
              onClick={openNewModal}
              className="mt-2 text-sm text-[#2d6a6a] hover:underline"
            >
              Adicionar primeiro lançamento
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                  Descrição
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                  Categoria
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                  Data
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                  Valor
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-20">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {entry.recorrente && (
                        <Repeat size={14} className="text-slate-400" title="Recorrente" />
                      )}
                      <span className="text-sm text-slate-700">{entry.descricao}</span>
                    </div>
                    {entry.observacoes && (
                      <p className="text-xs text-slate-400 mt-0.5">{entry.observacoes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      {CATEGORY_ICONS[entry.categoria]}
                      <span className="text-sm">{FINANCE_CATEGORY_INFO[entry.categoria].label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{formatDate(entry.data)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-medium ${
                        entry.tipo === 'despesa' ? 'text-[#7d4e57]' : 'text-[#3d6b59]'
                      }`}
                    >
                      {entry.tipo === 'despesa' ? '-' : '+'}
                      {formatCurrency(entry.valor)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(entry)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <EntryFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSave}
        editingEntry={editingEntry}
      />
    </div>
  );
}
