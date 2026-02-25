// =====================================================
// RAG SEARCH & KNOWLEDGE BASE
// =====================================================

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { RAGResult } from '../_shared/types.ts';

export async function ragSearchMemories(
  supabase: SupabaseClient,
  embedding: number[],
  userId: string,
): Promise<RAGResult[]> {
  try {
    const { data, error } = await supabase.rpc('rag_search_by_source', {
      query_embedding: embedding,
      p_source: 'memory',
      p_user_id: userId,
      p_match_threshold: 0.5,
      p_max_results: 5,
    });

    if (error) {
      console.error('RAG memory error:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('RAG memory exception:', e);
    return [];
  }
}

export async function loadKnowledgeBase(supabase: SupabaseClient): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('app_knowledge_base')
      .select('titulo, conteudo, categoria')
      .eq('ativo', true)
      .order('categoria');

    if (error || !data || data.length === 0) {
      console.warn('loadKnowledgeBase: nenhuma regra encontrada');
      return '';
    }

    console.log(`loadKnowledgeBase: ${data.length} regras carregadas`);

    const byCategory: Record<string, string[]> = {};
    for (const rule of data) {
      const cat = rule.categoria || 'geral';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(`- **${rule.titulo}**: ${rule.conteudo}`);
    }

    let block = '';
    for (const [cat, rules] of Object.entries(byCategory)) {
      block += `\n[${cat}]\n${rules.join('\n')}`;
    }

    return block;
  } catch (e) {
    console.error('loadKnowledgeBase error:', e);
    return '';
  }
}
