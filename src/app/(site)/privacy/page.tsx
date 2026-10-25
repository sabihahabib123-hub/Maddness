import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>Last updated: [date to be set by the business].</p>
      <h2>Who we are</h2>
      <p>[Legal entity name, trade licence number and registered address of the MADNESS restaurant business.]</p>
      <h2>What we collect</h2>
      <ul>
        <li>Feedback you send through our review form: display name, country, branch visited, visit type, ratings and comments.</li>
        <li>Optional contact details (email and/or phone) and whether you agreed to be contacted.</li>
        <li>Messages sent through our contact form, with the contact details you provide.</li>
        <li>Basic technical data needed to run and protect the website, such as your IP address for spam prevention.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To read and respond to feedback and enquiries.</li>
        <li>To publish approved reviews (display name, rating, branch, comment and date) on this website. Contact details are never published.</li>
        <li>To prevent spam and abuse.</li>
      </ul>
      <h2>Who can see it</h2>
      <p>Only authorised MADNESS staff can see private submissions. Data is stored with our hosting and database providers: [list providers and regions].</p>
      <h2>How long we keep it</h2>
      <p>[Retention period to be decided by the business.]</p>
      <h2>Your choices</h2>
      <p>You can ask us to access, correct or delete your information by contacting [privacy contact email].</p>
      <h2>Third-party links</h2>
      <p>Delivery platforms, Google Maps, Google Reviews and Instagram have their own privacy policies. We are not responsible for how they handle your data.</p>
      <h2>Applicable law</h2>
      <p>[To be completed after legal review, including the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021) where applicable.]</p>
    </LegalPage>
  );
}
