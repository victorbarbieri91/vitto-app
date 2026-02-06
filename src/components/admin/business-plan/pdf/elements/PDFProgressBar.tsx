import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from '../styles/pdfColors';

interface PDFProgressBarProps {
  current?: string | number;
  target?: string | number;
  showLabel?: boolean;
  color?: string;
  height?: number;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barContainer: {
    height: 6,
    backgroundColor: PDF_COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  currentLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
  },
  targetLabel: {
    fontSize: 8,
    color: PDF_COLORS.textSecondary,
  },
});

export function PDFProgressBar({
  current,
  target,
  showLabel = true,
  color = PDF_COLORS.deepBlue,
  height = 6,
}: PDFProgressBarProps) {
  // Parse values to calculate percentage
  const parseValue = (val?: string | number): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    // Try to extract number from string (e.g., "45%", "R$ 1000", "50 users")
    const match = val.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  const currentVal = parseValue(current);
  const targetVal = parseValue(target);
  const percentage = targetVal > 0 ? Math.min((currentVal / targetVal) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.barContainer, { height }]}>
        <View
          style={[
            styles.barFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.currentLabel}>
            {current ?? '-'}
          </Text>
          <Text style={styles.targetLabel}>
            Meta: {target ?? '-'}
          </Text>
        </View>
      )}
    </View>
  );
}

// Simple percentage bar without labels
export function PDFPercentageBar({
  percentage,
  color = PDF_COLORS.coral,
  height = 6,
}: {
  percentage: number;
  color?: string;
  height?: number;
}) {
  return (
    <View style={[styles.barContainer, { height }]}>
      <View
        style={[
          styles.barFill,
          { width: `${Math.min(percentage, 100)}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

export default PDFProgressBar;
