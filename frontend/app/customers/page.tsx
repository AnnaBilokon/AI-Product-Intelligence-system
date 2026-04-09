import { CompanyExplorer } from "@/components/CompanyExplorer";
import { Header } from "@/components/Header";

export default function CustomersPage() {
  return (
    <>
      <Header
        eyebrow="Companies"
        title="Explore company intelligence"
        description="Open any company to review its account summary, product insights, and the full timeline of uploaded feedback that shaped those signals."
      />
      <CompanyExplorer />
    </>
  );
}
