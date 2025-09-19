import type {
  FinancialContext,
  ParsedCommand,
  ValidationResult,
  ExtractedEntities,
  ResolvedEntities,
  Intent,
  IntentType,
  AIConfig
} from '../../types/ai';

/**
 * AICommandInterpreter
 * 
 * Sistema de interpretação de comandos em linguagem natural.
 * Processa comandos financeiros em português brasileiro.
 */
export class AICommandInterpreter {
  private static instance: AICommandInterpreter;
  private config: AIConfig;

  static getInstance(): AICommandInterpreter {
    if (!AICommandInterpreter.instance) {
      AICommandInterpreter.instance = new AICommandInterpreter();
    }
    return AICommandInterpreter.instance;
  }

  constructor() {
    this.config = {
      model: import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini',
      max_tokens: 500,
      temperature: 0.3,
      context_window_size: 4000,
      confidence_threshold: 0.7,
      enable_learning: true,
      enable_insights: true
    };
  }

  /**
   * Processa um comando completo do usuário
   */
  async parseCommand(input: string, context: FinancialContext): Promise<ParsedCommand> {
    console.log('🗣️ AICommandInterpreter: Processando comando:', input);

    try {
      // Limpar e normalizar input
      const cleanInput = this.normalizeInput(input);

      // Extrair entidades em paralelo com classificação de intenção
      const [entities, intent] = await Promise.all([
        this.extractEntities(cleanInput, context),
        this.classifyIntent(cleanInput, context)
      ]);

      // Resolver ambiguidades usando contexto
      const resolvedEntities = await this.resolveAmbiguity(entities, context);

      // Calcular confiança total
      const confidence = this.calculateOverallConfidence(intent, entities, resolvedEntities);

      const parsedCommand: ParsedCommand = {
        intent,
        entities: resolvedEntities,
        original_text: input,
        confidence
      };

      console.log('✅ Comando processado:', {
        intent: intent.tipo,
        confidence: confidence,
        entities: Object.keys(resolvedEntities).length
      });

      return parsedCommand;

    } catch (error) {
      console.error('❌ Erro ao processar comando:', error);
      
      // Retornar comando com intenção desconhecida
      return {
        intent: { tipo: 'unknown', confianca: 0 },
        entities: {},
        original_text: input,
        confidence: 0
      };
    }
  }

  /**
   * Valida um comando parseado
   */
  async validateCommand(command: ParsedCommand): Promise<ValidationResult> {
    console.log('✅ Validando comando:', command.intent.tipo);

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Validações baseadas no tipo de intenção
      switch (command.intent.tipo) {
        case 'criar_receita':
        case 'criar_despesa':
          this.validateTransactionCommand(command, errors, warnings, suggestions);
          break;

        case 'criar_transferencia':
          this.validateTransferCommand(command, errors, warnings, suggestions);
          break;

        case 'criar_parcelado':
          this.validateInstallmentCommand(command, errors, warnings, suggestions);
          break;

        case 'criar_meta':
          this.validateGoalCommand(command, errors, warnings, suggestions);
          break;

        case 'criar_orcamento':
          this.validateBudgetCommand(command, errors, warnings, suggestions);
          break;

        case 'consultar_saldo':
        case 'consultar_gastos':
        case 'analisar_categoria':
          // Consultas geralmente não precisam de validação específica
          break;

        case 'unknown':
          errors.push('Não consegui entender o que você quer fazer');
          suggestions.push('Tente ser mais específico, como "gastei 50 reais no supermercado"');
          break;

        default:
          warnings.push('Este tipo de comando ainda está em desenvolvimento');
      }

      // Verificar confiança geral
      if (command.confidence < this.config.confidence_threshold) {
        warnings.push('Não tenho certeza sobre o que você quer fazer');
        suggestions.push('Pode reformular de forma mais clara?');
      }

      const isValid = errors.length === 0;
      let clarificationMessage: string | undefined;

      if (!isValid || warnings.length > 0) {
        clarificationMessage = this.generateClarificationMessage(command, errors, warnings);
      }

      return {
        isValid,
        errors,
        warnings,
        clarificationMessage,
        suggestions
      };

    } catch (error) {
      console.error('❌ Erro ao validar comando:', error);
      return {
        isValid: false,
        errors: ['Erro interno na validação'],
        warnings: [],
        suggestions: ['Tente novamente ou reformule o comando']
      };
    }
  }

  /**
   * Sugere correções para comandos mal formados
   */
  async suggestCorrections(command: ParsedCommand): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      // Sugestões baseadas no tipo de intenção
      switch (command.intent.tipo) {
        case 'criar_despesa':
          if (!command.entities.valor) {
            suggestions.push('Inclua o valor gasto, ex: "gastei 50 reais"');
          }
          if (!command.entities.categoria) {
            suggestions.push('Mencione a categoria, ex: "no supermercado" ou "com alimentação"');
          }
          break;

        case 'criar_receita':
          if (!command.entities.valor) {
            suggestions.push('Inclua o valor recebido, ex: "recebi 2000 reais"');
          }
          break;

        case 'criar_transferencia':
          suggestions.push('Para transferências, informe: valor, conta origem e destino');
          suggestions.push('Ex: "transferi 500 da poupança para corrente"');
          break;

        case 'unknown':
          suggestions.push('Comandos que posso entender:');
          suggestions.push('• "Gastei X reais em Y"');
          suggestions.push('• "Recebi X de salário"');
          suggestions.push('• "Qual meu saldo?"');
          suggestions.push('• "Criar meta de X para Y"');
          break;
      }

    } catch (error) {
      console.error('❌ Erro ao gerar correções:', error);
      suggestions.push('Tente reformular sua mensagem de forma mais clara');
    }

    return suggestions;
  }

  // Métodos privados de processamento

  private normalizeInput(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\d.,]/g, ' ') // Remove pontuação especial
      .replace(/\s+/g, ' '); // Normaliza espaços
  }

  private async extractEntities(text: string, context: FinancialContext): Promise<ExtractedEntities> {
    console.log('🔍 Extraindo entidades de:', text);

    // Padrões para extração de entidades
    const patterns = {
      // Valores monetários
      valor: /(?:r\$\s*)?(\d+(?:\.\d{3})*(?:,\d{2})?|\d+)/gi,
      
      // Datas
      data: /(?:ontem|hoje|amanhã|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{1,2}\s+de\s+\w+)/gi,
      
      // Parcelas
      parcelas: /(?:(\d+)x|(\d+)\s*vezes|(\d+)\s*parcelas?)/gi,
      
      // Tipos de transação
      tipos: /(?:gast(?:ei|o)|comprei|paguei|recebi|ganhei|transferi)/gi
    };

    // Extrair valores
    const valores = this.extractValues(text, patterns.valor);
    
    // Extrair datas
    const datas = this.extractDates(text, patterns.data);
    
    // Extrair categorias (baseado no contexto do usuário)
    const categorias = this.extractCategories(text, context);
    
    // Extrair contas
    const contas = this.extractAccounts(text, context);
    
    // Extrair parcelas
    const parcelas = this.extractInstallments(text, patterns.parcelas);
    
    // Extrair tipos
    const tipos = this.extractTypes(text, patterns.tipos);
    
    // Extrair descrições (resto do texto)
    const descricoes = this.extractDescriptions(text, [valores, datas, categorias, contas]);

    return {
      valores,
      categorias,
      datas,
      contas,
      parcelas,
      descricoes,
      tipos
    };
  }

  private async classifyIntent(text: string, context: FinancialContext): Promise<Intent> {
    console.log('🎯 Classificando intenção');

    // Padrões de intenção (ordem importa - mais específicos primeiro)
    const intentPatterns: Array<{ pattern: RegExp; intent: IntentType; confidence: number }> = [
      // Criação de transações
      { pattern: /(?:gastei|comprei|paguei).+(?:reais?|r\$)/i, intent: 'criar_despesa', confidence: 0.9 },
      { pattern: /(?:recebi|ganhei).+(?:reais?|r\$)/i, intent: 'criar_receita', confidence: 0.9 },
      { pattern: /transferi.+(?:para|da|de)/i, intent: 'criar_transferencia', confidence: 0.8 },
      { pattern: /(?:parcel|dividir|financ).+(?:vezes|x)/i, intent: 'criar_parcelado', confidence: 0.8 },
      
      // Consultas
      { pattern: /(?:qual|quanto|como está).+saldo/i, intent: 'consultar_saldo', confidence: 0.9 },
      { pattern: /(?:quanto|onde).+(?:gastei|gasto)/i, intent: 'consultar_gastos', confidence: 0.8 },
      
      // Metas e orçamentos
      { pattern: /(?:criar|quero|meta).+(?:juntar|guardar|poupar)/i, intent: 'criar_meta', confidence: 0.8 },
      { pattern: /(?:orçamento|limite|máximo).+(?:categoria|mês)/i, intent: 'criar_orcamento', confidence: 0.8 },
      
      // Ajuda
      { pattern: /(?:ajuda|help|como|o que posso)/i, intent: 'ajuda', confidence: 0.7 },
    ];

    // Testar padrões
    for (const { pattern, intent, confidence } of intentPatterns) {
      if (pattern.test(text)) {
        console.log(`✅ Intenção detectada: ${intent} (${confidence})`);
        return { tipo: intent, confianca: confidence };
      }
    }

    // Se nenhum padrão foi encontrado
    console.log('❓ Intenção desconhecida');
    return { tipo: 'unknown', confianca: 0 };
  }

  private async resolveAmbiguity(entities: ExtractedEntities, context: FinancialContext): Promise<ResolvedEntities> {
    console.log('🤔 Resolvendo ambiguidades');

    const resolved: ResolvedEntities = {};

    try {
      // Resolver valor (primeiro valor encontrado)
      if (entities.valores.length > 0) {
        resolved.valor = entities.valores[0];
      }

      // Resolver categoria
      if (entities.categorias.length > 0) {
        resolved.categoria = await this.resolveCategoryAmbiguity(entities.categorias, context);
      }

      // Resolver conta
      if (entities.contas.length > 0) {
        resolved.conta = await this.resolveAccountAmbiguity(entities.contas, context);
      } else {
        // Usar conta padrão se disponível
        resolved.conta = await this.getDefaultAccount(context);
      }

      // Resolver data
      if (entities.datas.length > 0) {
        resolved.data = this.resolveDateAmbiguity(entities.datas);
      } else {
        resolved.data = new Date(); // Hoje por padrão
      }

      // Resolver tipo de transação
      if (entities.tipos.length > 0) {
        resolved.tipo = this.resolveTypeAmbiguity(entities.tipos);
      }

      // Resolver descrição
      if (entities.descricoes.length > 0) {
        resolved.descricao = entities.descricoes[0];
      }

      // Resolver parcelas
      if (entities.parcelas.length > 0) {
        resolved.parcelas = entities.parcelas[0];
      }

    } catch (error) {
      console.error('❌ Erro ao resolver ambiguidades:', error);
    }

    return resolved;
  }

  // Métodos auxiliares de extração

  private extractValues(text: string, pattern: RegExp): number[] {
    const matches = Array.from(text.matchAll(pattern));
    return matches
      .map(match => {
        const value = match[1]?.replace(/\./g, '').replace(',', '.');
        return parseFloat(value);
      })
      .filter(value => !isNaN(value) && value > 0);
  }

  private extractDates(text: string, pattern: RegExp): Date[] {
    const matches = Array.from(text.matchAll(pattern));
    const dates: Date[] = [];

    for (const match of matches) {
      const dateStr = match[0].toLowerCase();
      
      if (dateStr === 'hoje') {
        dates.push(new Date());
      } else if (dateStr === 'ontem') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        dates.push(yesterday);
      } else if (dateStr === 'amanhã') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dates.push(tomorrow);
      } else {
        // Tentar parsear datas em formato brasileiro
        const parsed = this.parseBrazilianDate(dateStr);
        if (parsed) dates.push(parsed);
      }
    }

    return dates;
  }

  private extractCategories(text: string, context: FinancialContext): string[] {
    const categories: string[] = [];
    
    // Buscar por nomes de categorias do usuário
    for (const categoria of context.historico.categorias_preferidas) {
      if (text.includes(categoria.categoria_nome.toLowerCase())) {
        categories.push(categoria.categoria_nome);
      }
    }

    // Palavras-chave comuns para categorias
    const categoryKeywords: { [key: string]: string[] } = {
      'Alimentação': ['supermercado', 'mercado', 'comida', 'restaurante', 'lanche', 'almoço'],
      'Transporte': ['uber', 'taxi', 'ônibus', 'metrô', 'combustível', 'gasolina'],
      'Saúde': ['farmácia', 'médico', 'consulta', 'remédio', 'hospital'],
      'Lazer': ['cinema', 'teatro', 'festa', 'diversão', 'entretenimento'],
      'Compras': ['loja', 'compra', 'shopping', 'roupas', 'eletrônicos'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          categories.push(category);
          break;
        }
      }
    }

    return [...new Set(categories)]; // Remove duplicatas
  }

  private extractAccounts(text: string, context: FinancialContext): string[] {
    const accounts: string[] = [];
    
    // Buscar por nomes de contas do usuário
    for (const conta of context.patrimonio.contas) {
      if (text.includes(conta.nome.toLowerCase())) {
        accounts.push(conta.nome);
      }
    }

    // Palavras-chave comuns para tipos de conta
    const accountKeywords: { [key: string]: string[] } = {
      'corrente': ['corrente', 'conta corrente'],
      'poupança': ['poupança', 'poupanca'],
      'carteira': ['carteira', 'dinheiro', 'cash'],
    };

    for (const [type, keywords] of Object.entries(accountKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          accounts.push(type);
          break;
        }
      }
    }

    return [...new Set(accounts)];
  }

  private extractInstallments(text: string, pattern: RegExp): number[] {
    const matches = Array.from(text.matchAll(pattern));
    return matches
      .map(match => {
        const num = match[1] || match[2] || match[3];
        return parseInt(num);
      })
      .filter(num => !isNaN(num) && num > 1 && num <= 60); // Max 60 parcelas
  }

  private extractTypes(text: string, pattern: RegExp): ('receita' | 'despesa')[] {
    const matches = Array.from(text.matchAll(pattern));
    const types: ('receita' | 'despesa')[] = [];

    for (const match of matches) {
      const verb = match[0].toLowerCase();
      
      if (['recebi', 'ganhei'].some(v => verb.includes(v))) {
        types.push('receita');
      } else if (['gastei', 'comprei', 'paguei'].some(v => verb.includes(v))) {
        types.push('despesa');
      }
    }

    return [...new Set(types)];
  }

  private extractDescriptions(text: string, extractedEntities: any[]): string[] {
    // Remove entidades já extraídas e retorna o resto como descrição
    let cleanText = text;
    
    // Remove valores, datas, etc. (implementação simplificada)
    cleanText = cleanText.replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
    
    return cleanText ? [cleanText] : [];
  }

  // Métodos de resolução de ambiguidade

  private async resolveCategoryAmbiguity(categories: string[], context: FinancialContext) {
    // Buscar categoria mais provável baseada no histórico
    for (const categoryName of categories) {
      const found = context.historico.categorias_preferidas.find(
        cat => cat.categoria_nome.toLowerCase() === categoryName.toLowerCase()
      );
      if (found) {
        return {
          id: found.categoria_id,
          nome: found.categoria_nome,
          tipo: 'despesa' // Assumir despesa por padrão
        };
      }
    }
    return undefined;
  }

  private async resolveAccountAmbiguity(accounts: string[], context: FinancialContext) {
    // Buscar conta mais provável
    for (const accountName of accounts) {
      const found = context.patrimonio.contas.find(
        acc => acc.nome.toLowerCase().includes(accountName.toLowerCase())
      );
      if (found) {
        return {
          id: found.id,
          nome: found.nome
        };
      }
    }
    return undefined;
  }

  private async getDefaultAccount(context: FinancialContext) {
    // Retornar primeira conta disponível ou conta padrão
    const defaultAccountId = context.usuario.preferencias.default_account_id;
    
    if (defaultAccountId) {
      const found = context.patrimonio.contas.find(acc => acc.id === defaultAccountId);
      if (found) {
        return { id: found.id, nome: found.nome };
      }
    }

    // Primeira conta disponível
    if (context.patrimonio.contas.length > 0) {
      const first = context.patrimonio.contas[0];
      return { id: first.id, nome: first.nome };
    }

    return undefined;
  }

  private resolveDateAmbiguity(dates: Date[]): Date {
    // Retornar primeira data ou hoje
    return dates.length > 0 ? dates[0] : new Date();
  }

  private resolveTypeAmbiguity(types: ('receita' | 'despesa')[]): 'receita' | 'despesa' | undefined {
    return types.length > 0 ? types[0] : undefined;
  }

  private parseBrazilianDate(dateStr: string): Date | null {
    // Implementação simples para formato DD/MM ou DD/MM/YYYY
    const patterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{1,2})\/(\d{1,2})/
    ];

    for (const pattern of patterns) {
      const match = dateStr.match(pattern);
      if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1; // JavaScript months are 0-based
        const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
        
        const date = new Date(year, month, day);
        if (date.getDate() === day && date.getMonth() === month) {
          return date;
        }
      }
    }

    return null;
  }

  // Métodos de validação específicos

  private validateTransactionCommand(command: ParsedCommand, errors: string[], warnings: string[], suggestions: string[]) {
    if (!command.entities.valor) {
      errors.push('Valor da transação é obrigatório');
      suggestions.push('Informe o valor, ex: "gastei 50 reais"');
    }

    if (!command.entities.categoria && !command.entities.descricao) {
      warnings.push('Seria útil informar a categoria ou descrição');
      suggestions.push('Ex: "no supermercado" ou "com alimentação"');
    }
  }

  private validateTransferCommand(command: ParsedCommand, errors: string[], warnings: string[], suggestions: string[]) {
    if (!command.entities.valor) {
      errors.push('Valor da transferência é obrigatório');
    }
    
    warnings.push('Para transferências, preciso saber as contas de origem e destino');
    suggestions.push('Ex: "transferi 500 da poupança para corrente"');
  }

  private validateInstallmentCommand(command: ParsedCommand, errors: string[], warnings: string[], suggestions: string[]) {
    if (!command.entities.valor) {
      errors.push('Valor total é obrigatório para parcelamento');
    }

    if (!command.entities.parcelas) {
      errors.push('Número de parcelas é obrigatório');
      suggestions.push('Ex: "em 6 vezes" ou "6x"');
    }
  }

  private validateGoalCommand(command: ParsedCommand, errors: string[], warnings: string[], suggestions: string[]) {
    if (!command.entities.valor) {
      errors.push('Valor da meta é obrigatório');
      suggestions.push('Ex: "meta de 5000 para viagem"');
    }
  }

  private validateBudgetCommand(command: ParsedCommand, errors: string[], warnings: string[], suggestions: string[]) {
    if (!command.entities.valor) {
      errors.push('Valor do orçamento é obrigatório');
    }

    if (!command.entities.categoria) {
      errors.push('Categoria do orçamento é obrigatória');
      suggestions.push('Ex: "orçamento de 400 para alimentação"');
    }
  }

  private calculateOverallConfidence(intent: Intent, entities: ExtractedEntities, resolved: ResolvedEntities): number {
    let confidence = intent.confianca;

    // Ajustar baseado na qualidade das entidades extraídas
    const entityScore = Object.keys(resolved).length / 5; // Máximo 5 entidades principais
    confidence = (confidence + entityScore) / 2;

    // Penalizar se entidades críticas estão faltando
    if (intent.tipo.includes('criar_') && !resolved.valor) {
      confidence *= 0.5; // Penalidade severa por falta de valor
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private generateClarificationMessage(command: ParsedCommand, errors: string[], warnings: string[]): string {
    if (errors.length > 0) {
      return `Preciso de mais informações: ${errors.join(', ')}`;
    }

    if (warnings.length > 0) {
      return `Entendi parcialmente. ${warnings.join(', ')}`;
    }

    return 'Posso prosseguir com essas informações?';
  }
}

// Instância única exportada
export const aiCommandInterpreter = AICommandInterpreter.getInstance(); 