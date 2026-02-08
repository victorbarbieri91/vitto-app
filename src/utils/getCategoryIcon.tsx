import React from 'react';
import { icons } from 'lucide-react';

export const getCategoryIcon = (iconName: string, color: string, size = 20) => {
  const LucideIcon = icons[iconName as keyof typeof icons];

  if (!LucideIcon) {
    const DefaultIcon = icons['HelpCircle'] || icons['CircleHelp'] || icons['Circle'];
    if (!DefaultIcon) return null;
    return <DefaultIcon color={color} size={size} />;
  }

  return <LucideIcon color={color} size={size} />;
}; 