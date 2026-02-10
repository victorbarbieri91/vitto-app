import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock, 
  CreditCard, 
  Calendar, 
  ChevronRight,
  X
} from 'lucide-react';
import { ModernCard, ModernButton, ModernBadge } from '../ui/modern';
import { automationService } from '../../services/api/AutomationService';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface InvoiceAlert {
  id: string;
  valor_total: number;
  data_vencimento: string;
  mes: number;
  ano: number;
  cartao?: {
    nome: string;
    cor?: string;
  };
}

interface InvoiceAlertsProps {
  className?: string;
  maxItems?: number;
}

/**
 *
 */
export default function InvoiceAlerts({ className, maxItems = 3 }: InvoiceAlertsProps) {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<InvoiceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    loadUpcomingInvoices();
  }, []);

  const loadUpcomingInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await automationService.getUpcomingInvoices(7); // Próximos 7 dias
      
      if (result.success && result.invoices) {
        const formattedAlerts = result.invoices.map(invoice => ({
          id: invoice.id,
          valor_total: invoice.valor_total,
          data_vencimento: invoice.data_vencimento,
          mes: invoice.mes,
          ano: invoice.ano,
          cartao: invoice.app_cartao_credito
        }));

        setAlerts(formattedAlerts);
      } else {
        setError(result.error || 'Erro ao carregar alertas');
      }
    } catch (err) {
      console.error('Erro ao carregar alertas:', err);
      setError('Erro inesperado ao carregar alertas');
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyLevel = (daysUntilDue: number) => {
    if (daysUntilDue <= 0) return 'overdue';
    if (daysUntilDue <= 2) return 'critical';
    if (daysUntilDue <= 5) return 'warning';
    return 'info';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return 'bg-red-500 text-white';
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const handleDismiss = (alertId: string) => {
    setDismissed(prev => [...prev, alertId]);
  };

  const handleViewInvoices = () => {
    navigate('/cartoes');
  };

  const visibleAlerts = alerts
    .filter(alert => !dismissed.includes(alert.id))
    .slice(0, maxItems);

  if (loading) {
    return (
      <ModernCard className={cn('p-4', className)}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse"></div>
          </div>
        </div>
      </ModernCard>
    );
  }

  if (error) {
    return (
      <ModernCard className={cn('p-4 border-red-200 bg-red-50', className)}>
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-700">
              Erro ao carregar alertas
            </p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      </ModernCard>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <ModernCard className={cn('p-4 border-green-200 bg-green-50', className)}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-700">
              Nenhuma fatura vencendo
            </p>
            <p className="text-xs text-green-600">
              Suas faturas estão em dia!
            </p>
          </div>
        </div>
      </ModernCard>
    );
  }

  return (
    <ModernCard className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-coral-500" />
            <h3 className="text-sm font-semibold text-deep-blue">
              Faturas Próximas do Vencimento
            </h3>
          </div>
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={handleViewInvoices}
            className="text-xs text-coral-500 hover:text-coral-600"
          >
            Ver todas
            <ChevronRight className="w-3 h-3 ml-1" />
          </ModernButton>
        </div>
      </div>

      {/* Alertas */}
      <div className="divide-y divide-slate-200">
        {visibleAlerts.map((alert, index) => {
          const daysUntilDue = getDaysUntilDue(alert.data_vencimento);
          const urgency = getUrgencyLevel(daysUntilDue);
          const cardColor = alert.cartao?.cor || '#F87060';

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: cardColor }}
                  >
                    <CreditCard className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-deep-blue truncate">
                        {alert.cartao?.nome || 'Cartão'}
                      </p>
                      <ModernBadge 
                        size="sm" 
                        className={cn(
                          'px-2 py-1 text-xs border',
                          getUrgencyColor(urgency)
                        )}
                      >
                        {getUrgencyIcon(urgency)}
                        <span className="ml-1">
                          {daysUntilDue <= 0 
                            ? 'Vencida' 
                            : daysUntilDue === 1 
                              ? '1 dia' 
                              : `${daysUntilDue} dias`
                          }
                        </span>
                      </ModernBadge>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm font-semibold text-deep-blue">
                        {formatCurrency(alert.valor_total)}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(alert.data_vencimento)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(alert.id)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </ModernButton>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      {alerts.length > maxItems && (
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={handleViewInvoices}
            className="w-full text-sm text-coral-500 hover:text-coral-600"
          >
            Ver mais {alerts.length - maxItems} faturas
          </ModernButton>
        </div>
      )}
    </ModernCard>
  );
} 