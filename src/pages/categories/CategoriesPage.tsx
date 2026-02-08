import { useState, useMemo } from 'react';
import { useCategories } from '../../hooks/useCategories';
import type { Category } from '../../hooks/useCategories';
import { ModernCard, ModernButton, ModernInput } from '../../components/ui/modern';
import { GlassOverlay, GlassmorphCard } from '../../components/ui/modern';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import {
  Pencil,
  Trash2,
  X,
  RotateCcw,
  Home,
  ShoppingCart,
  Car,
  Utensils,
  Plane,
  Heart,
  GraduationCap,
  Briefcase,
  Gift,
  Tag,
  Gamepad2,
  Music,
  Film,
  Book,
  Smartphone,
  Wifi,
  Zap,
  Droplets,
  Pill,
  Stethoscope,
  Baby,
  PawPrint,
  Dumbbell,
  Coffee,
  Wine,
  Pizza,
  ShoppingBag,
  CreditCard,
  Wallet,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  FileText,
  Wrench,
  Hammer,
  Paintbrush,
  Scissors,
  Camera,
  Headphones,
  Monitor,
  Laptop,
  Watch,
  Glasses,
  Shirt,
  type LucideIcon
} from 'lucide-react';

// Mapa de ícones disponíveis
const AVAILABLE_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: 'Home', icon: Home, label: 'Casa' },
  { name: 'ShoppingCart', icon: ShoppingCart, label: 'Compras' },
  { name: 'Car', icon: Car, label: 'Carro' },
  { name: 'Utensils', icon: Utensils, label: 'Alimentação' },
  { name: 'Plane', icon: Plane, label: 'Viagem' },
  { name: 'Heart', icon: Heart, label: 'Saúde' },
  { name: 'GraduationCap', icon: GraduationCap, label: 'Educação' },
  { name: 'Briefcase', icon: Briefcase, label: 'Trabalho' },
  { name: 'Gift', icon: Gift, label: 'Presente' },
  { name: 'Tag', icon: Tag, label: 'Outros' },
  { name: 'Gamepad2', icon: Gamepad2, label: 'Jogos' },
  { name: 'Music', icon: Music, label: 'Música' },
  { name: 'Film', icon: Film, label: 'Cinema' },
  { name: 'Book', icon: Book, label: 'Livros' },
  { name: 'Smartphone', icon: Smartphone, label: 'Telefone' },
  { name: 'Wifi', icon: Wifi, label: 'Internet' },
  { name: 'Zap', icon: Zap, label: 'Energia' },
  { name: 'Droplets', icon: Droplets, label: 'Água' },
  { name: 'Pill', icon: Pill, label: 'Remédios' },
  { name: 'Stethoscope', icon: Stethoscope, label: 'Médico' },
  { name: 'Baby', icon: Baby, label: 'Bebê' },
  { name: 'PawPrint', icon: PawPrint, label: 'Pet' },
  { name: 'Dumbbell', icon: Dumbbell, label: 'Academia' },
  { name: 'Coffee', icon: Coffee, label: 'Café' },
  { name: 'Wine', icon: Wine, label: 'Bebidas' },
  { name: 'Pizza', icon: Pizza, label: 'Fast Food' },
  { name: 'ShoppingBag', icon: ShoppingBag, label: 'Sacola' },
  { name: 'CreditCard', icon: CreditCard, label: 'Cartão' },
  { name: 'Wallet', icon: Wallet, label: 'Carteira' },
  { name: 'PiggyBank', icon: PiggyBank, label: 'Poupança' },
  { name: 'TrendingUp', icon: TrendingUp, label: 'Investimento' },
  { name: 'TrendingDown', icon: TrendingDown, label: 'Queda' },
  { name: 'DollarSign', icon: DollarSign, label: 'Dinheiro' },
  { name: 'Receipt', icon: Receipt, label: 'Recibo' },
  { name: 'FileText', icon: FileText, label: 'Documento' },
  { name: 'Wrench', icon: Wrench, label: 'Manutenção' },
  { name: 'Hammer', icon: Hammer, label: 'Construção' },
  { name: 'Paintbrush', icon: Paintbrush, label: 'Arte' },
  { name: 'Scissors', icon: Scissors, label: 'Beleza' },
  { name: 'Camera', icon: Camera, label: 'Foto' },
  { name: 'Headphones', icon: Headphones, label: 'Fone' },
  { name: 'Monitor', icon: Monitor, label: 'TV' },
  { name: 'Laptop', icon: Laptop, label: 'Notebook' },
  { name: 'Watch', icon: Watch, label: 'Relógio' },
  { name: 'Glasses', icon: Glasses, label: 'Óculos' },
  { name: 'Shirt', icon: Shirt, label: 'Roupa' },
];

// Helper para obter o ícone pelo nome
const getIconByName = (name: string): LucideIcon => {
  const found = AVAILABLE_ICONS.find(i => i.name.toLowerCase() === name?.toLowerCase());
  return found?.icon || Tag;
};

// Cores sugeridas (mas o usuário pode escolher qualquer cor)
const SUGGESTED_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
  '#10B981', '#14B8A6', '#06B6D4', '#3B82F6', '#6B7280',
];

type FilterType = 'todas' | 'despesa' | 'receita';

export default function CategoriesPage() {
  const { categories, loading, error, addCategory, updateCategory, deleteCategory, resetToDefault } = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('todas');
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'despesa' as 'receita' | 'despesa',
    cor: '#6366F1',
    icone: 'Tag'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrar categorias por tipo
  const filteredCategories = useMemo(() => {
    if (filterType === 'todas') return categories;
    return categories.filter(c => c.tipo === filterType || c.tipo === 'ambos');
  }, [categories, filterType]);

  // Separar categorias do usuário e padrão
  const userCategories = useMemo(() =>
    filteredCategories.filter(c => !c.is_default),
    [filteredCategories]
  );

  const defaultCategories = useMemo(() =>
    filteredCategories.filter(c => c.is_default),
    [filteredCategories]
  );

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setFormData({
        nome: category.nome,
        tipo: category.tipo === 'receita' ? 'receita' : 'despesa',
        cor: category.cor || '#6366F1',
        icone: category.icone || 'Tag'
      });
      setEditingCategory(category);
    } else {
      setFormData({
        nome: '',
        tipo: 'despesa',
        cor: '#6366F1',
        icone: 'Tag'
      });
      setEditingCategory(null);
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      setFormError('Nome é obrigatório');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          nome: formData.nome,
          tipo: formData.tipo,
          cor: formData.cor,
          icone: formData.icone,
        });
      } else {
        await addCategory({
          nome: formData.nome,
          tipo: formData.tipo,
          cor: formData.cor,
          icone: formData.icone,
          is_default: false
        });
      }

      handleCloseModal();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setFormError('Erro ao salvar categoria');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (category.is_default) return;

    if (window.confirm(`Excluir "${category.nome}"?`)) {
      try {
        await deleteCategory(category.id);
      } catch (err) {
        console.error('Erro ao excluir:', err);
      }
    }
  };

  // Loading state
  if (loading && categories.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <p>Erro ao carregar categorias: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const handleReset = async (category: Category) => {
    if (window.confirm(`Restaurar "${category.nome}" para a versão padrão?`)) {
      await resetToDefault(category.id);
    }
  };

  const CategoryItem = ({ category }: { category: Category }) => {
    const IconComponent = getIconByName(category.icone || 'Tag');
    const isCustomized = !!category.overrides_default_id;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="group flex items-center justify-between py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${category.cor}15` }}
          >
            <IconComponent size={18} style={{ color: category.cor }} />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <p className="font-medium text-slate-800 text-sm">{category.nome}</p>
              <p className="text-xs text-slate-400 capitalize">
                {category.tipo === 'ambos' ? 'Ambos' : category.tipo}
              </p>
            </div>
            {isCustomized && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md">
                Personalizada
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleOpenModal(category)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          {isCustomized && (
            <button
              onClick={() => handleReset(category)}
              className="p-2 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
              title="Restaurar padrão"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {!category.is_default && !isCustomized && (
            <button
              onClick={() => handleDelete(category)}
              className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Categorias</h1>
          <p className="text-sm text-slate-500">Organize suas receitas e despesas</p>
        </div>
        <ModernButton
          variant="primary"
          onClick={() => handleOpenModal()}
          className="bg-coral-500 hover:bg-coral-600"
        >
          Nova Categoria
        </ModernButton>
      </div>

      <ModernCard variant="default" className="p-4">
        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-6">
          {(['todas', 'despesa', 'receita'] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                filterType === type
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {type === 'todas' ? 'Todas' : type === 'despesa' ? 'Despesas' : 'Receitas'}
            </button>
          ))}
        </div>

        {/* Minhas Categorias */}
        {userCategories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-4">
              Minhas Categorias
            </h3>
            <div className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {userCategories.map(category => (
                  <CategoryItem key={category.id} category={category} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Categorias Padrão */}
        {defaultCategories.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-4">
              Categorias Padrão
            </h3>
            <div className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {defaultCategories.map(category => (
                  <CategoryItem key={category.id} category={category} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Tag size={32} className="mx-auto mb-2 opacity-50" />
            <p>Nenhuma categoria encontrada</p>
          </div>
        )}
      </ModernCard>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <GlassOverlay onClick={handleCloseModal}>
            <GlassmorphCard
              variant="frosted"
              blur="xl"
              className="w-full max-w-lg p-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-medium text-slate-800">
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-2.5 p-3 bg-slate-50/80 rounded-lg mb-4">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${formData.cor}20` }}
                >
                  {(() => {
                    const IconPreview = getIconByName(formData.icone);
                    return <IconPreview size={16} style={{ color: formData.cor }} />;
                  })()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {formData.nome || 'Nome da categoria'}
                  </p>
                  <p className="text-[11px] text-slate-400 capitalize">{formData.tipo}</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Nome */}
                <ModernInput
                  label="Nome"
                  size="sm"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Alimentação"
                  error={formError && !formData.nome.trim() ? formError : ''}
                />

                {/* Tipo */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Tipo
                  </label>
                  <div className="flex gap-2">
                    {(['despesa', 'receita'] as const).map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tipo }))}
                        disabled={editingCategory?.is_default}
                        className={cn(
                          'flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all',
                          formData.tipo === tipo
                            ? tipo === 'despesa'
                              ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                              : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-150',
                          editingCategory?.is_default && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {tipo === 'despesa' ? 'Despesa' : 'Receita'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cor */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Cor
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 flex-wrap">
                      {SUGGESTED_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, cor: color }))}
                          className={cn(
                            'w-5 h-5 rounded-md transition-transform hover:scale-110',
                            formData.cor === color && 'ring-2 ring-offset-1 ring-slate-400'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <input
                        type="color"
                        value={formData.cor}
                        onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={formData.cor}
                        onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                        className="w-16 text-[10px] px-1.5 py-1 border border-slate-200 rounded font-mono uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>

                {/* Ícone */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Ícone
                  </label>
                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 sm:gap-1 max-h-28 overflow-y-auto p-1.5 bg-slate-50/80 rounded-lg">
                    {AVAILABLE_ICONS.map(({ name, icon: Icon, label }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icone: name }))}
                        title={label}
                        className={cn(
                          'w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-105',
                          formData.icone === name
                            ? 'bg-white shadow-sm ring-1 ring-slate-200'
                            : 'hover:bg-white/80'
                        )}
                      >
                        <Icon
                          size={14}
                          className={cn(
                            formData.icone === name ? 'text-slate-700' : 'text-slate-400'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-red-500">{formError}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <ModernButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancelar
                  </ModernButton>
                  <ModernButton
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    className="flex-1 bg-coral-500 hover:bg-coral-600"
                  >
                    {editingCategory ? 'Salvar' : 'Criar'}
                  </ModernButton>
                </div>
              </div>
            </GlassmorphCard>
          </GlassOverlay>
        )}
      </AnimatePresence>
    </>
  );
}
