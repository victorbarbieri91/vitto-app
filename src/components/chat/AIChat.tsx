import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, TrendingUp, AlertTriangle, BarChart3, Heart, Brain, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiChatService } from '../../services/ai';
import { useAuth } from '../../hooks/useAuth';
import { Insight } from '../../types/ai';
import type { SentimentResult, FinancialReport, PredictiveAlert } from '../../services/ai';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  insights?: Insight[];
  sentiment?: SentimentResult;
  predictiveAlerts?: PredictiveAlert[];
  metadata?: any;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ✨ AIChat (Enhanced) - Etapa 3.2
 * 
 * Componente de chat com IA aprimorado que inclui:
 * - Análise de sentimento visual
 * - Alertas preditivos em tempo real
 * - Geração de relatórios inteligentes
 * - Rate limiting com feedback visual
 */
export default function AIChat({ isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [usageStats, setUsageStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // 🆕 Estados para novas funcionalidades
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [lastSentiment, setLastSentiment] = useState<SentimentResult | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mensagem de boas-vindas
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        text: `👋 Olá! Sou o **Vitto**, seu assistente financeiro inteligente!

💬 Posso ajudar você com:
📝 Registrar gastos e receitas
💰 Consultar saldo e extratos
🎯 Criar e acompanhar metas
📊 Analisar padrões de gastos
🔮 Gerar alertas preditivos
📋 Criar relatórios personalizados

✨ **Fale naturalmente comigo!** Como posso ajudar você hoje?`,
        isUser: false,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);

  // 🆕 Carregar estatísticas de uso
  useEffect(() => {
    if (user?.id) {
      const stats = aiChatService.getUsageStats(user.id);
      setUsageStats(stats);
    }
  }, [user?.id]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !user?.id) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await aiChatService.processMessage(
        inputValue,
        user.id,
        'default'
      );

      // 🆕 Atualizar estatísticas e sentimento
      if (response.sentiment) {
        setLastSentiment(response.sentiment);
      }
      
      const stats = aiChatService.getUsageStats(user.id);
      setUsageStats(stats);

      // Simular typing delay baseado no sentimento
      const typingDelay = response.sentiment?.sentiment === 'anxious' ? 800 : 500;
      
      setTimeout(() => {
        setIsTyping(false);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.message,
          isUser: false,
          timestamp: new Date(),
          insights: response.insights,
          sentiment: response.sentiment,
          predictiveAlerts: response.predictiveAlerts,
          metadata: response.metadata
        };

        setMessages(prev => [...prev, aiMessage]);
      }, typingDelay);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setIsTyping(false);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente.',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Gerar relatório financeiro
  const handleGenerateReport = async (type: 'monthly' | 'goal_analysis' | 'budget_review') => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const report = await aiChatService.generateFinancialReport(user.id, type);
      
      const reportMessage: Message = {
        id: Date.now().toString(),
        text: `📊 **${report.title}**\n\n**Resumo:** ${report.summary}\n\n**Análise:**\n${report.narrative}\n\n**Recomendações:**\n${report.recommendations.map(r => `• ${r}`).join('\n')}`,
        isUser: false,
        timestamp: new Date(),
        insights: report.insights,
        metadata: { reportType: type, reportId: report.id }
      };

      setMessages(prev => [...prev, reportMessage]);
      setShowReportOptions(false);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Render do indicador de sentimento
  const renderSentimentIndicator = (sentiment: SentimentResult) => {
    const getSentimentColor = () => {
      switch (sentiment.sentiment) {
        case 'positive': return 'text-green-500';
        case 'confident': return 'text-blue-500';
        case 'anxious': return 'text-yellow-500';
        case 'frustrated': return 'text-red-500';
        case 'negative': return 'text-red-600';
        default: return 'text-gray-500';
      }
    };

    const getSentimentIcon = () => {
      switch (sentiment.sentiment) {
        case 'positive': return '😊';
        case 'confident': return '💪';
        case 'anxious': return '😰';
        case 'frustrated': return '😤';
        case 'negative': return '😟';
        default: return '😐';
      }
    };

    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
        <Brain size={12} />
        <span>{getSentimentIcon()}</span>
        <span className={getSentimentColor()}>
          {sentiment.sentiment === 'positive' ? 'Positivo' :
           sentiment.sentiment === 'confident' ? 'Confiante' :
           sentiment.sentiment === 'anxious' ? 'Ansioso' :
           sentiment.sentiment === 'frustrated' ? 'Frustrado' :
           sentiment.sentiment === 'negative' ? 'Preocupado' : 'Neutro'}
        </span>
        {sentiment.financialStress > 0.5 && (
          <span className="text-orange-500 ml-2">
            🚨 Stress: {(sentiment.financialStress * 100).toFixed(0)}%
          </span>
        )}
      </div>
    );
  };

  // 🆕 Render dos alertas preditivos
  const renderPredictiveAlerts = (alerts: PredictiveAlert[]) => {
    if (!alerts.length) return null;

    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Zap size={14} className="text-yellow-500" />
          <span>Alertas Inteligentes</span>
        </div>
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-lg border-l-4 ${
              alert.type === 'critical' ? 'bg-red-50 border-red-400' :
              alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
              alert.type === 'opportunity' ? 'bg-green-50 border-green-400' :
              'bg-blue-50 border-blue-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {alert.type === 'critical' || alert.type === 'warning' ? 
                <AlertTriangle size={14} className="text-red-500" /> :
                <TrendingUp size={14} className="text-green-500" />
              }
              <span className="font-medium text-sm">{alert.title}</span>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                {alert.estimatedDays}d
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
            <div className="text-xs text-gray-600">
              <span className="font-medium">Predição:</span> {alert.prediction}
            </div>
            {alert.suggestedActions.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-medium text-gray-700 mb-1">Ações sugeridas:</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {alert.suggestedActions.slice(0, 2).map((action, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  // 🆕 Render do usage stats
  const renderUsageStats = () => {
    if (!usageStats) return null;

    return (
      <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <span>Uso da IA:</span>
          <div className="flex gap-4">
            <span>Hoje: {usageStats.day.used}/{usageStats.day.limit}</span>
            <span>Hora: {usageStats.hour.used}/{usageStats.hour.limit}</span>
          </div>
        </div>
        {usageStats.day.remaining < 10 && (
          <div className="text-orange-600 mt-1">
            ⚠️ Restam {usageStats.day.remaining} mensagens hoje
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50`}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-semibold">Vitto AI</h3>
              <p className="text-xs opacity-90">Assistente Financeiro Inteligente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastSentiment && (
              <div className="flex items-center gap-1 bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                <Heart size={12} />
                <span>
                  {lastSentiment.sentiment === 'positive' ? '😊' :
                   lastSentiment.sentiment === 'confident' ? '💪' :
                   lastSentiment.sentiment === 'anxious' ? '😰' :
                   lastSentiment.sentiment === 'frustrated' ? '😤' : '😐'}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowReportOptions(!showReportOptions)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
              title="Gerar Relatórios"
            >
              <BarChart3 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 🆕 Opções de Relatório */}
        <AnimatePresence>
          {showReportOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-gray-50 border-b"
            >
              <div className="text-sm font-medium mb-2">📊 Relatórios Inteligentes</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleGenerateReport('monthly')}
                  className="text-xs p-2 bg-blue-100 hover:bg-blue-200 rounded"
                  disabled={isLoading}
                >
                  📅 Mensal
                </button>
                <button
                  onClick={() => handleGenerateReport('goal_analysis')}
                  className="text-xs p-2 bg-green-100 hover:bg-green-200 rounded"
                  disabled={isLoading}
                >
                  🎯 Metas
                </button>
                <button
                  onClick={() => handleGenerateReport('budget_review')}
                  className="text-xs p-2 bg-purple-100 hover:bg-purple-200 rounded"
                  disabled={isLoading}
                >
                  📈 Orçamentos
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Bot size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="mb-2">Olá! Sou o Vitto 🤖</p>
              <p className="text-sm mb-4">Seu assistente financeiro inteligente com análise de sentimento e alertas preditivos!</p>
              <div className="text-xs space-y-1">
                <p>💬 "qual meu saldo?"</p>
                <p>💰 "gastei 50 reais no supermercado"</p>
                <p>🎯 "quero juntar 5000 para viagem"</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isUser
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className="flex items-start gap-2">
                  {!message.isUser && (
                    <Bot size={16} className="mt-1 text-indigo-600 flex-shrink-0" />
                  )}
                  {message.isUser && (
                    <User size={16} className="mt-1 text-white flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>

                {/* 🆕 Indicador de Sentimento */}
                {message.sentiment && renderSentimentIndicator(message.sentiment)}

                {/* Insights */}
                {message.insights && message.insights.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.insights.map((insight, index) => (
                      <div
                        key={insight.id}
                        className={`p-2 rounded text-xs ${
                          insight.type === 'positive'
                            ? 'bg-green-100 text-green-800'
                            : insight.type === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-medium">
                          <TrendingUp size={12} />
                          {insight.title}
                        </div>
                        <div className="mt-1">{insight.message}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 🆕 Alertas Preditivos */}
                {message.predictiveAlerts && renderPredictiveAlerts(message.predictiveAlerts)}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-indigo-600" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 🆕 Usage Stats */}
        {renderUsageStats()}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Fale naturalmente com o Vitto..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 