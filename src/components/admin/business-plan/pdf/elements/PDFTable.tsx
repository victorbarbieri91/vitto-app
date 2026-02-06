import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from '../styles/pdfColors';

interface Column {
  key: string;
  header: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface PDFTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  striped?: boolean;
}

const styles = StyleSheet.create({
  table: {
    width: '100%',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.deepBlue,
  },
  headerCell: {
    padding: 6,
    paddingVertical: 8,
    fontSize: 7,
    fontWeight: 'bold',
    color: PDF_COLORS.textWhite,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderLight,
  },
  altRow: {
    backgroundColor: PDF_COLORS.backgroundLight,
  },
  cell: {
    padding: 6,
    paddingVertical: 6,
    fontSize: 8,
    color: PDF_COLORS.textPrimary,
    lineHeight: 1.4,
  },
  cellLeft: {
    textAlign: 'left',
  },
  cellCenter: {
    textAlign: 'center',
  },
  cellRight: {
    textAlign: 'right',
  },
});

export function PDFTable({ columns, data, striped = true }: PDFTableProps) {
  const getCellStyle = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return styles.cellCenter;
      case 'right':
        return styles.cellRight;
      default:
        return styles.cellLeft;
    }
  };

  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.headerRow}>
        {columns.map((col) => (
          <View
            key={col.key}
            style={[
              styles.headerCell,
              { width: col.width || `${100 / columns.length}%` },
              getCellStyle(col.align),
            ]}
          >
            <Text>{col.header}</Text>
          </View>
        ))}
      </View>

      {/* Body */}
      {data.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={[
            styles.row,
            striped && rowIndex % 2 === 1 ? styles.altRow : {},
          ]}
        >
          {columns.map((col) => (
            <View
              key={col.key}
              style={[
                styles.cell,
                { width: col.width || `${100 / columns.length}%` },
                getCellStyle(col.align),
              ]}
            >
              {col.render ? (
                col.render(row[col.key], row)
              ) : (
                <Text>{String(row[col.key] ?? '')}</Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export default PDFTable;
