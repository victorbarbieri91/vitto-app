import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from '../styles/pdfColors';
import { PDFSubsection, PDFBulletList } from '../PDFSection';
import { PDFTable } from '../elements/PDFTable';
import type { RevenueContent } from '../../../../../types/admin';

interface RevenuePDFSectionProps {
  content: RevenueContent;
}

const styles = StyleSheet.create({
  // Plans grid
  plansContainer: {
    marginBottom: 12,
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  // Standard plan card
  planCard: {
    width: '48%',
    backgroundColor: PDF_COLORS.backgroundLight,
    padding: 12,
  },
  // Featured plan (first or most expensive)
  planCardFeatured: {
    width: '48%',
    backgroundColor: PDF_COLORS.deepBlue,
    padding: 12,
  },
  planLabel: {
    fontSize: 6,
    fontWeight: 'bold',
    color: PDF_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  planLabelFeatured: {
    color: 'rgba(255,255,255,0.6)',
  },
  planName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: PDF_COLORS.deepBlue,
    marginBottom: 4,
  },
  planNameFeatured: {
    color: PDF_COLORS.textWhite,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PDF_COLORS.coral,
    marginBottom: 8,
  },
  planPriceFeatured: {
    color: PDF_COLORS.coral,
  },
  planDivider: {
    height: 1,
    backgroundColor: PDF_COLORS.border,
    marginBottom: 8,
  },
  planDividerFeatured: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  planFeatures: {
    marginTop: 0,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  planFeatureCheck: {
    width: 12,
    fontSize: 8,
    color: PDF_COLORS.validated,
    marginRight: 3,
  },
  planFeatureCheckFeatured: {
    color: PDF_COLORS.coral,
  },
  planFeatureText: {
    flex: 1,
    fontSize: 7,
    color: PDF_COLORS.textSecondary,
    lineHeight: 1.4,
  },
  planFeatureTextFeatured: {
    color: 'rgba(255,255,255,0.85)',
  },
  planMoreFeatures: {
    fontSize: 7,
    color: PDF_COLORS.textMuted,
    marginTop: 3,
  },
  planMoreFeaturesFeatured: {
    color: 'rgba(255,255,255,0.6)',
  },
  pricingModelsContainer: {
    marginBottom: 6,
  },
});

export function RevenuePDFSection({ content }: RevenuePDFSectionProps) {
  // Prepare pricing models data for table
  const pricingData = (content.pricing || []).map((item) => ({
    model: item.model,
    description: item.description,
    value: item.value || '-',
  }));

  return (
    <View>
      {/* Pricing Models */}
      <PDFSubsection title="Modelos de Precificacao">
        {pricingData.length > 0 ? (
          <View style={styles.pricingModelsContainer}>
            <PDFTable
              columns={[
                { key: 'model', header: 'Modelo', width: '25%' },
                { key: 'description', header: 'Descricao', width: '50%' },
                { key: 'value', header: 'Valor', width: '25%', align: 'right' },
              ]}
              data={pricingData}
            />
          </View>
        ) : (
          <Text style={{ fontSize: 10, color: PDF_COLORS.textMuted }}>
            Nenhum modelo definido
          </Text>
        )}
      </PDFSubsection>

      {/* Plans */}
      <PDFSubsection title="Planos">
        {(content.plans || []).length > 0 ? (
          <View style={styles.plansContainer}>
            <View style={styles.plansGrid}>
              {(content.plans || []).map((plan, index) => {
                // First plan or plan with "Pro/Premium" in name is featured
                const isFeatured = index === 0 ||
                  plan.name.toLowerCase().includes('pro') ||
                  plan.name.toLowerCase().includes('premium');

                return (
                  <View
                    key={index}
                    style={isFeatured ? styles.planCardFeatured : styles.planCard}
                    wrap={false}
                  >
                    <Text style={[styles.planLabel, isFeatured && styles.planLabelFeatured]}>
                      {isFeatured ? 'Recomendado' : 'Plano'}
                    </Text>
                    <Text style={[styles.planName, isFeatured && styles.planNameFeatured]}>
                      {plan.name}
                    </Text>
                    <Text style={[styles.planPrice, isFeatured && styles.planPriceFeatured]}>
                      {plan.price}
                    </Text>
                    <View style={[styles.planDivider, isFeatured && styles.planDividerFeatured]} />
                    <View style={styles.planFeatures}>
                      {(plan.features || []).slice(0, 5).map((feature, idx) => (
                        <View key={idx} style={styles.planFeatureItem}>
                          <Text style={[styles.planFeatureCheck, isFeatured && styles.planFeatureCheckFeatured]}>
                            ✓
                          </Text>
                          <Text style={[styles.planFeatureText, isFeatured && styles.planFeatureTextFeatured]}>
                            {feature}
                          </Text>
                        </View>
                      ))}
                      {(plan.features || []).length > 5 && (
                        <Text style={[styles.planMoreFeatures, isFeatured && styles.planMoreFeaturesFeatured]}>
                          +{(plan.features || []).length - 5} mais recursos...
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <Text style={{ fontSize: 10, color: PDF_COLORS.textMuted }}>
            Nenhum plano definido
          </Text>
        )}
      </PDFSubsection>

      {/* Monetization Strategies */}
      <PDFSubsection title="Estrategias de Monetizacao">
        <PDFBulletList items={content.monetizationStrategies || []} />
      </PDFSubsection>

      {/* Future Hypotheses */}
      <PDFSubsection title="Hipoteses Futuras">
        <PDFBulletList items={content.futureHypotheses || []} />
      </PDFSubsection>
    </View>
  );
}

export default RevenuePDFSection;
