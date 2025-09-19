import React from 'react';
import ModernCard from '../ui/modern/ModernCard';
import { Lightbulb } from 'lucide-react';

const VittoNarrator = () => {
  return (
    <ModernCard variant="glass" padding="md">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-coral-500/20 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-coral-500" />
          </div>
          <h2 className="text-lg font-bold text-deep-blue">Cantinho do Vitto</h2>
        </div>
        
        <div className="p-1">
          <p className="text-sm text-slate-700 italic">
            "Sua jornada financeira é única. Lembre-se que cada pequena economia é um passo em direção a um grande objetivo. Estou aqui para ajudar a iluminar o caminho!"
          </p>
        </div>
      </div>
    </ModernCard>
  );
};

export default VittoNarrator; 