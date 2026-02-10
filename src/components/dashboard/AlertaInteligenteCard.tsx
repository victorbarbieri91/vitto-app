import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, TrendingUp, Info, Zap, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../store/AuthContext';
import { AIPredictiveAlerts, type PredictiveAlert } from '../../services/ai/AIPredictiveAlerts';
import { AIContextManager } from '../../services/ai/AIContextManager';

interface AlertaInteligenteCardProps {
  className?: string;
}

/**
 *
 */
export default function AlertaInteligenteCard({ className }: AlertaInteligenteCardProps) {
  const { user } = useAuth();
  const [alert, setAlert] = useState<PredictiveAlert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAlerts = async () => {
      try {
        setLoading(true);

        // Buscar contexto financeiro
        const contextManager = AIContextManager.getInstance();
        const context = await contextManager.buildFullContext(user.id);

        // Gerar alertas preditivos
        const alertsService = AIPredictiveAlerts.getInstance();
        const alerts = await alertsService.generatePredictiveAlerts(context);

        // Pegar o alerta mais urgente (primeiro da lista já ordenada por prioridade)
        setAlert(alerts.length > 0 ? alerts[0] : null);
      } catch (err) {
        console.error('Erro ao buscar alertas:', err);
        setAlert(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user]);

  // Determinar cores e icone baseado no tipo do alerta
  const getAlertStyles = (type: PredictiveAlert['type']) => {
    switch (type) {
      case 'critical':
        return {
          iconBg: 'bg-red-100',
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          titleColor: 'text-red-600',
          badge: 'bg-red-100 text-red-600',
          badgeText: 'Critico',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100',
          icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
          titleColor: 'text-amber-600',
          badge: 'bg-amber-100 text-amber-600',
          badgeText: 'Atencao',
        };
      case 'opportunity':
        return {
          iconBg: 'bg-emerald-100',
          icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
          titleColor: 'text-emerald-600',
          badge: 'bg-emerald-100 text-emerald-600',
          badgeText: 'Oportunidade',
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-blue-100',
          icon: <Info className="w-4 h-4 text-blue-500" />,
          titleColor: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-600',
          badgeText: 'Info',
        };
    }
  };

  // Estilo padrao consistente com outros cards
  const cardStyle = 'bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col';
  const headerStyle = 'px-4 py-3 border-b border-slate-100 flex items-center gap-2';

  // Loading state
  if (loading) {
    return (
      <div className={cn(cardStyle, className)}>
        <div className={headerStyle}>
          <Zap className="w-4 h-4 text-slate-400" />
          <h3 className="font-medium text-slate-700 text-sm">Conselhos Inteligentes</h3>
        </div>
        <div className="p-3 space-y-2">
          <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-6 bg-slate-50 rounded-lg animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  // Empty state - Tudo em ordem
  if (!alert) {
    return (
      <div className={cn(cardStyle, className)}>
        <div className={headerStyle}>
          <Zap className="w-4 h-4 text-slate-400" />
          <h3 className="font-medium text-slate-700 text-sm">Conselhos Inteligentes</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="p-3 rounded-full bg-emerald-100 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="font-medium text-slate-700">Tudo em ordem!</p>
            <p className="text-sm text-slate-400">Suas financas estao saudaveis</p>
          </motion.div>
        </div>
      </div>
    );
  }

  const styles = getAlertStyles(alert.type);

  return (
    <div className={cn(cardStyle, className)}>
      {/* Header padrao com badge de status */}
      <div className={cn(headerStyle, 'justify-between')}>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-slate-400" />
          <h3 className="font-medium text-slate-700 text-sm">Conselhos Inteligentes</h3>
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', styles.badge)}>
          {styles.badgeText}
        </span>
      </div>

      {/* Alert Content */}
      <div className="flex-1 p-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg', styles.iconBg)}>
              {styles.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('font-medium text-sm', styles.titleColor)}>{alert.title}</p>
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{alert.message}</p>
            </div>
          </div>

          {/* Previsao */}
          {alert.prediction && (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
              <span className="font-medium">Previsao:</span> {alert.prediction}
            </div>
          )}

          {/* Acao sugerida */}
          {alert.suggestedActions && alert.suggestedActions.length > 0 && (
            <button className="flex items-center gap-1 text-xs text-coral-500 hover:text-coral-600 font-medium">
              <span>{alert.suggestedActions[0]}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
