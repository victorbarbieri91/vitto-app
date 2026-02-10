import { useState, useEffect, useMemo } from 'react';
import { useHistoriaService } from '../../hooks/useHistoriaService';
import { useMockHistoriaService } from '../../hooks/useMockHistoriaService';
import { useAuth } from '../../store/AuthContext';
import type { EventoTimeline } from '../../types/historia';
import JourneyEvent from './JourneyEvent';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameMonth, getDate, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type JourneyBoardProps = {
    onEventClick: (event: EventoTimeline) => void;
    demoMode?: boolean;
};

const JourneyBoard = ({ onEventClick, demoMode = false }: JourneyBoardProps) => {
    const { user } = useAuth();
    const {
        timeline: realTimeline,
        loading: realLoading,
        error: realError,
    } = useHistoriaService();

    const {
        timeline: mockTimeline,
        loading: mockLoading,
        error: mockError,
    } = useMockHistoriaService();

    const timeline = demoMode ? mockTimeline : realTimeline;
    const loading = demoMode ? mockLoading : realLoading;
    const error = demoMode ? mockError : realError;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [allEvents, setAllEvents] = useState<EventoTimeline[]>([]);

    useEffect(() => {
        if (user && timeline.length) {
            const accountCreationEvent: EventoTimeline = {
                id: 'start-event',
                user_id: user.id,
                tipo: 'marco',
                nome: 'Início da Jornada',
                data_evento: user.created_at,
                concluido: true,
                descricao: 'Você começou sua jornada no Barsi.',
                status: 'concluido',
                cor: '#4caf50',
                created_at: user.created_at,
            };
            setAllEvents([accountCreationEvent, ...timeline]);
        } else {
            setAllEvents(timeline);
        }
    }, [user, timeline]);

    const eventsThisMonth = useMemo(() => {
        return allEvents
            .filter(event => isSameMonth(new Date(event.data_evento), currentDate))
            .sort((a, b) => new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime());
    }, [allEvents, currentDate]);
    
    const getEventType = (event: EventoTimeline): 'badge' | 'milestone_completed' | 'milestone_pending' => {
        if (event.tipo === 'badge') return 'badge';
        return event.concluido ? 'milestone_completed' : 'milestone_pending';
    };

    const getEventPosition = (eventDate: string) => {
        const dayOfMonth = getDate(new Date(eventDate));
        const daysInMonth = getDaysInMonth(new Date(eventDate));
        return `${(dayOfMonth / daysInMonth) * 100}%`;
    };

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };
    
    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    if (loading) return <div className="flex items-center justify-center h-[350px]"><p>Carregando sua jornada...</p></div>;
    if (error) return <div className="flex items-center justify-center h-[350px]"><p className="text-red-500">Erro ao carregar: {error}</p></div>;

    return (
        <div className="w-full h-[350px] rounded-lg p-4 flex flex-col relative overflow-hidden shadow-xl backdrop-blur-md bg-white/40 ring-1 ring-white/60">
            {/* Cabeçalho com Navegação */}
            <div className="flex justify-center items-center mb-4 relative z-10">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold text-slate-700 w-48 text-center capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* A Estrada e os Eventos */}
            <div className="flex-grow flex items-center relative">
                <div className="absolute top-1/2 left-10 right-10 h-2 rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 animate-gradient shadow-md"></div>
                
                <AnimatePresence>
                    {eventsThisMonth.map((event, index) => {
                        const eventType = getEventType(event);
                        const pinColor = {
                            milestone_completed: 'bg-green-400 glow-green',
                            milestone_pending: 'bg-slate-400 glow-slate',
                            badge: 'bg-amber-400 glow-amber',
                        }[eventType];

                        return (
                            <motion.div
                                key={event.id}
                                className="absolute top-1/2"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20, delay: index * 0.1 } }}
                                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                style={{ left: getEventPosition(event.data_evento) }}
                            >
                                <div className={`absolute ${index % 2 === 0 ? 'bottom-5' : 'top-5'} -translate-x-1/2`}>
                                    <JourneyEvent
                                        type={eventType}
                                        title={event.nome}
                                        date={event.data_evento}
                                        onClick={() => onEventClick(event)}
                                    />
                                </div>
                                <div className={`w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer ring-2 ring-white ${pinColor} transition-transform duration-200 hover:scale-110`}></div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default JourneyBoard; 