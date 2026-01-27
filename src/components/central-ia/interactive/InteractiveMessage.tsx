/**
 * InteractiveMessage - Renderiza elementos interativos no chat
 */

import type { InteractiveContent, InteractiveElement } from '../../../types/central-ia';
import { InteractiveButtons } from './InteractiveButtons';
import { FileAnalysisCard } from './FileAnalysisCard';
import { ColumnMappingCard } from './ColumnMappingCard';
import { PreviewTableCard } from './PreviewTableCard';
import { ImportResultCard } from './ImportResultCard';
import { ConfirmationCard } from './ConfirmationCard';

interface InteractiveMessageProps {
  interactive: InteractiveContent;
  onButtonClick?: (value: string) => void;
  onMappingChange?: (columnIndex: number, newField: string) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function InteractiveMessage({
  interactive,
  onButtonClick,
  onMappingChange,
  onConfirm,
  onCancel,
  disabled = false,
}: InteractiveMessageProps) {
  const renderElement = (element: InteractiveElement, index: number) => {
    switch (element.type) {
      case 'buttons':
        return (
          <InteractiveButtons
            key={`buttons-${index}`}
            element={element}
            onSelect={(value) => onButtonClick?.(value)}
            disabled={disabled}
          />
        );

      case 'file_analysis':
        return (
          <FileAnalysisCard
            key={`file-analysis-${index}`}
            element={element}
          />
        );

      case 'column_mapping':
        return (
          <ColumnMappingCard
            key={`column-mapping-${index}`}
            element={element}
            onMappingChange={onMappingChange}
          />
        );

      case 'preview_table':
        return (
          <PreviewTableCard
            key={`preview-table-${index}`}
            element={element}
          />
        );

      case 'import_result':
        return (
          <ImportResultCard
            key={`import-result-${index}`}
            element={element}
          />
        );

      case 'confirmation':
        return (
          <ConfirmationCard
            key={`confirmation-${index}`}
            element={element}
            onConfirm={onConfirm}
            onCancel={onCancel}
            disabled={disabled}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {interactive.elements.map((element, index) => renderElement(element, index))}
    </div>
  );
}
