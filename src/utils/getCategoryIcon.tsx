import React from 'react';
import { icons } from 'lucide-react';

export const getCategoryIcon = (iconName: string, color: string, size = 20) => {
  const LucideIcon = icons[iconName as keyof typeof icons];

  if (!LucideIcon) {
    // Retorna um ícone padrão caso o nome não seja encontrado
    const DefaultIcon = icons['HelpCircle'];
    return <DefaultIcon color={color} size={size} />;
  }

  return <LucideIcon color={color} size={size} />;
}; 