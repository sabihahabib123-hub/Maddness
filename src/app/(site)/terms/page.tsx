import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Terms and conditions", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <LegalPage title="Terms and conditions">
      <p>Last updated: [date to be set by the business].</p>
      <h2>About this website</h2>
      <p>This website is operated by [legal entity name]. By using it you agree to these terms.</p>
      <h2>Menu, prices and availability</h2>
      <p>Menu items, prices (in AED) and availability may change and can differ by branch. Prices on delivery platforms are set by those platforms and may differ.</p>
      <h2>Allergens</h2>
      <p>Allergen information is provided where verified by our kitchen. Always tell our team about allergies before ordering.</p>
      <h2>Online ordering</h2>
      <p>Orders placed through third-party delivery platforms are subject to those platforms&apos; terms. We do not process payments on this website.</p>
      <h2>Reviews and feedback</h2>
      <p>By submitting feedback, you confirm it is your own honest experience. We may decline to publish any submission, and we may edit it only to remove personal or offensive content.</p>
      <h2>Intellectual property</h2>
      <p>[To be completed by the business.]</p>
      <h2>Liability and governing law</h2>
      <p>[To be completed after legal review.]</p>
    </LegalPage>
  );
}
