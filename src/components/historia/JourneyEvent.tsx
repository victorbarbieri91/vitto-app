import React from 'react';
import { motion } from 'framer-motion';
import { Badge, CheckCircle, Target } from 'lucide-react';
import { cn } from '../../utils/cn';

type JourneyEventProps = {
    type: 'badge' | 'milestone_completed' | 'milestone_pending';
    title: string;
    date: string;
    onClick: () => void;
};

// Corrigido: Armazenando os componentes, não instâncias
const ICONS = {
    badge: Badge,
    milestone_completed: CheckCircle,
    milestone_pending: Target,
};

const JourneyEvent = ({ type, title, date, onClick }: JourneyEventProps) => {
    const IconComponent = ICONS[type];

    const baseClasses = "relative flex items-center p-3 rounded-lg shadow-md cursor-pointer transition-all duration-300 w-48";
    const typeClasses = {
        badge: 'bg-amber-100 border-l-4 border-amber-400 text-amber-800',
        milestone_completed: 'bg-green-100 border-l-4 border-green-500 text-green-800',
        milestone_pending: 'bg-slate-100 border-l-4 border-slate-400 text-slate-600',
    };

    return (
        <motion.div
            onClick={onClick}
            className={cn(baseClasses, typeClasses[type])}
            whileHover={{ scale: 1.1, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center space-x-3">
                {/* Corrigido: Renderizando o componente corretamente */}
                <IconComponent className="w-6 h-6 flex-shrink-0" />
                <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate">{title}</p>
                    <p className="text-xs">{new Date(date).toLocaleDateString()}</p>
                </div>
            </div>
        </motion.div>
    );
};

export default JourneyEvent; 