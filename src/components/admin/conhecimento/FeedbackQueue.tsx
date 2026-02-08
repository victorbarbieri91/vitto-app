import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase/client';
import {
  Check,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  MessageCircle,
  Clock,
  Loader2,
  Inbox
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const ORIGEM_CONFIG: Record<string, { label: string; icon: typeof AlertCircle; color: string }> = {
  feedback_erro: { label: 'Erro', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
  feedback_padrao: { label: 'Padrão', icon: TrendingUp, color: 'bg-green-100 text-green-700' },
  contexto_interacao: { label: 'Contexto', icon: MessageCircle, color: 'bg-blue-100 text-blue-700' },
};

interface FeedbackEntry {
  id: string;
  categoria: string;
  titulo: string;
  conteudo: string;
  tags: string[];
  origem: string;
  metadata: any;
  created_at: string;
}

interface Props {
  onRefresh: () => void;
}

export default function FeedbackQueue({ onRefresh }: Props) {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [origemFilter, setOrigemFilter] = useState('');

  useEffect(() => {
    fetchQueue();
  }, [origemFilter]);

  const fetchQueue = async () => {
    setLoading(true);
    let query = supabase
      .from('app_knowledge_base')
      .select('*')
      .eq('ativo', false)
      .order('created_at', { ascending: false });

    if (origemFilter) {
      query = query.eq('origem', origemFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar fila:', error);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  const generateEmbedding = async (text: string): Promise<number[] | null> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ text })
      });
      if (!res.ok) return null;
      const { embeddings } = await res.json();
      return embeddings?.[0] || null;
    } catch {
      return null;
    }
  };

  const handleApprove = async (entry: FeedbackEntry) => {
    setProcessingId(entry.id);
    try {
      // Generate embedding
      const embedding = await generateEmbedding(`${entry.titulo}: ${entry.conteudo}`);

      // Activate entry + add embedding
      const updateData: any = { ativo: true };
      if (embedding) {
        updateData.embedding = JSON.stringify(embedding);
      }
      // Remove needs_review flag from metadata
      if (entry.metadata) {
        const { needs_review, ...rest } = entry.metadata;
        updateData.metadata = { ...rest, reviewed: true, reviewed_at: new Date().toISOString() };
      }

      const { error } = await supabase
        .from('app_knowledge_base')
        .update(updateData)
        .eq('id', entry.id);

      if (error) {
        console.error('Erro ao aprovar:', error);
      } else {
        setEntries(prev => prev.filter(e => e.id !== entry.id));
        onRefresh();
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (entry: FeedbackEntry) => {
    if (!confirm('Rejeitar e deletar este registro?')) return;

    setProcessingId(entry.id);
    const { error } = await supabase
      .from('app_knowledge_base')
      .delete()
      .eq('id', entry.id);

    if (error) {
      console.error('Erro ao rejeitar:', error);
    } else {
      setEntries(prev => prev.filter(e => e.id !== entry.id));
    }
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOrigemFilter('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            !origemFilter ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          Todos ({entries.length})
        </button>
        {Object.entries(ORIGEM_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setOrigemFilter(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              origemFilter === key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Queue */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Inbox size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm">Nenhum item pendente de revisão</p>
          <p className="text-xs text-slate-400 mt-1">
            Erros e padrões serão listados aqui automaticamente
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => {
            const origemConfig = ORIGEM_CONFIG[entry.origem];
            const OrigemIcon = origemConfig?.icon || MessageCircle;
            const isProcessing = processingId === entry.id;

            return (
              <div key={entry.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  {/* Origem badge */}
                  <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${origemConfig?.color || 'bg-slate-100 text-slate-600'}`}>
                    <OrigemIcon size={10} />
                    {origemConfig?.label || entry.origem}
                  </span>

                  {/* Title */}
                  <span className="flex-1 text-sm text-slate-700 truncate">
                    {entry.titulo}
                  </span>

                  {/* Agent info */}
                  {entry.metadata?.agente && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                      {entry.metadata.agente}
                    </span>
                  )}

                  {/* Date */}
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock size={10} />
                    {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleApprove(entry)}
                      disabled={isProcessing}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                      title="Aprovar"
                    >
                      {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button
                      onClick={() => handleReject(entry)}
                      disabled={isProcessing}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Rejeitar"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {expandedId === entry.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>

                {/* Expanded */}
                {expandedId === entry.id && (
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 space-y-3">
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                      {entry.conteudo}
                    </pre>

                    {/* Metadata */}
                    {entry.metadata && (
                      <div className="text-[10px] text-slate-400 space-y-1">
                        {entry.metadata.tool_name && (
                          <p>Tool: <span className="font-mono text-slate-600">{entry.metadata.tool_name}</span></p>
                        )}
                        {entry.metadata.user_message && (
                          <p>Mensagem: <span className="text-slate-600">"{entry.metadata.user_message}"</span></p>
                        )}
                        {entry.metadata.args && (
                          <p>Args: <span className="font-mono text-slate-600">{JSON.stringify(entry.metadata.args)}</span></p>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {entry.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-slate-200 text-slate-500 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
