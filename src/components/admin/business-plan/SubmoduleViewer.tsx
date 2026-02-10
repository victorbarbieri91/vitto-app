import { useState } from 'react';
import { ChevronRight, CheckCircle, Circle, ExternalLink } from 'lucide-react';
import TextFieldModal from './TextFieldModal';
import type {
  BusinessPlanSubmodule,
  BusinessPlanContent,
  ThesisContent,
  MarketContent,
  ProductContent,
  RevenueContent,
  GoToMarketContent,
  MetricsContent,
  RisksContent
} from '../../../types/admin';

interface SubmoduleViewerProps {
  submodule: BusinessPlanSubmodule;
  content: BusinessPlanContent;
}

// Truncate text helper
function truncateText(text: string | undefined, maxLength: number = 150): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Simple section wrapper - sobrio e minimalista
interface SectionProps {
  title: string;
  children: React.ReactNode;
  onViewMore?: () => void;
  showViewMore?: boolean;
}

function Section({ title, children, onViewMore, showViewMore }: SectionProps) {
  return (
    <div className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </h3>
        {showViewMore && onViewMore && (
          <button
            onClick={onViewMore}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
          >
            Ver completo <ExternalLink size={12} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// Text field component
interface TextFieldProps {
  label: string;
  value: string | undefined;
  maxLength?: number;
}

function TextField({ label, value, maxLength = 180 }: TextFieldProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const hasContent = !!value?.trim();
  const needsTruncation = (value?.length || 0) > maxLength;

  return (
    <>
      <Section
        title={label}
        showViewMore={needsTruncation}
        onViewMore={() => setModalOpen(true)}
      >
        <p className="text-sm text-slate-700 leading-relaxed">
          {hasContent ? truncateText(value, maxLength) : (
            <span className="text-slate-400 italic">Nao definido</span>
          )}
        </p>
      </Section>

      <TextFieldModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={label}
        value={value || ''}
        readOnly
      />
    </>
  );
}

// List field component
interface ListFieldProps {
  label: string;
  items: string[] | undefined;
  emptyText?: string;
}

function ListField({ label, items, emptyText = 'Nenhum item' }: ListFieldProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const hasItems = items && items.length > 0;
  const needsModal = (items?.length || 0) > 5;

  return (
    <>
      <Section
        title={label}
        showViewMore={needsModal}
        onViewMore={() => setModalOpen(true)}
      >
        {hasItems ? (
          <ul className="space-y-2">
            {items.slice(0, 5).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <ChevronRight size={14} className="text-slate-300 mt-1 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
            {(items.length > 5) && (
              <li className="text-xs text-slate-400 pl-5">+ {items.length - 5} itens</li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 italic">{emptyText}</p>
        )}
      </Section>

      <TextFieldModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={label}
        value={items?.map((item, i) => `${i + 1}. ${item}`).join('\n\n') || ''}
        readOnly
      />
    </>
  );
}

// Hypotheses component
interface HypothesesFieldProps {
  hypotheses: Array<{ text: string; validated: boolean }> | undefined;
}

function HypothesesField({ hypotheses }: HypothesesFieldProps) {
  const hasItems = hypotheses && hypotheses.length > 0;
  const validatedCount = hypotheses?.filter(h => h.validated).length || 0;

  return (
    <Section title="Hipoteses">
      {hasItems ? (
        <>
          <p className="text-xs text-slate-400 mb-3">{validatedCount} de {hypotheses.length} validadas</p>
          <ul className="space-y-2.5">
            {hypotheses.map((hyp, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm">
                {hyp.validated ? (
                  <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle size={16} className="text-slate-300 mt-0.5 flex-shrink-0" />
                )}
                <span className={hyp.validated ? 'text-slate-700' : 'text-slate-500'}>
                  {hyp.text}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhuma hipotese definida</p>
      )}
    </Section>
  );
}

// Features component
interface FeaturesFieldProps {
  features: Array<{ name: string; description: string; status: string }> | undefined;
}

function FeaturesField({ features }: FeaturesFieldProps) {
  const hasItems = features && features.length > 0;

  const statusLabel: Record<string, string> = {
    implemented: 'Pronto',
    in_progress: 'Em dev',
    planned: 'Planejado'
  };

  const statusStyle: Record<string, string> = {
    implemented: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-amber-100 text-amber-700',
    planned: 'bg-slate-100 text-slate-500'
  };

  return (
    <Section title="Funcionalidades">
      {hasItems ? (
        <div className="space-y-2">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-center justify-between py-1">
              <span className="text-sm text-slate-700">{feat.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle[feat.status] || statusStyle.planned}`}>
                {statusLabel[feat.status] || 'Planejado'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhuma funcionalidade</p>
      )}
    </Section>
  );
}

// Segments component
interface SegmentsFieldProps {
  segments: Array<{ name: string; size: string; characteristics: string }> | undefined;
}

function SegmentsField({ segments }: SegmentsFieldProps) {
  const hasItems = segments && segments.length > 0;

  return (
    <Section title="Segmentos de Mercado">
      {hasItems ? (
        <div className="space-y-3">
          {segments.map((seg, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{seg.name}</span>
                {seg.size && <span className="text-xs text-slate-400">({seg.size})</span>}
              </div>
              {seg.characteristics && (
                <p className="text-xs text-slate-500 mt-1">{seg.characteristics}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum segmento</p>
      )}
    </Section>
  );
}

// Competitors component
interface CompetitorsFieldProps {
  competitors: Array<{ name: string; strengths: string[]; weaknesses: string[] }> | undefined;
}

function CompetitorsField({ competitors }: CompetitorsFieldProps) {
  const hasItems = competitors && competitors.length > 0;

  return (
    <Section title="Concorrentes">
      {hasItems ? (
        <div className="flex flex-wrap gap-2">
          {competitors.map((comp, idx) => (
            <span key={idx} className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-600">
              {comp.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum concorrente</p>
      )}
    </Section>
  );
}

// Plans component
interface PlansFieldProps {
  plans: Array<{ name: string; price: string; features: string[] }> | undefined;
}

function PlansField({ plans }: PlansFieldProps) {
  const hasItems = plans && plans.length > 0;

  return (
    <Section title="Planos">
      {hasItems ? (
        <div className="space-y-2">
          {plans.map((plan, idx) => (
            <div key={idx} className="flex items-center justify-between py-1">
              <span className="text-sm text-slate-700">{plan.name}</span>
              <span className="text-sm font-medium text-emerald-600">{plan.price}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum plano</p>
      )}
    </Section>
  );
}

// Channels component
interface ChannelsFieldProps {
  channels: Array<{ name: string; strategy: string; priority: string }> | undefined;
}

function ChannelsField({ channels }: ChannelsFieldProps) {
  const hasItems = channels && channels.length > 0;

  const priorityLabel: Record<string, string> = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baixa'
  };

  return (
    <Section title="Canais de Aquisicao">
      {hasItems ? (
        <div className="space-y-2">
          {channels.map((chan, idx) => (
            <div key={idx} className="flex items-center justify-between py-1">
              <span className="text-sm text-slate-700">{chan.name}</span>
              <span className="text-xs text-slate-500">Prioridade: {priorityLabel[chan.priority] || 'Media'}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum canal</p>
      )}
    </Section>
  );
}

// KPIs component
interface KPIsFieldProps {
  kpis: Array<{ name: string; target: string; current?: string }> | undefined;
}

function KPIsField({ kpis }: KPIsFieldProps) {
  const hasItems = kpis && kpis.length > 0;

  return (
    <Section title="Indicadores-Chave">
      {hasItems ? (
        <div className="space-y-2">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="flex items-center justify-between py-1">
              <span className="text-sm text-slate-700">{kpi.name}</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500">Atual: {kpi.current || '-'}</span>
                <span className="text-emerald-600">Meta: {kpi.target}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum indicador</p>
      )}
    </Section>
  );
}

// Risks component
interface RisksFieldProps {
  risks: Array<{ risk: string; impact: string; probability: string; mitigation?: string }> | undefined;
}

function RisksField({ risks }: RisksFieldProps) {
  const hasItems = risks && risks.length > 0;

  const impactLabel: Record<string, string> = {
    high: 'Alto',
    medium: 'Medio',
    low: 'Baixo'
  };

  const impactStyle: Record<string, string> = {
    high: 'text-red-600',
    medium: 'text-amber-600',
    low: 'text-slate-500'
  };

  return (
    <Section title="Riscos Mapeados">
      {hasItems ? (
        <div className="space-y-2">
          {risks.map((risk, idx) => (
            <div key={idx} className="flex items-center justify-between py-1">
              <span className="text-sm text-slate-700">{risk.risk}</span>
              <span className={`text-xs ${impactStyle[risk.impact] || impactStyle.medium}`}>
                Impacto: {impactLabel[risk.impact] || 'Medio'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum risco</p>
      )}
    </Section>
  );
}

// Period Objectives component
interface PeriodObjectivesFieldProps {
  objectives: Array<{ period: string; objectives: string[]; status: string }> | undefined;
}

function PeriodObjectivesField({ objectives }: PeriodObjectivesFieldProps) {
  const hasItems = objectives && objectives.length > 0;

  const statusLabel: Record<string, string> = {
    achieved: 'Alcancado',
    in_progress: 'Em progresso',
    pending: 'Pendente'
  };

  const statusStyle: Record<string, string> = {
    achieved: 'text-emerald-600',
    in_progress: 'text-amber-600',
    pending: 'text-slate-500'
  };

  return (
    <Section title="Objetivos por Periodo">
      {hasItems ? (
        <div className="space-y-2">
          {objectives.map((obj, idx) => (
            <div key={idx} className="flex items-center justify-between py-1">
              <span className="text-sm text-slate-700">{obj.period}</span>
              <span className={`text-xs ${statusStyle[obj.status] || statusStyle.pending}`}>
                {statusLabel[obj.status] || 'Pendente'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum objetivo</p>
      )}
    </Section>
  );
}

// Decisions component
interface DecisionsFieldProps {
  title: string;
  decisions: Array<{ decision: string; date?: string; deadline?: string }> | undefined;
  dateLabel?: string;
}

function DecisionsField({ title, decisions, dateLabel = 'Data' }: DecisionsFieldProps) {
  const hasItems = decisions && decisions.length > 0;

  return (
    <Section title={title}>
      {hasItems ? (
        <div className="space-y-2">
          {decisions.map((dec, idx) => (
            <div key={idx} className="py-1">
              <p className="text-sm text-slate-700">{dec.decision}</p>
              {(dec.date || dec.deadline) && (
                <p className="text-xs text-slate-400 mt-1">
                  {dateLabel}: {dec.date || dec.deadline}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhuma decisao</p>
      )}
    </Section>
  );
}

// Main viewer component
/**
 *
 */
export default function SubmoduleViewer({ submodule, content }: SubmoduleViewerProps) {
  switch (submodule) {
    case 'thesis':
      return <ThesisViewer content={content as ThesisContent} />;
    case 'market':
      return <MarketViewer content={content as MarketContent} />;
    case 'product':
      return <ProductViewer content={content as ProductContent} />;
    case 'revenue':
      return <RevenueViewer content={content as RevenueContent} />;
    case 'go_to_market':
      return <GoToMarketViewer content={content as GoToMarketContent} />;
    case 'metrics':
      return <MetricsViewer content={content as MetricsContent} />;
    case 'risks':
      return <RisksViewer content={content as RisksContent} />;
    default:
      return <div className="text-slate-500">Visualizador nao disponivel</div>;
  }
}

// THESIS VIEWER
function ThesisViewer({ content }: { content: ThesisContent }) {
  return (
    <div className="space-y-6">
      <TextField label="Problema Central" value={content.problem} />
      <TextField label="Publico-Alvo (Beachhead)" value={content.targetAudience} />
      <TextField label="Proposta de Valor" value={content.valueProposition} />
      <ListField label="Diferenciais" items={content.differentiators} />
      <HypothesesField hypotheses={content.hypotheses} />
    </div>
  );
}

// MARKET VIEWER
function MarketViewer({ content }: { content: MarketContent }) {
  return (
    <div className="space-y-6">
      <SegmentsField segments={content.segments} />
      <CompetitorsField competitors={content.competitors} />
      <TextField label="Posicionamento" value={content.positioning} />
    </div>
  );
}

// PRODUCT VIEWER
function ProductViewer({ content }: { content: ProductContent }) {
  return (
    <div className="space-y-6">
      <FeaturesField features={content.features} />
      <TextField label="Valor Entregue" value={content.valueDelivered} />
      <ListField label="Limitacoes Atuais" items={content.limitations} />
    </div>
  );
}

// REVENUE VIEWER
function RevenueViewer({ content }: { content: RevenueContent }) {
  return (
    <div className="space-y-6">
      <PlansField plans={content.plans} />
      <ListField label="Estrategias de Monetizacao" items={content.monetizationStrategies} />
    </div>
  );
}

// GO TO MARKET VIEWER
function GoToMarketViewer({ content }: { content: GoToMarketContent }) {
  return (
    <div className="space-y-6">
      <ChannelsField channels={content.channels} />
      <ListField label="Mensagens-Chave" items={content.keyMessages} />
    </div>
  );
}

// METRICS VIEWER
function MetricsViewer({ content }: { content: MetricsContent }) {
  return (
    <div className="space-y-6">
      <KPIsField kpis={content.keyIndicators} />
      <PeriodObjectivesField objectives={content.periodObjectives} />
    </div>
  );
}

// RISKS VIEWER
function RisksViewer({ content }: { content: RisksContent }) {
  return (
    <div className="space-y-6">
      <RisksField risks={content.mappedRisks} />
      <DecisionsField
        title="Decisoes Tomadas"
        decisions={content.decisionsMade?.map(d => ({ decision: d.decision, date: d.date }))}
      />
      <DecisionsField
        title="Decisoes Pendentes"
        decisions={content.decisionsPending?.map(d => ({ decision: d.decision, deadline: d.deadline }))}
        dateLabel="Prazo"
      />
    </div>
  );
}
