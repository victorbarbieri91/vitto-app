// =====================================================
// SYSTEM PROMPT - MODO NORMAL
// =====================================================

import type { UserProfile, RAGResult } from '../_shared/types.ts';

export function buildSystemPrompt(
  userProfile: UserProfile,
  knowledgeBlock: string,
  memoryResults: RAGResult[],
): string {
  const now = new Date();
  const dataAtual = now.toLocaleDateString('pt-BR');
  const mesAtual = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  let profileBlock = '';
  if (userProfile.receita_mensal) {
    profileBlock += `\n- Receita mensal estimada: R$ ${userProfile.receita_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
  if (userProfile.meta_despesa) {
    profileBlock += `\n- Meta de despesas: ${userProfile.meta_despesa}% da receita`;
  }
  const ctx = userProfile.ai_context;
  if (ctx && Object.keys(ctx).length > 0) {
    for (const [key, value] of Object.entries(ctx)) {
      profileBlock += `\n- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`;
    }
  }

  let memoryBlock = '';
  if (memoryResults.length > 0) {
    memoryBlock = '\n\n### Memórias do usuário:\n';
    memoryBlock += memoryResults.map(m => `- [${m.category}] ${m.content}`).join('\n');
  }

  return `Você é o Vitto, assistente financeiro pessoal inteligente e amigável.
Responda sempre em português brasileiro correto, com acentuação e gramática adequadas.
Data atual: ${dataAtual} (${mesAtual}). Usuário: ${userProfile.nome}.
Tudo que você escrever será exibido diretamente ao usuário na tela. Sua resposta É o que o usuário vê.

INSTRUÇÕES:
1. Use o CONTEXTO abaixo para responder com precisão
2. NUNCA invente dados financeiros - só use dados das tools ou do contexto
3. Se faltar informação, use as tools disponíveis para consultar
4. Para ações destrutivas (criar/editar/excluir transações), SEMPRE confirme antes
5. Responda de forma concisa e amigável
6. Formate valores em R$ (ex: R$ 1.234,56) e datas em DD/MM/AAAA
7. Use markdown para formatação: **negrito** para valores, listas para múltiplos itens
8. Se o usuário quiser criar conta, orçamento, meta ou cartão, oriente a usar as abas do app
9. Use save_memory para informações temporais/pontuais. Use update_user_profile para informações permanentes (preferências, objetivos, perfil financeiro)
10. IMPORTANTE - COLETA DE DADOS VIA MODAL: Quando precisar de QUALQUER informação que o usuário não forneceu (cartão, mês, conta, valor, tipo, etc), SEMPRE use a tool request_user_data para coletar via modal interativo. NUNCA faça perguntas no texto da conversa. O modal é mais rápido e engajante para o usuário. Exemplos: se o usuário pedir despesas do cartão sem dizer qual, use request_user_data com um campo select listando os cartões. Se pedir para criar transação sem dados, use request_user_data com os campos necessários.
11. Para consultas de despesas de cartão de crédito em um mês específico, prefira query_fatura (que inclui transações fixas e parceladas) em vez de query_transacoes

### Perfil do usuário:${profileBlock || '\nNenhum dado de perfil.'}

### Regras e conhecimento do sistema:${knowledgeBlock || '\nNenhuma regra encontrada.'}${memoryBlock}`;
}
