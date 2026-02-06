// PDF Brand Colors - Vitto Business Plan
// Inspirado em apresentações profissionais de startups

export const PDF_COLORS = {
  // Brand - Core colors
  coral: '#F87060',
  coralLight: '#FDA29B',
  coralDark: '#E85D48',
  deepBlue: '#102542',
  deepBlueLight: '#1A3A5C',
  deepBlueDark: '#0A1628',

  // Accent variations
  accentTeal: '#2D6A6A',
  accentTealLight: '#3D8A8A',

  // Status
  draft: '#64748B',
  validating: '#F59E0B',
  validated: '#10B981',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  textOnDark: '#E2E8F0',

  // Structure
  background: '#FFFFFF',
  backgroundLight: '#F8FAFC',
  backgroundDark: '#102542',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  tableHeader: '#F1F5F9',
  sectionBg: '#F8FAFC',
  cardBg: '#FFFFFF',

  // Risk matrix
  riskHigh: '#EF4444',
  riskMedium: '#F59E0B',
  riskLow: '#22C55E',

  // Priority
  priorityHigh: '#EF4444',
  priorityMedium: '#F59E0B',
  priorityLow: '#22C55E',

  // Feature status
  implemented: '#10B981',
  inProgress: '#3B82F6',
  planned: '#8B5CF6',
} as const;

// Status labels in Portuguese
export const STATUS_LABELS = {
  draft: 'Rascunho',
  validating: 'Em Validacao',
  validated: 'Validado',
} as const;

// Priority labels
export const PRIORITY_LABELS = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baixa',
} as const;

// Feature status labels
export const FEATURE_STATUS_LABELS = {
  implemented: 'Implementado',
  in_progress: 'Em Progresso',
  planned: 'Planejado',
} as const;

// Typography scale (inspired by professional presentations)
export const TYPOGRAPHY = {
  // Display - for cover page
  display: { fontSize: 42, fontWeight: 'bold' as const, letterSpacing: -0.5 },
  // Headlines
  h1: { fontSize: 28, fontWeight: 'bold' as const, letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: 'bold' as const },
  h3: { fontSize: 16, fontWeight: 'bold' as const },
  // Section labels (small uppercase)
  sectionLabel: { fontSize: 9, fontWeight: 'bold' as const, letterSpacing: 1.5 },
  // Body text
  body: { fontSize: 11, lineHeight: 1.6 },
  bodySmall: { fontSize: 10, lineHeight: 1.5 },
  // Captions
  caption: { fontSize: 8, color: PDF_COLORS.textMuted },
} as const;
