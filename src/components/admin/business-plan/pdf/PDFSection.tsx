import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from './styles/pdfColors';
import type { BusinessPlanStatus } from '../../../../types/admin';

// Logo path
const LOGO_WHITE = '/logo.vitto.branco.png';

interface PDFSectionProps {
  title: string;
  description?: string;
  status: BusinessPlanStatus;
  sectionNumber: number;
  pageNumber: number;
  totalPages: number;
  children: React.ReactNode;
}

const STATUS_COLORS = {
  draft: PDF_COLORS.draft,
  validating: PDF_COLORS.validating,
  validated: PDF_COLORS.validated,
};

const STATUS_LABELS = {
  draft: 'Rascunho',
  validating: 'Em Validacao',
  validated: 'Validado',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: PDF_COLORS.background,
  },
  // Header band
  headerBand: {
    backgroundColor: PDF_COLORS.deepBlue,
    padding: 35,
    paddingTop: 40,
    paddingBottom: 35,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: PDF_COLORS.coral,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: PDF_COLORS.textWhite,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  logo: {
    width: 70,
    height: 'auto',
    marginBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    color: PDF_COLORS.textOnDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Content area - no flex to prevent stretching
  contentArea: {
    padding: 35,
    paddingTop: 30,
    paddingBottom: 60,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 35,
    right: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
  },
  footerBrand: {
    fontSize: 10,
    color: PDF_COLORS.coral,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pageNumber: {
    fontSize: 9,
    color: PDF_COLORS.textMuted,
  },
});

/**
 *
 */
export function PDFSection({
  title,
  status,
  sectionNumber,
  pageNumber,
  totalPages,
  children,
}: PDFSectionProps) {
  return (
    <Page size="A4" style={styles.page}>
      {/* Header Band */}
      <View style={styles.headerBand}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.sectionLabel}>
              Secao {String(sectionNumber).padStart(2, '0')}
            </Text>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <View style={styles.headerRight}>
            <Image src={LOGO_WHITE} style={styles.logo} />
            <View style={styles.statusIndicator}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: STATUS_COLORS[status] },
                ]}
              />
              <Text style={styles.statusText}>{STATUS_LABELS[status]}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>{children}</View>

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerBrand}>VITTO</Text>
        <Text style={styles.pageNumber}>
          {pageNumber} / {totalPages}
        </Text>
      </View>
    </Page>
  );
}

// Subsection component with accent
interface SubsectionProps {
  title: string;
  children: React.ReactNode;
}

const subsectionStyles = StyleSheet.create({
  subsection: {
    marginBottom: 18,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleAccent: {
    width: 4,
    height: 16,
    backgroundColor: PDF_COLORS.coral,
    marginRight: 10,
  },
  title: {
    fontSize: 11,
    fontWeight: 'bold',
    color: PDF_COLORS.deepBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    paddingLeft: 14,
  },
});

/**
 *
 */
export function PDFSubsection({ title, children }: SubsectionProps) {
  return (
    <View style={subsectionStyles.subsection}>
      <View style={subsectionStyles.titleContainer} wrap={false}>
        <View style={subsectionStyles.titleAccent} />
        <Text style={subsectionStyles.title}>{title}</Text>
      </View>
      <View style={subsectionStyles.content}>{children}</View>
    </View>
  );
}

// Text block with justified text
interface TextBlockProps {
  label?: string;
  children: string;
}

const textBlockStyles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  label: {
    fontSize: 8,
    fontWeight: 'bold',
    color: PDF_COLORS.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
    color: PDF_COLORS.textPrimary,
    textAlign: 'justify',
  },
});

/**
 *
 */
export function PDFTextBlock({ label, children }: TextBlockProps) {
  return (
    <View style={textBlockStyles.container}>
      {label && <Text style={textBlockStyles.label}>{label}</Text>}
      <Text style={textBlockStyles.text}>{children}</Text>
    </View>
  );
}

// Bullet list
interface BulletListProps {
  items: string[];
  label?: string;
}

const bulletListStyles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  label: {
    fontSize: 8,
    fontWeight: 'bold',
    color: PDF_COLORS.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  item: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletContainer: {
    width: 14,
    paddingTop: 3,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: PDF_COLORS.coral,
  },
  text: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.4,
    color: PDF_COLORS.textPrimary,
    textAlign: 'justify',
  },
});

/**
 *
 */
export function PDFBulletList({ items, label }: BulletListProps) {
  if (!items || items.length === 0) return null;

  return (
    <View style={bulletListStyles.container}>
      {label && <Text style={bulletListStyles.label}>{label}</Text>}
      {items.map((item, index) => (
        <View key={index} style={bulletListStyles.item} wrap={false}>
          <View style={bulletListStyles.bulletContainer}>
            <View style={bulletListStyles.bullet} />
          </View>
          <Text style={bulletListStyles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default PDFSection;
