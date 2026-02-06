import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from '../styles/pdfColors';
import { PDFSubsection, PDFBulletList } from '../PDFSection';
import { PDFTable } from '../elements/PDFTable';
import { PDFPriorityBadge } from '../elements/PDFStatusBadge';
import type { GoToMarketContent } from '../../../../../types/admin';

interface GoToMarketPDFSectionProps {
  content: GoToMarketContent;
}

const styles = StyleSheet.create({
  messagesContainer: {
    marginBottom: 8,
  },
  messageCard: {
    backgroundColor: PDF_COLORS.backgroundLight,
    padding: 8,
    marginBottom: 6,
  },
  messageNumber: {
    fontSize: 7,
    fontWeight: 'bold',
    color: PDF_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  messageText: {
    fontSize: 9,
    color: PDF_COLORS.textPrimary,
    lineHeight: 1.4,
  },
  audienceCard: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderLight,
  },
  audienceSegment: {
    width: '30%',
    paddingRight: 8,
  },
  audienceSegmentText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: PDF_COLORS.deepBlue,
  },
  audienceMessage: {
    flex: 1,
  },
  audienceMessageText: {
    fontSize: 8,
    color: PDF_COLORS.textPrimary,
    lineHeight: 1.4,
  },
});

export function GoToMarketPDFSection({ content }: GoToMarketPDFSectionProps) {
  // Prepare channels data for table
  const channelsData = (content.channels || []).map((channel) => ({
    name: channel.name,
    strategy: channel.strategy,
    priority: channel.priority,
  }));

  return (
    <View>
      {/* Channels */}
      <PDFSubsection title="Canais de Aquisicao">
        {channelsData.length > 0 ? (
          <PDFTable
            columns={[
              { key: 'name', header: 'Canal', width: '20%' },
              { key: 'strategy', header: 'Estrategia', width: '60%' },
              {
                key: 'priority',
                header: 'Prioridade',
                width: '20%',
                render: (value) => (
                  <PDFPriorityBadge priority={value as 'high' | 'medium' | 'low'} />
                ),
              },
            ]}
            data={channelsData}
          />
        ) : (
          <Text style={{ fontSize: 10, color: PDF_COLORS.textMuted }}>
            Nenhum canal definido
          </Text>
        )}
      </PDFSubsection>

      {/* Strategies */}
      <PDFSubsection title="Estrategias">
        <PDFBulletList items={content.strategies || []} />
      </PDFSubsection>

      {/* Key Messages */}
      <PDFSubsection title="Mensagens-Chave">
        {(content.keyMessages || []).length > 0 ? (
          <View style={styles.messagesContainer}>
            {(content.keyMessages || []).map((message, index) => (
              <View key={index} style={styles.messageCard}>
                <Text style={styles.messageNumber}>Mensagem {index + 1}</Text>
                <Text style={styles.messageText}>"{message}"</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 10, color: PDF_COLORS.textMuted }}>
            Nenhuma mensagem definida
          </Text>
        )}
      </PDFSubsection>

      {/* Target Audiences */}
      <PDFSubsection title="Publicos-Alvo">
        {(content.targetAudiences || []).length > 0 ? (
          <View>
            {(content.targetAudiences || []).map((audience, index) => (
              <View key={index} style={styles.audienceCard}>
                <View style={styles.audienceSegment}>
                  <Text style={styles.audienceSegmentText}>{audience.segment}</Text>
                </View>
                <View style={styles.audienceMessage}>
                  <Text style={styles.audienceMessageText}>{audience.message}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 10, color: PDF_COLORS.textMuted }}>
            Nenhum publico definido
          </Text>
        )}
      </PDFSubsection>
    </View>
  );
}

export default GoToMarketPDFSection;
