import { useState, useEffect } from 'react';
import { Database, FileText, Clock, CheckCircle, XCircle, Filter, Eye, Trash2, Edit } from 'lucide-react';
import embeddingService from '../../../services/ai/EmbeddingService';
import { useAuth } from '../../../store/AuthContext';

interface KnowledgeItem {
  id: string;
  content: string;
  title?: string;
  category: string;
  source: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface KnowledgeStats {
  totalChunks: number;
  approvedChunks: number;
  pendingChunks: number;
  rejectedChunks: number;
  categoriesCount: number;
  sourcesCount: number;
}

export default function KnowledgeBaseDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedCategory, page]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carrega itens
      const status = selectedStatus === 'all' ? undefined : selectedStatus;
      const category = selectedCategory === 'all' ? undefined : selectedCategory;

      const knowledgeItems = await embeddingService.listKnowledge(status, category, itemsPerPage);
      setItems(knowledgeItems);

      // Carrega estatísticas (simulado - você pode implementar uma função específica)
      if (page === 1) {
        const allItems = await embeddingService.listKnowledge(undefined, undefined, 1000);
        const statsData: KnowledgeStats = {
          totalChunks: allItems.length,
          approvedChunks: allItems.filter(i => i.status === 'approved').length,
          pendingChunks: allItems.filter(i => i.status === 'pending').length,
          rejectedChunks: allItems.filter(i => i.status === 'rejected').length,
          categoriesCount: new Set(allItems.map(i => i.category)).size,
          sourcesCount: new Set(allItems.map(i => i.source)).size
        };
        setStats(statsData);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!user) return;

    try {
      await embeddingService.approveKnowledge(id, user.id);
      await loadData();
    } catch (error) {
      console.error('Erro ao aprovar item:', error);
    }
  };

  const handleReject = async (id: string) => {
    if (!user) return;

    try {
      await embeddingService.rejectKnowledge(id, user.id);
      await loadData();
    } catch (error) {
      console.error('Erro ao rejeitar item:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'approved': 'Aprovado',
      'rejected': 'Rejeitado',
      'pending': 'Pendente'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredItems = items.filter(item =>
    searchTerm === '' ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(items.map(item => item.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Database className="w-6 h-6 mr-2" />
          Base de Conhecimento
        </h2>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalChunks}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approvedChunks}</div>
            <div className="text-sm text-gray-500">Aprovados</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingChunks}</div>
            <div className="text-sm text-gray-500">Pendentes</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejectedChunks}</div>
            <div className="text-sm text-gray-500">Rejeitados</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.categoriesCount}</div>
            <div className="text-sm text-gray-500">Categorias</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.sourcesCount}</div>
            <div className="text-sm text-gray-500">Fontes</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Buscar conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
                setSelectedCategory('all');
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">
            Itens de Conhecimento ({filteredItems.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Carregando...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum item encontrado
            </h3>
            <p className="text-gray-500">
              Tente ajustar os filtros ou adicione mais conteúdo à base.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(item.status)}
                      <span className="text-sm font-medium text-gray-900">
                        {getStatusLabel(item.status)}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {item.category}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                        {item.source}
                      </span>
                    </div>

                    {item.title && (
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {item.title}
                      </h4>
                    )}

                    <div className="text-sm text-gray-700 mb-2">
                      {expandedItem === item.id
                        ? item.content
                        : item.content.length > 200
                        ? item.content.substring(0, 200) + '...'
                        : item.content
                      }
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Criado: {formatDate(item.created_at)}</span>
                      <span>Atualizado: {formatDate(item.updated_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {/* View/Expand Button */}
                    <button
                      onClick={() => setExpandedItem(
                        expandedItem === item.id ? null : item.id
                      )}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Ver conteúdo completo"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Action Buttons */}
                    {item.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="p-2 text-green-600 hover:text-green-700"
                          title="Aprovar"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleReject(item.id)}
                          className="p-2 text-red-600 hover:text-red-700"
                          title="Rejeitar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination would go here if needed */}
    </div>
  );
}