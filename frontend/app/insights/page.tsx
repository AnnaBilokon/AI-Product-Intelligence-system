import { AnalysisPanel } from "@/components/AnalysisPanel";
import { Header } from "@/components/Header";

export default function InsightsPage() {
  return (
    <>
      <Header
        eyebrow="Insights"
        title="Interrogate the feedback graph"
        description="Run focused analysis over retrieved chunks to surface pain points, repeated requests, recurring themes, and opportunities worth shipping."
      />
      <AnalysisPanel />
    </>
  );
}
