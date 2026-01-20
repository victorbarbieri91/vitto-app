/**
 * AgentCoordinator - Orquestrador Central do Sistema Multi-Agente
 *
 * Como o "CEO da empresa" - coordena todos os agentes especializados,
 * distribui tarefas, monitora progresso e consolida resultados.
 */

import { DocumentAgent } from './agents/DocumentAgent';
import { AnalysisAgent } from './agents/AnalysisAgent';
import { ExecutionAgent } from './agents/ExecutionAgent';
import { ValidationAgent } from './agents/ValidationAgent';
import { CommunicationAgent } from './agents/CommunicationAgent';
import { financialMemoryManager } from '../FinancialMemoryManager';
import { AgentConfigService } from '../../api/agentConfig';
import type { FinancialContext } from '../../../types/ai';

export interface AgentTask {
  id: string;
  type: 'document_processing' | 'data_analysis' | 'financial_operation' | 'validation' | 'communication';
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  dependencies?: string[]; // IDs de tasks que devem completar antes
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface WorkflowResult {
  success: boolean;
  results: Record<string, any>;
  totalTime: number;
  errors?: string[];
  insights?: string[];
  suggestions?: string[];
}

export interface AgentCapabilities {
  canProcessDocuments: boolean;
  canAnalyzeData: boolean;
  canExecuteOperations: boolean;
  canValidateResults: boolean;
  canCommunicate: boolean;
  isAvailable: boolean;
  currentLoad: number; // 0-100%
}

export class AgentCoordinator {
  private static instance: AgentCoordinator;

  // Agentes especializados
  private documentAgent: DocumentAgent;
  private analysisAgent: AnalysisAgent;
  private executionAgent: ExecutionAgent;
  private validationAgent: ValidationAgent;
  private communicationAgent: CommunicationAgent;

  // Estado do workflow
  private activeTasks: Map<string, AgentTask> = new Map();
  private taskQueue: AgentTask[] = [];
  private workflowHistory: WorkflowResult[] = [];

  // Configurações
  private maxConcurrentTasks = 5;
  private taskTimeout = 30000; // 30 segundos por task

  static getInstance(): AgentCoordinator {
    if (!AgentCoordinator.instance) {
      AgentCoordinator.instance = new AgentCoordinator();
    }
    return AgentCoordinator.instance;
  }

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents(): void {
    this.documentAgent = new DocumentAgent();
    this.analysisAgent = new AnalysisAgent();
    this.executionAgent = new ExecutionAgent();
    this.validationAgent = new ValidationAgent();
    this.communicationAgent = new CommunicationAgent();
  }

  /**
   * Processa uma requisição complexa coordenando múltiplos agentes
   */
  async processRequest(
    userMessage: string,
    userId: string,
    context: FinancialContext,
    attachedFile?: File,
    documentAnalysis?: string
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    console.log('🎯 AgentCoordinator: Iniciando processamento complexo...');

    try {
      // 1. Analisar a requisição e determinar workflow necessário
      const workflow = await this.planWorkflow(userMessage, attachedFile, documentAnalysis, context);
      console.log('📋 Workflow planejado:', workflow.map(t => `${t.type}(${t.priority})`));

      // 2. Executar tasks em paralelo quando possível
      const results = await this.executeWorkflow(workflow, userId, context);

      // 3. Consolidar resultados
      const finalResult = await this.consolidateResults(results, userMessage, userId);

      // 4. Salvar na memória RAG
      await this.saveWorkflowToMemory(userMessage, finalResult, userId, context);

      const totalTime = Date.now() - startTime;
      console.log(`✅ AgentCoordinator: Workflow completo em ${totalTime}ms`);

      return {
        success: true,
        results: finalResult,
        totalTime,
        insights: finalResult.insights || [],
        suggestions: finalResult.suggestions || []
      };

    } catch (error) {
      console.error('❌ AgentCoordinator: Erro no workflow:', error);

      return {
        success: false,
        results: {},
        totalTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido no workflow']
      };
    }
  }

  /**
   * Planeja o workflow baseado na requisição do usuário
   */
  private async planWorkflow(
    userMessage: string,
    attachedFile?: File,
    documentAnalysis?: string,
    context?: FinancialContext
  ): Promise<AgentTask[]> {
    const tasks: AgentTask[] = [];

    // Analisar o que o usuário está pedindo
    const messageAnalysis = this.analyzeUserIntent(userMessage);

    // Se há documento anexado, começar com processamento
    if (attachedFile || documentAnalysis) {
      tasks.push({
        id: 'doc_processing',
        type: 'document_processing',
        priority: 'high',
        data: { file: attachedFile, analysis: documentAnalysis },
        status: 'pending'
      });
    }

    // Análise de dados (pode rodar em paralelo com documentos)
    if (messageAnalysis.needsAnalysis) {
      tasks.push({
        id: 'data_analysis',
        type: 'data_analysis',
        priority: 'medium',
        data: { userMessage, context, focus: messageAnalysis.analysisType },
        status: 'pending'
      });
    }

    // Operações financeiras (depende de análise ou documentos)
    if (messageAnalysis.needsExecution) {
      tasks.push({
        id: 'financial_ops',
        type: 'financial_operation',
        priority: 'high',
        data: { operations: messageAnalysis.operations },
        dependencies: attachedFile ? ['doc_processing'] : [],
        status: 'pending'
      });
    }

    // Validação (sempre executar após operações)
    if (tasks.some(t => t.type === 'financial_operation')) {
      tasks.push({
        id: 'validation',
        type: 'validation',
        priority: 'critical',
        data: { validateOperations: true },
        dependencies: ['financial_ops'],
        status: 'pending'
      });
    }

    // Comunicação (sempre por último)
    tasks.push({
      id: 'communication',
      type: 'communication',
      priority: 'medium',
      data: { originalMessage: userMessage, responseType: messageAnalysis.responseType },
      dependencies: tasks.filter(t => t.id !== 'communication').map(t => t.id),
      status: 'pending'
    });

    return tasks;
  }

  /**
   * Executa workflow com paralelismo inteligente
   */
  private async executeWorkflow(
    tasks: AgentTask[],
    userId: string,
    context: FinancialContext
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const completedTasks = new Set<string>();

    while (completedTasks.size < tasks.length) {
      // Encontrar tasks que podem executar agora (sem dependências pendentes)
      const readyTasks = tasks.filter(task =>
        task.status === 'pending' &&
        (task.dependencies?.every(dep => completedTasks.has(dep)) ?? true)
      );

      if (readyTasks.length === 0) {
        throw new Error('Workflow travado - dependências circulares ou tasks falharam');
      }

      // Executar tasks prontas em paralelo
      const taskPromises = readyTasks.slice(0, this.maxConcurrentTasks).map(async (task) => {
        task.status = 'in_progress';
        task.startTime = Date.now();

        try {
          console.log(`🔄 Executando ${task.type} (${task.id})...`);
          const result = await this.executeTask(task, userId, context, results);

          task.status = 'completed';
          task.endTime = Date.now();
          task.result = result;
          results[task.id] = result;
          completedTasks.add(task.id);

          console.log(`✅ ${task.id} completo em ${task.endTime - task.startTime!}ms`);

          // Registrar métricas de sucesso
          await AgentConfigService.logAgentUsage(
            task.type.replace('_', ''),
            true,
            task.endTime - task.startTime!
          );

        } catch (error) {
          task.status = 'failed';
          task.error = error instanceof Error ? error.message : 'Erro desconhecido';
          console.error(`❌ ${task.id} falhou:`, error);

          // Registrar métricas de falha
          await AgentConfigService.logAgentUsage(
            task.type.replace('_', ''),
            false,
            Date.now() - task.startTime!
          );

          // Para tasks críticas, falhar todo o workflow
          if (task.priority === 'critical') {
            throw error;
          }
        }
      });

      await Promise.all(taskPromises);
    }

    return results;
  }

  /**
   * Executa uma task específica com o agente apropriado
   */
  private async executeTask(
    task: AgentTask,
    userId: string,
    context: FinancialContext,
    previousResults: Record<string, any>
  ): Promise<any> {
    switch (task.type) {
      case 'document_processing':
        return await this.documentAgent.processDocument(task.data, userId);

      case 'data_analysis':
        return await this.analysisAgent.analyzeData({
          ...task.data,
          previousResults,
          context
        }, userId);

      case 'financial_operation':
        return await this.executionAgent.executeOperations({
          ...task.data,
          previousResults,
          context
        }, userId);

      case 'validation':
        return await this.validationAgent.validateResults({
          ...task.data,
          previousResults,
          context
        }, userId);

      case 'communication':
        return await this.communicationAgent.generateResponse({
          ...task.data,
          previousResults,
          context
        }, userId);

      default:
        throw new Error(`Tipo de task não reconhecido: ${task.type}`);
    }
  }

  /**
   * Consolida resultados de todos os agentes
   */
  private async consolidateResults(
    results: Record<string, any>,
    originalMessage: string,
    userId: string
  ): Promise<any> {
    // O agente de comunicação já deve ter consolidado os resultados
    const communicationResult = results.communication;

    if (!communicationResult) {
      throw new Error('Agente de comunicação não produziu resultado');
    }

    // Adicionar metadados do workflow
    return {
      ...communicationResult,
      workflow_metadata: {
        tasks_executed: Object.keys(results),
        original_message: originalMessage,
        processing_summary: this.generateProcessingSummary(results)
      }
    };
  }

  /**
   * Salva resultado do workflow na memória RAG
   */
  private async saveWorkflowToMemory(
    userMessage: string,
    result: any,
    userId: string,
    context: FinancialContext
  ): Promise<void> {
    try {
      const workflowSummary = `Workflow multi-agente: ${userMessage}\n\nResultado: ${result.message}`;

      await financialMemoryManager.armazenarInteracao({
        userId,
        tipo: 'padrao',
        conteudo: workflowSummary,
        resumo: `Multi-agente processou: ${userMessage}`,
        metadata: {
          workflow_type: 'multi_agent',
          tasks_executed: result.workflow_metadata?.tasks_executed || [],
          success: true,
          processing_time: result.workflow_metadata?.total_time
        },
        contextoFinanceiro: {
          saldo_total: context.patrimonio?.saldo_total,
          operacoes_executadas: result.workflow_metadata?.operations_count || 0
        }
      });
    } catch (error) {
      console.warn('Não foi possível salvar workflow na memória RAG:', error);
    }
  }

  /**
   * Analisa intenção do usuário para planejar workflow
   */
  private analyzeUserIntent(message: string): {
    needsAnalysis: boolean;
    needsExecution: boolean;
    analysisType?: string;
    operations?: string[];
    responseType: string;
  } {
    const lowerMessage = message.toLowerCase();

    // Palavras-chave para análise
    const analysisKeywords = ['analise', 'compare', 'padrão', 'tendência', 'relatório', 'como está'];
    const executionKeywords = ['crie', 'registre', 'importe', 'organize', 'categorize', 'transferir'];

    const needsAnalysis = analysisKeywords.some(keyword => lowerMessage.includes(keyword));
    const needsExecution = executionKeywords.some(keyword => lowerMessage.includes(keyword));

    let analysisType = 'general';
    if (lowerMessage.includes('gasto') || lowerMessage.includes('despesa')) {
      analysisType = 'expenses';
    } else if (lowerMessage.includes('receita') || lowerMessage.includes('entrada')) {
      analysisType = 'income';
    } else if (lowerMessage.includes('saldo') || lowerMessage.includes('conta')) {
      analysisType = 'balances';
    }

    const operations: string[] = [];
    if (lowerMessage.includes('transação') || lowerMessage.includes('lançamento')) {
      operations.push('create_transaction');
    }
    if (lowerMessage.includes('categorize') || lowerMessage.includes('categoria')) {
      operations.push('categorize_transactions');
    }

    return {
      needsAnalysis,
      needsExecution,
      analysisType,
      operations,
      responseType: needsExecution ? 'action_result' : 'analysis_report'
    };
  }

  /**
   * Gera resumo do processamento
   */
  private generateProcessingSummary(results: Record<string, any>): string {
    const summaryParts: string[] = [];

    if (results.doc_processing) {
      summaryParts.push('Documento processado');
    }
    if (results.data_analysis) {
      summaryParts.push('Dados analisados');
    }
    if (results.financial_ops) {
      summaryParts.push('Operações executadas');
    }
    if (results.validation) {
      summaryParts.push('Resultados validados');
    }

    return summaryParts.join(', ');
  }

  /**
   * Obtém status de todos os agentes
   */
  getAgentsStatus(): Record<string, AgentCapabilities> {
    return {
      document: this.documentAgent.getCapabilities(),
      analysis: this.analysisAgent.getCapabilities(),
      execution: this.executionAgent.getCapabilities(),
      validation: this.validationAgent.getCapabilities(),
      communication: this.communicationAgent.getCapabilities()
    };
  }

  /**
   * Obtém estatísticas do coordenador
   */
  getCoordinatorStats(): {
    totalWorkflows: number;
    averageProcessingTime: number;
    successRate: number;
    activeTasksCount: number;
  } {
    const totalWorkflows = this.workflowHistory.length;
    const successfulWorkflows = this.workflowHistory.filter(w => w.success).length;
    const averageTime = totalWorkflows > 0
      ? this.workflowHistory.reduce((sum, w) => sum + w.totalTime, 0) / totalWorkflows
      : 0;

    return {
      totalWorkflows,
      averageProcessingTime: Math.round(averageTime),
      successRate: totalWorkflows > 0 ? successfulWorkflows / totalWorkflows : 1,
      activeTasksCount: this.activeTasks.size
    };
  }
}

// Instância singleton
export const agentCoordinator = AgentCoordinator.getInstance();