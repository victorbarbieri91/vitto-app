import { useState } from 'react';
import { supabase } from '../../../services/supabase/client';
import { X, Save, Loader2, Sparkles } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const CATEGORIAS = [
  { value: 'tabela', label: 'Tabela' },
  { value: 'regra_negocio', label: 'Regra de Negócio' },
  { value: 'erro_comum', label: 'Erro Comum' },
  { value: 'fluxo', label: 'Fluxo' },
  { value: 'dica', label: 'Dica' },
];

interface Props {
  entry: any | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function KnowledgeForm({ entry, onClose, onSaved }: Props) {
  const [titulo, setTitulo] = useState(entry?.titulo || '');
  const [categoria, setCategoria] = useState(entry?.categoria || 'regra_negocio');
  const [conteudo, setConteudo] = useState(entry?.conteudo || '');
  const [tagsInput, setTagsInput] = useState(entry?.tags?.join(', ') || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const handleSave = async () => {
    if (!titulo.trim() || !conteudo.trim()) {
      setError('Título e conteúdo são obrigatórios');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Generate embedding
      const embedding = await generateEmbedding(`${titulo}: ${conteudo}`);

      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const record: any = {
        titulo: titulo.trim(),
        categoria,
        conteudo: conteudo.trim(),
        tags,
        origem: 'manual',
        ativo: true,
      };

      if (embedding) {
        record.embedding = JSON.stringify(embedding);
      }

      if (entry?.id) {
        // Update
        const { error: updateErr } = await supabase
          .from('app_knowledge_base')
          .update(record)
          .eq('id', entry.id);

        if (updateErr) throw updateErr;
      } else {
        // Insert
        const { error: insertErr } = await supabase
          .from('app_knowledge_base')
          .insert(record);

        if (insertErr) throw insertErr;
      }

      onSaved();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {entry ? 'Editar Regra' : 'Nova Regra'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Erro conta_id vs cartao_id"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            >
              {CATEGORIAS.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Conteúdo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Conteúdo
              <span className="text-xs text-slate-400 ml-2">
                Este texto será usado para busca semântica RAG
              </span>
            </label>
            <textarea
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
              rows={12}
              placeholder="Descreva a regra, erro ou fluxo em detalhes..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono resize-y"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tags
              <span className="text-xs text-slate-400 ml-2">separadas por vírgula</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="erro, cartao, transacao"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Sparkles size={12} />
            Embedding será gerado automaticamente
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
