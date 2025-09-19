// Central exports for AI services
export { aiContextManager } from './AIContextManager';
export { aiCommandInterpreter } from './AICommandInterpreter';
export { aiActionExecutor } from './AIActionExecutor';
export { aiInsightGenerator } from './AIInsightGenerator';
export { aiChatService } from './AIChatService';

// 🆕 Etapa 3.2: Componentes Avançados de IA
export { aiRateLimiter } from './AIRateLimiter';
export { aiSentimentAnalyzer } from './AISentimentAnalyzer';
export { aiReportGenerator } from './AIReportGenerator';
export { aiPredictiveAlerts } from './AIPredictiveAlerts';

// 🆕 Etapa 3.3: Machine Learning e Predições
export { default as AITrendAnalyzer } from './AITrendAnalyzer';
export { default as AIAnomalyDetector } from './AIAnomalyDetector';
export { default as AIClassifier } from './AIClassifier';
export { default as AIMLEngine } from './AIMLEngine';

// Exportar tipos importantes
export type { SentimentResult } from './AISentimentAnalyzer';
export type { FinancialReport } from './AIReportGenerator';
export type { PredictiveAlert } from './AIPredictiveAlerts';

// Export types
export * from '../../types/ai'; 