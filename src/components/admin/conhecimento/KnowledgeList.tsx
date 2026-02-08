import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase/client';
import {
  Search,
  Edit2,
  EyeOff,
  Eye,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock,
  Database,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Workflow,
  Zap
} from 'lucide-react';

const CATEGORIAS = [
  { value: '', label: 'Todas' },
  { value: 'tabela', label: 'Tabela', icon: Database },
  { value: 'regra_negocio', label: 'Regra de Negócio', icon: AlertTriangle },
  { value: 'erro_comum', label: 'Erro Comum', icon: Zap },
  { value: 'fluxo', label: 'Fluxo', icon: Workflow },
  { value: 'dica', label: 'Dica', icon: Lightbulb },
];

const CATEGORIA_COLORS: Record<string, string> = {
  tabela: 'bg-blue-100 text-blue-700',
  regra_negocio: 'bg-amber-100 text-amber-700',
  erro_comum: 'bg-red-100 text-red-700',
  fluxo: 'bg-purple-100 text-purple-700',
  dica: 'bg-green-100 text-green-700',
  padrao_uso: 'bg-teal-100 text-teal-700',
  contexto_interacao: 'bg-slate-100 text-slate-700',
};

const ORIGEM_LABELS: Record<string, string> = {
  manual: 'Manual',
  migrado: 'Migrado',
  feedback_erro: 'Feedback Erro',
  feedback_padrao: 'Feedback Padrão',
};

interface KnowledgeEntry {
  id: string;
  categoria: string;
  titulo: string;
  conteudo: string;
  tags: string[];
  origem: string;
  ativo: boolean;
  created_at: string;
  embedding: any;
}

interface Props {
  onEdit: (entry: KnowledgeEntry) => void;
}

export default function KnowledgeList({ onEdit }: Props) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [categoriaFilter]);

  const fetchEntries = async () => {
    setLoading(true);
    let query = supabase
      .from('app_knowledge_base')
      .select('id, categoria, titulo, conteudo, tags, origem, ativo, created_at, embedding')
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (categoriaFilter) {
      query = query.eq('categoria', categoriaFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar KB:', error);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  const toggleActive = async (entry: KnowledgeEntry) => {
    const { error } = await supabase
      .from('app_knowledge_base')
      .update({ ativo: !entry.ativo })
      .eq('id', entry.id);

    if (!error) {
      fetchEntries();
    }
  };

  const filtered = entries.filter(e =>
    !search || e.titulo.toLowerCase().includes(search.toLowerCase()) ||
    e.conteudo.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar regras..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <div className="flex gap-1">
          {CATEGORIAS.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategoriaFilter(cat.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                categoriaFilter === cat.value
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>{filtered.length} regra{filtered.length !== 1 ? 's' : ''}</span>
        <span>{filtered.filter(e => e.embedding).length} com embedding</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <BookOpen size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm">Nenhuma regra encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => (
            <div
              key={entry.id}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden"
            >
              {/* Row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              >
                {/* Categoria badge */}
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${CATEGORIA_COLORS[entry.categoria] || 'bg-slate-100 text-slate-600'}`}>
                  {entry.categoria}
                </span>

                {/* Title */}
                <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                  {entry.titulo}
                </span>

                {/* Tags */}
                <div className="hidden md:flex items-center gap-1">
                  {entry.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-500 rounded">
                      <Tag size={8} />
                      {tag}
                    </span>
                  ))}
                  {(entry.tags?.length || 0) > 3 && (
                    <span className="text-[10px] text-slate-400">+{entry.tags.length - 3}</span>
                  )}
                </div>

                {/* Origem */}
                <span className="text-[10px] text-slate-400 w-20 text-right">
                  {ORIGEM_LABELS[entry.origem] || entry.origem}
                </span>

                {/* Embedding indicator */}
                <div className={`w-2 h-2 rounded-full ${entry.embedding ? 'bg-green-400' : 'bg-slate-300'}`}
                  title={entry.embedding ? 'Com embedding' : 'Sem embedding'}
                />

                {/* Expand icon */}
                {expandedId === entry.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>

              {/* Expanded content */}
              {expandedId === entry.id && (
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                    {entry.conteudo}
                  </pre>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <Clock size={10} />
                      {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                      {entry.tags?.length > 0 && (
                        <span className="ml-2">Tags: {entry.tags.join(', ')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); onEdit(entry); }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      >
                        <Edit2 size={12} />
                        Editar
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); toggleActive(entry); }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded transition-colors"
                      >
                        {entry.ativo ? <EyeOff size={12} /> : <Eye size={12} />}
                        {entry.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
