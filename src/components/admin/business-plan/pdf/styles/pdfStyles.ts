import { StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from './pdfColors';

// Base styles for Business Plan PDF
export const baseStyles = StyleSheet.create({
  // Page
  page: {
    padding: 50,
    paddingTop: 60,
    paddingBottom: 60,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: PDF_COLORS.textPrimary,
    backgroundColor: PDF_COLORS.background,
  },

  // Typography
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PDF_COLORS.deepBlue,
    marginBottom: 16,
  },
  h2: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PDF_COLORS.deepBlue,
    marginBottom: 12,
  },
  h3: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
    marginBottom: 8,
  },
  h4: {
    fontSize: 11,
    fontWeight: 'bold',
    color: PDF_COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.5,
    color: PDF_COLORS.textPrimary,
  },
  small: {
    fontSize: 8,
    color: PDF_COLORS.textSecondary,
  },
  muted: {
    color: PDF_COLORS.textMuted,
  },

  // Layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  flexWrap: {
    flexWrap: 'wrap',
  },
  gap4: {
    gap: 4,
  },
  gap8: {
    gap: 8,
  },
  gap12: {
    gap: 12,
  },
  gap16: {
    gap: 16,
  },

  // Margins
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mb24: { marginBottom: 24 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt24: { marginTop: 24 },

  // Padding
  p8: { padding: 8 },
  p12: { padding: 12 },
  p16: { padding: 16 },
  px8: { paddingHorizontal: 8 },
  px12: { paddingHorizontal: 12 },
  py4: { paddingVertical: 4 },
  py8: { paddingVertical: 8 },

  // Text alignment
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },

  // Borders
  border: {
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
  },
  rounded: {
    borderRadius: 4,
  },

  // Backgrounds
  bgLight: {
    backgroundColor: PDF_COLORS.sectionBg,
  },
  bgTableHeader: {
    backgroundColor: PDF_COLORS.tableHeader,
  },

  // Section container
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.coral,
  },

  // Card style
  card: {
    backgroundColor: PDF_COLORS.sectionBg,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },

  // Lists
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  bullet: {
    width: 16,
    fontSize: 10,
    color: PDF_COLORS.coral,
  },
  listContent: {
    flex: 1,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: PDF_COLORS.border,
    marginVertical: 16,
  },
});

// Table styles
export const tableStyles = StyleSheet.create({
  table: {
    width: '100%',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.tableHeader,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },
  headerCell: {
    padding: 8,
    fontSize: 9,
    fontWeight: 'bold',
    color: PDF_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderLight,
  },
  cell: {
    padding: 8,
    fontSize: 9,
    color: PDF_COLORS.textPrimary,
  },
  altRow: {
    backgroundColor: PDF_COLORS.sectionBg,
  },
});

// Cover page styles
export const coverStyles = StyleSheet.create({
  page: {
    padding: 60,
    backgroundColor: PDF_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: PDF_COLORS.coral,
    letterSpacing: 2,
  },
  divider: {
    width: 100,
    height: 3,
    backgroundColor: PDF_COLORS.deepBlue,
    marginVertical: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PDF_COLORS.deepBlue,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  year: {
    fontSize: 24,
    color: PDF_COLORS.textSecondary,
    marginBottom: 40,
  },
  statusBox: {
    backgroundColor: PDF_COLORS.sectionBg,
    borderRadius: 8,
    padding: 20,
    width: 300,
    marginTop: 20,
  },
  statusTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: PDF_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 9,
    color: PDF_COLORS.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: PDF_COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PDF_COLORS.coral,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 10,
    color: PDF_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    color: PDF_COLORS.textMuted,
  },
});

// Header/Footer styles
export const headerFooterStyles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: PDF_COLORS.deepBlue,
  },
  headerLogo: {
    fontSize: 10,
    color: PDF_COLORS.coral,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.borderLight,
  },
  footerText: {
    fontSize: 8,
    color: PDF_COLORS.textMuted,
  },
  pageNumber: {
    fontSize: 8,
    color: PDF_COLORS.textSecondary,
  },
});
