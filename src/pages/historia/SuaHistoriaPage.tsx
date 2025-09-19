import { useState } from 'react';
// import { Plus } from 'lucide-react';

import type { EventoTimeline } from '../../types/historia';
import JourneyBoard from '../../components/historia/JourneyBoard';
import JourneyDashboard from '../../components/historia/JourneyDashboard';
import VittoNarrator from '../../components/historia/VittoNarrator';
import CreateMilestoneModal from '../../components/historia/CreateMilestoneModal';
import Button from '../../components/ui/Button';
// import BoardControls from '../../components/historia/BoardControls';
import ModernSwitch from '../../components/ui/modern/ModernSwitch';

const SuaHistoriaPage = () => {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventoTimeline | null>(null);
    const [demoMode, setDemoMode] = useState<boolean>(true);

    const handleEventClick = (event: EventoTimeline) => {
        setSelectedEvent(event);
    };

    const handleOpenModal = () => setCreateModalOpen(true);
    const handleCloseModal = () => setCreateModalOpen(false);
    
    const handleSaveMilestone = (milestone: any) => {
        console.log('Saving milestone:', milestone);
        setCreateModalOpen(false);
    };

    return (
        <div className="p-4 sm:p-6 h-full flex flex-col">
            {/* Cabeçalho da Página */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-xl font-semibold text-slate-700">Sua História</h1>
                <div className="flex items-center gap-4">
                    <ModernSwitch
                        checked={demoMode}
                        onChange={setDemoMode}
                        label="Modo Demo"
                        description="Ver dados fictícios"
                    />
                    <Button onClick={handleOpenModal} className="bg-primary hover:bg-primary-dark text-white">
                        Criar Marco
                    </Button>
                </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
                {/* Coluna Esquerda: O Tabuleiro da Jornada */}
                <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col">
                    {/* Removido BoardControls para espaço */}
                    <div className="flex-grow min-h-[600px] overflow-auto">
                        <JourneyBoard onEventClick={handleEventClick} demoMode={demoMode} />
                    </div>
                </div>

                {/* Coluna Direita: Dashboard e Narrador */}
                <div className="flex flex-col gap-6">
                    <JourneyDashboard />
                    <VittoNarrator />
                </div>
            </div>

            {isCreateModalOpen && (
                <CreateMilestoneModal
                    isOpen={isCreateModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveMilestone}
                />
            )}
        </div>
    );
};

export default SuaHistoriaPage;