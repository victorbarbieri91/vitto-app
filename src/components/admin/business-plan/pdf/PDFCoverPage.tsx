import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from './styles/pdfColors';
import type { BusinessPlan } from '../../../../types/admin';

// Logo path (will be resolved at build time)
const LOGO_WHITE = '/logo.vitto.branco.png';

interface PDFCoverPageProps {
  plans: BusinessPlan[];
  companyName?: string;
  version?: string;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: PDF_COLORS.deepBlue,
  },
  // Main content area
  content: {
    flex: 1,
    padding: 60,
    paddingTop: 80,
    justifyContent: 'space-between',
  },
  // Top - Logo
  header: {
    alignItems: 'flex-start',
  },
  logo: {
    width: 120,
    height: 'auto',
  },
  // Center - Main title
  titleSection: {
    alignItems: 'flex-start',
    marginTop: 80,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: PDF_COLORS.coral,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 52,
    fontWeight: 'bold',
    color: PDF_COLORS.textWhite,
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: PDF_COLORS.textOnDark,
    letterSpacing: 1,
  },
  dividerContainer: {
    marginTop: 40,
  },
  divider: {
    width: 80,
    height: 4,
    backgroundColor: PDF_COLORS.coral,
  },
  // Bottom - Stats and info
  bottomSection: {
    marginTop: 'auto',
  },
  statsContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 30,
    marginBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: PDF_COLORS.textWhite,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 9,
    color: PDF_COLORS.textOnDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Progress
  progressSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 10,
    color: PDF_COLORS.textOnDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PDF_COLORS.coral,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: PDF_COLORS.coral,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  footerLeft: {},
  footerLabel: {
    fontSize: 8,
    color: PDF_COLORS.textOnDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    opacity: 0.7,
  },
  footerValue: {
    fontSize: 11,
    color: PDF_COLORS.textWhite,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  confidential: {
    fontSize: 8,
    color: PDF_COLORS.coral,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
});

export function PDFCoverPage({ plans, companyName = 'Vitto', version }: PDFCoverPageProps) {
  const currentYear = new Date().getFullYear();
  const generationDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Calculate status counts
  const validated = plans.filter((p) => p.status === 'validated').length;
  const validating = plans.filter((p) => p.status === 'validating').length;
  const draft = plans.filter((p) => p.status === 'draft').length;
  const total = plans.length;

  // Calculate progress (validated = 100%, validating = 50%, draft = 0%)
  const progress = total > 0
    ? Math.round(((validated * 1.0 + validating * 0.5) / total) * 100)
    : 0;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.header}>
          <Image src={LOGO_WHITE} style={styles.logo} />
        </View>

        {/* Main Title */}
        <View style={styles.titleSection}>
          <Text style={styles.sectionLabel}>Documento Estrategico</Text>
          <Text style={styles.mainTitle}>Business Plan</Text>
          <Text style={styles.subtitle}>{currentYear}</Text>
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{validated}</Text>
                <Text style={styles.statLabel}>Validados</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{validating}</Text>
                <Text style={styles.statLabel}>Em Validacao</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{draft}</Text>
                <Text style={styles.statLabel}>Rascunho</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progresso Geral</Text>
                <Text style={styles.progressPercentage}>{progress}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progress}%` }
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerLabel}>Gerado em</Text>
              <Text style={styles.footerValue}>{generationDate}</Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.confidential}>Confidencial</Text>
              <Text style={styles.footerValue}>{companyName}</Text>
            </View>
          </View>
        </View>
      </View>
    </Page>
  );
}

export default PDFCoverPage;
