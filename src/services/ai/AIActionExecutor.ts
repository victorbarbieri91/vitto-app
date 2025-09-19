import {
  ParsedCommand,
  OperationResult,
  FinancialContext,
  AIError,
  ContextChange
} from '../../types/ai';
import { transactionService } from '../api/TransactionService';
import { accountService } from '../api/AccountService';
import { categoryService } from '../api/CategoryService';
import { goalService } from '../api/GoalService';
import { budgetService } from '../api/BudgetService';
import { aiContextManager } from './AIContextManager';
import { supabase } from '../supabase/client';

/**
 * AIActionExecutor
 * 
 * Responsável por executar operações financeiras interpretadas pela IA.
 * Valida permissões, executa CRUD e pode fazer rollback de operações.
 */
export class AIActionExecutor {
  private static instance: AIActionExecutor;
  private operationHistory: Map<string, any> = new Map();

  static getInstance(): AIActionExecutor {
    if (!AIActionExecutor.instance) {
      AIActionExecutor.instance = new AIActionExecutor();
    }
    return AIActionExecutor.instance;
  }

  /**
   * Executa uma operação financeira baseada no comando interpretado
   */
  async executeFinancialOperation(
    command: ParsedCommand,
    context: FinancialContext,
    userId: string
  ): Promise<OperationResult> {
    console.log('⚡ AIActionExecutor: Executando operação:', command.intent.tipo);

    try {
      // Validar permissões
      const hasPermission = await this.validatePermissions(userId, command);
      if (!hasPermission) {
        return {
          type: 'error',
          message: 'Você não tem permissão para esta operação',
          suggestions: ['Verifique suas credenciais e tente novamente']
        };
      }

      // Executar baseado no tipo de intenção
      let result: OperationResult;

      switch (command.intent.tipo) {
        case 'criar_receita':
          result = await this.executeCreateReceita(command, context, userId);
          break;

        case 'criar_despesa':
          result = await this.executeCreateDespesa(command, context, userId);
          break;

        case 'criar_transferencia':
          result = await this.executeCreateTransferencia(command, context, userId);
          break;

        case 'criar_parcelado':
          result = await this.executeCreateParcelado(command, context, userId);
          break;

        case 'criar_meta':
          result = await this.executeCreateMeta(command, context, userId);
          break;

        case 'criar_orcamento':
          result = await this.executeCreateOrcamento(command, context, userId);
          break;

        case 'consultar_saldo':
          result = await this.executeConsultarSaldo(command, context, userId);
          break;

        case 'consultar_gastos':
          result = await this.executeConsultarGastos(command, context, userId);
          break;

        case 'analisar_categoria':
          result = await this.executeAnalisarCategoria(command, context, userId);
          break;

        default:
          result = {
            type: 'error',
            message: `Operação '${command.intent.tipo}' ainda não implementada`,
            suggestions: ['Tente um comando mais simples por enquanto']
          };
      }

      // Logar operação para auditoria
      await this.logOperation(userId, command, result);

      // Atualizar contexto se operação foi bem-sucedida
      if (result.type === 'operation_success') {
        await this.updateContextAfterOperation(userId, command, result);
      }

      console.log('✅ Operação executada:', result.type);
      return result;

    } catch (error) {
      console.error('❌ Erro ao executar operação:', error);
      
      return {
        type: 'error',
        message: 'Erro interno ao executar operação',
        suggestions: ['Tente novamente ou reformule o comando']
      };
    }
  }

  /**
   * Valida se o usuário tem permissão para executar a operação
   */
  async validatePermissions(userId: string, command: ParsedCommand): Promise<boolean> {
    try {
      // Verificar se usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        return false;
      }

      // Validações específicas por tipo de operação
      switch (command.intent.tipo) {
        case 'criar_receita':
        case 'criar_despesa':
        case 'criar_transferencia':
        case 'criar_parcelado':
          // Verificar se tem contas cadastradas
          const accounts = await accountService.list();
          return accounts.length > 0;

        case 'criar_meta':
        case 'criar_orcamento':
          // Qualquer usuário pode criar metas e orçamentos
          return true;

        case 'consultar_saldo':
        case 'consultar_gastos':
        case 'analisar_categoria':
          // Consultas são sempre permitidas
          return true;

        default:
          return true;
      }

    } catch (error) {
      console.error('Erro ao validar permissões:', error);
      return false;
    }
  }

  /**
   * Executa rollback de uma operação
   */
  async rollbackOperation(operationId: string): Promise<void> {
    console.log('🔄 Executando rollback da operação:', operationId);

    try {
      const operation = this.operationHistory.get(operationId);
      if (!operation) {
        throw new Error('Operação não encontrada para rollback');
      }

      // Rollback baseado no tipo de operação
      switch (operation.type) {
        case 'transaction_created':
          await transactionService.delete(operation.data.id);
          break;

        case 'goal_created':
          await goalService.delete(operation.data.id);
          break;

        case 'budget_created':
          await budgetService.delete(operation.data.id);
          break;

        default:
          console.warn('Tipo de operação não suporta rollback:', operation.type);
      }

      // Remover do histórico
      this.operationHistory.delete(operationId);
      console.log('✅ Rollback executado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao executar rollback:', error);
      throw error;
    }
  }

  // Métodos de execução específicos

  private async executeCreateReceita(
    command: ParsedCommand,
    context: FinancialContext,
    userId: string
  ): Promise<OperationResult> {
    try {
      const { valor, categoria, conta, data, descricao } = command.entities;

      if (!valor) {
        return {
          type: 'clarification_needed',
          message: 'Preciso saber o valor da receita',
          suggestions: ['Ex: "recebi 2000 reais de salário"']
        };
      }

      // Buscar ou criar categoria
      const categoryId = categoria?.id || await this.getDefaultCategory('receita', context);
      const accountId = conta?.id || await this.getDefaultAccount(context);

      if (!accountId) {
        return {
          type: 'error',
          message: 'Nenhuma conta encontrada. Cadastre uma conta primeiro.',
          suggestions: ['Acesse a página de contas para cadastrar uma nova conta']
        };
      }

      // Criar receita
      const transaction = await transactionService.create({
        descricao: descricao || 'Receita via IA',
        valor,
        tipo: 'receita',
        categoria_id: categoryId,
        conta_id: accountId,
        data: data || new Date(),
        user_id: userId
      });

      // Salvar no histórico para possível rollback
      const operationId = this.generateOperationId();
      this.operationHistory.set(operationId, {
        type: 'transaction_created',
        data: transaction
      });

      return {
        type: 'operation_success',
        message: `✅ Receita de ${this.formatCurrency(valor)} criada com sucesso!`,
        impact: `Seu saldo foi atualizado. Novo saldo previsto será recalculado.`,
        data: transaction
      };

    } catch (error) {
      console.error('Erro ao criar receita:', error);
      return {
        type: 'error',
        message: 'Erro ao criar receita',
        suggestions: ['Verifique os dados e tente novamente']
      };
    }
  }

  private async executeCreateDespesa(
    command: ParsedCommand,
    context: FinancialContext,
    userId: string
  ): Promise<OperationResult> {
    try {
      const { valor, categoria, conta, data, descricao } = command.entities;

      if (!valor) {
        return {
          type: 'clarification_needed',
          message: 'Preciso saber o valor da despesa',
          suggestions: ['Ex: "gastei 80 reais no supermercado"']
        };
      }

      // Verificar saldo suficiente
      const accountId = conta?.id || await this.getDefaultAccount(context);
      if (accountId) {
        const account = context.patrimonio.contas.find(a => a.id === accountId);
        if (account && account.saldo_atual < valor) {
          return {
            type: 'clarification_needed',
            message: `Saldo insuficiente na conta ${account.nome}. Saldo atual: ${this.formatCurrency(account.saldo_atual)}`,
            suggestions: [
              'Usar outra conta?',
              `Registrar valor menor? Ex: ${this.formatCurrency(account.saldo_atual)}`,
              'Registrar mesmo assim? (pode ficar negativo)'
            ]
          };
        }
      }

      // Buscar ou criar categoria
      const categoryId = categoria?.id || await this.getDefaultCategory('despesa', context);

      if (!accountId) {
        return {
          type: 'error',
          message: 'Nenhuma conta encontrada. Cadastre uma conta primeiro.',
          suggestions: ['Acesse a página de contas para cadastrar uma nova conta']
        };
      }

      // Criar despesa
      const transaction = await transactionService.create({
        descricao: descricao || 'Despesa via IA',
        valor,
        tipo: 'despesa',
        categoria_id: categoryId,
        conta_id: accountId,
        data: data || new Date(),
        user_id: userId
      });

      // Salvar no histórico
      const operationId = this.generateOperationId();
      this.operationHistory.set(operationId, {
        type: 'transaction_created',
        data: transaction
      });

      return {
        type: 'operation_success',
        message: `✅ Despesa de ${this.formatCurrency(valor)} registrada!`,
        impact: `Saldo reduzido. ${categoria?.nome ? `Categoria: ${categoria.nome}` : ''}`,
        data: transaction
      };

    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      return {
        type: 'error',
        message: 'Erro ao registrar despesa',
        suggestions: ['Verifique os dados e tente novamente']
      };
    }
  }

  private async executeCreateTransferencia(
    command: ParsedCommand,
    context: FinancialContext,
    userId: string
  ): Promise<OperationResult> {
    // TODO: Implementar transferências via IA
    return {
      type: 'error',
      message: 'Transferências via IA ainda estão em desenvolvimento',
      suggestions: ['Use a interface de transferências por enquanto']
    };
  }

  private async executeCreateParcelado(
    command: ParsedCommand,
    context: FinancialContext,
    userId: string
  ): Promise<OperationResult> {
    try {
      const { valor, parcelas, categoria, conta, descricao } = command.entities;

      if (!valor || !parcelas) {
        return {
          type: 'clarification_needed',
          message: 'Preciso do valor total e número de parcelas',
          suggestions: ['Ex: "comprei celular de 1200 em 6 vezes"']
        };
      }

      const valorParcela = valor / parcelas;
      const accountId = conta?.id || await this.getDefaultAccount(context);
      const categoryId = categoria?.id || await this.getDefaultCategory('despesa', context);

      // Criar transação parcelada
      const result = await transactionService.createInstallmentTransaction({
        descricao: descricao || 'Compra parcelada via IA',
        valor_total: valor,
        categoria_id: categoryId,
        conta_id: accountId || 0,
        total_parcelas: parcelas,
        data_inicio: new Date(),
        user_id: userId
      });

      return {
        type: 'operation_success',
        message: `✅ Compra parcelada criada: ${parcelas}x de ${this.formatCurrency(valorParcela)}`,
        impact: `Total: ${this.formatCurrency(valor)}. Primeira parcela debitada hoje.`,
        data: result
      };

    } catch (error) {
      console.error('Erro ao criar parcelado:', error);
      return {
        type: 'error',
        message: 'Erro ao criar compra parcelada',
        suggestions: ['Verifique os dados e tente novamente']
      };
    }
  }

  private async executeCreateMeta(
    command: ParsedCommand,
    context: FinancialContext,
    userId: string
  ): Promise<OperationResult> {
    try {
      const { valor, descricao } = command.entities;

      if (!valor) {
        return {
          type: 'clarification_needed',
          message: 'Preciso saber o valor da meta',
          suggestions: ['Ex: "meta de 5000 para viagem"']
        };
      }

      // Criar meta
      const goal = await goalService.create({
        titulo: descricao || 'Meta criada via IA',
        valor_meta: valor,
        valor_atual: 0,
        data_inicio: new Date(),
        data_fim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        categoria: 'geral',
        cor: '#F87060',
        user_id: userId
      });

      return {
        type: 'operation_success',
        message: `✅ Meta de ${this.formatCurrency(valor)} criada!`,
        impact: 'Meta ativa. Comece a poupar para atingi-la!',
        data: goal
      };

    } catch (error) {
      console.error('Erro ao criar meta:', error);
      return {
        type: 'error',
        message: 'Erro ao criar meta',
        suggestions: ['Verifique os dados e tente novamente']
      };
    }
  }

  private async executeCreateOrcamento(
    command: ParsedCommand,
    context: FinancialContext,
    userId: string
  ): Promise<OperationResult> {
    try {
      const { valor, categoria } = command.entities;

      if (!valor || !categoria) {
        return {
          type: 'clarification_needed',
          message: 'Preciso do valor e categoria do orçamento',
          suggestions: ['Ex: "orçamento de 400 para alimentação"']
        };
      }

      // Criar orçamento
      const budget = await budgetService.create({
        categoria_id: categoria.id,
        valor_limite: valor,
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        user_id: userId
      });

      return {
        type: 'operation_success',
        message: `✅ Orçamento de ${this.formatCurrency(valor)} criado para ${categoria.nome}!`,
        impact: 'Orçamento ativo. Monitore seus gastos nesta categoria.',
        data: budget
      };

    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      return {
        type: 'error',
        message: 'Erro ao criar orçamento',
        suggestions: ['Verifique os dados e tente novamente']
      };
    }
  }

  private async executeConsultarSaldo(
    command: ParsedCommand,
    context: FinancialContext,
    userId: string
  ): Promise<OperationResult> {
    try {
      const { patrimonio } = context;
      
      let message = `💰 **Seu Saldo Total**: ${this.formatCurrency(patrimonio.saldo_total)}\n`;
      
      if (patrimonio.saldo_previsto !== patrimonio.saldo_total) {
        message += `📊 **Saldo Previsto**: ${this.formatCurrency(patrimonio.saldo_previsto)}\n`;
      }

      message += '\n**Por Conta:**\n';
      for (const conta of patrimonio.contas) {
        message += `• ${conta.nome}: ${this.formatCurrency(conta.saldo_atual)}\n`;
      }

      return {
        type: 'operation_success',
        message,
        impact: 'Dados atualizados em tempo real'
      };

    } catch (error) {
      console.error('Erro ao consultar saldo:', error);
      return {
        type: 'error',
        message: 'Erro ao consultar saldo',
        suggestions: ['Tente novamente']
      };
    }
  }

  private async executeConsultarGastos(
    command: ParsedCommand,
    context: FinancialContext,
    userId: string
  ): Promise<OperationResult> {
    try {
      const { indicadores } = context;
      
      let message = `📊 **Resumo do Mês**\n`;
      message += `💸 Despesas: ${this.formatCurrency(indicadores.mes_atual.despesas_mes)}\n`;
      message += `💰 Receitas: ${this.formatCurrency(indicadores.mes_atual.receitas_mes)}\n`;
      message += `📈 Saldo Líquido: ${this.formatCurrency(indicadores.mes_atual.fluxo_liquido)}\n`;

      // TODO: Adicionar detalhes por categoria quando implementarmos

      return {
        type: 'operation_success',
        message,
        impact: 'Análise baseada nos dados deste mês'
      };

    } catch (error) {
      console.error('Erro ao consultar gastos:', error);
      return {
        type: 'error',
        message: 'Erro ao consultar gastos',
        suggestions: ['Tente novamente']
      };
    }
  }

  private async executeAnalisarCategoria(
    command: ParsedCommand,
    context: FinancialContext,
    userId: string
  ): Promise<OperationResult> {
    // TODO: Implementar análise detalhada por categoria
    return {
      type: 'operation_success',
      message: 'Análise de categorias ainda está em desenvolvimento',
      suggestions: ['Em breve teremos análises detalhadas por categoria']
    };
  }

  // Métodos auxiliares

  private async getDefaultCategory(tipo: 'receita' | 'despesa', context: FinancialContext): Promise<number> {
    // Retornar categoria padrão baseada no tipo
    const defaultCategories = context.usuario.preferencias.default_categories;
    
    if (defaultCategories[tipo]) {
      return defaultCategories[tipo];
    }

    // Buscar primeira categoria do tipo
    const categories = await categoryService.list();
    const found = categories.find(cat => cat.tipo === tipo);
    
    return found?.id || 1; // Fallback para ID 1
  }

  private async getDefaultAccount(context: FinancialContext): Promise<number | undefined> {
    const defaultId = context.usuario.preferencias.default_account_id;
    if (defaultId) return defaultId;

    // Primeira conta disponível
    return context.patrimonio.contas[0]?.id;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logOperation(userId: string, command: ParsedCommand, result: OperationResult) {
    try {
      await supabase
        .from('app_ai_operation_log')
        .insert({
          user_id: userId,
          intent_type: command.intent.tipo,
          command_text: command.original_text,
          operation_success: result.type === 'operation_success',
          result_message: result.message,
          timestamp: new Date()
        });
    } catch (error) {
      console.warn('Não foi possível logar operação:', error);
    }
  }

  private async updateContextAfterOperation(userId: string, command: ParsedCommand, result: OperationResult) {
    try {
      const changes: ContextChange[] = [];

      // Mapear mudanças baseadas no tipo de operação
      switch (command.intent.tipo) {
        case 'criar_receita':
        case 'criar_despesa':
        case 'criar_parcelado':
          changes.push({
            type: 'transaction_created',
            data: result.data,
            timestamp: new Date()
          });
          break;

        case 'criar_meta':
          changes.push({
            type: 'goal_created',
            data: result.data,
            timestamp: new Date()
          });
          break;

        case 'criar_orcamento':
          changes.push({
            type: 'budget_updated',
            data: result.data,
            timestamp: new Date()
          });
          break;
      }

      if (changes.length > 0) {
        await aiContextManager.updateContext(userId, changes);
      }

    } catch (error) {
      console.warn('Erro ao atualizar contexto:', error);
    }
  }
}

// Instância única exportada
export const aiActionExecutor = AIActionExecutor.getInstance(); 