// =====================================================
// EXECUTOR DE TOOLS COMPARTILHADAS
// =====================================================

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ToolResult } from './types.ts';
import { generateEmbedding } from './embedding.ts';

/**
 * Executa tools compartilhadas entre central-ia e entrevista-ia.
 * Retorna null se a tool nao for reconhecida (para o caller tratar).
 */
export async function executeSharedTool(
  supabase: SupabaseClient,
  userId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResult | null> {
  try {
    switch (toolName) {
      case 'query_categorias': {
        let query = supabase.from('app_categoria').select('id, nome, tipo, cor, icone').or(`user_id.eq.${userId},user_id.is.null`);
        if (args.tipo && args.tipo !== 'todos') query = query.or(`tipo.eq.${args.tipo},tipo.eq.ambos`);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data };
      }

      case 'query_contas': {
        let query = supabase.from('app_conta').select('id, nome, tipo, saldo_atual, moeda, instituicao, cor').eq('user_id', userId);
        if (args.apenas_ativas) query = query.or('status.eq.ativa,status.eq.ativo');
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data };
      }

      case 'query_cartoes': {
        const now = new Date();
        const mesAtual = now.getMonth() + 1; const anoAtual = now.getFullYear();
        const startDate = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`;
        const endDate = new Date(anoAtual, mesAtual, 0).toISOString().split('T')[0];
        const { data: cartoes, error } = await supabase.from('app_cartao_credito').select('id, nome, limite, dia_fechamento, dia_vencimento, cor, ultimos_quatro_digitos').eq('user_id', userId);
        if (error) throw error;
        const cartoesComFatura = [];
        for (const cartao of (cartoes || [])) {
          const { data: despesas } = await supabase.from('app_transacoes').select('valor').eq('user_id', userId).eq('cartao_id', cartao.id).gte('data', startDate).lte('data', endDate);
          const totalDespesas = (despesas || []).reduce((sum: number, t: { valor: number }) => sum + Number(t.valor), 0);
          const { data: fatura } = await supabase.from('app_fatura').select('id, mes, ano, valor_total, status, data_vencimento').eq('cartao_id', cartao.id).eq('mes', mesAtual).eq('ano', anoAtual).single();
          cartoesComFatura.push({ ...cartao, limite_disponivel: cartao.limite - totalDespesas, despesas_mes_atual: totalDespesas, fatura_atual: fatura || null });
        }
        return { success: true, data: cartoesComFatura };
      }

      case 'save_memory': {
        const scoreByType: Record<string, number> = { preferencia: 0.8, objetivo: 0.9, padrao: 0.7, insight: 0.6, lembrete: 0.85 };
        let embedding = null;
        try { embedding = await generateEmbedding(`[${args.tipo}] ${args.conteudo}`); } catch (e) { console.error('Erro ao gerar embedding para memoria:', e); }
        const insertData: Record<string, unknown> = { usuario_id: userId, tipo_conteudo: args.tipo, conteudo: args.conteudo, ativo: true, relevancia_score: scoreByType[args.tipo as string] || 0.5 };
        if (embedding) insertData.embedding = embedding;
        const { error } = await supabase.from('app_memoria_ia').insert(insertData);
        if (error) throw error;
        return { success: true, data: { saved: true, message: 'Memoria salva com sucesso' } };
      }

      case 'update_user_profile': {
        const field = args.field as string;
        const value = args.value;
        const action = (args.action as string) || 'set';
        const { data: perfil, error: perfilError } = await supabase.from('app_perfil').select('ai_context').eq('id', userId).single();
        if (perfilError) throw perfilError;
        const currentContext = perfil?.ai_context || {};
        if (action === 'delete') { delete currentContext[field]; } else { currentContext[field] = value; }
        const { error: updateError } = await supabase.from('app_perfil').update({ ai_context: currentContext }).eq('id', userId);
        if (updateError) throw updateError;
        return { success: true, data: { updated: true, field, action } };
      }

      default:
        return null; // Tool nao reconhecida - caller deve tratar
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`Erro ao executar shared tool ${toolName}:`, error);
    return { success: false, error: errMsg };
  }
}
