import { useState, useEffect } from 'react';
import { Target, Plus, Calendar, TrendingUp, TrendingDown, AlertTriangle, Search } from 'lucide-react';
import type { BudgetStatus, Category, Budget, NewBudget } from '../../services/api';
import { budgetService, categoryService } from '../../services/api';
import { ModernCard, ModernButton, ModernInput, ModernSelect } from '../ui/modern';
import BudgetCard from './BudgetCard';
import BudgetForm from '../forms/BudgetForm';
import { cn } from '../../utils/cn';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'verde' | 'amarelo' | 'vermelho';

/**
 *
 */
export default function BudgetDashboard() {
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatus[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statusesData, categoriesData] = await Promise.all([
        budgetService.getBudgetsStatus(selectedMonth, selectedYear),
        categoryService.list()
      ]);
      
      setBudgetStatuses(statusesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const handleCreateBudget = () => {
    setEditingBudget(undefined);
    setShowForm(true);
  };

  const handleEditBudget = async (budgetId: number) => {
    try {
      const budget = await budgetService.getById(budgetId);
      setEditingBudget(budget);
      setShowForm(true);
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
    }
  };

  const handleDeleteBudget = async (budgetId: number) => {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;
    
    try {
      await budgetService.delete(budgetId);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
    }
  };

  const handleSaveBudget = async (budgetData: NewBudget) => {
    try {
      setIsSubmitting(true);
      
      if (editingBudget) {
        await budgetService.update(editingBudget.id, budgetData);
      } else {
        await budgetService.create(budgetData);
      }
      
      setShowForm(false);
      setEditingBudget(undefined);
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const filteredBudgets = budgetStatuses.filter(budget => {
    const matchesStatus = filterStatus === 'all' || budget.status === filterStatus;
    const matchesSearch = budget.budget.categoria.nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const summary = budgetStatuses.reduce(
    (acc, budget) => {
      acc.totalBudget += budget.budget.valor;
      acc.totalSpent += budget.gastoAtual;
      
      if (budget.status === 'verde') acc.green++;
      else if (budget.status === 'amarelo') acc.yellow++;
      else if (budget.status === 'vermelho') acc.red++;
      
      return acc;
    },
    { totalBudget: 0, totalSpent: 0, green: 0, yellow: 0, red: 0 }
  );

  const overallPercentage = summary.totalBudget > 0 ? (summary.totalSpent / summary.totalBudget) * 100 : 0;

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getOverallStatus = () => {
    if (overallPercentage <= 75) return { color: '#10b981', label: 'Excelente controle' };
    if (overallPercentage <= 90) return { color: '#f59e0b', label: 'Atenção aos gastos' };
    return { color: '#ef4444', label: 'Controle necessário' };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-coral-500 rounded-xl">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-deep-blue">Orçamentos</h1>
            <p className="text-slate-500">
              Gerencie seus orçamentos por categoria
            </p>
          </div>
        </div>
        <ModernButton
          onClick={handleCreateBudget}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Novo Orçamento
        </ModernButton>
      </div>

      {/* Period Selector */}
      <ModernCard className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Período:</span>
          </div>
          
          <ModernSelect
            value={selectedMonth.toString()}
            onChange={(value) => setSelectedMonth(parseInt(value))}
            options={monthNames.map((month, index) => ({
              value: (index + 1).toString(),
              label: month
            }))}
            className="w-32"
          />
          
          <ModernInput
            type="number"
            value={selectedYear.toString()}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-20"
            min="2020"
            max="2030"
          />
        </div>
      </ModernCard>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-coral-100 rounded-lg">
              <Target className="w-5 h-5 text-coral-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Orçado</p>
              <p className="text-lg font-bold text-deep-blue">
                {formatCurrency(summary.totalBudget)}
              </p>
            </div>
          </div>
        </ModernCard>

        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Gasto</p>
              <p className="text-lg font-bold text-deep-blue">
                {formatCurrency(summary.totalSpent)}
              </p>
            </div>
          </div>
        </ModernCard>

        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${overallStatus.color}20` }}
            >
              <TrendingUp 
                className="w-5 h-5"
                style={{ color: overallStatus.color }}
              />
            </div>
            <div>
              <p className="text-sm text-slate-500">Status Geral</p>
              <p 
                className="text-lg font-bold"
                style={{ color: overallStatus.color }}
              >
                {Math.round(overallPercentage)}%
              </p>
            </div>
          </div>
        </ModernCard>

        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Categorias</p>
              <div className="flex gap-1 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" title={`${summary.green} normais`} />
                <span className="w-2 h-2 bg-yellow-500 rounded-full" title={`${summary.yellow} atenção`} />
                <span className="w-2 h-2 bg-red-500 rounded-full" title={`${summary.red} extrapolados`} />
              </div>
            </div>
          </div>
        </ModernCard>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <ModernInput
          placeholder="Buscar categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="w-64"
        />
        
        <ModernSelect
          value={filterStatus}
          onChange={(value) => setFilterStatus(value as FilterStatus)}
          options={[
            { value: 'all', label: 'Todos os status' },
            { value: 'verde', label: 'Dentro do orçamento' },
            { value: 'amarelo', label: 'Atenção' },
            { value: 'vermelho', label: 'Extrapolado' }
          ]}
          className="w-48"
        />

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === 'grid' 
                ? "bg-coral-500 text-white" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              <div className="bg-current rounded-sm" />
              <div className="bg-current rounded-sm" />
              <div className="bg-current rounded-sm" />
              <div className="bg-current rounded-sm" />
            </div>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === 'list' 
                ? "bg-coral-500 text-white" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <div className="w-4 h-4 flex flex-col gap-0.5">
              <div className="h-0.5 bg-current rounded" />
              <div className="h-0.5 bg-current rounded" />
              <div className="h-0.5 bg-current rounded" />
            </div>
          </button>
        </div>
      </div>

      {/* Budget List/Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <ModernCard key={index} className="p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded mb-2" />
              <div className="h-3 bg-slate-200 rounded mb-4" />
              <div className="h-2 bg-slate-200 rounded" />
            </ModernCard>
          ))}
        </div>
      ) : filteredBudgets.length === 0 ? (
        <ModernCard className="p-12 text-center">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            {searchTerm || filterStatus !== 'all' 
              ? 'Nenhum orçamento encontrado' 
              : 'Nenhum orçamento configurado'
            }
          </h3>
          <p className="text-slate-500 mb-4">
            {searchTerm || filterStatus !== 'all'
              ? 'Tente alterar os filtros de busca'
              : 'Configure orçamentos para suas categorias de despesa'
            }
          </p>
          <ModernButton onClick={handleCreateBudget}>
            Criar Primeiro Orçamento
          </ModernButton>
        </ModernCard>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        )}>
          {filteredBudgets.map((budgetStatus) => (
            <BudgetCard
              key={budgetStatus.budget.id}
              budgetStatus={budgetStatus}
              onEdit={handleEditBudget}
              onDelete={handleDeleteBudget}
              variant={viewMode === 'list' ? 'compact' : 'default'}
            />
          ))}
          
          {/* Add new budget card */}
          <BudgetCard
            onCreateBudget={handleCreateBudget}
          />
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <BudgetForm
          budget={editingBudget}
          categories={categories}
          onSave={handleSaveBudget}
          onCancel={() => {
            setShowForm(false);
            setEditingBudget(undefined);
          }}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
} 