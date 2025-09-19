import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import type { Category } from '../../hooks/useCategories';
import { ModernCard, ModernButton, ModernInput } from '../../components/ui/modern';
import { useAuth } from '../../store/AuthContext';

export default function CategoriesPage() {
  const { user } = useAuth();
  const { categories, loading, error, addCategory, updateCategory, deleteCategory } = useCategories();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'despesa',
    cor: '#6366F1',
    icone: 'tag'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para abrir modal de adição
  const handleAddCategory = () => {
    setFormData({
      nome: '',
      tipo: 'despesa',
      cor: '#6366F1',
      icone: 'tag'
    });
    setFormError('');
    setEditingCategory(null);
    setIsAddModalOpen(true);
  };

  // Função para abrir modal de edição
  const handleEditCategory = (category: Category) => {
    setFormData({
      nome: category.nome,
      tipo: category.tipo,
      cor: category.cor || '#6366F1',
      icone: category.icone || 'tag'
    });
    setFormError('');
    setEditingCategory(category);
    setIsAddModalOpen(true);
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingCategory(null);
  };

  // Função para lidar com mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para validar formulário
  const validateForm = () => {
    if (!formData.nome.trim()) {
      setFormError('Nome da categoria é obrigatório');
      return false;
    }
    return true;
  };

  // Função para salvar categoria
  const handleSaveCategory = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          ...formData,
          user_id: '', // Será substituído pelo backend
          is_default: editingCategory.is_default
        });
      } else {
        await addCategory({
          ...formData,
          user_id: '', // Será substituído pelo backend
          is_default: false
        });
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      setFormError('Erro ao salvar categoria. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para excluir categoria
  const handleDeleteCategory = async (category: Category) => {
    if (category.is_default) {
      alert('Categorias padrão não podem ser excluídas.');
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja excluir a categoria "${category.nome}"?`)) {
      try {
        await deleteCategory(category.id);
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
      }
    }
  };

  // Cores disponíveis para seleção
  const availableColors = [
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6B7280', // Gray
  ];

  // Ícones disponíveis para seleção (nomes apenas, serão usados com biblioteca de ícones futuramente)
  const availableIcons = [
    'tag',
    'home',
    'shopping-cart',
    'car',
    'utensils',
    'plane',
    'heartbeat',
    'graduation-cap',
    'briefcase',
    'gift'
  ];

  // Renderizar esqueleto de carregamento
  if (loading && categories.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Categorias</h1>
          <div className="w-24 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-4 animate-pulse">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Renderizar mensagem de erro
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>Erro ao carregar categorias: {error}</p>
          <ModernButton 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </ModernButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-deep-blue">Categorias</h1>
          <p className="text-slate-500">Gerencie suas categorias de receitas e despesas</p>
        </div>
        <ModernButton 
          variant="primary"
          onClick={handleAddCategory}
          className="bg-coral-500 hover:bg-coral-600 text-white"
        >
          Nova Categoria
        </ModernButton>
      </div>
      
      <ModernCard variant="default" className="p-6">

      {/* Tabs para filtrar por tipo */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className="border-primary text-primary border-b-2 whitespace-nowrap py-4 px-1 font-medium"
            >
              Todas
            </button>
            <button
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 font-medium"
            >
              Despesas
            </button>
            <button
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 font-medium"
            >
              Receitas
            </button>
          </nav>
        </div>
      </div>

      {/* Lista de Categorias */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-500 mb-4">Nenhuma categoria encontrada.</p>
          <Button onClick={handleAddCategory}>
            Adicionar Categoria
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => (
            <div 
              key={category.id} 
              className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: category.cor || '#6366F1' }}
                  >
                    <span className="text-white text-lg">{category.icone ? category.icone.charAt(0).toUpperCase() : '#'}</span>
                  </div>
                  <div>
                    <h3 className="font-medium">{category.nome}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {category.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      {category.is_default && ' • Padrão'}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditCategory(category)}
                    className="text-gray-500 hover:text-primary"
                    disabled={loading}
                  >
                    Editar
                  </button>
                  {!category.is_default && (
                    <button 
                      onClick={() => handleDeleteCategory(category)}
                      className="text-gray-500 hover:text-red-500"
                      disabled={loading}
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para adicionar/editar categoria */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>
            
            <form className="space-y-4">
              <Input
                label="Nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Alimentação, Transporte, etc."
                error={formError && !formData.nome.trim() ? formError : ''}
              />
              
              <div>
                <label className="block text-sm font-medium text-fontColor mb-1">
                  Tipo
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="input-field"
                  disabled={editingCategory?.is_default}
                >
                  <option value="despesa">Despesa</option>
                  <option value="receita">Receita</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-fontColor mb-1">
                  Cor
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full ${formData.cor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, cor: color }))}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-fontColor mb-1">
                  Ícone
                </label>
                <select
                  name="icone"
                  value={formData.icone}
                  onChange={handleChange}
                  className="input-field"
                >
                  {availableIcons.map(icon => (
                    <option key={icon} value={icon}>
                      {icon.charAt(0).toUpperCase() + icon.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              
              {formError && (
                <p className="text-red-500 text-sm">{formError}</p>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <ModernButton 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancelar
                </ModernButton>
                <ModernButton 
                  type="button" 
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  onClick={handleSaveCategory}
                >
                  {editingCategory ? 'Salvar' : 'Adicionar'}
                </ModernButton>
              </div>
            </form>
          </div>
        </div>
      )}
      </ModernCard>
    </>
  );
}
