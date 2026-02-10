import type { EventoTimeline } from '../../types/historia';
import JourneyEvent from './JourneyEvent';

type GoalLaneProps = {
    title: string;
    events: EventoTimeline[];
};

const GoalLane = ({ title, events = [] }: GoalLaneProps) => {

    const getEventType = (event: EventoTimeline): 'badge' | 'milestone_completed' | 'milestone_pending' => {
        if (event.tipo === 'badge') return 'badge';
        return event.concluido ? 'milestone_completed' : 'milestone_pending';
    };

    return (
        <div className="flex-1 border-r border-slate-200 p-2 min-w-[200px]">
            <h3 className="font-bold text-center text-deep-blue sticky top-0 bg-white/50 backdrop-blur-sm py-2">{title}</h3>
            <div className="relative h-full pt-4">
                {events.map(event => (
                    <div key={event.id} className="mb-4 flex justify-center">
                         <JourneyEvent
                            type={getEventType(event)}
                            title={event.nome}
                            date={event.data_evento}
                            onClick={() => console.log(event.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GoalLane; 