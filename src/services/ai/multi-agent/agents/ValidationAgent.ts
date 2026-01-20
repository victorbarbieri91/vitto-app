/**
 * ValidationAgent - Especialista em Validação e Controle de Qualidade
 *
 * 🔍 O "Auditor Financeiro" da equipe - foca exclusivamente em:
 * - Validação de dados e operações
 * - Detecção de anomalias e inconsistências
 * - Verificação de integridade financeira
 * - Controle de qualidade pós-operações
 * - Auditoria e compliance
 */

import { aiContextManager } from '../../AIContextManager';
import { financialMemoryManager } from '../../FinancialMemoryManager';
import type { FinancialContext } from '../../../../types/ai';

export interface ValidationTask {
  validateOperations?: boolean;
  validateData?: boolean;
  checkAnomalies?: boolean;
  auditCompliance?: boolean;
  operationsToValidate?: Array<{
    id: string;
    type: string;
    data: any;
    result?: any;
  }>;
  dataToValidate?: {
    transactions?: any[];
    accounts?: any[];
    categories?: any[];
    customData?: any;
  };
  previousResults: Record<string, any>;
  context: FinancialContext;
  validationRules?: {
    allowedValueRange?: { min: number; max: number };
    requiredFields?: string[];
    businessRules?: string[];
  };
}

export interface ValidationResult {
  success: boolean;
  validationsPassed: number;
  validationsFailed: number;
  findings: Array<{
    type: 'error' | 'warning' | 'info' | 'anomaly';
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    affected_item?: string;
    recommendation?: string;
    auto_fix_available?: boolean;
  }>;
  anomalies_detected: Array<{
    type: 'unusual_amount' | 'duplicate_transaction' | 'category_mismatch' | 'timing_anomaly';
    description: string;
    confidence: number;
    affected_data: any;
    suggested_action: string;
  }>;
  compliance_status: {
    passed: boolean;
    checks_performed: string[];
    violations: string[];
    recommendations: string[];
  };
  data_integrity: {
    score: number; // 0-1
    issues_found: number;
    consistency_check: boolean;
    referential_integrity: boolean;
  };
  summary: {
    overall_health: 'excellent' | 'good' | 'fair' | 'poor';
    confidence_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    requires_attention: boolean;
  };
  next_validation_recommendations: string[];
  metadata: {
    validationTimeMs: number;
    rulesApplied: string[];
    dataPointsChecked: number;
    algorithmsUsed: string[];
  };
}

export class ValidationAgent {
  private validationHistory: ValidationResult[] = [];
  private specializations = {
    data_integrity: 0.98,      // Integridade de dados
    anomaly_detection: 0.95,   // Detecção de anomalias
    business_rules: 0.92,      // Regras de negócio
    compliance_audit: 0.90,    // Auditoria e compliance
    pattern_analysis: 0.88     // Análise de padrões
  };

  private businessRules = {
    // Regras de negócio padrão
    max_transaction_value: 50000,
    min_transaction_value: 0.01,
    max_daily_transactions: 100,
    suspicious_keywords: ['teste', 'test', 'fake', 'lorem'],
    required_transaction_fields: ['descricao', 'valor', 'data', 'categoria_id', 'conta_id']
  };

  /**
   * Valida resultados e dados com análise profunda
   */
  async validateResults(task: ValidationTask, userId: string): Promise<ValidationResult> {
    const startTime = Date.now();
    console.log('🔍 ValidationAgent: Iniciando validação abrangente...');

    try {
      const findings: ValidationResult['findings'] = [];
      const anomalies: ValidationResult['anomalies_detected'] = [];
      let validationsPassed = 0;
      let validationsFailed = 0;

      // 1. Validação de operações (se solicitada)
      if (task.validateOperations && task.operationsToValidate) {
        const operationsValidation = await this.validateOperations(task.operationsToValidate, task.context);
        findings.push(...operationsValidation.findings);
        anomalies.push(...operationsValidation.anomalies);
        validationsPassed += operationsValidation.passed;
        validationsFailed += operationsValidation.failed;
      }

      // 2. Validação de dados (se solicitada)
      if (task.validateData && task.dataToValidate) {
        const dataValidation = await this.validateData(task.dataToValidate, task.context, userId);
        findings.push(...dataValidation.findings);
        anomalies.push(...dataValidation.anomalies);
        validationsPassed += dataValidation.passed;
        validationsFailed += dataValidation.failed;
      }

      // 3. Detecção de anomalias (se solicitada)
      if (task.checkAnomalies) {
        const anomalyDetection = await this.detectAnomalies(task.context, userId);
        anomalies.push(...anomalyDetection);
      }

      // 4. Auditoria de compliance (se solicitada)
      const complianceStatus = task.auditCompliance
        ? await this.performComplianceAudit(task.context, userId)
        : {
            passed: true,
            checks_performed: [],
            violations: [],
            recommendations: []
          };

      // 5. Verificação de integridade de dados
      const dataIntegrity = await this.checkDataIntegrity(task.previousResults, task.context);

      // 6. Compilar resultado final
      const validationResult = this.compileValidationResult(
        findings,
        anomalies,
        complianceStatus,
        dataIntegrity,
        validationsPassed,
        validationsFailed,
        startTime
      );

      this.validationHistory.push(validationResult);
      console.log(`✅ ValidationAgent: Validação completa - ${validationsPassed} passaram, ${validationsFailed} falharam`);

      return validationResult;

    } catch (error) {
      console.error('❌ ValidationAgent: Erro na validação:', error);

      return {
        success: false,
        validationsPassed: 0,
        validationsFailed: 1,
        findings: [{
          type: 'error',
          severity: 'critical',
          message: `Erro crítico na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          recommendation: 'Revisar dados e tentar novamente'
        }],
        anomalies_detected: [],
        compliance_status: {
          passed: false,
          checks_performed: [],
          violations: ['Falha na execução da validação'],
          recommendations: ['Verificar conectividade e integridade do sistema']
        },
        data_integrity: {
          score: 0,
          issues_found: 1,
          consistency_check: false,
          referential_integrity: false
        },
        summary: {
          overall_health: 'poor',
          confidence_score: 0,
          risk_level: 'critical',
          requires_attention: true
        },
        next_validation_recommendations: ['Corrigir erro de sistema antes de continuar'],
        metadata: {
          validationTimeMs: Date.now() - startTime,
          rulesApplied: [],
          dataPointsChecked: 0,
          algorithmsUsed: ['error_handler']
        }
      };
    }
  }

  /**
   * Valida operações executadas
   */
  private async validateOperations(
    operations: Array<any>,
    context: FinancialContext
  ): Promise<{
    findings: ValidationResult['findings'];
    anomalies: ValidationResult['anomalies_detected'];
    passed: number;
    failed: number;
  }> {
    const findings: ValidationResult['findings'] = [];
    const anomalies: ValidationResult['anomalies_detected'] = [];
    let passed = 0;
    let failed = 0;

    for (const operation of operations) {
      try {
        // Validar estrutura da operação
        if (!operation.id || !operation.type) {
          findings.push({
            type: 'error',
            severity: 'high',
            message: 'Operação com estrutura inválida - faltam id ou type',
            affected_item: operation.id || 'unknown',
            recommendation: 'Certificar que todas as operações têm id e type definidos'
          });
          failed++;
          continue;
        }

        // Validar resultado da operação
        if (operation.result) {
          const resultValidation = this.validateOperationResult(operation);
          if (resultValidation.isValid) {
            passed++;
          } else {
            failed++;
            findings.push(...resultValidation.issues);
          }

          // Detectar anomalias na operação
          const operationAnomalies = this.detectOperationAnomalies(operation, context);
          anomalies.push(...operationAnomalies);
        } else {
          findings.push({
            type: 'warning',
            severity: 'medium',
            message: 'Operação sem resultado definido',
            affected_item: operation.id,
            recommendation: 'Verificar se a operação foi executada corretamente'
          });
        }

      } catch (error) {
        failed++;
        findings.push({
          type: 'error',
          severity: 'high',
          message: `Erro ao validar operação ${operation.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          affected_item: operation.id
        });
      }
    }

    return { findings, anomalies, passed, failed };
  }

  /**
   * Valida dados fornecidos
   */
  private async validateData(
    data: ValidationTask['dataToValidate'],
    context: FinancialContext,
    userId: string
  ): Promise<{
    findings: ValidationResult['findings'];
    anomalies: ValidationResult['anomalies_detected'];
    passed: number;
    failed: number;
  }> {
    const findings: ValidationResult['findings'] = [];
    const anomalies: ValidationResult['anomalies_detected'] = [];
    let passed = 0;
    let failed = 0;

    // Validar transações
    if (data?.transactions) {
      for (const transaction of data.transactions) {
        const validation = this.validateTransaction(transaction);
        if (validation.isValid) {
          passed++;
        } else {
          failed++;
          findings.push(...validation.issues);
        }

        // Detectar duplicatas
        const duplicates = await this.checkForDuplicateTransaction(transaction, userId);
        if (duplicates.length > 0) {
          anomalies.push({
            type: 'duplicate_transaction',
            description: `Possível transação duplicada: ${transaction.descricao}`,
            confidence: 0.8,
            affected_data: transaction,
            suggested_action: 'Revisar e consolidar transações duplicadas'
          });
        }
      }
    }

    // Validar contas
    if (data?.accounts) {
      for (const account of data.accounts) {
        const validation = this.validateAccount(account);
        if (validation.isValid) {
          passed++;
        } else {
          failed++;
          findings.push(...validation.issues);
        }
      }
    }

    // Validar categorias
    if (data?.categories) {
      for (const category of data.categories) {
        const validation = this.validateCategory(category);
        if (validation.isValid) {
          passed++;
        } else {
          failed++;
          findings.push(...validation.issues);
        }
      }
    }

    return { findings, anomalies, passed, failed };
  }

  /**
   * Detecta anomalias nos dados financeiros
   */
  private async detectAnomalies(context: FinancialContext, userId: string): Promise<ValidationResult['anomalies_detected']> {
    const anomalies: ValidationResult['anomalies_detected'] = [];

    try {
      // Buscar padrões históricos da memória RAG
      const historicalPatterns = await financialMemoryManager.buscarSimilares(
        'padrões de gastos usuais',
        userId,
        { limit: 10 }
      );

      // Analisar transações recentes para anomalias
      if (context.transacoes_recentes?.length) {
        for (const transacao of context.transacoes_recentes) {
          // Verificar valores fora do padrão
          if (Math.abs(transacao.valor) > this.businessRules.max_transaction_value) {
            anomalies.push({
              type: 'unusual_amount',
              description: `Valor incomum: ${this.formatCurrency(transacao.valor)}`,
              confidence: 0.9,
              affected_data: transacao,
              suggested_action: 'Verificar se o valor está correto'
            });
          }

          // Verificar keywords suspeitas
          const hasSuspiciousKeywords = this.businessRules.suspicious_keywords.some(
            keyword => transacao.descricao?.toLowerCase().includes(keyword)
          );
          if (hasSuspiciousKeywords) {
            anomalies.push({
              type: 'category_mismatch',
              description: `Descrição suspeita: "${transacao.descricao}"`,
              confidence: 0.7,
              affected_data: transacao,
              suggested_action: 'Revisar descrição da transação'
            });
          }

          // Verificar timing (transações em horários incomuns)
          if (transacao.data) {
            const transactionTime = new Date(transacao.data);
            const hour = transactionTime.getHours();
            if (hour < 6 || hour > 23) {
              anomalies.push({
                type: 'timing_anomaly',
                description: `Transação em horário incomum: ${hour}:${transactionTime.getMinutes()}`,
                confidence: 0.6,
                affected_data: transacao,
                suggested_action: 'Verificar se a transação foi legítima'
              });
            }
          }
        }
      }

    } catch (error) {
      console.warn('Erro na detecção de anomalias:', error);
    }

    return anomalies;
  }

  /**
   * Realiza auditoria de compliance
   */
  private async performComplianceAudit(
    context: FinancialContext,
    userId: string
  ): Promise<ValidationResult['compliance_status']> {
    const checks: string[] = [];
    const violations: string[] = [];
    const recommendations: string[] = [];

    try {
      // Verificar se há categorias obrigatórias
      checks.push('Verificação de categorias obrigatórias');
      if (!context.categorias?.length) {
        violations.push('Nenhuma categoria encontrada no sistema');
        recommendations.push('Configurar categorias básicas para transações');
      }

      // Verificar se há contas configuradas
      checks.push('Verificação de contas bancárias');
      if (!context.contas?.length) {
        violations.push('Nenhuma conta bancária configurada');
        recommendations.push('Adicionar pelo menos uma conta bancária');
      }

      // Verificar integridade das transações
      checks.push('Verificação de integridade de transações');
      const invalidTransactions = context.transacoes_recentes?.filter(t =>
        !t.descricao || t.valor === undefined || !t.categoria_id
      ) || [];

      if (invalidTransactions.length > 0) {
        violations.push(`${invalidTransactions.length} transações com dados incompletos`);
        recommendations.push('Completar dados das transações inválidas');
      }

      // Verificar saldos consistentes
      checks.push('Verificação de consistência de saldos');
      const hasNegativeBalances = context.contas?.some(conta => conta.saldo < 0);
      if (hasNegativeBalances) {
        recommendations.push('Revisar contas com saldo negativo');
      }

    } catch (error) {
      violations.push(`Erro na auditoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return {
      passed: violations.length === 0,
      checks_performed: checks,
      violations,
      recommendations
    };
  }

  /**
   * Verifica integridade dos dados
   */
  private async checkDataIntegrity(
    previousResults: Record<string, any>,
    context: FinancialContext
  ): Promise<ValidationResult['data_integrity']> {
    let score = 1.0;
    let issuesFound = 0;
    let consistencyCheck = true;
    let referentialIntegrity = true;

    try {
      // Verificar consistência dos resultados
      Object.entries(previousResults).forEach(([key, result]) => {
        if (!result || (typeof result === 'object' && Object.keys(result).length === 0)) {
          score -= 0.1;
          issuesFound++;
          consistencyCheck = false;
        }
      });

      // Verificar integridade referencial
      if (context.transacoes_recentes?.length) {
        const invalidRefs = context.transacoes_recentes.filter(t =>
          t.categoria_id && !context.categorias?.find(c => c.id === t.categoria_id) ||
          t.conta_id && !context.contas?.find(c => c.id === t.conta_id)
        );

        if (invalidRefs.length > 0) {
          score -= 0.2;
          issuesFound += invalidRefs.length;
          referentialIntegrity = false;
        }
      }

    } catch (error) {
      score = 0;
      issuesFound++;
      consistencyCheck = false;
      referentialIntegrity = false;
    }

    return {
      score: Math.max(score, 0),
      issues_found: issuesFound,
      consistency_check: consistencyCheck,
      referential_integrity: referentialIntegrity
    };
  }

  /**
   * Valida resultado de uma operação
   */
  private validateOperationResult(operation: any): {
    isValid: boolean;
    issues: ValidationResult['findings'];
  } {
    const issues: ValidationResult['findings'] = [];

    if (!operation.result.success) {
      issues.push({
        type: 'error',
        severity: 'high',
        message: `Operação ${operation.type} falhou: ${operation.result.error || 'Erro não especificado'}`,
        affected_item: operation.id,
        recommendation: 'Revisar parâmetros e tentar novamente'
      });
    }

    if (operation.type === 'create_transaction' && operation.result.data) {
      const transaction = operation.result.data;
      const validation = this.validateTransaction(transaction);
      issues.push(...validation.issues);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Detecta anomalias em uma operação específica
   */
  private detectOperationAnomalies(operation: any, context: FinancialContext): ValidationResult['anomalies_detected'] {
    const anomalies: ValidationResult['anomalies_detected'] = [];

    // Verificar se valor está fora do padrão para o tipo de operação
    if (operation.type === 'create_transaction' && operation.result?.data?.valor) {
      const valor = Math.abs(operation.result.data.valor);

      if (valor > this.businessRules.max_transaction_value) {
        anomalies.push({
          type: 'unusual_amount',
          description: `Valor muito alto para transação: ${this.formatCurrency(valor)}`,
          confidence: 0.85,
          affected_data: operation.result.data,
          suggested_action: 'Confirmar se o valor está correto'
        });
      }
    }

    return anomalies;
  }

  /**
   * Valida uma transação individual
   */
  private validateTransaction(transaction: any): {
    isValid: boolean;
    issues: ValidationResult['findings'];
  } {
    const issues: ValidationResult['findings'] = [];

    // Verificar campos obrigatórios
    for (const field of this.businessRules.required_transaction_fields) {
      if (!transaction[field]) {
        issues.push({
          type: 'error',
          severity: 'high',
          message: `Campo obrigatório ausente: ${field}`,
          affected_item: transaction.id || 'transação',
          recommendation: `Adicionar valor para o campo ${field}`
        });
      }
    }

    // Verificar range de valores
    if (transaction.valor !== undefined) {
      const valor = Math.abs(transaction.valor);
      if (valor < this.businessRules.min_transaction_value) {
        issues.push({
          type: 'warning',
          severity: 'low',
          message: `Valor muito baixo: ${this.formatCurrency(valor)}`,
          affected_item: transaction.id || 'transação',
          recommendation: 'Verificar se o valor está correto'
        });
      }
    }

    // Verificar descrição
    if (transaction.descricao && transaction.descricao.length < 3) {
      issues.push({
        type: 'warning',
        severity: 'medium',
        message: 'Descrição muito curta',
        affected_item: transaction.id || 'transação',
        recommendation: 'Adicionar descrição mais detalhada'
      });
    }

    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      issues
    };
  }

  /**
   * Valida uma conta
   */
  private validateAccount(account: any): {
    isValid: boolean;
    issues: ValidationResult['findings'];
  } {
    const issues: ValidationResult['findings'] = [];

    if (!account.nome) {
      issues.push({
        type: 'error',
        severity: 'high',
        message: 'Nome da conta é obrigatório',
        affected_item: account.id || 'conta'
      });
    }

    if (account.saldo !== undefined && isNaN(account.saldo)) {
      issues.push({
        type: 'error',
        severity: 'high',
        message: 'Saldo deve ser um número válido',
        affected_item: account.id || 'conta'
      });
    }

    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      issues
    };
  }

  /**
   * Valida uma categoria
   */
  private validateCategory(category: any): {
    isValid: boolean;
    issues: ValidationResult['findings'];
  } {
    const issues: ValidationResult['findings'] = [];

    if (!category.nome) {
      issues.push({
        type: 'error',
        severity: 'high',
        message: 'Nome da categoria é obrigatório',
        affected_item: category.id || 'categoria'
      });
    }

    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      issues
    };
  }

  /**
   * Verifica transações duplicadas
   */
  private async checkForDuplicateTransaction(transaction: any, userId: string): Promise<any[]> {
    try {
      // Buscar transações similares na memória
      const similarTransactions = await financialMemoryManager.buscarSimilares(
        `transação ${transaction.descricao} ${transaction.valor}`,
        userId,
        { limit: 5 }
      );

      // Filtrar apenas transações realmente similares
      return similarTransactions.filter(similar =>
        similar.metadata?.transaction_value === transaction.valor &&
        similar.metadata?.transaction_description?.toLowerCase() === transaction.descricao?.toLowerCase()
      );
    } catch (error) {
      console.warn('Erro ao verificar duplicatas:', error);
      return [];
    }
  }

  /**
   * Compila resultado final da validação
   */
  private compileValidationResult(
    findings: ValidationResult['findings'],
    anomalies: ValidationResult['anomalies_detected'],
    complianceStatus: ValidationResult['compliance_status'],
    dataIntegrity: ValidationResult['data_integrity'],
    validationsPassed: number,
    validationsFailed: number,
    startTime: number
  ): ValidationResult {
    const criticalIssues = findings.filter(f => f.severity === 'critical').length;
    const highIssues = findings.filter(f => f.severity === 'high').length;
    const errors = findings.filter(f => f.type === 'error').length;

    let overallHealth: ValidationResult['summary']['overall_health'] = 'excellent';
    let riskLevel: ValidationResult['summary']['risk_level'] = 'low';

    if (criticalIssues > 0 || errors > 5) {
      overallHealth = 'poor';
      riskLevel = 'critical';
    } else if (highIssues > 0 || errors > 2) {
      overallHealth = 'fair';
      riskLevel = 'high';
    } else if (findings.length > 5 || anomalies.length > 3) {
      overallHealth = 'good';
      riskLevel = 'medium';
    }

    const confidenceScore = Math.max(
      1 - (errors * 0.2) - (anomalies.length * 0.1) - (criticalIssues * 0.3),
      0
    );

    return {
      success: validationsFailed === 0 && criticalIssues === 0,
      validationsPassed,
      validationsFailed,
      findings,
      anomalies_detected: anomalies,
      compliance_status: complianceStatus,
      data_integrity: dataIntegrity,
      summary: {
        overall_health: overallHealth,
        confidence_score: confidenceScore,
        risk_level: riskLevel,
        requires_attention: criticalIssues > 0 || highIssues > 2
      },
      next_validation_recommendations: this.generateNextValidationRecommendations(findings, anomalies),
      metadata: {
        validationTimeMs: Date.now() - startTime,
        rulesApplied: Object.keys(this.businessRules),
        dataPointsChecked: validationsPassed + validationsFailed,
        algorithmsUsed: ['business_rules', 'anomaly_detection', 'pattern_matching', 'integrity_check']
      }
    };
  }

  /**
   * Gera recomendações para próximas validações
   */
  private generateNextValidationRecommendations(
    findings: ValidationResult['findings'],
    anomalies: ValidationResult['anomalies_detected']
  ): string[] {
    const recommendations: string[] = [];

    if (findings.some(f => f.severity === 'critical')) {
      recommendations.push('Corrigir problemas críticos antes de continuar');
    }

    if (anomalies.length > 5) {
      recommendations.push('Investigar alto número de anomalias detectadas');
    }

    if (findings.some(f => f.type === 'error')) {
      recommendations.push('Revisar e corrigir erros de validação');
    }

    if (anomalies.some(a => a.type === 'duplicate_transaction')) {
      recommendations.push('Implementar verificação de duplicatas automática');
    }

    if (recommendations.length === 0) {
      recommendations.push('Sistema validado com sucesso - continuar monitoramento');
    }

    return recommendations;
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
      canExecuteOperations: false, // ❌ Não é responsabilidade
      canValidateResults: true,    // ✅ Especialidade principal
      canCommunicate: false,       // ❌ Não é responsabilidade
      isAvailable: true,
      currentLoad: Math.min(this.validationHistory.length * 5, 100)
    };
  }

  /**
   * Obtém estatísticas do agente
   */
  getStats(): {
    totalValidationsPerformed: number;
    averageValidationTime: number;
    anomaliesDetected: number;
    successRate: number;
    specializations: Record<string, number>;
  } {
    const totalValidations = this.validationHistory.reduce(
      (sum, h) => sum + h.validationsPassed + h.validationsFailed, 0
    );
    const successfulValidations = this.validationHistory.reduce(
      (sum, h) => sum + h.validationsPassed, 0
    );
    const totalAnomalies = this.validationHistory.reduce(
      (sum, h) => sum + h.anomalies_detected.length, 0
    );

    return {
      totalValidationsPerformed: totalValidations,
      averageValidationTime: this.validationHistory.length > 0
        ? this.validationHistory.reduce((sum, h) => sum + h.metadata.validationTimeMs, 0) / this.validationHistory.length
        : 0,
      anomaliesDetected: totalAnomalies,
      successRate: totalValidations > 0 ? successfulValidations / totalValidations : 1,
      specializations: this.specializations
    };
  }
}