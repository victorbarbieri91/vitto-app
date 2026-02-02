import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/supabase/client';

interface MonthData {
  mes: string;
  mesNum: number;
  ano: number;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface FluxoMensalChartProps {
  className?: string;
  months?: number;
}

export default function FluxoMensalChart({ className, months = 4 }: FluxoMensalChartProps) {
  const { user } = useAuth();
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // Buscar apenas transações CONFIRMADAS (receita/despesa), excluindo:
        // - despesa_cartao (consolidadas nas faturas)
        // - pendentes (não efetivadas ainda)
        const { data: transactions, error: fetchError } = await supabase
          .from('app_transacoes')
          .select('data, valor, tipo, status')
          .eq('user_id', user.id)
          .gte('data', startStr)
          .lte('data', endStr)
          .eq('status', 'confirmado') // Apenas transações efetivadas
          .in('tipo', ['receita', 'despesa']); // Exclui despesa_cartao

        if (fetchError) throw fetchError;

        const monthlyData: Record<string, { receitas: number; despesas: number }> = {};

        for (let i = 0; i < months; i++) {
          const date = new Date(today.getFullYear(), today.getMonth() - months + 1 + i, 1);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyData[key] = { receitas: 0, despesas: 0 };
        }

        (transactions || []).forEach((t: any) => {
          const date = new Date(t.data);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          if (monthlyData[key]) {
            if (t.tipo === 'receita') {
              monthlyData[key].receitas += Number(t.valor);
            } else if (t.tipo === 'despesa') {
              // Apenas despesas normais, não despesa_cartao (já filtrado na query)
              monthlyData[key].despesas += Number(t.valor);
            }
          }
        });

        const chartData: MonthData[] = Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, values]) => {
            const [ano, mesNum] = key.split('-').map(Number);
            return {
              mes: monthNames[mesNum - 1],
              mesNum,
              ano,
              receitas: values.receitas,
              despesas: values.despesas,
              saldo: values.receitas - values.despesas
            };
          });

        setData(chartData);
      } catch (err) {
        console.error('Erro ao carregar fluxo mensal:', err);
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, months]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Tooltip customizado - aparece só no hover
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const saldo = (payload[0]?.value || 0) - (payload[1]?.value || 0);
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-deep-blue/95 backdrop-blur-sm rounded-xl shadow-xl p-3 border border-white/10"
        >
          <p className="font-semibold text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-white/70">
                {entry.name === 'receitas' ? 'Receitas' : 'Despesas'}
              </span>
              <span className={cn(
                'font-semibold',
                entry.name === 'receitas' ? 'text-emerald-400' : 'text-coral-400'
              )}>
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
            <span className="text-white/70 text-sm">Saldo</span>
            <span className={cn(
              'font-bold',
              saldo >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {saldo >= 0 ? '+' : ''}{formatCurrency(saldo)}
            </span>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  // Verificar se tem dados
  const hasData = data.some(d => d.receitas > 0 || d.despesas > 0);

  // Estilo padrao para todos os estados
  const cardStyle = 'bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col';
  const headerStyle = 'px-4 py-3 border-b border-slate-100 flex items-center gap-2';

  if (loading) {
    return (
      <div className={cn(cardStyle, className)}>
        <div className={headerStyle}>
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <h3 className="font-medium text-slate-700 text-sm">Fluxo Mensal</h3>
        </div>
        <div className="flex-1 p-4">
          <div className="h-full bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(cardStyle, className)}>
        <div className={headerStyle}>
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <h3 className="font-medium text-slate-700 text-sm">Fluxo Mensal</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <div className={cn(cardStyle, className)}>
        <div className={headerStyle}>
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <h3 className="font-medium text-slate-700 text-sm">Fluxo Mensal</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="p-3 rounded-full bg-slate-100 mb-2">
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm">Sem movimentacao</p>
          <p className="text-slate-400 text-xs">Adicione transacoes para ver o fluxo</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(cardStyle, className)}>
      {/* Header padrao */}
      <div className={cn(headerStyle, 'justify-between')}>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <h3 className="font-medium text-slate-700 text-sm">Fluxo Mensal</h3>
        </div>

        {/* Legenda compacta */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500">Receitas</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-coral-500" />
            <span className="text-slate-500">Despesas</span>
          </div>
        </div>
      </div>

      {/* Grafico */}
      <div className="flex-1 min-h-0 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 5, left: 5, bottom: 5 }}
            barCategoryGap="25%"
          >
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 8 }}
            />
            <Bar
              dataKey="receitas"
              name="receitas"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="despesas"
              name="despesas"
              fill="#F87060"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
