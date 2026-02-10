import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from '../styles/pdfColors';

interface Risk {
  risk: string;
  impact: 'low' | 'medium' | 'high';
  probability: 'low' | 'medium' | 'high';
}

interface PDFRiskMatrixProps {
  risks: Risk[];
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  title: {
    fontSize: 9,
    fontWeight: 'bold',
    color: PDF_COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  matrixContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  yAxisLabel: {
    width: 16,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yAxisText: {
    fontSize: 7,
    color: PDF_COLORS.textSecondary,
    transform: 'rotate(-90deg)',
  },
  matrixGrid: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
  },
  cellCount: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  axisLabels: {
    flexDirection: 'row',
    marginLeft: 16,
    marginTop: 3,
  },
  axisLabel: {
    width: 30,
    fontSize: 6,
    color: PDF_COLORS.textMuted,
    textAlign: 'center',
  },
  xAxisTitle: {
    marginLeft: 16,
    marginTop: 3,
    fontSize: 7,
    color: PDF_COLORS.textSecondary,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 6,
    color: PDF_COLORS.textSecondary,
  },
});

// Color mapping based on combined risk level - more subtle
const getCellColor = (impactLevel: number, probabilityLevel: number): string => {
  const riskScore = impactLevel + probabilityLevel; // 0-4 scale
  if (riskScore >= 4) return '#F1F5F9'; // High risk - light gray
  if (riskScore >= 2) return '#F8FAFC'; // Medium risk - lighter
  return '#FFFFFF'; // Low risk - white
};

const getTextColor = (impactLevel: number, probabilityLevel: number): string => {
  const riskScore = impactLevel + probabilityLevel;
  if (riskScore >= 4) return PDF_COLORS.deepBlue;
  if (riskScore >= 2) return PDF_COLORS.textSecondary;
  return PDF_COLORS.textMuted;
};

const levelMap: Record<string, number> = { low: 0, medium: 1, high: 2 };
const levelLabels = ['Baixo', 'Medio', 'Alto'];

/**
 *
 */
export function PDFRiskMatrix({ risks }: PDFRiskMatrixProps) {
  // Count risks in each cell
  const matrix: number[][] = [
    [0, 0, 0], // Impact High
    [0, 0, 0], // Impact Medium
    [0, 0, 0], // Impact Low
  ];

  risks.forEach((risk) => {
    const impactIdx = 2 - levelMap[risk.impact]; // Invert so high is at top
    const probIdx = levelMap[risk.probability];
    matrix[impactIdx][probIdx]++;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Matriz de Riscos</Text>

      <View style={styles.matrixContainer}>
        {/* Y-axis label */}
        <View style={styles.yAxisLabel}>
          <Text style={styles.yAxisText}>IMPACTO</Text>
        </View>

        {/* Matrix grid */}
        <View style={styles.matrixGrid}>
          {matrix.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((count, colIdx) => {
                const impactLevel = 2 - rowIdx;
                const probLevel = colIdx;
                return (
                  <View
                    key={colIdx}
                    style={[
                      styles.cell,
                      { backgroundColor: getCellColor(impactLevel, probLevel) },
                    ]}
                  >
                    {count > 0 && (
                      <Text
                        style={[
                          styles.cellCount,
                          { color: getTextColor(impactLevel, probLevel) },
                        ]}
                      >
                        {count}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          {/* X-axis labels */}
          <View style={styles.axisLabels}>
            {levelLabels.map((label, idx) => (
              <Text key={idx} style={styles.axisLabel}>
                {label}
              </Text>
            ))}
          </View>
          <Text style={styles.xAxisTitle}>PROBABILIDADE</Text>
        </View>
      </View>

      {/* Legend - simplified */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F1F5F9' }]} />
          <Text style={styles.legendText}>Alto</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F8FAFC' }]} />
          <Text style={styles.legendText}>Medio</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: PDF_COLORS.border }]} />
          <Text style={styles.legendText}>Baixo</Text>
        </View>
      </View>
    </View>
  );
}

export default PDFRiskMatrix;
