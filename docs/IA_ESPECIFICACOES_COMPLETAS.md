# 🤖 **ESPECIFICAÇÕES COMPLETAS - SISTEMA DE IA VITTO**

## **🎯 VISÃO GERAL DA IA OPERACIONAL**

### **Conceito Revolucionário**
A IA do Vitto não é um chatbot tradicional. É um **assistente financeiro operacional** que:
- **Compreende contexto financeiro completo** do usuário
- **Executa operações reais** no sistema (CRUD completo)
- **Analisa padrões** e gera insights personalizados
- **Aprende preferências** do usuário ao longo do tempo
- **Sugere otimizações** financeiras baseadas em dados reais

### **Diferencial Competitivo**
```typescript
// IA Tradicional (outros apps)
interface ChatbotTradicional {
  funcionalidade: "responder perguntas";
  operacoes: ["consulta"];
  inteligencia: "genérica";
}

// IA Vitto (revolucionária)
interface AIOperacional {
  funcionalidade: "operar sistema financeiro completo";
  operacoes: ["criar", "editar", "excluir", "analisar", "prever", "otimizar"];
  inteligencia: "especializada em finanças pessoais";
  contexto: "dados financeiros completos do usuário";
}
```

---

## **🏗️ ARQUITETURA TÉCNICA DA IA**

### **Componentes Principais**
```typescript
// 1. Context Manager - Prepara contexto financeiro
class AIContextManager {
  async buildContext(userId: string): Promise<FinancialContext>;
  async updateContext(userId: string, changes: ContextChange[]): Promise<void>;
  async getRelevantHistory(userId: string, query: string): Promise<RelevantData>;
}

// 2. Command Interpreter - Processa linguagem natural
class AICommandInterpreter {
  async parseCommand(input: string, context: FinancialContext): Promise<ParsedCommand>;
  async validateCommand(command: ParsedCommand): Promise<ValidationResult>;
  async suggestCorrections(command: ParsedCommand): Promise<Suggestion[]>;
}

// 3. Action Executor - Executa operações
class AIActionExecutor {
  async executeFinancialOperation(command: ParsedCommand): Promise<OperationResult>;
  async validatePermissions(userId: string, operation: Operation): Promise<boolean>;
  async rollbackOperation(operationId: string): Promise<void>;
}

// 4. Insight Generator - Gera análises
class AIInsightGenerator {
  async generateInsights(context: FinancialContext): Promise<Insight[]>;
  async detectAnomalies(transactions: Transaction[]): Promise<Anomaly[]>;
  async predictTrends(history: FinancialHistory): Promise<Prediction[]>;
}
```

### **Contexto Financeiro Completo**
```typescript
interface FinancialContext {
  // Dados Básicos do Usuário
  usuario: {
    id: string;
    nome: string;
    preferencias: UserPreferences;
    configuracoes: UserSettings;
  };
  
  // Estado Financeiro Atual
  patrimonio: {
    saldo_total: number;
    saldo_previsto: number;
    contas: ContaComSaldo[];
    investimentos: Investimento[];
  };
  
  // Indicadores Automáticos
  indicadores: {
    mes_atual: IndicadoresMes;
    tendencias: TendenciaGastos[];
    saude_financeira: SaudeFinanceira;
    comparacao_mensal: ComparacaoMensal;
  };
  
  // Histórico e Padrões
  historico: {
    lancamentos_recentes: Lancamento[];
    padroes_gastos: PadraoGasto[];
    categorias_preferidas: CategoriaFrequencia[];
    horarios_transacoes: HorarioPattern[];
  };
  
  // Planejamento Futuro
  planejamento: {
    lancamentos_futuros: LancamentoFuturo[];
    metas_ativas: Meta[];
    orcamentos_ativos: Orcamento[];
    projecoes: ProjecaoMensal[];
  };
  
  // Contexto da Conversa
  conversa: {
    mensagens_recentes: Mensagem[];
    intencoes_anteriores: Intencao[];
    operacoes_realizadas: OperacaoRealizada[];
    preferencias_contextuais: PreferenciaContextual[];
  };
}
```

---

## **💡 CAPACIDADES OPERACIONAIS DA IA**

### **1. Operações CRUD Completas**

#### **Lançamentos Financeiros**
```typescript
interface LancamentoOperations {
  // Criar
  criarReceita: {
    comando: "Recebi R$ 500 de freelance";
    interpretacao: {
      valor: 500;
      tipo: "receita";
      categoria: "Renda Extra"; // IA deduz categoria
      conta: "conta_padrao";    // IA usa conta padrão
      data: "hoje";
    };
    confirmacao: "Criar receita de R$ 500,00 em 'Renda Extra'?";
    execucao: TransactionService.create();
  };
  
  criarDespesa: {
    comando: "Gastei 80 reais no supermercado";
    interpretacao: {
      valor: 80;
      tipo: "despesa";
      categoria: "Alimentação";
      conta: "conta_padrao";
      data: "hoje";
    };
    confirmacao: "Registrar despesa de R$ 80,00 em 'Alimentação'?";
    execucao: TransactionService.create();
  };
  
  criarParcelado: {
    comando: "Comprei um celular de R$ 1200 em 6 vezes no cartão";
    interpretacao: {
      valor: 1200;
      tipo: "despesa";
      categoria: "Compras";
      cartao: "cartao_padrao";
      parcelas: 6;
      valor_parcela: 200;
    };
    confirmacao: "Criar compra parcelada de R$ 1.200,00 em 6x de R$ 200,00?";
    execucao: TransactionService.createParcelado();
  };
  
  // Editar
  editarLancamento: {
    comando: "Altere a despesa do supermercado para R$ 75";
    processo: [
      "1. Buscar última despesa em 'Alimentação'",
      "2. Confirmar qual lançamento alterar",
      "3. Atualizar valor de 80 para 75",
      "4. Recalcular indicadores automaticamente"
    ];
  };
  
  // Excluir
  excluirLancamento: {
    comando: "Cancele a compra do celular";
    processo: [
      "1. Buscar compra parcelada mais recente",
      "2. Mostrar detalhes para confirmação",
      "3. Excluir lançamento principal + parcelas futuras",
      "4. Ajustar saldo e projeções"
    ];
  };
}
```

#### **Gestão de Contas**
```typescript
interface ContaOperations {
  criarConta: {
    comando: "Preciso cadastrar minha conta da Nubank";
    interpretacao: {
      nome: "Nubank";
      tipo: "corrente";
      instituicao: "Nubank";
      saldo_inicial: null; // IA perguntará
    };
    fluxo: [
      "Qual o saldo atual da conta Nubank?",
      "Usuário: R$ 1500",
      "Criar conta 'Nubank' com saldo inicial R$ 1.500,00?"
    ];
  };
  
  editarConta: {
    comando: "Atualize o saldo da minha conta corrente para R$ 2000";
    processo: [
      "1. Identificar qual conta corrente (se múltiplas)",
      "2. Mostrar saldo atual vs novo saldo",
      "3. Confirmar alteração",
      "4. Atualizar e recalcular indicadores"
    ];
  };
}
```

#### **Categorias Personalizadas**
```typescript
interface CategoriaOperations {
  criarCategoria: {
    comando: "Quero criar uma categoria 'Pet Shop' para gastos do meu cachorro";
    interpretacao: {
      nome: "Pet Shop";
      tipo: "despesa";
      cor: "#FF6B6B"; // IA sugere cor baseada no tema
      icone: "paw";   // IA sugere ícone relacionado
    };
    confirmacao: "Criar categoria 'Pet Shop' para despesas com ícone de pata?";
  };
  
  editarCategoria: {
    comando: "Mude a cor da categoria 'Lazer' para azul";
    processo: [
      "1. Buscar categoria 'Lazer'",
      "2. Mostrar cor atual",
      "3. Aplicar nova cor azul",
      "4. Atualizar interface"
    ];
  };
}
```

### **2. Metas e Orçamentos**
```typescript
interface PlanejamentoOperations {
  criarMeta: {
    comando: "Quero juntar R$ 5000 para viajar até dezembro";
    interpretacao: {
      titulo: "Viagem";
      valor_meta: 5000;
      data_fim: "2024-12-31";
      estrategia: "valor_fixo_mensal"; // IA calcula
      valor_mensal: 833.33; // R$ 5000 / 6 meses restantes
    };
    confirmacao: "Criar meta de R$ 5.000,00 poupando R$ 833,33/mês?";
    sugestao: "Com sua média de sobra mensal de R$ 600, precisará economizar R$ 233 a mais.";
  };
  
  criarOrcamento: {
    comando: "Quero gastar no máximo R$ 400 por mês com alimentação";
    interpretacao: {
      categoria: "Alimentação";
      valor_limite: 400;
      mes: "atual";
      tipo: "mensal";
    };
    confirmacao: "Definir orçamento de R$ 400,00/mês para 'Alimentação'?";
    analise: "Baseado nos últimos 3 meses, você gastou em média R$ 520. Precisará reduzir R$ 120.";
  };
}
```

---

## **🧠 SISTEMA DE ANÁLISE E INSIGHTS**

### **Análises Automáticas**
```typescript
interface AnalysisCapabilities {
  // Análise de Padrões
  detectarPadroes: {
    gastos_por_dia_semana: "Você gasta 40% mais aos sábados";
    horarios_transacoes: "80% dos gastos acontecem entre 18h-20h";
    categorias_crescentes: "Gastos com 'Lazer' aumentaram 25% este mês";
    sazonalidade: "Dezembro sempre 30% acima da média";
  };
  
  // Previsões
  preverComportamento: {
    saldo_fim_mes: "Com os gastos atuais, saldo previsto: R$ 1.200";
    categoria_limite: "Orçamento 'Alimentação' será ultrapassado em 5 dias";
    meta_projecao: "Meta 'Viagem' será atingida 2 meses atrasada";
    tendencia_geral: "Patrimônio crescendo 3% ao mês";
  };
  
  // Alertas Inteligentes
  gerarAlertas: {
    gastos_anomalos: "Gasto com 'Saúde' 300% acima do normal";
    oportunidades: "Sobrou R$ 200 este mês, que tal investir?";
    otimizacoes: "Cancele assinaturas não usadas: economia de R$ 50/mês";
    lembretes: "Fatura do cartão vence em 3 dias: R$ 850";
  };
}
```

### **Insights Personalizados**
```typescript
// Exemplos de insights que a IA gera automaticamente
const exemplosInsights = [
  {
    tipo: "economia",
    titulo: "Oportunidade de Economia",
    descricao: "Você gastou R$ 230 com delivery este mês. Cozinhando 2x por semana, economizaria R$ 80.",
    acao: "Quer que eu crie uma meta de reduzir delivery?",
    impacto: "+R$ 960/ano"
  },
  
  {
    tipo: "investimento",
    titulo: "Sobra Recorrente",
    descricao: "Nos últimos 3 meses você teve sobra média de R$ 400. Que tal automatizar um investimento?",
    acao: "Posso criar uma meta de investimento mensal?",
    impacto: "+R$ 4.800/ano + rendimentos"
  },
  
  {
    tipo: "alerta",
    titulo: "Gasto Atípico",
    descricao: "Seus gastos com 'Compras' estão 150% acima do normal este mês.",
    acao: "Quer revisar os lançamentos desta categoria?",
    impacto: "Pode impactar meta 'Viagem'"
  },
  
  {
    tipo: "otimizacao",
    titulo: "Reorganização de Orçamento",
    descricao: "Categoria 'Transporte' sempre fica abaixo do orçado. Que tal realocar R$ 100 para 'Lazer'?",
    acao: "Posso ajustar seus orçamentos automaticamente?",
    impacto: "Orçamentos mais realistas"
  }
];
```

---

## **🗣️ PROCESSAMENTO DE LINGUAGEM NATURAL**

### **Comandos Suportados**

#### **Criação de Lançamentos**
```typescript
const comandosLancamento = [
  // Básicos
  "Gastei 50 reais no supermercado",
  "Recebi 2000 de salário",
  "Transferi 300 da poupança para corrente",
  
  // Com detalhes
  "Comprei uma pizza de R$ 35 no cartão de crédito",
  "Paguei R$ 120 de conta de luz ontem",
  "Recebi R$ 500 de freelance na conta Nubank",
  
  // Parcelados
  "Comprei um notebook de R$ 3000 em 10 vezes",
  "Parcelei a viagem em 6x de R$ 400",
  
  // Fixos/Recorrentes
  "Crie um lançamento fixo de aluguel de R$ 800 todo dia 10",
  "Meu salário é R$ 3000 todo dia 5 do mês",
  "Quero lembrar da academia de R$ 80 mensais"
];
```

#### **Consultas e Análises**
```typescript
const comandosConsulta = [
  // Saldos
  "Qual meu saldo atual?",
  "Como está minha conta da Nubank?",
  "Quanto vou ter no final do mês?",
  
  // Gastos
  "Quanto gastei este mês?",
  "Meus gastos com alimentação estão altos?",
  "Onde estou gastando mais dinheiro?",
  
  // Comparações
  "Gastei mais ou menos que mês passado?",
  "Como estão meus orçamentos?",
  "Vou conseguir bater minhas metas?",
  
  // Projeções
  "Como vai ficar meu saldo em dezembro?",
  "Quando vou conseguir juntar R$ 10000?",
  "Vai sobrar dinheiro este mês?"
];
```

#### **Gestão de Categorias e Contas**
```typescript
const comandosGestao = [
  // Categorias
  "Crie uma categoria 'Academia' para despesas",
  "Mude a cor da categoria 'Lazer' para verde",
  "Exclua a categoria 'Teste'",
  
  // Contas
  "Cadastre minha conta do Bradesco",
  "Atualize o saldo da poupança para R$ 5000",
  "Quero inativar a conta da Caixa",
  
  // Cartões
  "Adicione meu cartão Visa que vence dia 15",
  "O limite do meu cartão é R$ 2000",
  "Meu cartão fecha dia 10 e vence dia 20"
];
```

### **Engine de Interpretação**
```typescript
class NLPEngine {
  // Extrai entidades financeiras do texto
  async extractEntities(text: string): Promise<ExtractedEntities> {
    const patterns = {
      valor: /R?\$?\s?(\d+(?:\.\d{3})*(?:,\d{2})?|\d+)/g,
      categoria: this.categoriaPatterns,
      data: /ontem|hoje|amanhã|\d{1,2}\/\d{1,2}|\d{1,2} de \w+/g,
      conta: /nubank|bradesco|caixa|itau|corrente|poupança/gi,
      parcelas: /(\d+)x|\d+ vezes|\d+ parcelas/g
    };
    
    return {
      valores: this.extractValues(text, patterns.valor),
      categorias: this.extractCategories(text, patterns.categoria),
      datas: this.extractDates(text, patterns.data),
      contas: this.extractAccounts(text, patterns.conta),
      parcelas: this.extractInstallments(text, patterns.parcelas)
    };
  }
  
  // Determina a intenção do usuário
  async classifyIntent(text: string, context: FinancialContext): Promise<Intent> {
    const intentPatterns = {
      criar_receita: /recebi|ganhei|salário|freelance|renda/i,
      criar_despesa: /gastei|comprei|paguei|conta de/i,
      criar_transferencia: /transferi|movi|passei/i,
      consultar_saldo: /saldo|quanto tenho|como está/i,
      criar_meta: /meta|juntar|guardar|poupar/i,
      criar_orcamento: /orçamento|limite|máximo/i,
      analisar_gastos: /análise|relatório|onde gastei/i
    };
    
    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(text)) {
        return { 
          tipo: intent as IntentType,
          confianca: this.calculateConfidence(text, pattern, context)
        };
      }
    }
    
    return { tipo: 'unknown', confianca: 0 };
  }
  
  // Resolve ambiguidades usando contexto
  async resolveAmbiguity(entities: ExtractedEntities, context: FinancialContext): Promise<ResolvedEntities> {
    return {
      valor: entities.valores[0], // Primeiro valor encontrado
      categoria: await this.resolveCategoryAmbiguity(entities.categorias, context),
      conta: await this.resolveAccountAmbiguity(entities.contas, context),
      data: this.resolveDateAmbiguity(entities.datas)
    };
  }
}
```

---

## **⚡ FLUXO DE EXECUÇÃO COMPLETO**

### **Pipeline de Processamento**
```typescript
async function processarComandoCompleto(input: string, userId: string): Promise<OperationResult> {
  // 1. Preparar Contexto
  const context = await AIContextManager.buildContext(userId);
  
  // 2. Processar Linguagem Natural
  const entities = await NLPEngine.extractEntities(input);
  const intent = await NLPEngine.classifyIntent(input, context);
  const resolved = await NLPEngine.resolveAmbiguity(entities, context);
  
  // 3. Validar Comando
  const validation = await validateCommand({
    intent,
    entities: resolved,
    context
  });
  
  if (!validation.isValid) {
    return {
      type: 'clarification_needed',
      message: validation.clarificationMessage,
      suggestions: validation.suggestions
    };
  }
  
  // 4. Gerar Sugestão
  const suggestion = await generateActionSuggestion({
    intent,
    entities: resolved,
    context
  });
  
  // 5. Aguardar Confirmação
  const confirmation = await waitForUserConfirmation(suggestion);
  
  if (!confirmation.confirmed) {
    return {
      type: 'operation_cancelled',
      message: 'Operação cancelada pelo usuário'
    };
  }
  
  // 6. Executar Operação
  const result = await AIActionExecutor.executeFinancialOperation({
    intent,
    entities: resolved,
    context,
    userId
  });
  
  // 7. Atualizar Contexto
  await AIContextManager.updateContext(userId, result.changes);
  
  // 8. Gerar Insights Pós-Operação
  const insights = await AIInsightGenerator.generatePostOperationInsights(result, context);
  
  return {
    type: 'operation_success',
    message: result.successMessage,
    impact: result.financialImpact,
    insights: insights,
    data: result.operationData
  };
}
```

### **Tratamento de Erros e Edge Cases**
```typescript
class AIErrorHandler {
  async handleAmbiguousCommand(input: string, context: FinancialContext): Promise<ClarificationResponse> {
    // Exemplo: "Gastei 100 reais" (falta categoria e conta)
    const missingInfo = this.identifyMissingInformation(input, context);
    
    return {
      message: "Preciso de mais informações:",
      questions: [
        "Em qual categoria foi esse gasto?",
        "De qual conta saiu o dinheiro?"
      ],
      suggestions: this.generateSuggestions(missingInfo, context)
    };
  }
  
  async handleInvalidOperation(operation: ParsedCommand): Promise<ErrorResponse> {
    // Exemplo: Transferir mais dinheiro do que tem na conta
    if (operation.intent === 'criar_transferencia') {
      const sourceBal = await this.getAccountBalance(operation.entities.conta_origem);
      if (operation.entities.valor > sourceBal) {
        return {
          error: 'insufficient_funds',
          message: `Saldo insuficiente. Saldo atual: R$ ${sourceBal}`,
          suggestions: [
            `Transferir R$ ${sourceBal} (saldo total)?`,
            "Verificar saldo de outras contas?",
            "Cancelar operação?"
          ]
        };
      }
    }
    
    return { error: 'unknown', message: 'Operação inválida' };
  }
  
  async recoverFromError(error: AIError, context: FinancialContext): Promise<RecoveryAction> {
    switch (error.type) {
      case 'category_not_found':
        return {
          type: 'suggest_creation',
          message: `Categoria '${error.details.category}' não encontrada. Quer criar?`,
          action: () => this.createCategory(error.details.category)
        };
        
      case 'account_not_found':
        return {
          type: 'suggest_selection',
          message: "Qual conta você quer usar?",
          options: context.contas.map(c => c.nome)
        };
        
      default:
        return {
          type: 'fallback',
          message: "Desculpe, não consegui processar. Pode reformular?"
        };
    }
  }
}
```

---

## **📊 MÉTRICAS E MONITORAMENTO DA IA**

### **KPIs de Performance**
```typescript
interface AIMetrics {
  // Precisão da Interpretação
  accuracy: {
    intent_classification: number;  // % de intenções corretas
    entity_extraction: number;      // % de entidades corretas
    command_completion: number;     // % de comandos executados com sucesso
  };
  
  // Velocidade de Resposta
  performance: {
    avg_response_time: number;      // Tempo médio de resposta
    context_build_time: number;     // Tempo para construir contexto
    operation_execution_time: number; // Tempo para executar operações
  };
  
  // Satisfação do Usuário
  user_satisfaction: {
    successful_operations: number;  // Operações bem-sucedidas
    user_corrections: number;       // Quantas vezes usuário corrigiu IA
    session_completion_rate: number; // % de sessões completadas
  };
  
  // Utilização
  usage: {
    commands_per_day: number;
    most_used_operations: string[];
    peak_usage_hours: number[];
  };
}
```

### **Sistema de Logging**
```typescript
interface AIOperationLog {
  timestamp: Date;
  user_id: string;
  session_id: string;
  
  // Input do usuário
  user_input: string;
  
  // Processamento da IA
  extracted_entities: ExtractedEntities;
  classified_intent: Intent;
  context_used: ContextSummary;
  
  // Resultado
  operation_executed: boolean;
  operation_type: string;
  execution_time: number;
  errors: AIError[];
  
  // Feedback
  user_satisfied: boolean;
  user_corrections: string[];
}
```

---

Este arquivo contém as especificações completas do sistema de IA. Vou continuar com os próximos arquivos da documentação. Quer que eu prossiga? 