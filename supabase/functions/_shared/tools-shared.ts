// =====================================================
// TOOL DEFINITIONS COMPARTILHADAS (usadas por ambos os modos)
// =====================================================

import type { Tool } from './types.ts';

export const SHARED_TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'query_categorias',
      description: 'Lista categorias disponiveis para receitas ou despesas.',
      parameters: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['receita', 'despesa', 'todos'] }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_contas',
      description: 'Lista todas as contas bancarias do usuario com saldos.',
      parameters: {
        type: 'object',
        properties: {
          apenas_ativas: { type: 'boolean' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_cartoes',
      description: 'Lista cartoes de credito com limites, fatura atual aberta e total de despesas do mes.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_memory',
      description: 'Salva uma informacao importante sobre o usuario para lembrar no futuro.',
      parameters: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['preferencia', 'objetivo', 'padrao', 'insight', 'lembrete'] },
          conteudo: { type: 'string', description: 'O que deve ser lembrado' }
        },
        required: ['tipo', 'conteudo']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_user_profile',
      description: 'Atualiza informacoes permanentes do usuario (preferencias, objetivos, perfil financeiro). Use para dados que devem persistir entre conversas. Diferente de save_memory (temporario), este eh o perfil permanente.',
      parameters: {
        type: 'object',
        properties: {
          field: { type: 'string', description: 'Campo a atualizar (ex: objetivo_principal, perfil_investidor, preferencia_notificacao, salario_liquido, dia_pagamento, etc)' },
          value: { description: 'Valor do campo (string, numero ou objeto)' },
          action: { type: 'string', enum: ['set', 'delete'], description: 'set para definir/atualizar, delete para remover (default: set)' }
        },
        required: ['field', 'value']
      }
    }
  }
];
