import SiteLayout from "./(site)/layout";
import NotFound from "./(site)/not-found";

/** Unmatched URLs get the branded 404 inside the normal header and footer. */
export default function RootNotFound() {
  return (
    <SiteLayout>
      <NotFound />
    </SiteLayout>
  );
}
