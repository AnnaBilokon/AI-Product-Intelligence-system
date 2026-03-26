import { Header } from "@/components/Header";
import { UploadFeedback } from "@/components/UploadFeedback";

export default function FeedbackPage() {
  return (
    <>
      <Header
        eyebrow="Feedback Ingestion"
        title="Bring fragmented customer evidence into one retrievable system"
        description="Upload raw feedback files, paste manual notes, and normalize customer signal into a Chroma-backed knowledge base for downstream analysis."
      />
      <UploadFeedback />
    </>
  );
}
