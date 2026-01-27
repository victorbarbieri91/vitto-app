import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AddBudgetCardProps {
  onClick: () => void;
}

export default function AddBudgetCard({ onClick }: AddBudgetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2, borderColor: '#F87060' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        "relative rounded-xl p-4 h-[120px]",
        "border-2 border-dashed border-slate-200",
        "hover:bg-coral-50/30",
        "transition-all duration-200",
        "cursor-pointer group",
        "flex flex-col items-center justify-center gap-2"
      )}
    >
      {/* Ícone */}
      <div className={cn(
        "w-10 h-10 rounded-xl",
        "bg-slate-100 group-hover:bg-coral-100",
        "flex items-center justify-center",
        "transition-colors duration-200"
      )}>
        <Plus className={cn(
          "w-5 h-5",
          "text-slate-400 group-hover:text-coral-500",
          "transition-colors duration-200"
        )} />
      </div>

      {/* Texto */}
      <div className="text-center">
        <span className={cn(
          "text-sm font-medium text-slate-500",
          "group-hover:text-coral-600",
          "transition-colors duration-200"
        )}>
          Novo Orçamento
        </span>
      </div>
    </motion.div>
  );
}
