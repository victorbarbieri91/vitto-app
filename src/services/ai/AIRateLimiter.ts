/**
 * AIRateLimiter
 * 
 * Sistema de controle de rate limiting para APIs de IA
 * Previne abuso e controla custos da OpenAI API
 */

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  cooldownPeriod: number; // ms
}

interface RateLimitState {
  requestsThisMinute: number;
  requestsThisHour: number;
  requestsThisDay: number;
  lastRequest: number;
  windowStartMinute: number;
  windowStartHour: number;
  windowStartDay: number;
}

export class AIRateLimiter {
  private static instance: AIRateLimiter;
  private config: RateLimitConfig;
  private state: Map<string, RateLimitState> = new Map();

  static getInstance(): AIRateLimiter {
    if (!AIRateLimiter.instance) {
      AIRateLimiter.instance = new AIRateLimiter();
    }
    return AIRateLimiter.instance;
  }

  constructor() {
    this.config = {
      maxRequestsPerMinute: 20,
      maxRequestsPerHour: 200,
      maxRequestsPerDay: 1000,
      cooldownPeriod: 1000 // 1 segundo
    };
  }

  /**
   * Verifica se uma requisição pode ser feita
   */
  async canMakeRequest(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    waitTime?: number;
  }> {
    const now = Date.now();
    const userState = this.getUserState(userId);

    // Verificar cooldown
    if (now - userState.lastRequest < this.config.cooldownPeriod) {
      return {
        allowed: false,
        reason: 'Por favor, aguarde um momento antes de enviar outra mensagem.',
        waitTime: this.config.cooldownPeriod - (now - userState.lastRequest)
      };
    }

    // Atualizar janelas de tempo
    this.updateTimeWindows(userState, now);

    // Verificar limites
    if (userState.requestsThisMinute >= this.config.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: 'Muitas mensagens por minuto. Tente novamente em alguns instantes.',
        waitTime: 60000 - (now - userState.windowStartMinute)
      };
    }

    if (userState.requestsThisHour >= this.config.maxRequestsPerHour) {
      return {
        allowed: false,
        reason: 'Limite de mensagens por hora atingido. Tente novamente mais tarde.',
        waitTime: 3600000 - (now - userState.windowStartHour)
      };
    }

    if (userState.requestsThisDay >= this.config.maxRequestsPerDay) {
      return {
        allowed: false,
        reason: 'Limite diário de mensagens atingido. Tente novamente amanhã.',
        waitTime: 86400000 - (now - userState.windowStartDay)
      };
    }

    return { allowed: true };
  }

  /**
   * Registra uma requisição feita
   */
  recordRequest(userId: string): void {
    const now = Date.now();
    const userState = this.getUserState(userId);

    this.updateTimeWindows(userState, now);
    
    userState.requestsThisMinute++;
    userState.requestsThisHour++;
    userState.requestsThisDay++;
    userState.lastRequest = now;

    this.state.set(userId, userState);
  }

  /**
   * Obtém estado do usuário
   */
  private getUserState(userId: string): RateLimitState {
    if (!this.state.has(userId)) {
      const now = Date.now();
      this.state.set(userId, {
        requestsThisMinute: 0,
        requestsThisHour: 0,
        requestsThisDay: 0,
        lastRequest: 0,
        windowStartMinute: now,
        windowStartHour: now,
        windowStartDay: now
      });
    }
    return this.state.get(userId)!;
  }

  /**
   * Atualiza janelas de tempo se necessário
   */
  private updateTimeWindows(userState: RateLimitState, now: number): void {
    // Reset window de minuto (60 segundos)
    if (now - userState.windowStartMinute >= 60000) {
      userState.requestsThisMinute = 0;
      userState.windowStartMinute = now;
    }

    // Reset window de hora (3600 segundos)
    if (now - userState.windowStartHour >= 3600000) {
      userState.requestsThisHour = 0;
      userState.windowStartHour = now;
    }

    // Reset window de dia (86400 segundos)
    if (now - userState.windowStartDay >= 86400000) {
      userState.requestsThisDay = 0;
      userState.windowStartDay = now;
    }
  }

  /**
   * Obtém estatísticas de uso para um usuário
   */
  getUsageStats(userId: string): {
    minute: { used: number; limit: number; remaining: number };
    hour: { used: number; limit: number; remaining: number };
    day: { used: number; limit: number; remaining: number };
  } {
    const userState = this.getUserState(userId);
    const now = Date.now();
    this.updateTimeWindows(userState, now);

    return {
      minute: {
        used: userState.requestsThisMinute,
        limit: this.config.maxRequestsPerMinute,
        remaining: this.config.maxRequestsPerMinute - userState.requestsThisMinute
      },
      hour: {
        used: userState.requestsThisHour,
        limit: this.config.maxRequestsPerHour,
        remaining: this.config.maxRequestsPerHour - userState.requestsThisHour
      },
      day: {
        used: userState.requestsThisDay,
        limit: this.config.maxRequestsPerDay,
        remaining: this.config.maxRequestsPerDay - userState.requestsThisDay
      }
    };
  }

  /**
   * Configurar limites customizados
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Limpar estado para testes
   */
  clearState(): void {
    this.state.clear();
  }
}

export const aiRateLimiter = AIRateLimiter.getInstance(); 