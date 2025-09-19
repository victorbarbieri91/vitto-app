import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useBudget } from '../../hooks/useBudget';
import { useCategories } from '../../hooks/useCategories';
import { ModernCard, ModernButton, ModernInput } from '../../components/ui/modern';

export default function BudgetsPage() {
  const { user } = useAuth();
  const { 
    budgets, 
    budgetStatus, 
    loading, 
    error, 
    addBudget, 
    updateBudget, 
    deleteBudget,
    getBudgetsForMonth,
    getCategoriesWithoutBudget 
  } = useBudget();
  const { categories } = useCategories();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [formData, setFormData] = useState({
    categoria_id: '',
    mes: currentMonth,
    ano: currentYear,
    valor: ''
  });
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handleAddBudget = async () => {
    const categoriesWithoutBudget = await getCategoriesWithoutBudget(currentMonth, currentYear);
    setAvailableCategories(categoriesWithoutBudget);
    setFormData({
      categoria_id: '',
      mes: currentMonth,
      ano: currentYear,
      valor: ''
    });
    setEditingBudget(null);
    setIsAddModalOpen(true);
  };

  const handleEditBudget = (budget: any) => {
    setFormData({
      categoria_id: budget.categoria_id.toString(),
      mes: budget.mes,
      ano: budget.ano,
      valor: budget.valor.toString()
    });
    setEditingBudget(budget);
    setIsAddModalOpen(true);
  };

  const handleSaveBudget = async () => {
    try {
      const budgetData = {
        categoria_id: parseInt(formData.categoria_id),
        mes: formData.mes,
        ano: formData.ano,
        valor: parseFloat(formData.valor)
      };

      if (editingBudget) {
        await updateBudget(editingBudget.id, budgetData);
      } else {
        await addBudget(budgetData);
      }

      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
    }
  };

  const handleDeleteBudget = async (budget: any) => {
    if (window.confirm(`Tem certeza que deseja excluir o orçamento para ${budget.categoria.nome}?`)) {
      try {
        await deleteBudget(budget.id);
      } catch (error) {
        console.error('Erro ao excluir orçamento:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verde': return 'bg-green-500';
      case 'amarelo': return 'bg-yellow-500';
      case 'vermelho': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <ModernCard variant="default" className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </ModernCard>
    );
  }

  if (error) {
    return (
      <ModernCard variant="default" className="p-6">
          <div className="text-center text-red-600">
            <p>Erro ao carregar orçamentos: {error}</p>
            <ModernButton 
              variant="outline" 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </ModernButton>
          </div>
        </ModernCard>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8"></div>
          <div className="h-5"></div>
        </div>
        <ModernButton 
          variant="primary"
          onClick={handleAddBudget}
          className="bg-coral-500 hover:bg-coral-600 text-white"
        >
          Novo Orçamento
        </ModernButton>
      </div>
      
      <ModernCard variant="default" className="p-6">

        {/* Seletor de mês/ano */}
        <div className="flex gap-4 mb-6">
          <select 
            value={currentMonth} 
            onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg"
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
          <select 
            value={currentYear} 
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg"
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Lista de orçamentos */}
        {budgetStatus.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhum orçamento encontrado</h3>
            <p className="text-gray-500 mb-4">
              Comece criando seu primeiro orçamento para {monthNames[currentMonth - 1]} de {currentYear}
            </p>
            <ModernButton onClick={handleAddBudget}>
              Criar Primeiro Orçamento
            </ModernButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetStatus.map((budgetItem) => (
              <ModernCard key={budgetItem.budget.id} variant="metric" className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: budgetItem.budget.categoria.cor || '#6B7280' }}
                    ></div>
                    <h3 className="font-medium text-deep-blue">
                      {budgetItem.budget.categoria.nome}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditBudget(budgetItem.budget)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budgetItem.budget)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Planejado:</span>
                    <span className="font-medium">{formatCurrency(budgetItem.budget.valor)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gasto:</span>
                    <span className="font-medium">{formatCurrency(budgetItem.gastoAtual)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Restante:</span>
                    <span className={`font-medium ${budgetItem.saldoRestante >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(budgetItem.saldoRestante)}
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progresso</span>
                      <span>{budgetItem.percentualGasto.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getStatusColor(budgetItem.status)}`}
                        style={{ width: `${Math.min(budgetItem.percentualGasto, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        )}
      </ModernCard>

      {/* Modal de adicionar/editar orçamento */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
            </h2>

            <div className="space-y-4">
              {!editingBudget && (
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Valor Planejado</label>
                <ModernInput
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <ModernButton 
                variant="outline" 
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancelar
              </ModernButton>
              <ModernButton onClick={handleSaveBudget}>
                {editingBudget ? 'Salvar' : 'Criar'}
              </ModernButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}