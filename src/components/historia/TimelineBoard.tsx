import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Trophy, Target, Award, Calendar } from 'lucide-react';
import ModernCard from '../ui/modern/ModernCard';
import MilestoneCard from './MilestoneCard';
import BadgeCard from './BadgeCard';
import VittoCue, { useVittoCue } from './VittoCue';
// import CreateMilestoneModal from './CreateMilestoneModal'; // removed: managed by parent page
import { useHistoriaService } from '../../hooks/useHistoriaService';
import { useScreenDetection } from '../../hooks/useScreenDetection';
import type { EventoTimeline } from '../../types/historia';

interface TimelineBoardProps {
  className?: string;
}

type FiltroTipo = 'todos' | 'marcos' | 'badges' | 'concluidos' | 'pendentes';
type ModoExibicao = 'timeline' | 'grid' | 'lista';

/**
 *
 */
export default function TimelineBoard({ className = '' }: TimelineBoardProps) {
  const { size } = useScreenDetection();
  const { cue, parabenizar, motivar, saudar } = useVittoCue();
  
  const {
    timeline,
    resumo,
    loading,
    error,
    completeMarco,
    refreshData
  } = useHistoriaService();

  const [filtroAtivo, setFiltroAtivo] = useState<FiltroTipo>('todos');
  const [modoExibicao, _setModoExibicao] = useState<ModoExibicao>('timeline');
  const [busca, setBusca] = useState('');
  const [_itemSelecionado, setItemSelecionado] = useState<EventoTimeline | null>(null);
  // const [showCreateModal, setShowCreateModal] = useState(false); // removed: managed by parent page

  // Filtrar timeline
  const timelineFiltrada = timeline.filter(item => {
    // Filtro por tipo
    if (filtroAtivo === 'marcos' && item.tipo !== 'marco') return false;
    if (filtroAtivo === 'badges' && item.tipo !== 'badge') return false;
    if (filtroAtivo === 'concluidos' && !item.concluido) return false;
    if (filtroAtivo === 'pendentes' && item.concluido) return false;

    // Filtro por busca
    if (busca && !item.nome.toLowerCase().includes(busca.toLowerCase())) return false;

    return true;
  });

  // Animação de entrada
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  // Lidar com completar marco
  const handleCompleteMarco = async (id: string) => {
    const success = await completeMarco(id);
    if (success) {
      parabenizar('Parabéns! Você completou mais um marco importante!');
    }
  };

  // handleCreateMarco removed; modal handled at page level

  // Saudação inicial
  useEffect(() => {
    if (resumo && !loading) {
      const timer = setTimeout(() => {
        if (resumo.marcos_concluidos === 0) {
          saudar('Bem-vindo à sua jornada financeira! Vamos juntos conquistar seus objetivos!');
        } else {
          motivar(`Você já completou ${resumo.marcos_concluidos} marcos! Continue assim!`);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resumo, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-coral-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <ModernCard variant="default" padding="lg">
        <div className="text-center text-red-600">
          <p>Erro ao carregar sua história: {error}</p>
          <button 
            onClick={refreshData}
            className="mt-4 px-4 py-2 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </ModernCard>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com resumo */}
      <ModernCard variant="glass" padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-deep-blue mb-2">
              Sua História Financeira
            </h2>
            <p className="text-slate-600">
              Acompanhe sua jornada rumo ao sucesso financeiro
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-coral-500">
                {resumo?.marcos_concluidos || 0}
              </div>
              <div className="text-sm text-slate-500">Marcos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {resumo?.total_badges || 0}
              </div>
              <div className="text-sm text-slate-500">Badges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {resumo?.percentual_conclusao || 0}%
              </div>
              <div className="text-sm text-slate-500">Progresso</div>
            </div>
          </div>
        </div>

        {/* Barra de progresso geral */}
        <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${resumo?.percentual_conclusao || 0}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-3 bg-gradient-to-r from-coral-500 to-coral-600 rounded-full"
          />
        </div>

        <div className="text-sm text-slate-600 text-center">
          {resumo?.marcos_pendentes || 0} marcos restantes para completar sua jornada
        </div>
      </ModernCard>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'todos', label: 'Todos', icon: Calendar },
            { key: 'marcos', label: 'Marcos', icon: Target },
            { key: 'badges', label: 'Badges', icon: Award },
            { key: 'concluidos', label: 'Concluídos', icon: Trophy }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFiltroAtivo(key as FiltroTipo)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filtroAtivo === key
                  ? 'bg-coral-500 text-white shadow-lg shadow-coral-500/25'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
          />
        </div>
      </div>

      {/* Timeline */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {timelineFiltrada.length === 0 ? (
          <ModernCard variant="default" padding="lg">
            <div className="text-center text-slate-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Nenhum item encontrado</p>
              <p className="text-sm mt-2">
                {filtroAtivo === 'todos' 
                  ? 'Comece criando seu primeiro objetivo!' 
                  : 'Tente alterar os filtros ou busca.'
                }
              </p>
            </div>
          </ModernCard>
        ) : (
          <div className={`grid gap-4 ${
            size === 'mobile' 
              ? 'grid-cols-1' 
              : modoExibicao === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
          }`}>
            {timelineFiltrada.map((item, index) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className="relative"
              >
                {/* Linha conectora (apenas no modo timeline) */}
                {modoExibicao === 'timeline' && index < timelineFiltrada.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-8 bg-slate-200" />
                )}

                {/* Card do item */}
                {item.tipo === 'marco' ? (
                  <MilestoneCard
                    marco={item as any}
                    onComplete={handleCompleteMarco}
                    onClick={() => setItemSelecionado(item)}
                  />
                ) : (
                  <BadgeCard
                    badge={item as any}
                    onClick={() => setItemSelecionado(item)}
                  />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Botão de ação flutuante removido; modal agora controlado pela página */}

      {/* VittoCue */}
      {cue && (
        <VittoCue
          trigger={cue.trigger}
          contexto={cue.frase.contexto}
          mensagem={cue.frase.texto}
          duracao={cue.duracao}
          onClose={() => {}}
        />
      )}
    </div>
  );
}