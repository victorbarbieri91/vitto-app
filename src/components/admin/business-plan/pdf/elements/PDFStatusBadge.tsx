import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS, STATUS_LABELS, PRIORITY_LABELS, FEATURE_STATUS_LABELS } from '../styles/pdfColors';

type Status = 'draft' | 'validating' | 'validated';
type Priority = 'high' | 'medium' | 'low';
type FeatureStatus = 'implemented' | 'in_progress' | 'planned';

interface PDFStatusBadgeProps {
  status: Status;
}

interface PDFPriorityBadgeProps {
  priority: Priority;
}

interface PDFFeatureStatusBadgeProps {
  status: FeatureStatus;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  text: {
    fontSize: 8,
    color: PDF_COLORS.textSecondary,
  },
});

const statusDotColors: Record<Status, string> = {
  draft: PDF_COLORS.draft,
  validating: PDF_COLORS.validating,
  validated: PDF_COLORS.validated,
};

const priorityDotColors: Record<Priority, string> = {
  high: PDF_COLORS.textPrimary,
  medium: PDF_COLORS.textSecondary,
  low: PDF_COLORS.textMuted,
};

const featureStatusDotColors: Record<FeatureStatus, string> = {
  implemented: PDF_COLORS.validated,
  in_progress: PDF_COLORS.validating,
  planned: PDF_COLORS.draft,
};

/**
 *
 */
export function PDFStatusBadge({ status }: PDFStatusBadgeProps) {
  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: statusDotColors[status] }]} />
      <Text style={styles.text}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

/**
 *
 */
export function PDFPriorityBadge({ priority }: PDFPriorityBadgeProps) {
  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: priorityDotColors[priority] }]} />
      <Text style={styles.text}>{PRIORITY_LABELS[priority]}</Text>
    </View>
  );
}

/**
 *
 */
export function PDFFeatureStatusBadge({ status }: PDFFeatureStatusBadgeProps) {
  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: featureStatusDotColors[status] }]} />
      <Text style={styles.text}>{FEATURE_STATUS_LABELS[status]}</Text>
    </View>
  );
}

export default PDFStatusBadge;
