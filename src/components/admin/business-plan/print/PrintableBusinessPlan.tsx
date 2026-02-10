import { useEffect } from 'react';
import {
  SUBMODULE_INFO,
  type BusinessPlan,
  type BusinessPlanSubmodule,
  type ThesisContent,
  type MarketContent,
  type ProductContent,
  type RevenueContent,
  type GoToMarketContent,
  type MetricsContent,
  type RisksContent,
} from '../../../../types/admin';
import './printStyles.css';

interface PrintableBusinessPlanProps {
  plans: BusinessPlan[];
  companyName?: string;
  onPrintReady?: () => void;
}

// Define the order of submodules
const SUBMODULE_ORDER: BusinessPlanSubmodule[] = [
  'thesis',
  'market',
  'product',
  'revenue',
  'go_to_market',
  'metrics',
  'risks',
];

// Colors
const COLORS = {
  coral: '#F87060',
  deepBlue: '#102542',
  draft: '#64748B',
  validating: '#F59E0B',
  validated: '#10B981',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  backgroundLight: '#F8FAFC',
  border: '#E2E8F0',
};

const STATUS_LABELS = {
  draft: 'Rascunho',
  validating: 'Em Validacao',
  validated: 'Validado',
};

/**
 *
 */
export function PrintableBusinessPlan({
  plans,
  companyName = 'Vitto',
  onPrintReady,
}: PrintableBusinessPlanProps) {
  const sortedPlans = [...plans].sort(
    (a, b) =>
      SUBMODULE_ORDER.indexOf(a.submodule) - SUBMODULE_ORDER.indexOf(b.submodule)
  );

  const validated = plans.filter((p) => p.status === 'validated').length;
  const validating = plans.filter((p) => p.status === 'validating').length;
  const draft = plans.filter((p) => p.status === 'draft').length;
  const total = plans.length;
  const progress = total > 0
    ? Math.round(((validated * 1.0 + validating * 0.5) / total) * 100)
    : 0;

  const currentYear = new Date().getFullYear();
  const generationDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    onPrintReady?.();
  }, [onPrintReady]);

  return (
    <div className="print-document">
      {/* Cover Page */}
      <div className="print-page cover-page">
        <div className="cover-content">
          <div className="cover-header">
            <img src="/logo.vitto.branco.png" alt="Vitto" className="cover-logo" />
          </div>

          <div className="cover-title-section">
            <span className="cover-label">Documento Estrategico</span>
            <h1 className="cover-title">Business Plan</h1>
            <span className="cover-year">{currentYear}</span>
            <div className="cover-divider"></div>
          </div>

          <div className="cover-bottom">
            <div className="cover-stats">
              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-value">{validated}</span>
                  <span className="stat-label">Validados</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{validating}</span>
                  <span className="stat-label">Em Validacao</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{draft}</span>
                  <span className="stat-label">Rascunho</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{total}</span>
                  <span className="stat-label">Total</span>
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-header">
                  <span className="progress-title">Progresso Geral</span>
                  <span className="progress-percentage">{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>

            <div className="cover-footer">
              <div className="footer-left">
                <span className="footer-label">Gerado em</span>
                <span className="footer-value">{generationDate}</span>
              </div>
              <div className="footer-right">
                <span className="confidential">Confidencial</span>
                <span className="footer-value">{companyName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="print-page toc-page">
        <div className="toc-header">
          <div className="toc-header-content">
            <span className="toc-label">Indice</span>
            <h2 className="toc-title">Sumario</h2>
          </div>
          <img src="/logo.vitto.branco.png" alt="Vitto" className="toc-logo" />
        </div>

        <div className="toc-content">
          <ul className="toc-list">
            {sortedPlans.map((plan, index) => {
              const info = SUBMODULE_INFO[plan.submodule];
              return (
                <li key={plan.id} className="toc-item">
                  <span className="toc-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="toc-item-title">{info.title}</span>
                  <span
                    className="toc-status"
                    style={{ backgroundColor: COLORS[plan.status] }}
                  >
                    {STATUS_LABELS[plan.status]}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="page-footer">
          <span className="footer-brand">VITTO</span>
          <span className="page-number">2 / {2 + sortedPlans.length}</span>
        </div>
      </div>

      {/* Content Sections */}
      {sortedPlans.map((plan, index) => {
        const info = SUBMODULE_INFO[plan.submodule];
        const pageNumber = index + 3;
        const sectionNumber = index + 1;

        return (
          <div key={plan.id} className="print-page section-page">
            <div className="section-header">
              <div className="section-header-content">
                <span className="section-label">Secao {String(sectionNumber).padStart(2, '0')}</span>
                <h2 className="section-title">{info.title}</h2>
              </div>
              <div className="section-header-right">
                <img src="/logo.vitto.branco.png" alt="Vitto" className="section-logo" />
                <div className="status-indicator">
                  <span
                    className="status-dot"
                    style={{ backgroundColor: COLORS[plan.status] }}
                  ></span>
                  <span className="status-text">{STATUS_LABELS[plan.status]}</span>
                </div>
              </div>
            </div>

            <div className="section-content">
              {renderSectionContent(plan)}
            </div>

            <div className="page-footer">
              <span className="footer-brand">VITTO</span>
              <span className="page-number">{pageNumber} / {2 + sortedPlans.length}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Render section content based on type
function renderSectionContent(plan: BusinessPlan) {
  switch (plan.submodule) {
    case 'thesis':
      return <ThesisSection content={plan.content as ThesisContent} />;
    case 'market':
      return <MarketSection content={plan.content as MarketContent} />;
    case 'product':
      return <ProductSection content={plan.content as ProductContent} />;
    case 'revenue':
      return <RevenueSection content={plan.content as RevenueContent} />;
    case 'go_to_market':
      return <GoToMarketSection content={plan.content as GoToMarketContent} />;
    case 'metrics':
      return <MetricsSection content={plan.content as MetricsContent} />;
    case 'risks':
      return <RisksSection content={plan.content as RisksContent} />;
    default:
      return null;
  }
}

// Subsection component
function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="subsection">
      <div className="subsection-title-container">
        <div className="subsection-accent"></div>
        <h3 className="subsection-title">{title}</h3>
      </div>
      <div className="subsection-content">{children}</div>
    </div>
  );
}

// Bullet list component
function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <p className="empty-text">Nenhum item definido</p>;

  return (
    <ul className="bullet-list">
      {items.map((item, index) => (
        <li key={index} className="bullet-item">
          <span className="bullet"></span>
          <span className="bullet-text">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// Table component
function Table({
  columns,
  data,
}: {
  columns: { key: string; header: string; width?: string; align?: string }[];
  data: Record<string, unknown>[];
}) {
  return (
    <table className="print-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={{ width: col.width, textAlign: col.align as 'left' | 'center' | 'right' || 'left' }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((col) => (
              <td key={col.key} style={{ textAlign: col.align as 'left' | 'center' | 'right' || 'left' }}>
                {String(row[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Status badge
function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    implemented: COLORS.validated,
    in_progress: COLORS.validating,
    planned: '#8B5CF6',
    high: '#EF4444',
    medium: COLORS.validating,
    low: COLORS.validated,
  };
  return (
    <span className="status-badge" style={{ backgroundColor: colors[status] || COLORS.draft }}>
      {label}
    </span>
  );
}

// ======================
// Section Components
// ======================

function ThesisSection({ content }: { content: ThesisContent }) {
  return (
    <>
      {content.valueProposition && (
        <div className="highlight-box coral">
          <span className="highlight-label">Proposta de Valor</span>
          <p className="highlight-text">{content.valueProposition}</p>
        </div>
      )}

      <Subsection title="Problema">
        <p className="text-block">{content.problem || 'Nao definido'}</p>
      </Subsection>

      <Subsection title="Publico-Alvo">
        <p className="text-block">{content.targetAudience || 'Nao definido'}</p>
      </Subsection>

      <Subsection title="Diferenciais">
        <BulletList items={content.differentiators || []} />
      </Subsection>

      {(content.hypotheses || []).length > 0 && (
        <Subsection title="Hipoteses">
          <div className="hypothesis-list">
            {(content.hypotheses || []).map((hypothesis, index) => (
              <div key={index} className="hypothesis-item">
                <span
                  className="hypothesis-dot"
                  style={{ backgroundColor: hypothesis.validated ? COLORS.validated : COLORS.draft }}
                ></span>
                <span className="hypothesis-text">{hypothesis.text}</span>
                <span
                  className="hypothesis-badge"
                  style={{
                    backgroundColor: hypothesis.validated ? COLORS.deepBlue : COLORS.backgroundLight,
                    color: hypothesis.validated ? '#fff' : COLORS.textMuted,
                  }}
                >
                  {hypothesis.validated ? 'Validada' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        </Subsection>
      )}
    </>
  );
}

function MarketSection({ content }: { content: MarketContent }) {
  const segmentsData = (content.segments || []).map((seg) => ({
    name: seg.name,
    size: seg.size,
    characteristics: seg.characteristics,
  }));

  return (
    <>
      <Subsection title="Segmentos de Mercado">
        {segmentsData.length > 0 ? (
          <Table
            columns={[
              { key: 'name', header: 'Segmento', width: '25%' },
              { key: 'size', header: 'Tamanho', width: '20%' },
              { key: 'characteristics', header: 'Caracteristicas', width: '55%' },
            ]}
            data={segmentsData}
          />
        ) : (
          <p className="empty-text">Nenhum segmento definido</p>
        )}
      </Subsection>

      <Subsection title="Analise Competitiva">
        {(content.competitors || []).length > 0 ? (
          <div className="competitors-list">
            {(content.competitors || []).map((competitor, index) => (
              <div key={index} className="competitor-card">
                <div className="competitor-header">
                  <div className="competitor-accent"></div>
                  <span className="competitor-name">{competitor.name}</span>
                </div>
                <div className="strengths-weaknesses">
                  <div className="sw-column">
                    <span className="sw-title">Pontos Fortes</span>
                    {(competitor.strengths || []).map((s, i) => (
                      <div key={i} className="sw-item positive">
                        <span className="sw-bullet">+</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="sw-column">
                    <span className="sw-title">Pontos Fracos</span>
                    {(competitor.weaknesses || []).map((w, i) => (
                      <div key={i} className="sw-item negative">
                        <span className="sw-bullet">-</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-text">Nenhum competidor mapeado</p>
        )}
      </Subsection>

      <Subsection title="Posicionamento">
        {content.positioning ? (
          <div className="highlight-box coral">
            <span className="highlight-label">Nosso Posicionamento</span>
            <p className="highlight-text">{content.positioning}</p>
          </div>
        ) : (
          <p className="empty-text">Posicionamento nao definido</p>
        )}
      </Subsection>
    </>
  );
}

function ProductSection({ content }: { content: ProductContent }) {
  const FEATURE_LABELS: Record<string, string> = {
    implemented: 'Implementado',
    in_progress: 'Em Progresso',
    planned: 'Planejado',
  };

  return (
    <>
      {content.valueDelivered && (
        <div className="highlight-box blue">
          <span className="highlight-label">Valor Entregue</span>
          <p className="highlight-text">{content.valueDelivered}</p>
        </div>
      )}

      <Subsection title="Funcionalidades">
        {(content.features || []).length > 0 ? (
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Funcionalidade</th>
                <th style={{ width: '55%' }}>Descricao</th>
                <th style={{ width: '20%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(content.features || []).map((feature, index) => (
                <tr key={index}>
                  <td>{feature.name}</td>
                  <td>{feature.description}</td>
                  <td>
                    <StatusBadge status={feature.status} label={FEATURE_LABELS[feature.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-text">Nenhuma funcionalidade definida</p>
        )}
      </Subsection>

      <Subsection title="Limitacoes Atuais">
        <BulletList items={content.limitations || []} />
      </Subsection>

      <Subsection title="Roadmap">
        {(content.roadmap || []).length > 0 ? (
          <div className="roadmap-list">
            {(content.roadmap || []).map((phase, index) => (
              <div key={index} className="roadmap-item">
                <div className="roadmap-number">{String(index + 1).padStart(2, '0')}</div>
                <div className="roadmap-content">
                  <span className="roadmap-phase">{phase.phase}</span>
                  <p className="roadmap-description">{phase.description}</p>
                  {phase.targetDate && (
                    <span className="roadmap-date">Previsao: {phase.targetDate}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-text">Roadmap nao definido</p>
        )}
      </Subsection>
    </>
  );
}

function RevenueSection({ content }: { content: RevenueContent }) {
  const pricingData = (content.pricing || []).map((item) => ({
    model: item.model,
    description: item.description,
    value: item.value || '-',
  }));

  return (
    <>
      <Subsection title="Modelos de Precificacao">
        {pricingData.length > 0 ? (
          <Table
            columns={[
              { key: 'model', header: 'Modelo', width: '25%' },
              { key: 'description', header: 'Descricao', width: '50%' },
              { key: 'value', header: 'Valor', width: '25%', align: 'right' },
            ]}
            data={pricingData}
          />
        ) : (
          <p className="empty-text">Nenhum modelo definido</p>
        )}
      </Subsection>

      <Subsection title="Planos">
        {(content.plans || []).length > 0 ? (
          <div className="plans-grid">
            {(content.plans || []).map((plan, index) => {
              const isFeatured = index === 0 ||
                plan.name.toLowerCase().includes('pro') ||
                plan.name.toLowerCase().includes('premium');

              return (
                <div key={index} className={`plan-card ${isFeatured ? 'featured' : ''}`}>
                  <span className="plan-label">{isFeatured ? 'Recomendado' : 'Plano'}</span>
                  <span className="plan-name">{plan.name}</span>
                  <span className="plan-price">{plan.price}</span>
                  <div className="plan-divider"></div>
                  <div className="plan-features">
                    {(plan.features || []).slice(0, 5).map((feature, idx) => (
                      <div key={idx} className="plan-feature">
                        <span className="plan-check">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                    {(plan.features || []).length > 5 && (
                      <span className="plan-more">+{(plan.features || []).length - 5} mais recursos...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty-text">Nenhum plano definido</p>
        )}
      </Subsection>

      <Subsection title="Estrategias de Monetizacao">
        <BulletList items={content.monetizationStrategies || []} />
      </Subsection>

      <Subsection title="Hipoteses Futuras">
        <BulletList items={content.futureHypotheses || []} />
      </Subsection>
    </>
  );
}

function GoToMarketSection({ content }: { content: GoToMarketContent }) {
  const PRIORITY_LABELS: Record<string, string> = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baixa',
  };

  return (
    <>
      <Subsection title="Canais de Aquisicao">
        {(content.channels || []).length > 0 ? (
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Canal</th>
                <th style={{ width: '60%' }}>Estrategia</th>
                <th style={{ width: '20%' }}>Prioridade</th>
              </tr>
            </thead>
            <tbody>
              {(content.channels || []).map((channel, index) => (
                <tr key={index}>
                  <td>{channel.name}</td>
                  <td>{channel.strategy}</td>
                  <td>
                    <StatusBadge status={channel.priority} label={PRIORITY_LABELS[channel.priority]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-text">Nenhum canal definido</p>
        )}
      </Subsection>

      <Subsection title="Estrategias">
        <BulletList items={content.strategies || []} />
      </Subsection>

      <Subsection title="Mensagens-Chave">
        {(content.keyMessages || []).length > 0 ? (
          <div className="messages-list">
            {(content.keyMessages || []).map((message, index) => (
              <div key={index} className="message-card">
                <span className="message-number">Mensagem {index + 1}</span>
                <p className="message-text">"{message}"</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-text">Nenhuma mensagem definida</p>
        )}
      </Subsection>

      <Subsection title="Publicos-Alvo">
        {(content.targetAudiences || []).length > 0 ? (
          <div className="audiences-list">
            {(content.targetAudiences || []).map((audience, index) => (
              <div key={index} className="audience-item">
                <span className="audience-segment">{audience.segment}</span>
                <span className="audience-message">{audience.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-text">Nenhum publico definido</p>
        )}
      </Subsection>
    </>
  );
}

function MetricsSection({ content }: { content: MetricsContent }) {
  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em Progresso',
    achieved: 'Alcancado',
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: COLORS.draft,
    in_progress: COLORS.validating,
    achieved: COLORS.validated,
  };

  return (
    <>
      <Subsection title="Indicadores-Chave (KPIs)">
        {(content.keyIndicators || []).length > 0 ? (
          <div className="kpi-grid">
            {(content.keyIndicators || []).map((kpi, index) => {
              const currentVal = parseFloat(String(kpi.current || 0).replace(/[^\d.]/g, '')) || 0;
              const targetVal = parseFloat(String(kpi.target || 0).replace(/[^\d.]/g, '')) || 0;
              const percentage = targetVal > 0 ? Math.min((currentVal / targetVal) * 100, 100) : 0;

              return (
                <div key={index} className="kpi-card">
                  <span className="kpi-name">{kpi.name}</span>
                  <span className="kpi-value">{kpi.current || '-'}</span>
                  <span className="kpi-target">Meta: {kpi.target}</span>
                  <div className="kpi-progress">
                    <div className="kpi-progress-fill" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty-text">Nenhum indicador definido</p>
        )}
      </Subsection>

      <Subsection title="Objetivos por Periodo">
        {(content.periodObjectives || []).length > 0 ? (
          <div className="objectives-list">
            {(content.periodObjectives || []).map((period, index) => (
              <div key={index} className="objective-card">
                <span className="objective-period">{period.period}</span>
                <ul className="objective-items">
                  {(period.objectives || []).map((obj, idx) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
                <div className="objective-status">
                  <span
                    className="objective-dot"
                    style={{ backgroundColor: STATUS_COLORS[period.status] }}
                  ></span>
                  <span>{STATUS_LABELS[period.status]}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-text">Nenhum objetivo definido</p>
        )}
      </Subsection>

      {(content.resultsTracking || []).length > 0 && (
        <Subsection title="Acompanhamento de Resultados">
          <Table
            columns={[
              { key: 'date', header: 'Data', width: '15%' },
              { key: 'metric', header: 'Metrica', width: '25%' },
              { key: 'value', header: 'Valor', width: '20%' },
              { key: 'notes', header: 'Observacoes', width: '40%' },
            ]}
            data={(content.resultsTracking || []).map((item) => ({
              date: item.date,
              metric: item.metric,
              value: item.value,
              notes: item.notes || '-',
            }))}
          />
        </Subsection>
      )}
    </>
  );
}

function RisksSection({ content }: { content: RisksContent }) {
  const IMPACT_LABELS: Record<string, string> = {
    high: 'Alto',
    medium: 'Medio',
    low: 'Baixo',
  };

  // Risk matrix calculation
  const matrix: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const levelMap: Record<string, number> = { low: 0, medium: 1, high: 2 };

  (content.mappedRisks || []).forEach((risk) => {
    const impactIdx = 2 - levelMap[risk.impact];
    const probIdx = levelMap[risk.probability];
    matrix[impactIdx][probIdx]++;
  });

  return (
    <>
      {(content.mappedRisks || []).length > 0 && (
        <Subsection title="Visao Geral dos Riscos">
          <div className="risk-matrix-container">
            <div className="risk-matrix">
              <div className="y-axis-label">IMPACTO</div>
              <div className="matrix-grid">
                {matrix.map((row, rowIdx) => (
                  <div key={rowIdx} className="matrix-row">
                    {row.map((count, colIdx) => {
                      const riskScore = (2 - rowIdx) + colIdx;
                      let bgColor = '#FFFFFF';
                      if (riskScore >= 4) bgColor = '#F1F5F9';
                      else if (riskScore >= 2) bgColor = '#F8FAFC';

                      return (
                        <div
                          key={colIdx}
                          className="matrix-cell"
                          style={{ backgroundColor: bgColor }}
                        >
                          {count > 0 && <span>{count}</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="x-axis-labels">
                  <span>Baixo</span>
                  <span>Medio</span>
                  <span>Alto</span>
                </div>
                <div className="x-axis-title">PROBABILIDADE</div>
              </div>
            </div>
          </div>
        </Subsection>
      )}

      <Subsection title="Riscos Mapeados">
        {(content.mappedRisks || []).length > 0 ? (
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Risco</th>
                <th style={{ width: '12%' }}>Impacto</th>
                <th style={{ width: '12%' }}>Prob.</th>
                <th style={{ width: '46%' }}>Mitigacao</th>
              </tr>
            </thead>
            <tbody>
              {(content.mappedRisks || []).map((risk, index) => (
                <tr key={index}>
                  <td>{risk.risk}</td>
                  <td><strong>{IMPACT_LABELS[risk.impact]}</strong></td>
                  <td><strong>{IMPACT_LABELS[risk.probability]}</strong></td>
                  <td>{risk.mitigation || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-text">Nenhum risco mapeado</p>
        )}
      </Subsection>

      <Subsection title="Decisoes Tomadas">
        {(content.decisionsMade || []).length > 0 ? (
          <div className="decisions-list">
            {(content.decisionsMade || []).map((decision, index) => (
              <div key={index} className="decision-card">
                <div className="decision-header">
                  <div className="decision-title-container">
                    <div className="decision-accent validated"></div>
                    <span className="decision-title">{decision.decision}</span>
                  </div>
                  <span className="decision-date">{decision.date}</span>
                </div>
                <p className="decision-justification">{decision.justification}</p>
                <span className="decision-impact">Impacto: {decision.impact}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-text">Nenhuma decisao registrada</p>
        )}
      </Subsection>

      <Subsection title="Decisoes Pendentes">
        {(content.decisionsPending || []).length > 0 ? (
          <div className="decisions-list">
            {(content.decisionsPending || []).map((decision, index) => (
              <div key={index} className="decision-card pending">
                <div className="decision-title-container">
                  <div className="decision-accent pending"></div>
                  <span className="decision-title">{decision.decision}</span>
                </div>
                <p className="decision-context">{decision.context}</p>
                {decision.deadline && (
                  <span className="decision-deadline">Prazo: {decision.deadline}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-text">Nenhuma decisao pendente</p>
        )}
      </Subsection>

      {(content.justifications || []).length > 0 && (
        <Subsection title="Justificativas Estrategicas">
          <BulletList items={content.justifications || []} />
        </Subsection>
      )}
    </>
  );
}

export default PrintableBusinessPlan;
