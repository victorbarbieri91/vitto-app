// =====================================================
// EXECUTOR DE TOOLS - MODO NORMAL (chat)
// =====================================================

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ToolResult } from '../_shared/types.ts';
import { executeSharedTool } from '../_shared/tool-executor-shared.ts';

export async function executeChatTool(
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
      case 'query_saldo': {
        if (args.conta_id) {
          const { data, error } = await supabase.from('app_conta').select('id, nome, saldo_atual, moeda, tipo').eq('user_id', userId).eq('id', args.conta_id).single();
          if (error) throw error;
          return { success: true, data };
        } else {
          const { data, error } = await supabase.from('app_conta').select('id, nome, saldo_atual, moeda, tipo').eq('user_id', userId).or('status.eq.ativa,status.eq.ativo');
          if (error) throw error;
          const saldoTotal = data?.reduce((sum: number, c: { saldo_atual: number }) => sum + (Number(c.saldo_atual) || 0), 0) || 0;
          return { success: true, data: { saldo_total: saldoTotal, contas: data } };
        }
      }

      case 'query_transacoes': {
        const now = new Date();
        const mes = args.mes || now.getMonth() + 1;
        const ano = args.ano || now.getFullYear();
        const limit = args.limit || 20;
        let query = supabase.from('app_transacoes').select('id, descricao, valor, tipo, data, status, observacoes, parcela_atual, total_parcelas, categoria:app_categoria(id, nome, cor), conta:app_conta(id, nome), cartao:app_cartao_credito(id, nome)').eq('user_id', userId).order('data', { ascending: false }).limit(limit as number);
        const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
        const endDate = new Date(Number(ano), Number(mes), 0).toISOString().split('T')[0];
        query = query.gte('data', startDate).lte('data', endDate);
        if (args.tipo && args.tipo !== 'todos') query = query.eq('tipo', args.tipo);
        if (args.categoria_id) query = query.eq('categoria_id', args.categoria_id);
        if (args.conta_id) query = query.eq('conta_id', args.conta_id);
        if (args.cartao_id) query = query.eq('cartao_id', args.cartao_id);
        if (args.status && args.status !== 'todos') query = query.eq('status', args.status);
        if (args.busca) query = query.ilike('descricao', `%${args.busca}%`);
        const { data, error } = await query;
        if (error) throw error;
        const total = data?.reduce((sum: number, t: { valor: number }) => sum + Number(t.valor), 0) || 0;
        return { success: true, data: { transacoes: data, total, quantidade: data?.length || 0 } };
      }

      case 'query_metas': {
        const { data, error } = await supabase.from('app_meta_financeira').select('id, titulo, descricao, valor_meta, valor_atual, data_inicio, data_fim, cor').eq('user_id', userId);
        if (error) throw error;
        const metasComProgresso = data?.map((m: { valor_meta: number; valor_atual: number }) => ({ ...m, percentual: m.valor_meta > 0 ? Math.round((m.valor_atual / m.valor_meta) * 100) : 0 }));
        return { success: true, data: metasComProgresso };
      }

      case 'query_orcamentos': {
        const now = new Date();
        const mes = args.mes || now.getMonth() + 1;
        const ano = args.ano || now.getFullYear();
        const { data: orcamentos, error } = await supabase.from('app_orcamento').select('id, valor, mes, ano, categoria:app_categoria(id, nome, cor)').eq('user_id', userId).eq('mes', mes).eq('ano', ano);
        if (error) throw error;
        const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
        const endDate = new Date(Number(ano), Number(mes), 0).toISOString().split('T')[0];
        const { data: gastos } = await supabase.from('app_transacoes').select('categoria_id, valor').eq('user_id', userId).in('tipo', ['despesa', 'despesa_cartao']).gte('data', startDate).lte('data', endDate);
        const gastosPorCat: Record<number, number> = {};
        (gastos || []).forEach((g: { categoria_id: number; valor: number }) => { gastosPorCat[g.categoria_id] = (gastosPorCat[g.categoria_id] || 0) + Number(g.valor); });
        const orcamentosComGastos = (orcamentos || []).map((o: any) => ({ ...o, gasto: gastosPorCat[(o.categoria as any)?.id] || 0, percentual_usado: o.valor > 0 ? Math.round((gastosPorCat[(o.categoria as any)?.id] || 0) / o.valor * 100) : 0 }));
        return { success: true, data: orcamentosComGastos };
      }

      case 'analise_gastos': {
        const now = new Date();
        const mes = args.mes || now.getMonth() + 1;
        const ano = args.ano || now.getFullYear();
        const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
        const endDate = new Date(Number(ano), Number(mes), 0).toISOString().split('T')[0];
        const { data, error } = await supabase.from('app_transacoes').select('valor, tipo, categoria:app_categoria(id, nome, cor)').eq('user_id', userId).in('tipo', ['despesa', 'despesa_cartao']).gte('data', startDate).lte('data', endDate);
        if (error) throw error;
        const porCategoria: Record<string, { nome: string; total: number; cor: string }> = {};
        let totalGeral = 0;
        data?.forEach((t: any) => { const cat = t.categoria as { id: number; nome: string; cor: string }; if (!porCategoria[cat.id]) porCategoria[cat.id] = { nome: cat.nome, total: 0, cor: cat.cor }; porCategoria[cat.id].total += Number(t.valor); totalGeral += Number(t.valor); });
        const analise = Object.values(porCategoria).map(c => ({ ...c, percentual: totalGeral > 0 ? Math.round((c.total / totalGeral) * 100) : 0 })).sort((a, b) => b.total - a.total);
        return { success: true, data: { total: totalGeral, por_categoria: analise, mes, ano } };
      }

      case 'analise_evolucao': {
        const mesesAnalisar = Number(args.meses) || 6;
        const resultados = [];
        const now = new Date();
        for (let i = 0; i < mesesAnalisar; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const mes = d.getMonth() + 1; const ano = d.getFullYear();
          const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
          const endDate = new Date(ano, mes, 0).toISOString().split('T')[0];
          const { data } = await supabase.from('app_transacoes').select('valor, tipo').eq('user_id', userId).gte('data', startDate).lte('data', endDate);
          const receitas = (data || []).filter((t: { tipo: string }) => t.tipo === 'receita').reduce((s: number, t: { valor: number }) => s + Number(t.valor), 0);
          const despesas = (data || []).filter((t: { tipo: string }) => t.tipo === 'despesa' || t.tipo === 'despesa_cartao').reduce((s: number, t: { valor: number }) => s + Number(t.valor), 0);
          resultados.push({ mes: d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }), receitas, despesas, saldo: receitas - despesas });
        }
        return { success: true, data: resultados.reverse() };
      }

      case 'query_transacoes_recorrentes': {
        const { data, error } = await supabase.from('app_transacoes_fixas').select('id, descricao, valor, tipo, dia_mes, ativo, categoria:app_categoria(id, nome, cor), conta:app_conta(id, nome), cartao:app_cartao_credito(id, nome)').eq('user_id', userId);
        if (error) throw error;
        return { success: true, data };
      }

      case 'query_fatura': {
        const now = new Date();
        const mes = args.mes || now.getMonth() + 1; const ano = args.ano || now.getFullYear();
        const { data: cartao } = await supabase.from('app_cartao_credito').select('nome, dia_fechamento').eq('id', args.cartao_id).single();
        const { data: fatura } = await supabase.from('app_fatura').select('id, cartao_id, mes, ano, valor_total, status, data_vencimento, data_pagamento').eq('cartao_id', args.cartao_id).eq('mes', mes).eq('ano', ano).single();

        if (fatura?.id) {
          const [transResult, totalResult] = await Promise.all([
            supabase.rpc('obter_transacoes_fatura', { p_fatura_id: fatura.id }),
            supabase.rpc('calcular_valor_total_fatura', { p_fatura_id: fatura.id }),
          ]);
          const transacoes = transResult.data || [];
          const total = totalResult.data || 0;
          const parceladas = transacoes.filter((t: any) => t.total_parcelas && t.total_parcelas > 1).length;
          const fixas = transacoes.filter((t: any) => t.is_fixed).length;
          const avista = transacoes.length - parceladas - fixas;
          return { success: true, data: { cartao: cartao?.nome, fatura: { ...fatura, valor_total: total }, transacoes, total, quantidade: transacoes.length, resumo: { parceladas, fixas, avista } } };
        }

        const diaFechamento = cartao?.dia_fechamento || 1;
        const mesNum = Number(mes); const anoNum = Number(ano);
        const fimCiclo = new Date(anoNum, mesNum - 1, diaFechamento);
        const inicioCiclo = new Date(anoNum, mesNum - 2, diaFechamento + 1);
        const startDate = inicioCiclo.toISOString().split('T')[0];
        const endDate = fimCiclo.toISOString().split('T')[0];
        const { data: transacoes, error } = await supabase.from('app_transacoes').select('id, descricao, valor, data, status, parcela_atual, total_parcelas, categoria:app_categoria(id, nome, cor)').eq('user_id', userId).eq('cartao_id', args.cartao_id).gte('data', startDate).lte('data', endDate).order('data', { ascending: false });
        if (error) throw error;
        const total = (transacoes || []).reduce((sum: number, t: { valor: number }) => sum + Number(t.valor), 0);
        return { success: true, data: { cartao: cartao?.nome, fatura: { mes, ano, status: 'aberta', valor_total: total }, transacoes, total, quantidade: transacoes?.length || 0 } };
      }

      case 'query_indicadores': {
        const now = new Date();
        const mes = args.mes || now.getMonth() + 1; const ano = args.ano || now.getFullYear();
        const { data, error } = await supabase.from('app_indicadores').select('*').eq('user_id', userId).eq('mes', mes).eq('ano', ano).is('conta_id', null).single();
        if (error && (error as any).code !== 'PGRST116') throw error;
        return { success: true, data: data || { mensagem: 'Indicadores nao disponiveis para este periodo' } };
      }

      case 'query_patrimonio': {
        let query = supabase.from('app_patrimonio_ativo').select('id, nome, categoria, subcategoria, valor_atual, valor_aquisicao, data_aquisicao, instituicao, observacoes, ativo, dados_especificos').eq('user_id', userId).eq('ativo', true);
        if (args.categoria && args.categoria !== 'todos') query = query.eq('categoria', args.categoria);
        const { data, error } = await query;
        if (error) throw error;
        const totaisPorCategoria: Record<string, number> = {};
        let totalGeral = 0;
        (data || []).forEach((ativo: { categoria: string; valor_atual: number }) => { totaisPorCategoria[ativo.categoria] = (totaisPorCategoria[ativo.categoria] || 0) + Number(ativo.valor_atual); totalGeral += Number(ativo.valor_atual); });
        return { success: true, data: { ativos: data, total_geral: totalGeral, totais_por_categoria: totaisPorCategoria, quantidade: data?.length || 0 } };
      }

      case 'create_transaction': {
        const { data, error } = await supabase.from('app_transacoes').insert({ user_id: userId, descricao: args.descricao, valor: args.valor, tipo: args.tipo, categoria_id: args.categoria_id, conta_id: args.conta_id, data: args.data, observacoes: args.observacoes || null, status: 'confirmado' }).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'create_transaction_cartao': {
        const parcelas = Number(args.parcelas) || 1;
        const valorParcela = Number(args.valor) / parcelas;
        const grupoParcelamento = parcelas > 1 ? crypto.randomUUID() : null;
        const transacoes = [];
        for (let i = 0; i < parcelas; i++) {
          const dataBase = new Date(args.data as string);
          dataBase.setMonth(dataBase.getMonth() + i);
          transacoes.push({ user_id: userId, descricao: parcelas > 1 ? `${args.descricao} (${i+1}/${parcelas})` : args.descricao, valor: valorParcela, tipo: 'despesa_cartao', categoria_id: args.categoria_id, cartao_id: args.cartao_id, data: dataBase.toISOString().split('T')[0], observacoes: args.observacoes || null, status: 'confirmado', parcela_atual: parcelas > 1 ? i + 1 : null, total_parcelas: parcelas > 1 ? parcelas : null, grupo_parcelamento: grupoParcelamento });
        }
        const { data, error } = await supabase.from('app_transacoes').insert(transacoes).select();
        if (error) throw error;
        return { success: true, data: { criadas: data?.length || 0, transacoes: data } };
      }

      case 'update_transaction': {
        const { id, ...updates } = args;
        const { data, error } = await supabase.from('app_transacoes').update(updates).eq('id', id).eq('user_id', userId).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'delete_transaction': {
        const { error } = await supabase.from('app_transacoes').delete().eq('id', args.id).eq('user_id', userId);
        if (error) throw error;
        return { success: true, data: { deleted: true, id: args.id } };
      }

      case 'pagar_fatura': {
        const { data: fatura, error: faturaError } = await supabase.from('app_fatura').select('id, cartao_id, valor_total, mes, ano').eq('id', args.fatura_id).single();
        if (faturaError) throw faturaError;
        const dataPagamento = args.data_pagamento || new Date().toISOString().split('T')[0];
        const { error: updateError } = await supabase.from('app_fatura').update({ status: 'paga', data_pagamento: dataPagamento }).eq('id', args.fatura_id);
        if (updateError) throw updateError;
        const { error: transError } = await supabase.from('app_transacoes').insert({ user_id: userId, descricao: `Pagamento de fatura ${fatura.mes}/${fatura.ano}`, valor: fatura.valor_total, tipo: 'despesa', categoria_id: 22, conta_id: args.conta_id, data: dataPagamento, status: 'confirmado' });
        if (transError) throw transError;
        return { success: true, data: { pago: true, valor: fatura.valor_total } };
      }

      default:
        return { success: false, error: `Tool desconhecida: ${toolName}` };
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`Erro ao executar chat tool ${toolName}:`, error);
    return { success: false, error: errMsg };
  }
}
