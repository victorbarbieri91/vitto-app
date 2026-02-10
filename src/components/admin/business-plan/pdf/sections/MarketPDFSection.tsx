import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from '../styles/pdfColors';
import { PDFSubsection, PDFTextBlock } from '../PDFSection';
import { PDFTable } from '../elements/PDFTable';
import type { MarketContent } from '../../../../../types/admin';

interface MarketPDFSectionProps {
  content: MarketContent;
}

const styles = StyleSheet.create({
  // Competitor cards
  competitorCard: {
    backgroundColor: PDF_COLORS.backgroundLight,
    padding: 12,
    marginBottom: 8,
  },
  competitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  competitorAccent: {
    width: 3,
    height: 14,
    backgroundColor: PDF_COLORS.deepBlue,
    marginRight: 8,
  },
  competitorName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: PDF_COLORS.deepBlue,
  },
  strengthsWeaknesses: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: PDF_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  bulletPositive: {
    width: 12,
    fontSize: 8,
    color: PDF_COLORS.validated,
    fontWeight: 'bold',
  },
  bulletNegative: {
    width: 12,
    fontSize: 8,
    color: PDF_COLORS.draft,
    fontWeight: 'bold',
  },
  itemText: {
    flex: 1,
    fontSize: 8,
    color: PDF_COLORS.textPrimary,
    lineHeight: 1.4,
    textAlign: 'justify',
  },
  // Positioning - Featured highlight with coral background
  positioningBox: {
    backgroundColor: PDF_COLORS.coral,
    padding: 18,
  },
  positioningLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  positioningText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: PDF_COLORS.textWhite,
    textAlign: 'justify',
  },
});

/**
 *
 */
export function MarketPDFSection({ content }: MarketPDFSectionProps) {
  // Prepare segments data for table
  const segmentsData = (content.segments || []).map((seg) => ({
    name: seg.name,
    size: seg.size,
    characteristics: seg.characteristics,
  }));

  return (
    <View>
      {/* Market Segments */}
      <PDFSubsection title="Segmentos de Mercado">
        {segmentsData.length > 0 ? (
          <PDFTable
            columns={[
              { key: 'name', header: 'Segmento', width: '25%' },
              { key: 'size', header: 'Tamanho', width: '20%' },
              { key: 'characteristics', header: 'Caracteristicas', width: '55%' },
            ]}
            data={segmentsData}
          />
        ) : (
          <PDFTextBlock>Nenhum segmento definido</PDFTextBlock>
        )}
      </PDFSubsection>

      {/* Competitors */}
      <PDFSubsection title="Analise Competitiva">
        {(content.competitors || []).length > 0 ? (
          (content.competitors || []).map((competitor, index) => (
            <View key={index} style={styles.competitorCard} wrap={false}>
              <View style={styles.competitorHeader}>
                <View style={styles.competitorAccent} />
                <Text style={styles.competitorName}>{competitor.name}</Text>
              </View>
              <View style={styles.strengthsWeaknesses}>
                {/* Strengths */}
                <View style={styles.column}>
                  <Text style={styles.columnTitle}>Pontos Fortes</Text>
                  {(competitor.strengths || []).map((strength, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <Text style={styles.bulletPositive}>+</Text>
                      <Text style={styles.itemText}>{strength}</Text>
                    </View>
                  ))}
                </View>
                {/* Weaknesses */}
                <View style={styles.column}>
                  <Text style={styles.columnTitle}>Pontos Fracos</Text>
                  {(competitor.weaknesses || []).map((weakness, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <Text style={styles.bulletNegative}>-</Text>
                      <Text style={styles.itemText}>{weakness}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))
        ) : (
          <PDFTextBlock>Nenhum competidor mapeado</PDFTextBlock>
        )}
      </PDFSubsection>

      {/* Positioning */}
      <PDFSubsection title="Posicionamento">
        {content.positioning ? (
          <View style={styles.positioningBox}>
            <Text style={styles.positioningLabel}>Nosso Posicionamento</Text>
            <Text style={styles.positioningText}>{content.positioning}</Text>
          </View>
        ) : (
          <PDFTextBlock>Posicionamento nao definido</PDFTextBlock>
        )}
      </PDFSubsection>
    </View>
  );
}

export default MarketPDFSection;
