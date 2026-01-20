import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AddBudgetCardProps {
  onClick: () => void;
}

export default function AddBudgetCard({ onClick }: AddBudgetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl p-5",
        "border-2 border-dashed border-slate-300",
        "hover:border-coral-500 hover:bg-coral-500/5",
        "transition-all duration-300",
        "cursor-pointer group",
        "flex flex-col items-center justify-center",
        "min-h-[200px]"
      )}
    >
      {/* Ícone */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "w-14 h-14 rounded-2xl",
          "bg-slate-100 group-hover:bg-coral-100",
          "flex items-center justify-center",
          "mb-4 transition-colors duration-300"
        )}
      >
        <Plus className={cn(
          "w-7 h-7",
          "text-slate-400 group-hover:text-coral-500",
          "transition-colors duration-300"
        )} />
      </motion.div>

      {/* Texto */}
      <h3 className={cn(
        "font-semibold text-slate-600",
        "group-hover:text-deep-blue",
        "transition-colors duration-300"
      )}>
        Novo Orçamento
      </h3>
      <p className="text-sm text-slate-400 mt-1 text-center">
        Defina um limite mensal
      </p>
    </motion.div>
  );
}
