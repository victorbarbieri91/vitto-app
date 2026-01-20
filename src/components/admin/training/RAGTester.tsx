import { useState } from 'react';
import { Search, Zap, Clock, Target, FileText } from 'lucide-react';
import vectorSearchService, { SearchResult, RAGContext } from '../../../services/ai/VectorSearchService';

interface RAGTesterProps {
  onTestComplete?: (context: RAGContext) => void;
}

export default function RAGTester({ onTestComplete }: RAGTesterProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [context, setContext] = useState<RAGContext | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [maxResults, setMaxResults] = useState(5);

  const categories = [
    'financial_planning',
    'budgeting',
    'investments',
    'debt_management',
    'savings',
    'credit_cards',
    'banking',
    'insurance',
    'taxes',
    'general'
  ];

  const testSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchContext = await vectorSearchService.searchForRAG(query, {
        maxResults,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined
      });

      setContext(searchContext);
      setResults(searchContext.results);

      if (onTestComplete) {
        onTestComplete(searchContext);
      }

      // Registra métricas
      await vectorSearchService.recordSearchMetrics(
        query,
        searchContext.results,
        `test-${Date.now()}`
      );

    } catch (error) {
      console.error('Erro na busca RAG:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      testSearch();
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const formatSimilarity = (similarity: number) => {
    return (similarity * 100).toFixed(1) + '%';
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-600 bg-green-100';
    if (similarity >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Search className="w-5 h-5 mr-2" />
          Testar Busca RAG
        </h3>

        {/* Query Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pergunta de teste
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: Como posso economizar dinheiro mensalmente?"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={testSearch}
                disabled={isSearching || !query.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSearching ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="ml-2">{isSearching ? 'Buscando...' : 'Buscar'}</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorias (opcional)
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Results */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Máximo de resultados
              </label>
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>3 resultados</option>
                <option value={5}>5 resultados</option>
                <option value={10}>10 resultados</option>
                <option value={15}>15 resultados</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Search Metrics */}
      {context && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Métricas da Busca
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {context.totalResults}
              </div>
              <div className="text-gray-500">Resultados</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 flex items-center justify-center">
                <Clock className="w-4 h-4 mr-1" />
                {context.searchTime}ms
              </div>
              <div className="text-gray-500">Tempo</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {context.categories.length}
              </div>
              <div className="text-gray-500">Categorias</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">
                {results.length > 0 ? formatSimilarity(results[0].similarity) : 'N/A'}
              </div>
              <div className="text-gray-500">Top Score</div>
            </div>
          </div>

          {context.categories.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">Categorias encontradas:</div>
              <div className="flex flex-wrap gap-1">
                {context.categories.map(cat => (
                  <span key={cat} className="px-2 py-1 bg-white text-xs rounded border">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Resultados da Busca ({results.length})
          </h4>

          {results.map((result, index) => (
            <div key={result.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      #{index + 1}
                    </span>
                    {result.title && (
                      <span className="text-sm font-medium text-gray-900">
                        {result.title}
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {result.category}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                      {result.source}
                    </span>
                  </div>

                  {result.fileName && (
                    <div className="text-xs text-gray-500 mb-2">
                      📄 {result.fileName}
                      {result.chunkIndex !== undefined && ` (chunk ${result.chunkIndex})`}
                    </div>
                  )}
                </div>

                <div className={`px-2 py-1 text-xs rounded-full font-medium ${getSimilarityColor(result.similarity)}`}>
                  {formatSimilarity(result.similarity)}
                </div>
              </div>

              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-gray-300">
                {result.content.length > 300
                  ? result.content.substring(0, 300) + '...'
                  : result.content
                }
              </div>

              {result.metadata && Object.keys(result.metadata).length > 0 && (
                <div className="mt-3 text-xs text-gray-500">
                  <details>
                    <summary className="cursor-pointer hover:text-gray-700">
                      Metadata
                    </summary>
                    <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(result.metadata, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {context && results.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum resultado encontrado
          </h3>
          <p className="text-gray-500">
            Tente ajustar sua busca ou adicionar mais conteúdo à base de conhecimento.
          </p>
        </div>
      )}

      {/* Quick Test Queries */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          Queries de Teste Rápido
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            'Como fazer um orçamento mensal?',
            'Qual a melhor forma de investir?',
            'Como quitar dívidas rapidamente?',
            'Dicas para economizar dinheiro',
            'O que é planejamento financeiro?',
            'Como usar cartão de crédito consciente?'
          ].map((testQuery, index) => (
            <button
              key={index}
              onClick={() => setQuery(testQuery)}
              className="text-left p-2 text-sm text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
            >
              "{testQuery}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}