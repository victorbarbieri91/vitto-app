import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from '../styles/pdfColors';
import { PDFSubsection } from '../PDFSection';
import { PDFTable } from '../elements/PDFTable';
import { PDFProgressBar } from '../elements/PDFProgressBar';
import type { MetricsContent } from '../../../../../types/admin';

interface MetricsPDFSectionProps {
  content: MetricsContent;
}

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: PDF_COLORS.backgroundLight,
    padding: 10,
  },
  kpiName: {
    fontSize: 7,
    fontWeight: 'bold',
    color: PDF_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PDF_COLORS.deepBlue,
    marginBottom: 3,
  },
  kpiTarget: {
    fontSize: 8,
    color: PDF_COLORS.textMuted,
    marginBottom: 6,
  },
  objectiveCard: {
    backgroundColor: PDF_COLORS.backgroundLight,
    padding: 10,
    marginBottom: 6,
  },
  objectivePeriod: {
    fontSize: 9,
    fontWeight: 'bold',
    color: PDF_COLORS.deepBlue,
    marginBottom: 6,
  },
  objectiveList: {
    marginBottom: 6,
  },
  objectiveItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  objectiveBullet: {
    width: 12,
    fontSize: 8,
    color: PDF_COLORS.textSecondary,
  },
  objectiveText: {
    flex: 1,
    fontSize: 8,
    color: PDF_COLORS.textPrimary,
    lineHeight: 1.4,
  },
  objectiveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 7,
    color: PDF_COLORS.textMuted,
  },
});

const STATUS_COLORS = {
  pending: PDF_COLORS.draft,
  in_progress: PDF_COLORS.validating,
  achieved: PDF_COLORS.validated,
};

const STATUS_LABELS = {
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  achieved: 'Alcancado',
};


/**
 *
 */
export function MetricsPDFSection({ content }: MetricsPDFSectionProps) {
  // Prepare tracking data for table
  const trackingData = (content.resultsTracking || []).map((item) => ({
    date: item.date,
    metric: item.metric,
    value: item.value,
    notes: item.notes || '-',
  }));

  return (
    <View>
      {/* Key Indicators */}
      <PDFSubsection title="Indicadores-Chave (KPIs)">
        {(content.keyIndicators || []).length > 0 ? (
          <View style={styles.kpiGrid}>
            {(content.keyIndicators || []).map((kpi, index) => (
              <View key={index} style={styles.kpiCard}>
                <Text style={styles.kpiName}>{kpi.name}</Text>
                <Text style={styles.kpiValue}>{kpi.current || '-'}</Text>
                <Text style={styles.kpiTarget}>Meta: {kpi.target}</Text>
                <PDFProgressBar
                  current={kpi.current}
                  target={kpi.target}
                  showLabel={false}
                  height={4}
                />
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 10, color: PDF_COLORS.textMuted }}>
            Nenhum indicador definido
          </Text>
        )}
      </PDFSubsection>

      {/* Period Objectives */}
      <PDFSubsection title="Objetivos por Periodo">
        {(content.periodObjectives || []).length > 0 ? (
          <View>
            {(content.periodObjectives || []).map((period, index) => (
              <View
                key={index}
                style={styles.objectiveCard}
                wrap={false}
              >
                <Text style={styles.objectivePeriod}>{period.period}</Text>
                <View style={styles.objectiveList}>
                  {(period.objectives || []).map((obj, idx) => (
                    <View key={idx} style={styles.objectiveItem}>
                      <Text style={styles.objectiveBullet}>•</Text>
                      <Text style={styles.objectiveText}>{obj}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.objectiveStatus}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: STATUS_COLORS[period.status] },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {STATUS_LABELS[period.status]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 10, color: PDF_COLORS.textMuted }}>
            Nenhum objetivo definido
          </Text>
        )}
      </PDFSubsection>

      {/* Results Tracking */}
      {trackingData.length > 0 && (
        <PDFSubsection title="Acompanhamento de Resultados">
          <PDFTable
            columns={[
              { key: 'date', header: 'Data', width: '15%' },
              { key: 'metric', header: 'Metrica', width: '25%' },
              { key: 'value', header: 'Valor', width: '20%' },
              { key: 'notes', header: 'Observacoes', width: '40%' },
            ]}
            data={trackingData}
          />
        </PDFSubsection>
      )}
    </View>
  );
}

export default MetricsPDFSection;
