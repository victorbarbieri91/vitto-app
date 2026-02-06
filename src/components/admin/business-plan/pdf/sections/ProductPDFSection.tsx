import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from '../styles/pdfColors';
import { PDFSubsection, PDFTextBlock, PDFBulletList } from '../PDFSection';
import { PDFTable } from '../elements/PDFTable';
import { PDFFeatureStatusBadge } from '../elements/PDFStatusBadge';
import type { ProductContent } from '../../../../../types/admin';

interface ProductPDFSectionProps {
  content: ProductContent;
}

const styles = StyleSheet.create({
  // Value Delivered - Featured with deep blue background
  valueBox: {
    backgroundColor: PDF_COLORS.deepBlue,
    padding: 18,
    marginBottom: 16,
  },
  valueLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  valueText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: PDF_COLORS.textWhite,
    textAlign: 'justify',
  },
  // Roadmap with visual timeline
  roadmapContainer: {
    marginTop: 4,
  },
  roadmapItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  roadmapNumberContainer: {
    width: 28,
    height: 28,
    backgroundColor: PDF_COLORS.deepBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roadmapNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: PDF_COLORS.textWhite,
  },
  roadmapContent: {
    flex: 1,
    paddingTop: 2,
  },
  roadmapPhase: {
    fontSize: 10,
    fontWeight: 'bold',
    color: PDF_COLORS.deepBlue,
    marginBottom: 3,
  },
  roadmapDescription: {
    fontSize: 9,
    color: PDF_COLORS.textPrimary,
    lineHeight: 1.4,
    marginBottom: 3,
    textAlign: 'justify',
  },
  roadmapDate: {
    fontSize: 8,
    color: PDF_COLORS.coral,
    fontWeight: 'bold',
  },
});

export function ProductPDFSection({ content }: ProductPDFSectionProps) {
  // Prepare features data for table
  const featuresData = (content.features || []).map((feature) => ({
    name: feature.name,
    description: feature.description,
    status: feature.status,
  }));

  return (
    <View>
      {/* Value Delivered - Highlighted */}
      {content.valueDelivered && (
        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>Valor Entregue</Text>
          <Text style={styles.valueText}>{content.valueDelivered}</Text>
        </View>
      )}

      {/* Features */}
      <PDFSubsection title="Funcionalidades">
        {featuresData.length > 0 ? (
          <PDFTable
            columns={[
              { key: 'name', header: 'Funcionalidade', width: '25%' },
              { key: 'description', header: 'Descricao', width: '55%' },
              {
                key: 'status',
                header: 'Status',
                width: '20%',
                render: (value) => (
                  <PDFFeatureStatusBadge status={value as 'implemented' | 'in_progress' | 'planned'} />
                ),
              },
            ]}
            data={featuresData}
          />
        ) : (
          <PDFTextBlock>Nenhuma funcionalidade definida</PDFTextBlock>
        )}
      </PDFSubsection>

      {/* Limitations */}
      <PDFSubsection title="Limitacoes Atuais">
        <PDFBulletList items={content.limitations || []} />
      </PDFSubsection>

      {/* Roadmap */}
      <PDFSubsection title="Roadmap">
        {(content.roadmap || []).length > 0 ? (
          <View style={styles.roadmapContainer}>
            {(content.roadmap || []).map((phase, index) => (
              <View key={index} style={styles.roadmapItem} wrap={false}>
                <View style={styles.roadmapNumberContainer}>
                  <Text style={styles.roadmapNumber}>{String(index + 1).padStart(2, '0')}</Text>
                </View>
                <View style={styles.roadmapContent}>
                  <Text style={styles.roadmapPhase}>{phase.phase}</Text>
                  <Text style={styles.roadmapDescription}>{phase.description}</Text>
                  {phase.targetDate && (
                    <Text style={styles.roadmapDate}>Previsao: {phase.targetDate}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <PDFTextBlock>Roadmap nao definido</PDFTextBlock>
        )}
      </PDFSubsection>
    </View>
  );
}

export default ProductPDFSection;
