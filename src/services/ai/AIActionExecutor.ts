import {
  ParsedCommand,
  OperationResult,
  FinancialContext,
  AIError,
  ContextChange
} from '../../types/ai';
import transactionService from '../api/TransactionService';
import accountService from '../api/AccountService';
import categoryService from '../api/CategoryService';
import goalService from '../api/GoalService';
import budgetService from '../api/BudgetService';
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
    try {
      const { valor, descricao } = command.entities;

      if (!valor) {
        return {
          type: 'clarification_needed',
          message: 'Preciso saber o valor da transferência',
          suggestions: ['Ex: "transferi 500 da poupança para corrente"']
        };
      }

      // Identificar contas de origem e destino
      const contasDisponiveis = context.patrimonio.contas;

      if (contasDisponiveis.length < 2) {
        return {
          type: 'error',
          message: 'Você precisa ter pelo menos 2 contas para fazer uma transferência',
          suggestions: ['Cadastre mais contas antes de fazer transferências']
        };
      }

      // Tentar identificar contas mencionadas no texto
      let contaOrigem = command.entities.conta;
      let contaDestino = null;

      // Se não identificou automaticamente, pedir esclarecimento
      if (!contaOrigem) {
        const contasList = contasDisponiveis.map(c => `• ${c.nome}: ${this.formatCurrency(c.saldo_atual)}`).join('\n');

        return {
          type: 'clarification_needed',
          message: `Preciso saber de qual conta sairá o dinheiro e para qual irá.\n\nContas disponíveis:\n${contasList}`,
          suggestions: [
            'Ex: "transferi 500 da conta corrente para poupança"',
            'Ex: "movi 300 da carteira para banco"'
          ]
        };
      }

      // Buscar a primeira conta que não seja a origem como destino (simplificação)
      const contaDestinoObj = contasDisponiveis.find(c => c.id !== contaOrigem?.id);

      if (!contaDestinoObj) {
        return {
          type: 'error',
          message: 'Não consegui identificar a conta de destino',
          suggestions: ['Especifique claramente as contas de origem e destino']
        };
      }

      // Verificar saldo suficiente
      const contaOrigemObj = contasDisponiveis.find(c => c.id === contaOrigem?.id);
      if (contaOrigemObj && contaOrigemObj.saldo_atual < valor) {
        return {
          type: 'error',
          message: `Saldo insuficiente na conta ${contaOrigemObj.nome}. Saldo disponível: ${this.formatCurrency(contaOrigemObj.saldo_atual)}`,
          suggestions: [
            `Transferir apenas ${this.formatCurrency(contaOrigemObj.saldo_atual)}`,
            'Escolher outra conta de origem'
          ]
        };
      }

      // Criar duas transações: uma saída e uma entrada
      const dataTransferencia = new Date();

      // Transação de saída
      const transacaoSaida = await this.transactionService.create({
        descricao: descricao || `Transferência para ${contaDestinoObj.nome}`,
        valor,
        tipo: 'despesa',
        categoria_id: await this.getTransferenciaCategoryId(),
        conta_id: contaOrigem!.id,
        data: dataTransferencia,
        user_id: userId,
        observacoes: `Transferência interna para conta ${contaDestinoObj.nome}`
      });

      // Transação de entrada
      const transacaoEntrada = await this.transactionService.create({
        descricao: descricao || `Transferência de ${contaOrigemObj?.nome}`,
        valor,
        tipo: 'receita',
        categoria_id: await this.getTransferenciaCategoryId(),
        conta_id: contaDestinoObj.id,
        data: dataTransferencia,
        user_id: userId,
        observacoes: `Transferência interna da conta ${contaOrigemObj?.nome}`
      });

      // Atualizar saldos das contas
      if (contaOrigemObj && contaDestinoObj) {
        await this.accountService.updateBalance(contaOrigem!.id, contaOrigemObj.saldo_atual - valor);
        await this.accountService.updateBalance(contaDestinoObj.id, contaDestinoObj.saldo_atual + valor);
      }

      return {
        type: 'operation_success',
        message: `✅ Transferência de ${this.formatCurrency(valor)} realizada com sucesso!`,
        impact: `${contaOrigemObj?.nome} → ${contaDestinoObj.nome}`,
        data: { saida: transacaoSaida, entrada: transacaoEntrada }
      };

    } catch (error) {
      console.error('Erro ao criar transferência:', error);
      return {
        type: 'error',
        message: 'Erro ao realizar transferência',
        suggestions: ['Verifique os dados e tente novamente']
      };
    }
  }

  private async getTransferenciaCategoryId(): Promise<number> {
    // Buscar ou criar categoria de transferência
    const categories = await this.categoryService.list();
    const transferCategory = categories.find(c =>
      c.nome.toLowerCase().includes('transfer') ||
      c.nome.toLowerCase().includes('moviment')
    );

    if (transferCategory) {
      return transferCategory.id;
    }

    // Criar categoria de transferência se não existir
    const newCategory = await this.categoryService.create({
      nome: 'Transferências',
      tipo: 'despesa',
      cor: '#6B7280',
      icone: 'arrow-right-left'
    });

    return newCategory.id;
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
    try {
      const { categoria, data } = command.entities;

      // Se não especificou categoria, mostrar resumo geral
      if (!categoria) {
        return this.executeAnaliseCategoriaGeral(context, userId);
      }

      // Análise específica da categoria
      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();

      // Buscar transações da categoria
      const { data: transacoes } = await supabase
        .from('app_transacoes')
        .select('*')
        .eq('user_id', userId)
        .eq('categoria_id', categoria.id)
        .eq('tipo', 'despesa')
        .gte('data', new Date(anoAtual, mesAtual - 1, 1).toISOString())
        .lte('data', new Date(anoAtual, mesAtual, 0).toISOString());

      if (!transacoes || transacoes.length === 0) {
        return {
          type: 'operation_success',
          message: `Nenhum gasto encontrado em ${categoria.nome} este mês`,
          suggestions: ['Verifique outros períodos ou categorias']
        };
      }

      // Calcular estatísticas
      const totalGasto = transacoes.reduce((sum, t) => sum + Number(t.valor), 0);
      const mediaGasto = totalGasto / transacoes.length;
      const maiorGasto = Math.max(...transacoes.map(t => Number(t.valor)));
      const menorGasto = Math.min(...transacoes.map(t => Number(t.valor)));

      // Buscar dados históricos para comparação
      const { data: historicoTransacoes } = await supabase
        .from('app_transacoes')
        .select('valor, data')
        .eq('user_id', userId)
        .eq('categoria_id', categoria.id)
        .eq('tipo', 'despesa')
        .gte('data', new Date(anoAtual, mesAtual - 4, 1).toISOString())
        .lte('data', new Date(anoAtual, mesAtual - 1, 0).toISOString());

      const mediaHistorica = historicoTransacoes && historicoTransacoes.length > 0
        ? historicoTransacoes.reduce((sum, t) => sum + Number(t.valor), 0) / 3 // média dos últimos 3 meses
        : 0;

      const variacao = mediaHistorica > 0
        ? ((totalGasto - mediaHistorica) / mediaHistorica) * 100
        : 0;

      // Buscar orçamento da categoria se existir
      const { data: orcamento } = await supabase
        .from('app_orcamento')
        .select('valor')
        .eq('user_id', userId)
        .eq('categoria_id', categoria.id)
        .eq('mes', mesAtual)
        .eq('ano', anoAtual)
        .single();

      let message = `📊 **Análise de ${categoria.nome}**\n\n`;
      message += `💰 **Total gasto este mês**: ${this.formatCurrency(totalGasto)}\n`;
      message += `📈 **Número de transações**: ${transacoes.length}\n`;
      message += `💵 **Gasto médio**: ${this.formatCurrency(mediaGasto)}\n`;
      message += `⬆️ **Maior gasto**: ${this.formatCurrency(maiorGasto)}\n`;
      message += `⬇️ **Menor gasto**: ${this.formatCurrency(menorGasto)}\n`;

      if (mediaHistorica > 0) {
        message += `\n📊 **Comparação com histórico**\n`;
        message += `📉 Média últimos 3 meses: ${this.formatCurrency(mediaHistorica)}\n`;
        message += `📈 Variação: ${variacao > 0 ? '+' : ''}${variacao.toFixed(1)}%\n`;
      }

      if (orcamento) {
        const percentualUsado = (totalGasto / orcamento.valor) * 100;
        message += `\n💼 **Orçamento**\n`;
        message += `📋 Limite: ${this.formatCurrency(orcamento.valor)}\n`;
        message += `📊 Usado: ${percentualUsado.toFixed(1)}%\n`;
        message += `💰 Disponível: ${this.formatCurrency(orcamento.valor - totalGasto)}\n`;
      }

      // Gerar insights específicos
      const insights: Insight[] = [];

      if (variacao > 30) {
        insights.push({
          id: `cat_${Date.now()}`,
          tipo: 'alerta',
          titulo: 'Aumento significativo de gastos',
          descricao: `Gastos em ${categoria.nome} aumentaram ${variacao.toFixed(0)}%`,
          acao: 'Revise os gastos e identifique oportunidades de economia',
          prioridade: 'alta',
          categoria_afetada: categoria.nome,
          valor_impacto: totalGasto - mediaHistorica,
          created_at: new Date()
        });
      }

      if (orcamento && totalGasto > orcamento.valor) {
        insights.push({
          id: `orc_${Date.now()}`,
          tipo: 'alerta',
          titulo: 'Orçamento excedido!',
          descricao: `Você ultrapassou o orçamento de ${categoria.nome} em ${this.formatCurrency(totalGasto - orcamento.valor)}`,
          acao: 'Evite novos gastos nesta categoria este mês',
          prioridade: 'urgente',
          categoria_afetada: categoria.nome,
          valor_impacto: totalGasto - orcamento.valor,
          created_at: new Date()
        });
      }

      return {
        type: 'operation_success',
        message,
        insights,
        data: {
          categoria: categoria.nome,
          total: totalGasto,
          transacoes: transacoes.length,
          media: mediaGasto,
          variacao
        }
      };

    } catch (error) {
      console.error('Erro ao analisar categoria:', error);
      return {
        type: 'error',
        message: 'Erro ao analisar categoria',
        suggestions: ['Tente novamente ou escolha outra categoria']
      };
    }
  }

  private async executeAnaliseCategoriaGeral(context: FinancialContext, userId: string): Promise<OperationResult> {
    try {
      // Análise geral de todas as categorias
      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();

      const { data: gastosPorCategoria } = await supabase
        .from('app_transacoes')
        .select(`
          categoria_id,
          valor,
          app_categoria!inner(nome)
        `)
        .eq('user_id', userId)
        .eq('tipo', 'despesa')
        .gte('data', new Date(anoAtual, mesAtual - 1, 1).toISOString())
        .lte('data', new Date(anoAtual, mesAtual, 0).toISOString());

      if (!gastosPorCategoria || gastosPorCategoria.length === 0) {
        return {
          type: 'operation_success',
          message: 'Nenhum gasto encontrado este mês',
          suggestions: ['Registre suas transações para obter análises']
        };
      }

      // Agrupar por categoria
      const categoriasTotais = new Map<string, { total: number; count: number }>();

      gastosPorCategoria.forEach((t: any) => {
        const nome = t.app_categoria?.nome || 'Sem categoria';
        const atual = categoriasTotais.get(nome) || { total: 0, count: 0 };
        categoriasTotais.set(nome, {
          total: atual.total + Number(t.valor),
          count: atual.count + 1
        });
      });

      // Ordenar por valor total
      const categoriasOrdenadas = Array.from(categoriasTotais.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10); // Top 10 categorias

      let message = '📊 **Análise Geral de Categorias**\n\n';
      message += '**Top Categorias de Gastos:**\n\n';

      let totalGeral = 0;
      categoriasOrdenadas.forEach(([nome, dados], index) => {
        totalGeral += dados.total;
        const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📌';
        message += `${emoji} **${nome}**: ${this.formatCurrency(dados.total)} (${dados.count} transações)\n`;
      });

      message += `\n💰 **Total Geral**: ${this.formatCurrency(totalGeral)}\n`;

      // Categoria com maior gasto médio
      const categoriasMédias = Array.from(categoriasTotais.entries())
        .map(([nome, dados]) => ({ nome, media: dados.total / dados.count }))
        .sort((a, b) => b.media - a.media)[0];

      if (categoriasMédias) {
        message += `\n💡 **Dica**: ${categoriasMédias.nome} tem o maior gasto médio (${this.formatCurrency(categoriasMédias.media)} por transação)`;
      }

      return {
        type: 'operation_success',
        message,
        data: {
          categorias: Object.fromEntries(categoriasTotais),
          total: totalGeral
        }
      };

    } catch (error) {
      console.error('Erro na análise geral:', error);
      return {
        type: 'error',
        message: 'Erro ao analisar categorias',
        suggestions: ['Tente novamente mais tarde']
      };
    }
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