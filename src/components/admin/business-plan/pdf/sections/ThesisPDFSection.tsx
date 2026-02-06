import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from '../styles/pdfColors';
import { PDFSubsection, PDFTextBlock, PDFBulletList } from '../PDFSection';
import type { ThesisContent } from '../../../../../types/admin';

interface ThesisPDFSectionProps {
  content: ThesisContent;
}

const styles = StyleSheet.create({
  // Value Proposition - Featured highlight with coral background
  valuePropositionBox: {
    backgroundColor: PDF_COLORS.coral,
    padding: 20,
    marginBottom: 18,
  },
  valuePropositionLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  valuePropositionText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: PDF_COLORS.textWhite,
    textAlign: 'justify',
  },
  // Hypotheses section
  hypothesisList: {
    marginTop: 4,
  },
  hypothesisItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: PDF_COLORS.backgroundLight,
  },
  hypothesisContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
    marginTop: 2,
  },
  hypothesisText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.5,
    color: PDF_COLORS.textPrimary,
    textAlign: 'justify',
  },
  validationBadge: {
    marginLeft: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: PDF_COLORS.deepBlue,
  },
  validationBadgePending: {
    backgroundColor: PDF_COLORS.backgroundLight,
  },
  validationText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: PDF_COLORS.textWhite,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  validationTextPending: {
    color: PDF_COLORS.textMuted,
  },
});

export function ThesisPDFSection({ content }: ThesisPDFSectionProps) {
  return (
    <View>
      {/* Value Proposition - Featured highlight */}
      {content.valueProposition && (
        <View style={styles.valuePropositionBox} wrap={false}>
          <Text style={styles.valuePropositionLabel}>Proposta de Valor</Text>
          <Text style={styles.valuePropositionText}>{content.valueProposition}</Text>
        </View>
      )}

      {/* Problem */}
      <PDFSubsection title="Problema">
        <PDFTextBlock>{content.problem || 'Nao definido'}</PDFTextBlock>
      </PDFSubsection>

      {/* Target Audience */}
      <PDFSubsection title="Publico-Alvo">
        <PDFTextBlock>{content.targetAudience || 'Nao definido'}</PDFTextBlock>
      </PDFSubsection>

      {/* Differentiators */}
      <PDFSubsection title="Diferenciais">
        <PDFBulletList items={content.differentiators || []} />
      </PDFSubsection>

      {/* Hypotheses */}
      {(content.hypotheses || []).length > 0 && (
        <PDFSubsection title="Hipoteses">
          <View style={styles.hypothesisList}>
            {(content.hypotheses || []).map((hypothesis, index) => (
              <View key={index} style={styles.hypothesisItem} wrap={false}>
                <View style={styles.hypothesisContent}>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: hypothesis.validated
                          ? PDF_COLORS.validated
                          : PDF_COLORS.draft,
                      },
                    ]}
                  />
                  <Text style={styles.hypothesisText}>{hypothesis.text}</Text>
                </View>
                <View
                  style={[
                    styles.validationBadge,
                    !hypothesis.validated && styles.validationBadgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.validationText,
                      !hypothesis.validated && styles.validationTextPending,
                    ]}
                  >
                    {hypothesis.validated ? 'Validada' : 'Pendente'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </PDFSubsection>
      )}
    </View>
  );
}

export default ThesisPDFSection;
