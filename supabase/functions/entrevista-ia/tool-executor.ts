// =====================================================
// EXECUTOR DE TOOLS - ENTREVISTA
// =====================================================

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ToolResult } from '../_shared/types.ts';
import { executeSharedTool } from '../_shared/tool-executor-shared.ts';

export async function executeInterviewTool(
  supabase: SupabaseClient,
  userId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  // Tentar shared tools primeiro
  const sharedResult = await executeSharedTool(supabase, userId, toolName, args);
  if (sharedResult !== null) return sharedResult;

  try {
    switch (toolName) {
      case 'create_conta': {
        const { data, error } = await supabase.from('app_conta').insert({
          user_id: userId,
          nome: args.nome,
          tipo: args.tipo || 'conta_corrente',
          saldo_inicial: args.saldo_inicial || 0,
          saldo_atual: args.saldo_inicial || 0,
          instituicao: args.instituicao || null,
          cor: args.cor || '#4F46E5',
          status: 'ativo',
          moeda: 'BRL',
        }).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'create_cartao': {
        const { data, error } = await supabase.from('app_cartao_credito').insert({
          user_id: userId,
          nome: args.nome,
          limite: args.limite,
          dia_fechamento: args.dia_fechamento,
          dia_vencimento: args.dia_vencimento,
          ultimos_quatro_digitos: args.ultimos_quatro_digitos || null,
          cor: args.cor || '#1A1A1A',
        }).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'update_conta': {
        const { conta_id, ...updates } = args;
        const cleanUpdates: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined && v !== null) cleanUpdates[k] = v;
        }
        if (cleanUpdates.saldo_atual !== undefined) {
          cleanUpdates.saldo_inicial = cleanUpdates.saldo_atual;
        }
        const { data, error } = await supabase.from('app_conta')
          .update(cleanUpdates).eq('id', conta_id).eq('user_id', userId)
          .select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'update_cartao': {
        const { cartao_id, ...updates } = args;
        const cleanUpdates: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined && v !== null) cleanUpdates[k] = v;
        }
        const { data, error } = await supabase.from('app_cartao_credito')
          .update(cleanUpdates).eq('id', cartao_id).eq('user_id', userId)
          .select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'create_transacao_fixa': {
        const today = new Date().toISOString().split('T')[0];
        const insertData: Record<string, unknown> = {
          user_id: userId,
          descricao: args.descricao,
          valor: Math.abs(Number(args.valor)),
          tipo: args.tipo,
          categoria_id: args.categoria_id,
          dia_mes: args.dia_mes || 1,
          data_inicio: today,
          ativo: true,
        };
        if (args.conta_id) insertData.conta_id = args.conta_id;
        if (args.cartao_id) insertData.cartao_id = args.cartao_id;
        const { data, error } = await supabase.from('app_transacoes_fixas').insert(insertData).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'create_meta': {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('app_meta_financeira').insert({
          user_id: userId,
          titulo: args.titulo,
          valor_meta: args.valor_meta,
          valor_atual: args.valor_atual || 0,
          data_inicio: today,
          data_fim: args.data_fim,
          descricao: args.descricao || null,
          cor: args.cor || '#10B981',
        }).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'create_orcamento': {
        const now = new Date();
        const { data, error } = await supabase.from('app_orcamento').insert({
          user_id: userId,
          categoria_id: args.categoria_id,
          valor: args.valor,
          tipo: args.tipo || 'despesa',
          mes: now.getMonth() + 1,
          ano: now.getFullYear(),
        }).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'update_perfil_financeiro': {
        const field = args.field as string;
        const value = args.value;
        const { data: perfil, error: perfilError } = await supabase.from('app_perfil').select('perfil_financeiro').eq('id', userId).single();
        if (perfilError) throw perfilError;
        const currentPerfil = perfil?.perfil_financeiro || {};
        currentPerfil[field] = value;
        const { error: updateError } = await supabase.from('app_perfil').update({ perfil_financeiro: currentPerfil }).eq('id', userId);
        if (updateError) throw updateError;
        return { success: true, data: { updated: true, field } };
      }

      case 'finalizar_entrevista': {
        // Marcar onboarding como completo
        const { error } = await supabase.from('app_perfil').update({
          onboarding_completed: true,
        }).eq('id', userId);
        if (error) throw error;

        // Calcular receita mensal total a partir de transacoes fixas de receita
        const { data: receitasFixas } = await supabase.from('app_transacoes_fixas')
          .select('valor').eq('user_id', userId).eq('tipo', 'receita').eq('ativo', true);
        const receitaTotal = (receitasFixas || []).reduce((sum: number, r: { valor: number }) => sum + Number(r.valor), 0);
        if (receitaTotal > 0) {
          await supabase.from('app_perfil').update({ receita_mensal_estimada: receitaTotal }).eq('id', userId);
        }

        return { success: true, data: { completed: true, message: 'Entrevista finalizada com sucesso!' } };
      }

      case 'get_interview_progress': {
        const [contas, cartoes, fixas, metas, orcamentos] = await Promise.all([
          supabase.from('app_conta').select('id, nome, tipo, saldo_atual, instituicao').eq('user_id', userId),
          supabase.from('app_cartao_credito').select('id, nome, limite, ultimos_quatro_digitos, dia_fechamento, dia_vencimento').eq('user_id', userId),
          supabase.from('app_transacoes_fixas').select('id, descricao, valor, tipo').eq('user_id', userId).eq('ativo', true),
          supabase.from('app_meta_financeira').select('id, titulo, valor_meta').eq('user_id', userId),
          supabase.from('app_orcamento').select('id, valor').eq('user_id', userId),
        ]);
        const { data: perfil } = await supabase.from('app_perfil').select('perfil_financeiro').eq('id', userId).single();
        const perfilFields = Object.keys(perfil?.perfil_financeiro || {});

        const receitasFixas = (fixas.data || []).filter((f: { tipo: string }) => f.tipo === 'receita');
        const despesasFixas = (fixas.data || []).filter((f: { tipo: string }) => f.tipo === 'despesa' || f.tipo === 'despesa_cartao');

        return {
          success: true,
          data: {
            contas: { quantidade: contas.data?.length || 0, items: contas.data },
            cartoes: { quantidade: cartoes.data?.length || 0, items: cartoes.data },
            receitas_fixas: { quantidade: receitasFixas.length, items: receitasFixas },
            despesas_fixas: { quantidade: despesasFixas.length, items: despesasFixas },
            metas: { quantidade: metas.data?.length || 0, items: metas.data },
            orcamentos: { quantidade: orcamentos.data?.length || 0 },
            perfil_financeiro: { campos_preenchidos: perfilFields.length, campos: perfilFields },
          },
        };
      }

      default:
        return { success: false, error: `Tool desconhecida: ${toolName}` };
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`Erro ao executar interview tool ${toolName}:`, error);
    return { success: false, error: errMsg };
  }
}
