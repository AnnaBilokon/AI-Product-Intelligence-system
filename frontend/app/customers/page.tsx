import { CustomerReport } from "@/components/CustomerReport";
import { Header } from "@/components/Header";

export default function CustomersPage() {
  return (
    <>
      <Header
        eyebrow="Customers"
        title="Generate account-specific intelligence"
        description="Pull all stored feedback for a customer and turn it into a usable summary for product reviews, success planning, or expansion conversations."
      />
      <CustomerReport />
    </>
  );
}
