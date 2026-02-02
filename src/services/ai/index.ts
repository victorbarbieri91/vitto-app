// Central exports for AI services
// Serviços ativos que usam arquitetura segura (Edge Functions)

// Contexto e Alertas Preditivos (usados por AlertaInteligenteCard)
export { AIContextManager } from './AIContextManager';
export { AIPredictiveAlerts } from './AIPredictiveAlerts';

// Serviços de Importação (usados pela Central IA)
export { smartImportService } from './SmartImportService';
export { createImportAgent, ConversationalImportAgent } from './ConversationalImportAgent';

// Exportar tipos importantes
export type { PredictiveAlert } from './AIPredictiveAlerts';

// Export types
export * from '../../types/ai';
