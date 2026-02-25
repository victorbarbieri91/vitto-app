// =====================================================
// CONFIRMACAO DE ACOES (modo normal)
// =====================================================

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { executeChatTool } from './tool-executor.ts';

export function generateActionPreview(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case 'create_transaction': {
      const dataFormatada = args.data ? new Date(args.data as string + 'T12:00:00').toLocaleDateString('pt-BR') : '';
      return `Vou criar uma ${args.tipo === 'receita' ? 'receita' : 'despesa'} de **R$ ${Number(args.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**:\n\n\ud83d\udcdd **Descrição:** ${args.descricao}\n\ud83d\udcc5 **Data:** ${dataFormatada}\n\nConfirma esta operação?`;
    }
    case 'create_transaction_cartao': {
      const parcelas = Number(args.parcelas) || 1;
      const dataFormatadaCartao = args.data ? new Date(args.data as string + 'T12:00:00').toLocaleDateString('pt-BR') : '';
      return `Vou criar uma despesa no cartão de **R$ ${Number(args.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**${parcelas > 1 ? ` em **${parcelas}x**` : ''}:\n\n\ud83d\udcb3 **Descrição:** ${args.descricao}\n\ud83d\udcc5 **Data:** ${dataFormatadaCartao}\n\nConfirma esta operação?`;
    }
    case 'update_transaction':
      return `Vou atualizar a transação #${args.id}:\n\n${Object.entries(args).filter(([key]) => key !== 'id').map(([key, value]) => `**${key}:** ${value}`).join('\n')}\n\nConfirma?`;
    case 'delete_transaction':
      return `\u26a0\ufe0f Vou remover a transação #${args.id}.\n\n**Esta ação não pode ser desfeita.**\n\nConfirma a exclusão?`;
    case 'pagar_fatura':
      return `Vou marcar a fatura como paga e debitar da conta selecionada.\n\nConfirma o pagamento?`;
    default:
      return `Confirma a execução de ${toolName}?`;
  }
}

export function generateSuccessMessage(actionType: string, args: Record<string, unknown>): string {
  switch (actionType) {
    case 'create_transaction':
      return `\u2705 Pronto! ${args.tipo === 'receita' ? 'Receita' : 'Despesa'} de **R$ ${Number(args.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** registrada com sucesso!`;
    case 'create_transaction_cartao':
      return `\u2705 Pronto! Despesa no cartão de **R$ ${Number(args.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** registrada com sucesso!`;
    case 'update_transaction':
      return '\u2705 Transação atualizada com sucesso!';
    case 'delete_transaction':
      return '\u2705 Transação removida com sucesso!';
    case 'pagar_fatura':
      return '\u2705 Fatura paga com sucesso!';
    default:
      return '\u2705 Operação realizada com sucesso!';
  }
}

export async function processConfirmedAction(
  supabase: SupabaseClient,
  actionId: string,
  confirmed: boolean,
  userId: string,
): Promise<{ type: string; message?: string; error?: string }> {
  const { data: action, error } = await supabase
    .from('app_pending_actions').select('*')
    .eq('id', actionId).eq('user_id', userId).eq('status', 'pending').single();

  if (error || !action) {
    return { type: 'error', error: 'Ação não encontrada ou já processada.' };
  }

  if (new Date(action.expires_at) < new Date()) {
    await supabase.from('app_pending_actions').update({ status: 'expired' }).eq('id', actionId);
    return { type: 'error', error: 'Esta ação expirou. Por favor, solicite novamente.' };
  }

  if (!confirmed) {
    await supabase.from('app_pending_actions').update({ status: 'rejected' }).eq('id', actionId);
    return { type: 'complete', message: 'Operação cancelada. Como posso ajudar?' };
  }

  const result = await executeChatTool(supabase, userId, action.action_type, action.action_data);
  await supabase.from('app_pending_actions').update({ status: 'confirmed' }).eq('id', actionId);

  if (result.success) {
    return { type: 'complete', message: generateSuccessMessage(action.action_type, action.action_data) };
  }
  return { type: 'error', error: result.error || 'Erro ao executar a operação.' };
}
