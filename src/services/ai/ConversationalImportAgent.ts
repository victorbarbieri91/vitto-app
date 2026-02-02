/**
 * Agente de Importacao Conversacional
 *
 * Guia o usuario passo a passo no processo de importacao de documentos financeiros.
 * Usa GPT Vision para imagens e DeepSeek para texto/PDFs.
 */

import { supabase } from '../supabase/client';
import { documentProcessor } from './DocumentProcessor';
import type {
  ImportFlowState,
  ImportFlowAction,
  ImportFlowStep,
  DocumentType,
  ExtractedTransaction,
  ImportQuestion,
  AvailableCard,
  AvailableAccount,
  AvailableCategory,
  ImportAgentConfig,
  ImportChatMessage
} from '../../types/import-flow';

// Estado inicial
const initialState: ImportFlowState = {
  step: 'idle',
  transacoes: [],
  totalTransacoes: 0,
  valorTotal: 0,
  questionsHistory: [],
  observacoes: [],
  alertas: []
};

export class ConversationalImportAgent {
  private state: ImportFlowState = { ...initialState };
  private config: ImportAgentConfig;
  private onStateChange?: (state: ImportFlowState) => void;
  private onMessage?: (message: ImportChatMessage) => void;

  constructor(config: ImportAgentConfig) {
    this.config = config;
  }

  // Registrar callbacks
  public setCallbacks(callbacks: {
    onStateChange?: (state: ImportFlowState) => void;
    onMessage?: (message: ImportChatMessage) => void;
  }) {
    this.onStateChange = callbacks.onStateChange;
    this.onMessage = callbacks.onMessage;
  }

  // Obter estado atual
  public getState(): ImportFlowState {
    return { ...this.state };
  }

  // Resetar estado
  public reset() {
    this.state = { ...initialState };
    this.notifyStateChange();
  }

  // Processar arquivo
  public async processFile(file: File): Promise<void> {
    this.dispatch({ type: 'START_ANALYSIS', fileName: file.name, fileType: this.getFileType(file) });

    this.sendMessage({
      tipo: 'sistema',
      conteudo: `📄 Analisando "${file.name}"...`
    });

    try {
      // Processar documento usando DocumentProcessor
      const result = await documentProcessor.processDocument(file, this.config.userId);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao processar documento');
      }

      const { tipo_documento, confianca, dados_extraidos, observacoes } = result.data;

      // Converter transacoes extraidas
      const transacoes: ExtractedTransaction[] = (dados_extraidos.transacoes || []).map((t, index) => ({
        id: `tx_${index}_${Date.now()}`,
        data: t.data,
        descricao: t.descricao,
        valor: t.valor,
        tipo: t.tipo,
        categoria_id: this.suggestCategory(t.descricao, t.categoria_sugerida),
        categoria_nome: t.categoria_sugerida,
        selecionada: true,
        duplicata: false
      }));

      this.dispatch({
        type: 'ANALYSIS_COMPLETE',
        documentType: tipo_documento as DocumentType,
        confianca,
        transacoes,
        observacoes: observacoes || []
      });

      // Iniciar fluxo conversacional baseado no tipo de documento
      await this.startConversationalFlow();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.dispatch({ type: 'ANALYSIS_ERROR', error: errorMessage });

      this.sendMessage({
        tipo: 'sistema',
        conteudo: `❌ Erro ao processar arquivo: ${errorMessage}\n\nDicas:\n• Tente uma imagem com melhor qualidade\n• Use PDF em vez de imagem se possível\n• Verifique se o documento está legível`
      });
    }
  }

  // Iniciar fluxo conversacional apos analise
  private async startConversationalFlow(): Promise<void> {
    const { documentType, confianca, transacoes, observacoes } = this.state;

    // Mensagem inicial com resumo
    const resumo = this.buildAnalysisSummary();
    this.sendMessage({
      tipo: 'sistema',
      conteudo: resumo
    });

    // Se confianca baixa, pedir confirmacao do tipo
    if (confianca && confianca < 0.7) {
      await this.askDocumentTypeConfirmation();
      return;
    }

    // Se for fatura de cartao, perguntar qual cartao
    if (documentType === 'fatura_cartao') {
      await this.askCardSelection();
      return;
    }

    // Se for extrato bancario, perguntar qual conta
    if (documentType === 'extrato_bancario') {
      await this.askAccountSelection();
      return;
    }

    // Para outros tipos (planilha, lista, outro), perguntar onde quer importar
    await this.askDestinationType();
  }

  // Construir resumo da analise
  private buildAnalysisSummary(): string {
    const { documentType, transacoes, confianca } = this.state;
    const total = transacoes.reduce((sum, t) => sum + t.valor, 0);

    const tipoLabel = this.getDocumentTypeLabel(documentType);
    const confiancaLabel = confianca && confianca >= 0.8 ? '✅' : confianca && confianca >= 0.6 ? '⚠️' : '❓';

    let message = `${confiancaLabel} **Documento identificado: ${tipoLabel}**\n\n`;
    message += `📊 Encontrei **${transacoes.length} transações** totalizando **R$ ${total.toFixed(2).replace('.', ',')}**\n`;

    if (this.state.observacoes.length > 0) {
      message += `\n📝 Observações:\n`;
      this.state.observacoes.forEach(obs => {
        message += `• ${obs}\n`;
      });
    }

    return message;
  }

  // Perguntar confirmacao do tipo de documento
  private async askDocumentTypeConfirmation(): Promise<void> {
    const question: ImportQuestion = {
      id: 'confirm_type',
      tipo: 'single_choice',
      pergunta: 'Não tenho certeza do tipo de documento. Pode confirmar?',
      opcoes: [
        { id: 'fatura_cartao', label: '💳 Fatura de Cartão', descricao: 'Compras no crédito' },
        { id: 'extrato_bancario', label: '🏦 Extrato Bancário', descricao: 'Movimentações de conta' },
        { id: 'comprovante_pix', label: '📱 Comprovante PIX', descricao: 'Transferência PIX' },
        { id: 'outro', label: '📄 Outro', descricao: 'Não sei / outro tipo' }
      ],
      obrigatoria: true
    };

    this.updateState({ step: 'confirming_type', currentQuestion: question });

    this.sendMessage({
      tipo: 'pergunta',
      conteudo: question.pergunta,
      dados: { question }
    });
  }

  // Perguntar qual cartao
  private async askCardSelection(): Promise<void> {
    const cards = this.config.cards;

    if (cards.length === 0) {
      this.sendMessage({
        tipo: 'sistema',
        conteudo: '⚠️ Você não tem cartões cadastrados. Cadastre um cartão primeiro em Configurações > Cartões.'
      });
      return;
    }

    // Tentar identificar cartao automaticamente
    const suggestedCard = this.tryIdentifyCard();

    const question: ImportQuestion = {
      id: 'select_card',
      tipo: 'single_choice',
      pergunta: suggestedCard
        ? `Parece ser do cartão **${suggestedCard.nome}**. Está correto?`
        : 'Para qual cartão devo importar essas transações?',
      opcoes: cards.map(c => ({
        id: c.id,
        label: `💳 ${c.nome}`,
        descricao: c.ultimos_digitos ? `Final ${c.ultimos_digitos}` : undefined
      })),
      obrigatoria: true
    };

    this.updateState({ step: 'selecting_destination', currentQuestion: question });

    this.sendMessage({
      tipo: 'pergunta',
      conteudo: question.pergunta,
      dados: { question }
    });
  }

  // Perguntar qual conta
  private async askAccountSelection(): Promise<void> {
    const accounts = this.config.accounts;

    if (accounts.length === 0) {
      this.sendMessage({
        tipo: 'sistema',
        conteudo: '⚠️ Você não tem contas cadastradas. Cadastre uma conta primeiro em Configurações > Contas.'
      });
      return;
    }

    const question: ImportQuestion = {
      id: 'select_account',
      tipo: 'single_choice',
      pergunta: 'Para qual conta bancária devo importar?',
      opcoes: accounts.map(a => ({
        id: a.id,
        label: `🏦 ${a.nome}`,
        descricao: `Saldo: R$ ${a.saldo_atual.toFixed(2).replace('.', ',')}`
      })),
      obrigatoria: true
    };

    this.updateState({ step: 'selecting_destination', currentQuestion: question });

    this.sendMessage({
      tipo: 'pergunta',
      conteudo: question.pergunta,
      dados: { question }
    });
  }

  // Perguntar tipo de destino (para documentos genéricos)
  private async askDestinationType(): Promise<void> {
    const hasCards = this.config.cards.length > 0;
    const hasAccounts = this.config.accounts.length > 0;

    if (!hasCards && !hasAccounts) {
      this.sendMessage({
        tipo: 'sistema',
        conteudo: '⚠️ Você não tem cartões nem contas cadastradas. Cadastre pelo menos um em Configurações primeiro.'
      });
      return;
    }

    const opcoes = [];

    if (hasCards) {
      opcoes.push({
        id: 'cartao',
        label: '💳 Fatura de Cartão',
        descricao: 'Importar como gastos no cartão de crédito'
      });
    }

    if (hasAccounts) {
      opcoes.push({
        id: 'conta',
        label: '🏦 Movimentos de Conta',
        descricao: 'Importar como transações da conta bancária'
      });
    }

    opcoes.push({
      id: 'avulso',
      label: '📝 Transações Avulsas',
      descricao: 'Importar sem vincular a cartão ou conta específica'
    });

    const question: ImportQuestion = {
      id: 'select_destination_type',
      tipo: 'single_choice',
      pergunta: 'Como você gostaria de importar essas transações?',
      opcoes,
      obrigatoria: true
    };

    this.updateState({ step: 'selecting_destination', currentQuestion: question });

    this.sendMessage({
      tipo: 'pergunta',
      conteudo: question.pergunta,
      dados: { question }
    });
  }

  // Perguntar se precisa ajustar período (para contas)
  private async askPeriodConfirmation(): Promise<void> {
    const question: ImportQuestion = {
      id: 'need_period_adjustment',
      tipo: 'single_choice',
      pergunta: 'As datas das transações estão corretas ou preciso ajustar para um mês específico?',
      opcoes: [
        { id: 'correct', label: '✅ Datas estão corretas', descricao: 'Manter as datas como foram lidas' },
        { id: 'adjust', label: '📅 Ajustar período', descricao: 'As datas podem estar erradas' }
      ],
      obrigatoria: true
    };

    this.updateState({ step: 'collecting_data', currentQuestion: question });

    this.sendMessage({
      tipo: 'pergunta',
      conteudo: question.pergunta,
      dados: { question }
    });
  }

  // Perguntar mes/ano de referencia
  private async askPeriodSelection(): Promise<void> {
    const now = new Date();
    const months = [];

    // Ultimos 3 meses como opcoes
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mes = date.getMonth() + 1;
      const ano = date.getFullYear();
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      months.push({ id: `${mes}_${ano}`, label: `📅 ${label}` });
    }

    const question: ImportQuestion = {
      id: 'select_period',
      tipo: 'single_choice',
      pergunta: 'Qual o mês de referência?',
      opcoes: months,
      obrigatoria: true
    };

    this.updateState({ step: 'collecting_data', currentQuestion: question });

    this.sendMessage({
      tipo: 'pergunta',
      conteudo: question.pergunta,
      dados: { question }
    });
  }

  // Responder pergunta
  public async answerQuestion(questionId: string, answer: string | number): Promise<void> {
    const { currentQuestion } = this.state;

    if (!currentQuestion || currentQuestion.id !== questionId) {
      return;
    }

    // Registrar resposta
    this.state.questionsHistory.push({ ...currentQuestion, resposta: answer });

    // Processar resposta baseado no tipo de pergunta
    switch (questionId) {
      case 'confirm_type':
        this.dispatch({ type: 'CONFIRM_TYPE', documentType: answer as DocumentType });
        if (answer === 'fatura_cartao') {
          await this.askCardSelection();
        } else if (answer === 'extrato_bancario') {
          await this.askAccountSelection();
        } else {
          this.showPreview();
        }
        break;

      case 'select_card':
        const card = this.config.cards.find(c => c.id === answer);
        if (card) {
          this.dispatch({ type: 'SELECT_CARD', cartaoId: card.id, cartaoNome: card.nome });
          this.sendMessage({
            tipo: 'sistema',
            conteudo: `✅ Selecionado: **${card.nome}**`
          });
          await this.askPeriodSelection();
        }
        break;

      case 'select_account':
        const account = this.config.accounts.find(a => a.id === answer);
        if (account) {
          this.dispatch({ type: 'SELECT_ACCOUNT', contaId: account.id, contaNome: account.nome });
          this.sendMessage({
            tipo: 'sistema',
            conteudo: `✅ Selecionado: **${account.nome}**`
          });
          // Perguntar se as transações têm datas incorretas ou se precisa ajustar período
          await this.askPeriodConfirmation();
        }
        break;

      case 'select_period':
        const [mes, ano] = String(answer).split('_').map(Number);
        this.dispatch({ type: 'SET_PERIOD', mes, ano });
        this.showPreview();
        break;

      case 'select_destination_type':
        if (answer === 'cartao') {
          await this.askCardSelection();
        } else if (answer === 'conta') {
          await this.askAccountSelection();
        } else {
          // Transações avulsas - ir direto para preview
          this.sendMessage({
            tipo: 'sistema',
            conteudo: '✅ Entendido! As transações serão importadas como avulsas.'
          });
          this.showPreview();
        }
        break;

      case 'need_period_adjustment':
        if (answer === 'adjust') {
          await this.askPeriodSelection();
        } else {
          this.showPreview();
        }
        break;
    }
  }

  // Mostrar preview das transacoes
  private showPreview(): void {
    const { transacoes, cartaoNome, contaNome, documentType } = this.state;
    const total = transacoes.reduce((sum, t) => sum + t.valor, 0);
    const destino = cartaoNome || contaNome || 'Transações';

    this.updateState({ step: 'preview' });

    this.sendMessage({
      tipo: 'preview',
      conteudo: `📋 **Preview da Importação**\n\nDestino: ${destino}\nTotal: ${transacoes.length} transações = R$ ${total.toFixed(2).replace('.', ',')}`,
      dados: {
        transacoes,
        summary: {
          total: transacoes.length,
          valor: `R$ ${total.toFixed(2).replace('.', ',')}`,
          destino
        }
      }
    });

    // Perguntar confirmacao
    this.sendMessage({
      tipo: 'sistema',
      conteudo: '👆 Revise as transações acima. Você pode desmarcar as que não quer importar.\n\nQuando estiver pronto, clique em **Importar** para confirmar.'
    });
  }

  // Alternar selecao de transacao
  public toggleTransaction(transactionId: string): void {
    this.dispatch({ type: 'TOGGLE_TRANSACTION', transactionId });
  }

  // Atualizar categoria de transacao
  public updateTransactionCategory(transactionId: string, categoryId: number, categoryName: string): void {
    this.dispatch({ type: 'UPDATE_CATEGORY', transactionId, categoryId, categoryName });
  }

  // Confirmar e executar importacao
  public async confirmImport(): Promise<void> {
    const { transacoes, cartaoId, contaId, documentType, mesReferencia, anoReferencia } = this.state;

    const selectedTransactions = transacoes.filter(t => t.selecionada);

    if (selectedTransactions.length === 0) {
      this.sendMessage({
        tipo: 'sistema',
        conteudo: '⚠️ Nenhuma transação selecionada para importar.'
      });
      return;
    }

    this.dispatch({ type: 'START_IMPORT' });

    this.sendMessage({
      tipo: 'sistema',
      conteudo: `⏳ Importando ${selectedTransactions.length} transações...`
    });

    try {
      // Determinar tipo de transacao baseado no documento
      const tipoTransacao = documentType === 'fatura_cartao' ? 'despesa_cartao' :
                           documentType === 'extrato_bancario' ? 'despesa' : 'despesa';

      // Inserir transacoes no banco
      const transacoesParaInserir = selectedTransactions.map(t => ({
        user_id: this.config.userId,
        descricao: t.descricao,
        valor: t.valor,
        data: this.fixTransactionDate(t.data, mesReferencia, anoReferencia),
        tipo: t.tipo === 'credito' ? 'receita' : tipoTransacao,
        categoria_id: t.categoria_id || 13, // 13 = Outros
        cartao_id: cartaoId || null,
        conta_id: contaId || null,
        origem: 'importacao',
        status: 'confirmado'
      }));

      const { data, error } = await supabase
        .from('app_transacoes')
        .insert(transacoesParaInserir)
        .select();

      if (error) {
        throw error;
      }

      const importedCount = data?.length || 0;
      this.dispatch({ type: 'IMPORT_COMPLETE', count: importedCount });

      this.sendMessage({
        tipo: 'resultado',
        conteudo: `✅ **Importação concluída!**\n\n${importedCount} transações importadas com sucesso.`,
        dados: {
          resultado: {
            sucesso: true,
            importados: importedCount
          }
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao importar';
      this.dispatch({ type: 'IMPORT_ERROR', error: errorMessage });

      this.sendMessage({
        tipo: 'sistema',
        conteudo: `❌ Erro na importação: ${errorMessage}`
      });
    }
  }

  // Corrige a data da transacao usando mes/ano de referencia
  private fixTransactionDate(dateStr: string, mesRef?: number, anoRef?: number): string {
    const now = new Date();
    const targetYear = anoRef || now.getFullYear();
    const targetMonth = mesRef || (now.getMonth() + 1);

    // Se a data já está no formato correto YYYY-MM-DD e o ano é razoável
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1]);
      const month = parseInt(isoMatch[2]);
      const day = parseInt(isoMatch[3]);

      // Se o ano parece errado (fora de range razoável), corrigir
      if (year < 2020 || year > 2030) {
        // O "ano" provavelmente é o dia mal interpretado
        // Usar o mês/ano de referência
        const correctedDay = day <= 31 ? day : parseInt(isoMatch[1].slice(-2));
        return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(correctedDay).padStart(2, '0')}`;
      }

      // Ano está ok, mas verificar se o mês de referência foi especificado
      if (mesRef && anoRef) {
        return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }

      return dateStr; // Data já está correta
    }

    // Tenta extrair apenas o dia da string
    const dayMatch = dateStr.match(/(\d{1,2})/);
    if (dayMatch) {
      const day = Math.min(parseInt(dayMatch[1]), 31);
      return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Fallback: usar data atual com mês/ano de referência
    return `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
  }

  // Helpers
  private getFileType(file: File): 'pdf' | 'xlsx' | 'csv' | 'image' {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
    if (ext === 'csv') return 'csv';
    return 'image';
  }

  private getDocumentTypeLabel(type?: DocumentType): string {
    const labels: Record<DocumentType, string> = {
      fatura_cartao: 'Fatura de Cartão de Crédito',
      extrato_bancario: 'Extrato Bancário',
      comprovante_pix: 'Comprovante PIX',
      cupom_fiscal: 'Cupom Fiscal',
      planilha_investimentos: 'Planilha de Investimentos',
      lista_despesas_fixas: 'Lista de Despesas Fixas',
      outro: 'Documento Financeiro'
    };
    return type ? labels[type] : 'Documento';
  }

  private tryIdentifyCard(): AvailableCard | null {
    // Tentar identificar cartao pela descricao das transacoes
    const transacoes = this.state.transacoes;
    const cards = this.config.cards;

    for (const card of cards) {
      const nomeLower = card.nome.toLowerCase();
      for (const t of transacoes) {
        if (t.descricao.toLowerCase().includes(nomeLower)) {
          return card;
        }
      }
    }
    return null;
  }

  private suggestCategory(descricao: string, sugerida?: string): number | undefined {
    const desc = descricao.toLowerCase();

    // Mapeamento de palavras-chave para categoria_id
    const keywords: Record<string, number> = {
      // Alimentacao (18)
      'ifood': 18, 'restaurante': 18, 'padaria': 18, 'lanchonete': 18,
      // Mercado (25)
      'supermercado': 25, 'mercado': 25, 'hortifruti': 25, 'atacadao': 25,
      // Transporte (19)
      'uber': 19, '99': 19, 'combustivel': 19, 'gasolina': 19, 'estacionamento': 19,
      // Moradia (7)
      'aluguel': 7, 'condominio': 7, 'luz': 7, 'energia': 7, 'agua': 7, 'gas': 7,
      // Saude (21)
      'farmacia': 21, 'drogaria': 21, 'medico': 21, 'hospital': 21,
      // Lazer (20)
      'netflix': 20, 'spotify': 20, 'cinema': 20, 'steam': 20, 'playstation': 20,
      // Compras (11)
      'amazon': 11, 'mercado livre': 11, 'shein': 11, 'shopee': 11, 'aliexpress': 11,
      // Contas (12)
      'internet': 12, 'telefone': 12, 'celular': 12, 'claro': 12, 'vivo': 12, 'tim': 12
    };

    for (const [keyword, categoryId] of Object.entries(keywords)) {
      if (desc.includes(keyword)) {
        return categoryId;
      }
    }

    // Se tiver sugestao da IA, tentar mapear
    if (sugerida) {
      const sugestaoMap: Record<string, number> = {
        'alimentacao': 18, 'mercado': 25, 'transporte': 19, 'moradia': 7,
        'saude': 21, 'lazer': 20, 'compras': 11, 'contas': 12, 'outros': 13
      };
      return sugestaoMap[sugerida.toLowerCase()] || 13;
    }

    return 13; // Outros
  }

  // Dispatch action e atualizar estado
  private dispatch(action: ImportFlowAction): void {
    this.state = this.reducer(this.state, action);
    this.notifyStateChange();
  }

  private updateState(partial: Partial<ImportFlowState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  private sendMessage(message: Omit<ImportChatMessage, 'id' | 'timestamp'>): void {
    if (this.onMessage) {
      this.onMessage({
        ...message,
        id: `msg_${Date.now()}`,
        timestamp: new Date()
      });
    }
  }

  // Reducer para gerenciar estado
  private reducer(state: ImportFlowState, action: ImportFlowAction): ImportFlowState {
    switch (action.type) {
      case 'START_ANALYSIS':
        return {
          ...initialState,
          step: 'analyzing',
          fileName: action.fileName,
          fileType: action.fileType as 'pdf' | 'xlsx' | 'csv' | 'image'
        };

      case 'ANALYSIS_COMPLETE':
        return {
          ...state,
          step: 'identifying',
          documentType: action.documentType,
          confianca: action.confianca,
          transacoes: action.transacoes,
          totalTransacoes: action.transacoes.length,
          valorTotal: action.transacoes.reduce((sum, t) => sum + t.valor, 0),
          observacoes: action.observacoes
        };

      case 'ANALYSIS_ERROR':
        return {
          ...state,
          step: 'error',
          errorMessage: action.error
        };

      case 'CONFIRM_TYPE':
        return {
          ...state,
          documentType: action.documentType
        };

      case 'SELECT_CARD':
        return {
          ...state,
          cartaoId: action.cartaoId,
          cartaoNome: action.cartaoNome,
          destination: 'transacoes'
        };

      case 'SELECT_ACCOUNT':
        return {
          ...state,
          contaId: action.contaId,
          contaNome: action.contaNome,
          destination: 'transacoes'
        };

      case 'SET_PERIOD':
        return {
          ...state,
          mesReferencia: action.mes,
          anoReferencia: action.ano
        };

      case 'TOGGLE_TRANSACTION':
        return {
          ...state,
          transacoes: state.transacoes.map(t =>
            t.id === action.transactionId
              ? { ...t, selecionada: !t.selecionada }
              : t
          )
        };

      case 'UPDATE_CATEGORY':
        return {
          ...state,
          transacoes: state.transacoes.map(t =>
            t.id === action.transactionId
              ? { ...t, categoria_id: action.categoryId, categoria_nome: action.categoryName }
              : t
          )
        };

      case 'START_IMPORT':
        return {
          ...state,
          step: 'importing'
        };

      case 'IMPORT_COMPLETE':
        return {
          ...state,
          step: 'completed',
          importedCount: action.count
        };

      case 'IMPORT_ERROR':
        return {
          ...state,
          step: 'error',
          errorMessage: action.error
        };

      case 'RESET':
        return { ...initialState };

      default:
        return state;
    }
  }
}

// Factory para criar agente com dados do usuario
export async function createImportAgent(userId: string): Promise<ConversationalImportAgent> {
  // Buscar cartoes do usuario
  const { data: cards } = await supabase
    .from('app_cartao_credito')
    .select('id, nome, ultimos_quatro_digitos, dia_fechamento, dia_vencimento')
    .eq('user_id', userId);

  // Buscar contas do usuario
  const { data: accounts } = await supabase
    .from('app_conta')
    .select('id, nome, tipo, saldo_atual')
    .eq('user_id', userId);

  // Buscar categorias
  const { data: categories } = await supabase
    .from('app_categoria')
    .select('id, nome, tipo');

  const config: ImportAgentConfig = {
    userId,
    cards: (cards || []).map(c => ({
      id: c.id,
      nome: c.nome,
      ultimos_digitos: c.ultimos_quatro_digitos,
      dia_fechamento: c.dia_fechamento,
      dia_vencimento: c.dia_vencimento
    })),
    accounts: (accounts || []).map(a => ({
      id: a.id,
      nome: a.nome,
      tipo: a.tipo,
      saldo_atual: Number(a.saldo_atual) || 0
    })),
    categories: (categories || []).map(c => ({
      id: c.id,
      nome: c.nome,
      tipo: c.tipo as 'receita' | 'despesa' | 'ambos'
    }))
  };

  return new ConversationalImportAgent(config);
}
