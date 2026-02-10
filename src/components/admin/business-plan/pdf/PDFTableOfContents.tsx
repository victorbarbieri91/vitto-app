import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from './styles/pdfColors';
import { SUBMODULE_INFO, type BusinessPlan, type BusinessPlanSubmodule } from '../../../../types/admin';

// Logo path
const LOGO_WHITE = '/logo.vitto.branco.png';

interface PDFTableOfContentsProps {
  plans: BusinessPlan[];
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: PDF_COLORS.background,
  },
  // Header band
  headerBand: {
    backgroundColor: PDF_COLORS.deepBlue,
    padding: 40,
    paddingTop: 50,
    paddingBottom: 45,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: {},
  sectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: PDF_COLORS.coral,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PDF_COLORS.textWhite,
  },
  logo: {
    width: 80,
    height: 'auto',
  },
  // Content area
  contentArea: {
    padding: 40,
    paddingBottom: 60,
  },
  tocList: {
    marginTop: 10,
  },
  tocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderLight,
  },
  tocNumber: {
    width: 50,
    height: 50,
    backgroundColor: PDF_COLORS.deepBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  tocNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PDF_COLORS.textWhite,
  },
  tocContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tocTitleContainer: {
    flex: 1,
  },
  tocTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
    marginBottom: 4,
  },
  tocDescription: {
    fontSize: 9,
    color: PDF_COLORS.textMuted,
    lineHeight: 1.4,
  },
  tocRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tocPage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: PDF_COLORS.textSecondary,
    width: 30,
    textAlign: 'right',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
  },
  footerBrand: {
    fontSize: 10,
    color: PDF_COLORS.coral,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pageIndicator: {
    fontSize: 9,
    color: PDF_COLORS.textMuted,
  },
});

const STATUS_COLORS = {
  draft: PDF_COLORS.draft,
  validating: PDF_COLORS.validating,
  validated: PDF_COLORS.validated,
};

// Define the order of submodules
const SUBMODULE_ORDER: BusinessPlanSubmodule[] = [
  'thesis',
  'market',
  'product',
  'revenue',
  'go_to_market',
  'metrics',
  'risks',
];

/**
 *
 */
export function PDFTableOfContents({ plans }: PDFTableOfContentsProps) {
  // Sort plans by the defined order
  const sortedPlans = [...plans].sort(
    (a, b) => SUBMODULE_ORDER.indexOf(a.submodule) - SUBMODULE_ORDER.indexOf(b.submodule)
  );

  return (
    <Page size="A4" style={styles.page}>
      {/* Header Band */}
      <View style={styles.headerBand}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.sectionLabel}>Indice</Text>
            <Text style={styles.title}>Sumario</Text>
          </View>
          <Image src={LOGO_WHITE} style={styles.logo} />
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        <View style={styles.tocList}>
          {sortedPlans.map((plan, index) => {
            const info = SUBMODULE_INFO[plan.submodule];
            const pageNumber = index + 3; // Cover = 1, TOC = 2, sections start at 3

            return (
              <View key={plan.id} style={styles.tocItem}>
                <View style={styles.tocNumber}>
                  <Text style={styles.tocNumberText}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                </View>
                <View style={styles.tocContent}>
                  <View style={styles.tocTitleContainer}>
                    <Text style={styles.tocTitle}>{info.title}</Text>
                    <Text style={styles.tocDescription}>{info.description}</Text>
                  </View>
                  <View style={styles.tocRight}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: STATUS_COLORS[plan.status] },
                      ]}
                    />
                    <Text style={styles.tocPage}>{pageNumber}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerBrand}>VITTO</Text>
        <Text style={styles.pageIndicator}>2 / {sortedPlans.length + 2}</Text>
      </View>
    </Page>
  );
}

export default PDFTableOfContents;
