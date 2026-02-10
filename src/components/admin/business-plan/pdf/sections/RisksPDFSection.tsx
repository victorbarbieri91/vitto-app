import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from '../styles/pdfColors';
import { PDFSubsection, PDFBulletList } from '../PDFSection';
import { PDFTable } from '../elements/PDFTable';
import { PDFRiskMatrix } from '../elements/PDFRiskMatrix';
import type { RisksContent } from '../../../../../types/admin';

interface RisksPDFSectionProps {
  content: RisksContent;
}

const styles = StyleSheet.create({
  impactText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  // Decision cards - completed decisions with deep blue accent
  decisionCard: {
    backgroundColor: PDF_COLORS.backgroundLight,
    padding: 10,
    marginBottom: 8,
  },
  decisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  decisionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  decisionAccent: {
    width: 3,
    height: 12,
    backgroundColor: PDF_COLORS.validated,
    marginRight: 8,
  },
  decisionTitle: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
  },
  decisionDateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: PDF_COLORS.deepBlue,
  },
  decisionDate: {
    fontSize: 6,
    fontWeight: 'bold',
    color: PDF_COLORS.textWhite,
  },
  decisionJustification: {
    fontSize: 8,
    color: PDF_COLORS.textSecondary,
    marginBottom: 6,
    lineHeight: 1.4,
    textAlign: 'justify',
    paddingLeft: 11,
  },
  decisionImpact: {
    fontSize: 7,
    color: PDF_COLORS.coral,
    fontWeight: 'bold',
    paddingLeft: 11,
  },
  // Pending decisions - with warning accent
  pendingCard: {
    backgroundColor: PDF_COLORS.backgroundLight,
    padding: 10,
    marginBottom: 8,
  },
  pendingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pendingAccent: {
    width: 3,
    height: 12,
    backgroundColor: PDF_COLORS.validating,
    marginRight: 8,
  },
  pendingTitle: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
  },
  pendingContext: {
    fontSize: 8,
    color: PDF_COLORS.textSecondary,
    marginBottom: 6,
    lineHeight: 1.4,
    textAlign: 'justify',
    paddingLeft: 11,
  },
  pendingDeadlineBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: PDF_COLORS.validating,
    marginLeft: 11,
  },
  pendingDeadline: {
    fontSize: 6,
    fontWeight: 'bold',
    color: PDF_COLORS.textWhite,
  },
});

const IMPACT_LABELS = {
  high: 'Alto',
  medium: 'Medio',
  low: 'Baixo',
};

function ImpactText({ level }: { level: 'high' | 'medium' | 'low' }) {
  return (
    <Text style={styles.impactText}>{IMPACT_LABELS[level]}</Text>
  );
}

/**
 *
 */
export function RisksPDFSection({ content }: RisksPDFSectionProps) {
  // Prepare risks data for the matrix
  const risksForMatrix = (content.mappedRisks || []).map((r) => ({
    risk: r.risk,
    impact: r.impact,
    probability: r.probability,
  }));

  // Prepare risks data for table
  const risksTableData = (content.mappedRisks || []).map((risk) => ({
    risk: risk.risk,
    impact: risk.impact,
    probability: risk.probability,
    mitigation: risk.mitigation || '-',
  }));

  return (
    <View>
      {/* Risk Matrix */}
      {risksForMatrix.length > 0 && (
        <PDFSubsection title="Visao Geral dos Riscos">
          <PDFRiskMatrix risks={risksForMatrix} />
        </PDFSubsection>
      )}

      {/* Mapped Risks Table */}
      <PDFSubsection title="Riscos Mapeados">
        {risksTableData.length > 0 ? (
          <PDFTable
            columns={[
              { key: 'risk', header: 'Risco', width: '30%' },
              {
                key: 'impact',
                header: 'Impacto',
                width: '12%',
                render: (value) => <ImpactText level={value as 'high' | 'medium' | 'low'} />,
              },
              {
                key: 'probability',
                header: 'Prob.',
                width: '12%',
                render: (value) => <ImpactText level={value as 'high' | 'medium' | 'low'} />,
              },
              { key: 'mitigation', header: 'Mitigacao', width: '46%' },
            ]}
            data={risksTableData}
          />
        ) : (
          <Text style={{ fontSize: 10, color: PDF_COLORS.textMuted }}>
            Nenhum risco mapeado
          </Text>
        )}
      </PDFSubsection>

      {/* Decisions Made */}
      <PDFSubsection title="Decisoes Tomadas">
        {(content.decisionsMade || []).length > 0 ? (
          <View>
            {(content.decisionsMade || []).map((decision, index) => (
              <View key={index} style={styles.decisionCard} wrap={false}>
                <View style={styles.decisionHeader}>
                  <View style={styles.decisionTitleContainer}>
                    <View style={styles.decisionAccent} />
                    <Text style={styles.decisionTitle}>{decision.decision}</Text>
                  </View>
                  <View style={styles.decisionDateBadge}>
                    <Text style={styles.decisionDate}>{decision.date}</Text>
                  </View>
                </View>
                <Text style={styles.decisionJustification}>
                  {decision.justification}
                </Text>
                <Text style={styles.decisionImpact}>
                  Impacto: {decision.impact}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 10, color: PDF_COLORS.textMuted }}>
            Nenhuma decisao registrada
          </Text>
        )}
      </PDFSubsection>

      {/* Pending Decisions */}
      <PDFSubsection title="Decisoes Pendentes">
        {(content.decisionsPending || []).length > 0 ? (
          <View>
            {(content.decisionsPending || []).map((decision, index) => (
              <View key={index} style={styles.pendingCard} wrap={false}>
                <View style={styles.pendingTitleContainer}>
                  <View style={styles.pendingAccent} />
                  <Text style={styles.pendingTitle}>{decision.decision}</Text>
                </View>
                <Text style={styles.pendingContext}>{decision.context}</Text>
                {decision.deadline && (
                  <View style={styles.pendingDeadlineBadge}>
                    <Text style={styles.pendingDeadline}>
                      Prazo: {decision.deadline}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 10, color: PDF_COLORS.textMuted }}>
            Nenhuma decisao pendente
          </Text>
        )}
      </PDFSubsection>

      {/* Justifications */}
      {(content.justifications || []).length > 0 && (
        <PDFSubsection title="Justificativas Estrategicas">
          <PDFBulletList items={content.justifications || []} />
        </PDFSubsection>
      )}
    </View>
  );
}

export default RisksPDFSection;
