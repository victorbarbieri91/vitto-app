/**
 * ExecutionAgent - Especialista em Execução de Operações Financeiras
 *
 * ⚡ O "Operador Financeiro" da equipe - foca exclusivamente em:
 * - Criação e edição de transações
 * - Organização e categorização automática
 * - Importação de dados de documentos
 * - Operações em lote (bulk operations)
 * - Sincronização e reconciliação
 */

import { aiActionExecutor } from '../../AIActionExecutor';
import { aiContextManager } from '../../AIContextManager';
import type { FinancialContext, ParsedCommand, OperationResult } from '../../../../types/ai';

export interface ExecutionTask {
  operations: Array<{
    type: 'create_transaction' | 'update_transaction' | 'delete_transaction' |
          'import_transactions' | 'categorize_transactions' | 'create_transfer' |
          'create_budget' | 'update_budget' | 'bulk_import';
    data: any;
    priority: 'high' | 'medium' | 'low';
    validation_required: boolean;
  }>;
  context: FinancialContext;
  previousResults?: Record<string, any>;
  batchMode?: boolean;
  autoConfirm?: boolean;
}

export interface ExecutionResult {
  success: boolean;
  operations_completed: number;
  operations_failed: number;
  results: Array<{
    operation_id: string;
    type: string;
    status: 'completed' | 'failed' | 'skipped';
    result?: any;
    error?: string;
    impact?: string;
  }>;
  summary: {
    transactions_created: number;
    transactions_updated: number;
    transactions_imported: number;
    total_amount_processed: number;
    categories_assigned: number;
  };
  recommendations: string[];
  next_actions: string[];
  metadata: {
    executionTimeMs: number;
    operationsPerSecond: number;
    errorRate: number;
    validationsPassed: number;
  };
}

export class ExecutionAgent {
  private executionHistory: ExecutionResult[] = [];
  private specializations = {
    transaction_creation: 0.98,    // Criação de transações
    bulk_operations: 0.95,        // Operações em lote
    data_import: 0.92,            // Importação de dados
    categorization: 0.90,         // Categorização automática
    reconciliation: 0.87          // Reconciliação de dados
  };

  private operationQueue: Array<any> = [];
  private maxBatchSize = 50;

  /**
   * Executa operações financeiras de forma otimizada
   */
  async executeOperations(task: ExecutionTask, userId: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    console.log('⚡ ExecutionAgent: Iniciando execução de operações...');

    try {
      // 1. Validar operações antes da execução
      const validatedOps = await this.validateOperations(task.operations, task.context);

      // 2. Otimizar ordem de execução
      const optimizedOps = this.optimizeExecutionOrder(validatedOps);

      // 3. Executar operações (em lote se possível)
      const results = await this.executeOptimizedOperations(optimizedOps, userId, task);

      // 4. Compilar resultados e estatísticas
      const executionResult = this.compileResults(results, startTime);

      // 5. Gerar recomendações pós-execução
      executionResult.recommendations = await this.generatePostExecutionRecommendations(
        executionResult,
        task.context
      );

      this.executionHistory.push(executionResult);
      console.log(`✅ ExecutionAgent: ${executionResult.operations_completed} operações completas em ${executionResult.metadata.executionTimeMs}ms`);

      return executionResult;

    } catch (error) {
      console.error('❌ ExecutionAgent: Erro na execução:', error);

      return {
        success: false,
        operations_completed: 0,
        operations_failed: task.operations.length,
        results: task.operations.map((op, index) => ({
          operation_id: `op_${index}`,
          type: op.type,
          status: 'failed' as const,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })),
        summary: {
          transactions_created: 0,
          transactions_updated: 0,
          transactions_imported: 0,
          total_amount_processed: 0,
          categories_assigned: 0
        },
        recommendations: ['Revisar dados de entrada e tentar novamente'],
        next_actions: ['Verificar conectividade com banco de dados'],
        metadata: {
          executionTimeMs: Date.now() - startTime,
          operationsPerSecond: 0,
          errorRate: 1,
          validationsPassed: 0
        }
      };
    }
  }

  /**
   * Valida operações antes da execução
   */
  private async validateOperations(operations: ExecutionTask['operations'], context: FinancialContext): Promise<ExecutionTask['operations']> {
    const validatedOps: ExecutionTask['operations'] = [];

    for (const operation of operations) {
      try {
        const validation = await this.validateSingleOperation(operation, context);
        if (validation.isValid) {
          validatedOps.push({
            ...operation,
            data: validation.sanitizedData || operation.data
          });
        } else {
          console.warn(`Operação ${operation.type} rejeitada:`, validation.errors);
        }
      } catch (error) {
        console.warn(`Erro na validação de ${operation.type}:`, error);
      }
    }

    return validatedOps;
  }

  /**
   * Valida uma operação específica
   */
  private async validateSingleOperation(operation: any, context: FinancialContext): Promise<{
    isValid: boolean;
    errors?: string[];
    sanitizedData?: any;
  }> {
    const errors: string[] = [];
    let sanitizedData = { ...operation.data };

    switch (operation.type) {
      case 'create_transaction':
        if (!sanitizedData.descricao) errors.push('Descrição é obrigatória');
        if (!sanitizedData.valor || isNaN(sanitizedData.valor)) errors.push('Valor deve ser um número válido');
        if (!sanitizedData.categoria_id) errors.push('Categoria é obrigatória');
        if (!sanitizedData.conta_id) errors.push('Conta é obrigatória');

        // Sanitizar dados
        if (sanitizedData.valor) {
          sanitizedData.valor = parseFloat(sanitizedData.valor);
        }
        if (!sanitizedData.data) {
          sanitizedData.data = new Date().toISOString().split('T')[0];
        }
        break;

      case 'import_transactions':
        if (!sanitizedData.transactions || !Array.isArray(sanitizedData.transactions)) {
          errors.push('Lista de transações é obrigatória');
        } else if (sanitizedData.transactions.length > this.maxBatchSize) {
          errors.push(`Máximo ${this.maxBatchSize} transações por lote`);
        }
        break;

      case 'create_transfer':
        if (!sanitizedData.conta_origem || !sanitizedData.conta_destino) {
          errors.push('Contas de origem e destino são obrigatórias');
        }
        if (sanitizedData.conta_origem === sanitizedData.conta_destino) {
          errors.push('Conta de origem deve ser diferente da conta de destino');
        }
        if (!sanitizedData.valor || sanitizedData.valor <= 0) {
          errors.push('Valor da transferência deve ser positivo');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      sanitizedData
    };
  }

  /**
   * Otimiza ordem de execução das operações
   */
  private optimizeExecutionOrder(operations: ExecutionTask['operations']): ExecutionTask['operations'] {
    // Ordenar por prioridade e tipo (operações de leitura primeiro, depois escritas)
    return operations.sort((a, b) => {
      // Prioridade
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Tipo de operação (leitura antes de escrita)
      const typeOrder = {
        'categorize_transactions': 1,
        'import_transactions': 2,
        'create_transaction': 3,
        'update_transaction': 4,
        'create_transfer': 5,
        'delete_transaction': 6
      };
      return typeOrder[a.type] - typeOrder[b.type];
    });
  }

  /**
   * Executa operações otimizadas
   */
  private async executeOptimizedOperations(
    operations: ExecutionTask['operations'],
    userId: string,
    task: ExecutionTask
  ): Promise<Array<any>> {
    const results: Array<any> = [];

    // Agrupar operações similares para execução em lote quando possível
    const groupedOps = this.groupOperationsForBatch(operations);

    for (const group of groupedOps) {
      if (group.length === 1) {
        // Execução individual
        const result = await this.executeSingleOperation(group[0], userId, task.context);
        results.push(result);
      } else {
        // Execução em lote
        const batchResults = await this.executeBatchOperations(group, userId, task.context);
        results.push(...batchResults);
      }
    }

    return results;
  }

  /**
   * Agrupa operações para execução em lote
   */
  private groupOperationsForBatch(operations: ExecutionTask['operations']): Array<ExecutionTask['operations']> {
    const groups: Array<ExecutionTask['operations']> = [];
    const currentBatch: ExecutionTask['operations'] = [];

    for (const operation of operations) {
      // Operações que podem ser executadas em lote
      if (operation.type === 'create_transaction' && currentBatch.length < this.maxBatchSize) {
        currentBatch.push(operation);
      } else {
        // Finalizar lote atual se não estiver vazio
        if (currentBatch.length > 0) {
          groups.push([...currentBatch]);
          currentBatch.length = 0;
        }
        // Adicionar operação individual
        groups.push([operation]);
      }
    }

    // Adicionar último lote se não estiver vazio
    if (currentBatch.length > 0) {
      groups.push(currentBatch);
    }

    return groups;
  }

  /**
   * Executa uma operação individual
   */
  private async executeSingleOperation(
    operation: any,
    userId: string,
    context: FinancialContext
  ): Promise<any> {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      let result: any;

      switch (operation.type) {
        case 'create_transaction':
          result = await this.createTransaction(operation.data, userId);
          break;

        case 'create_transfer':
          result = await this.createTransfer(operation.data, userId);
          break;

        case 'import_transactions':
          result = await this.importTransactions(operation.data.transactions, userId);
          break;

        case 'categorize_transactions':
          result = await this.categorizeTransactions(operation.data, userId);
          break;

        default:
          throw new Error(`Tipo de operação não suportado: ${operation.type}`);
      }

      return {
        operation_id: operationId,
        type: operation.type,
        status: 'completed',
        result,
        impact: this.calculateOperationImpact(operation, result)
      };

    } catch (error) {
      return {
        operation_id: operationId,
        type: operation.type,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Executa operações em lote
   */
  private async executeBatchOperations(
    operations: ExecutionTask['operations'],
    userId: string,
    context: FinancialContext
  ): Promise<Array<any>> {
    const results: Array<any> = [];

    // Por simplicidade, executar cada operação individualmente
    // Em uma implementação mais avançada, isso seria otimizado para SQL em lote
    for (const operation of operations) {
      const result = await this.executeSingleOperation(operation, userId, context);
      results.push(result);
    }

    return results;
  }

  /**
   * Cria uma transação individual
   */
  private async createTransaction(data: any, userId: string): Promise<any> {
    try {
      // Usar o AIActionExecutor existente
      const command: ParsedCommand = {
        intent: {
          tipo: 'criar_transacao',
          parametros: data,
          confianca: 1.0
        },
        entidades: {
          valor: data.valor,
          descricao: data.descricao,
          categoria: data.categoria_id,
          conta: data.conta_id,
          data: data.data
        }
      };

      const context = await aiContextManager.buildContext(userId);
      const result = await aiActionExecutor.executeCreateTransaction(command, context, userId);

      return result;
    } catch (error) {
      throw new Error(`Erro ao criar transação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Cria uma transferência entre contas
   */
  private async createTransfer(data: any, userId: string): Promise<any> {
    try {
      const command: ParsedCommand = {
        intent: {
          tipo: 'criar_transferencia',
          parametros: data,
          confianca: 1.0
        },
        entidades: {
          valor: data.valor,
          conta_origem: data.conta_origem,
          conta_destino: data.conta_destino,
          descricao: data.descricao || `Transferência de ${data.valor}`,
          data: data.data || new Date().toISOString().split('T')[0]
        }
      };

      const context = await aiContextManager.buildContext(userId);
      const result = await aiActionExecutor.executeCreateTransferencia(command, context, userId);

      return result;
    } catch (error) {
      throw new Error(`Erro ao criar transferência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Importa múltiplas transações
   */
  private async importTransactions(transactions: Array<any>, userId: string): Promise<any> {
    const results = {
      imported: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const transaction of transactions) {
      try {
        await this.createTransaction(transaction, userId);
        results.imported++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Erro na transação "${transaction.descricao}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return results;
  }

  /**
   * Categoriza transações automaticamente
   */
  private async categorizeTransactions(data: any, userId: string): Promise<any> {
    try {
      const command: ParsedCommand = {
        intent: {
          tipo: 'analisar_categoria',
          parametros: data,
          confianca: 1.0
        },
        entidades: {
          categoria_id: data.categoria_id,
          periodo: data.periodo
        }
      };

      const context = await aiContextManager.buildContext(userId);
      const result = await aiActionExecutor.executeAnalisarCategoria(command, context, userId);

      return result;
    } catch (error) {
      throw new Error(`Erro ao categorizar transações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Calcula impacto da operação
   */
  private calculateOperationImpact(operation: any, result: any): string {
    switch (operation.type) {
      case 'create_transaction':
        const valor = operation.data.valor;
        const tipo = valor >= 0 ? 'receita' : 'despesa';
        return `${tipo} de ${this.formatCurrency(Math.abs(valor))} adicionada`;

      case 'create_transfer':
        return `Transferência de ${this.formatCurrency(operation.data.valor)} realizada`;

      case 'import_transactions':
        return `${result.imported || 0} transações importadas`;

      default:
        return 'Operação executada com sucesso';
    }
  }

  /**
   * Compila resultados finais
   */
  private compileResults(results: Array<any>, startTime: number): ExecutionResult {
    const completed = results.filter(r => r.status === 'completed').length;
    const failed = results.filter(r => r.status === 'failed').length;

    // Calcular estatísticas de resumo
    const summary = {
      transactions_created: 0,
      transactions_updated: 0,
      transactions_imported: 0,
      total_amount_processed: 0,
      categories_assigned: 0
    };

    let validationsPassed = 0;

    results.forEach(result => {
      if (result.status === 'completed') {
        validationsPassed++;

        switch (result.type) {
          case 'create_transaction':
            summary.transactions_created++;
            if (result.result?.data?.valor) {
              summary.total_amount_processed += Math.abs(result.result.data.valor);
            }
            break;

          case 'import_transactions':
            if (result.result?.imported) {
              summary.transactions_imported += result.result.imported;
            }
            break;

          case 'categorize_transactions':
            summary.categories_assigned++;
            break;
        }
      }
    });

    const executionTime = Date.now() - startTime;

    return {
      success: failed === 0,
      operations_completed: completed,
      operations_failed: failed,
      results,
      summary,
      recommendations: [], // Será preenchido depois
      next_actions: this.generateNextActions(results),
      metadata: {
        executionTimeMs: executionTime,
        operationsPerSecond: executionTime > 0 ? (completed / executionTime) * 1000 : 0,
        errorRate: results.length > 0 ? failed / results.length : 0,
        validationsPassed
      }
    };
  }

  /**
   * Gera recomendações pós-execução
   */
  private async generatePostExecutionRecommendations(
    result: ExecutionResult,
    context: FinancialContext
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (result.operations_failed > 0) {
      recommendations.push(`${result.operations_failed} operações falharam - revisar dados de entrada`);
    }

    if (result.summary.transactions_created > 10) {
      recommendations.push('Muitas transações criadas - considerar revisar categorização');
    }

    if (result.summary.total_amount_processed > 10000) {
      recommendations.push('Alto volume financeiro processado - verificar se todos os valores estão corretos');
    }

    if (result.metadata.errorRate > 0.1) {
      recommendations.push('Taxa de erro elevada - verificar qualidade dos dados de entrada');
    }

    return recommendations;
  }

  /**
   * Gera próximas ações sugeridas
   */
  private generateNextActions(results: Array<any>): string[] {
    const actions: string[] = [];

    const hasTransactions = results.some(r => r.type === 'create_transaction' && r.status === 'completed');
    if (hasTransactions) {
      actions.push('Revisar transações criadas no dashboard');
    }

    const hasImports = results.some(r => r.type === 'import_transactions' && r.status === 'completed');
    if (hasImports) {
      actions.push('Verificar categorização das transações importadas');
    }

    const hasErrors = results.some(r => r.status === 'failed');
    if (hasErrors) {
      actions.push('Corrigir erros e tentar operações falhadas novamente');
    }

    return actions;
  }

  /**
   * Formata valores monetários
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Obtém capacidades do agente
   */
  getCapabilities(): {
    canProcessDocuments: boolean;
    canAnalyzeData: boolean;
    canExecuteOperations: boolean;
    canValidateResults: boolean;
    canCommunicate: boolean;
    isAvailable: boolean;
    currentLoad: number;
  } {
    return {
      canProcessDocuments: false,  // ❌ Não é responsabilidade
      canAnalyzeData: false,       // ❌ Não é responsabilidade
      canExecuteOperations: true,  // ✅ Especialidade principal
      canValidateResults: false,   // ❌ Não é responsabilidade
      canCommunicate: false,       // ❌ Não é responsabilidade
      isAvailable: this.operationQueue.length < this.maxBatchSize,
      currentLoad: Math.min((this.operationQueue.length / this.maxBatchSize) * 100, 100)
    };
  }

  /**
   * Obtém estatísticas do agente
   */
  getStats(): {
    totalOperationsExecuted: number;
    averageExecutionTime: number;
    successRate: number;
    operationsPerSecond: number;
    specializations: Record<string, number>;
  } {
    const totalOps = this.executionHistory.reduce((sum, h) => sum + h.operations_completed + h.operations_failed, 0);
    const successfulOps = this.executionHistory.reduce((sum, h) => sum + h.operations_completed, 0);

    return {
      totalOperationsExecuted: totalOps,
      averageExecutionTime: this.executionHistory.length > 0
        ? this.executionHistory.reduce((sum, h) => sum + h.metadata.executionTimeMs, 0) / this.executionHistory.length
        : 0,
      successRate: totalOps > 0 ? successfulOps / totalOps : 1,
      operationsPerSecond: this.executionHistory.length > 0
        ? this.executionHistory.reduce((sum, h) => sum + h.metadata.operationsPerSecond, 0) / this.executionHistory.length
        : 0,
      specializations: this.specializations
    };
  }
}