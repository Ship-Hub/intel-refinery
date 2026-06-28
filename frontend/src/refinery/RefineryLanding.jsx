import './refinery.css';
import {
  Nav, ProblemSection, HowItWorks, LiveRefinement, RefineryModelSection,
  AdaptiveStructure, ComparisonSection, SourceTraceSection, IncrementalRefinementSection,
  InputOutput, UseCasesSection, DeveloperSection, PricingPreviewSection, FinalCTA, Footer,
} from './Sections';
import Hero from './Hero';

export default function RefineryLanding() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink font-sans antialiased">
      <Nav />
      <div id="top" className="h-px" />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <LiveRefinement />
      <RefineryModelSection />
      <AdaptiveStructure />
      <ComparisonSection />
      <SourceTraceSection />
      <IncrementalRefinementSection />
      <InputOutput />
      <UseCasesSection />
      <DeveloperSection />
      <PricingPreviewSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
