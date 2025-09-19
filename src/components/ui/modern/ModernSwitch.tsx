import React from 'react';
import { Switch } from '@headlessui/react';
import { cn } from '../../../utils/cn';
import { motion } from 'framer-motion';

interface ModernSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

const ModernSwitch: React.FC<ModernSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) => {
  return (
    <Switch.Group as="div" className="flex items-center justify-between">
      <span className="flex-grow flex flex-col">
        <Switch.Label as="span" className="text-sm font-medium text-slate-800" passive>
          {label}
        </Switch.Label>
        {description && (
          <Switch.Description as="span" className="text-sm text-slate-500">
            {description}
          </Switch.Description>
        )}
      </span>
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-2',
          {
            'bg-coral-500': checked,
            'bg-slate-200': !checked,
            'cursor-not-allowed opacity-50': disabled,
          }
        )}
      >
        <motion.span
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 700, damping: 30 }}
          className="pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg ring-0"
        />
      </Switch>
    </Switch.Group>
  );
};

export default ModernSwitch; 