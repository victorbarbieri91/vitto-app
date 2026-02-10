import { Document } from '@react-pdf/renderer';
import { PDFCoverPage } from './PDFCoverPage';
import { PDFTableOfContents } from './PDFTableOfContents';
import { PDFSection } from './PDFSection';
import { ThesisPDFSection } from './sections/ThesisPDFSection';
import { MarketPDFSection } from './sections/MarketPDFSection';
import { ProductPDFSection } from './sections/ProductPDFSection';
import { RevenuePDFSection } from './sections/RevenuePDFSection';
import { GoToMarketPDFSection } from './sections/GoToMarketPDFSection';
import { MetricsPDFSection } from './sections/MetricsPDFSection';
import { RisksPDFSection } from './sections/RisksPDFSection';
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

interface BusinessPlanPDFProps {
  plans: BusinessPlan[];
  companyName?: string;
  version?: string;
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

// Render the appropriate section based on submodule type
function renderSectionContent(plan: BusinessPlan) {
  switch (plan.submodule) {
    case 'thesis':
      return <ThesisPDFSection content={plan.content as ThesisContent} />;
    case 'market':
      return <MarketPDFSection content={plan.content as MarketContent} />;
    case 'product':
      return <ProductPDFSection content={plan.content as ProductContent} />;
    case 'revenue':
      return <RevenuePDFSection content={plan.content as RevenueContent} />;
    case 'go_to_market':
      return <GoToMarketPDFSection content={plan.content as GoToMarketContent} />;
    case 'metrics':
      return <MetricsPDFSection content={plan.content as MetricsContent} />;
    case 'risks':
      return <RisksPDFSection content={plan.content as RisksContent} />;
    default:
      return null;
  }
}

/**
 *
 */
export function BusinessPlanPDF({
  plans,
  companyName = 'Vitto',
  version,
}: BusinessPlanPDFProps) {
  // Sort plans by the defined order
  const sortedPlans = [...plans].sort(
    (a, b) =>
      SUBMODULE_ORDER.indexOf(a.submodule) - SUBMODULE_ORDER.indexOf(b.submodule)
  );

  // Calculate total pages (Cover + TOC + sections)
  const totalPages = 2 + sortedPlans.length;

  return (
    <Document
      title={`Business Plan - ${companyName}`}
      author={companyName}
      subject="Plano Estrategico de Negocios"
      keywords="business plan, estrategia, startup"
      creator="Vitto Business Plan Generator"
      producer="Vitto App"
    >
      {/* Cover Page */}
      <PDFCoverPage
        plans={sortedPlans}
        companyName={companyName}
        version={version}
      />

      {/* Table of Contents */}
      <PDFTableOfContents plans={sortedPlans} />

      {/* Content Sections */}
      {sortedPlans.map((plan, index) => {
        const info = SUBMODULE_INFO[plan.submodule];
        const pageNumber = index + 3; // Cover = 1, TOC = 2, sections start at 3
        const sectionNumber = index + 1;

        return (
          <PDFSection
            key={plan.id}
            title={info.title}
            description={info.description}
            status={plan.status}
            sectionNumber={sectionNumber}
            pageNumber={pageNumber}
            totalPages={totalPages}
          >
            {renderSectionContent(plan)}
          </PDFSection>
        );
      })}
    </Document>
  );
}

export default BusinessPlanPDF;
