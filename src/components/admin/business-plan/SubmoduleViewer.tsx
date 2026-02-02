import { useState } from 'react';
import { ChevronRight, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
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

// Text field card component
interface TextFieldCardProps {
  label: string;
  value: string | undefined;
  maxLength?: number;
}

function TextFieldCard({ label, value, maxLength = 150 }: TextFieldCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const hasContent = !!value?.trim();
  const needsTruncation = (value?.length || 0) > maxLength;

  return (
    <>
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {label}
          </span>
          {needsTruncation && (
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs text-coral-600 hover:text-coral-700 flex items-center gap-1 flex-shrink-0"
            >
              Ver mais <ExternalLink size={12} />
            </button>
          )}
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          {hasContent ? truncateText(value, maxLength) : (
            <span className="text-slate-400 italic">Nao definido</span>
          )}
        </p>
      </div>

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

// List field card component
interface ListFieldCardProps {
  label: string;
  items: string[] | undefined;
  emptyText?: string;
}

function ListFieldCard({ label, items, emptyText = 'Nenhum item' }: ListFieldCardProps) {
  const hasItems = items && items.length > 0;
  const displayItems = items?.slice(0, 3) || [];
  const remainingCount = (items?.length || 0) - 3;

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
        {label}
      </span>
      {hasItems ? (
        <ul className="space-y-1.5">
          {displayItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
              <ChevronRight size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{truncateText(item, 80)}</span>
            </li>
          ))}
          {remainingCount > 0 && (
            <li className="text-xs text-slate-500 pl-5">
              + {remainingCount} mais
            </li>
          )}
        </ul>
      ) : (
        <p className="text-sm text-slate-400 italic">{emptyText}</p>
      )}
    </div>
  );
}

// Hypotheses card component
interface HypothesesCardProps {
  hypotheses: Array<{ text: string; validated: boolean }> | undefined;
}

function HypothesesCard({ hypotheses }: HypothesesCardProps) {
  const hasItems = hypotheses && hypotheses.length > 0;

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
        Hipoteses
      </span>
      {hasItems ? (
        <ul className="space-y-2">
          {hypotheses.map((hyp, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              {hyp.validated ? (
                <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle size={16} className="text-slate-300 mt-0.5 flex-shrink-0" />
              )}
              <span className={hyp.validated ? 'text-slate-700' : 'text-slate-600'}>
                {truncateText(hyp.text, 100)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhuma hipotese definida</p>
      )}
    </div>
  );
}

// Features card component
interface FeaturesCardProps {
  features: Array<{ name: string; description: string; status: string }> | undefined;
}

function FeaturesCard({ features }: FeaturesCardProps) {
  const hasItems = features && features.length > 0;
  const displayItems = features?.slice(0, 4) || [];
  const remainingCount = (features?.length || 0) - 4;

  const statusColors: Record<string, string> = {
    implemented: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-amber-100 text-amber-700',
    planned: 'bg-slate-100 text-slate-600'
  };

  const statusLabels: Record<string, string> = {
    implemented: 'Pronto',
    in_progress: 'Em dev',
    planned: 'Planejado'
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
        Funcionalidades
      </span>
      {hasItems ? (
        <div className="space-y-2">
          {displayItems.map((feat, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-700 truncate flex-1">{feat.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[feat.status] || statusColors.planned}`}>
                {statusLabels[feat.status] || 'Planejado'}
              </span>
            </div>
          ))}
          {remainingCount > 0 && (
            <p className="text-xs text-slate-500">+ {remainingCount} mais</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhuma funcionalidade</p>
      )}
    </div>
  );
}

// Segments card component
interface SegmentsCardProps {
  segments: Array<{ name: string; size: string; characteristics: string }> | undefined;
}

function SegmentsCard({ segments }: SegmentsCardProps) {
  const hasItems = segments && segments.length > 0;

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
        Segmentos de Mercado
      </span>
      {hasItems ? (
        <div className="space-y-2">
          {segments.map((seg, idx) => (
            <div key={idx} className="text-sm">
              <span className="font-medium text-slate-700">{seg.name}</span>
              {seg.size && <span className="text-slate-500 ml-2">({seg.size})</span>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum segmento definido</p>
      )}
    </div>
  );
}

// Competitors card component
interface CompetitorsCardProps {
  competitors: Array<{ name: string; strengths: string[]; weaknesses: string[] }> | undefined;
}

function CompetitorsCard({ competitors }: CompetitorsCardProps) {
  const hasItems = competitors && competitors.length > 0;

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
        Concorrentes
      </span>
      {hasItems ? (
        <div className="flex flex-wrap gap-2">
          {competitors.map((comp, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-700"
            >
              {comp.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum concorrente mapeado</p>
      )}
    </div>
  );
}

// Plans card component
interface PlansCardProps {
  plans: Array<{ name: string; price: string; features: string[] }> | undefined;
}

function PlansCard({ plans }: PlansCardProps) {
  const hasItems = plans && plans.length > 0;

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
        Planos
      </span>
      {hasItems ? (
        <div className="space-y-2">
          {plans.map((plan, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm text-slate-700">{plan.name}</span>
              <span className="text-sm font-medium text-emerald-600">{plan.price}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum plano definido</p>
      )}
    </div>
  );
}

// Channels card component
interface ChannelsCardProps {
  channels: Array<{ name: string; strategy: string; priority: string }> | undefined;
}

function ChannelsCard({ channels }: ChannelsCardProps) {
  const hasItems = channels && channels.length > 0;

  const priorityColors: Record<string, string> = {
    high: 'bg-coral-100 text-coral-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600'
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
        Canais de Aquisicao
      </span>
      {hasItems ? (
        <div className="space-y-2">
          {channels.map((chan, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-700 truncate flex-1">{chan.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[chan.priority] || priorityColors.medium}`}>
                {chan.priority === 'high' ? 'Alta' : chan.priority === 'low' ? 'Baixa' : 'Media'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum canal definido</p>
      )}
    </div>
  );
}

// KPIs card component
interface KPIsCardProps {
  kpis: Array<{ name: string; target: string; current?: string }> | undefined;
}

function KPIsCard({ kpis }: KPIsCardProps) {
  const hasItems = kpis && kpis.length > 0;

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
        Indicadores-Chave
      </span>
      {hasItems ? (
        <div className="space-y-2">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-700 truncate flex-1">{kpi.name}</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Atual: {kpi.current || '-'}</span>
                <span className="text-emerald-600">Meta: {kpi.target || '-'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum indicador definido</p>
      )}
    </div>
  );
}

// Risks card component
interface RisksCardProps {
  risks: Array<{ risk: string; impact: string; probability: string; mitigation?: string }> | undefined;
}

function RisksCard({ risks }: RisksCardProps) {
  const hasItems = risks && risks.length > 0;

  const impactColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600'
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
        Riscos Mapeados
      </span>
      {hasItems ? (
        <div className="space-y-2">
          {risks.slice(0, 3).map((risk, idx) => (
            <div key={idx} className="flex items-start justify-between gap-2">
              <span className="text-sm text-slate-700 truncate flex-1">{risk.risk}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${impactColors[risk.impact] || impactColors.medium}`}>
                {risk.impact === 'high' ? 'Alto' : risk.impact === 'low' ? 'Baixo' : 'Medio'}
              </span>
            </div>
          ))}
          {(risks?.length || 0) > 3 && (
            <p className="text-xs text-slate-500">+ {risks.length - 3} mais</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum risco mapeado</p>
      )}
    </div>
  );
}

// Main viewer component
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
    <div className="space-y-4">
      <TextFieldCard label="Problema Central" value={content.problem} />
      <TextFieldCard label="Publico-Alvo (Beachhead)" value={content.targetAudience} />
      <TextFieldCard label="Proposta de Valor" value={content.valueProposition} />
      <ListFieldCard label="Diferenciais" items={content.differentiators} />
      <HypothesesCard hypotheses={content.hypotheses} />
    </div>
  );
}

// MARKET VIEWER
function MarketViewer({ content }: { content: MarketContent }) {
  return (
    <div className="space-y-4">
      <SegmentsCard segments={content.segments} />
      <CompetitorsCard competitors={content.competitors} />
      <TextFieldCard label="Posicionamento" value={content.positioning} />
    </div>
  );
}

// PRODUCT VIEWER
function ProductViewer({ content }: { content: ProductContent }) {
  return (
    <div className="space-y-4">
      <FeaturesCard features={content.features} />
      <TextFieldCard label="Valor Entregue" value={content.valueDelivered} />
      <ListFieldCard label="Limitacoes Atuais" items={content.limitations} />
    </div>
  );
}

// REVENUE VIEWER
function RevenueViewer({ content }: { content: RevenueContent }) {
  return (
    <div className="space-y-4">
      <PlansCard plans={content.plans} />
      <ListFieldCard label="Estrategias de Monetizacao" items={content.monetizationStrategies} />
    </div>
  );
}

// GO TO MARKET VIEWER
function GoToMarketViewer({ content }: { content: GoToMarketContent }) {
  return (
    <div className="space-y-4">
      <ChannelsCard channels={content.channels} />
      <ListFieldCard label="Mensagens-Chave" items={content.keyMessages} />
    </div>
  );
}

// METRICS VIEWER
function MetricsViewer({ content }: { content: MetricsContent }) {
  return (
    <div className="space-y-4">
      <KPIsCard kpis={content.keyIndicators} />
      {content.periodObjectives && content.periodObjectives.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-2">
            Objetivos por Periodo
          </span>
          <div className="space-y-2">
            {content.periodObjectives.map((obj, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{obj.period}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  obj.status === 'achieved' ? 'bg-emerald-100 text-emerald-700' :
                  obj.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {obj.status === 'achieved' ? 'Alcancado' : obj.status === 'in_progress' ? 'Em progresso' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// RISKS VIEWER
function RisksViewer({ content }: { content: RisksContent }) {
  return (
    <div className="space-y-4">
      <RisksCard risks={content.mappedRisks} />

      {content.decisionsMade && content.decisionsMade.length > 0 && (
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
          <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide block mb-2">
            Decisoes Tomadas
          </span>
          <div className="space-y-2">
            {content.decisionsMade.slice(0, 3).map((dec, idx) => (
              <div key={idx} className="text-sm text-slate-700">
                {dec.decision}
                {dec.date && <span className="text-slate-400 ml-2 text-xs">({dec.date})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {content.decisionsPending && content.decisionsPending.length > 0 && (
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
          <span className="text-xs font-medium text-amber-700 uppercase tracking-wide block mb-2">
            Decisoes Pendentes
          </span>
          <div className="space-y-2">
            {content.decisionsPending.slice(0, 3).map((dec, idx) => (
              <div key={idx} className="text-sm text-slate-700">
                {dec.decision}
                {dec.deadline && <span className="text-amber-600 ml-2 text-xs">(ate {dec.deadline})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
