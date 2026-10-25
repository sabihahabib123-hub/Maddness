import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getPublicRepo } from "@/lib/data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const repo = getPublicRepo();
  const [settings, branches, delivery] = await Promise.all([repo.getSettings(), repo.listBranches(), repo.listDeliveryLinks()]);

  return (
    <>
      {/* Without JavaScript, scroll-reveal content must still be visible. */}
      <noscript>
        <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
      </noscript>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      {settings.show_sample_notice && (
        <aside aria-label="Preview notice" className="border-t border-gold/40 bg-gold/10">
          <p className="container-page py-3 text-center text-sm text-gold">
            Preview: menu items, prices and some copy are sample content awaiting confirmation from MADNESS.
          </p>
        </aside>
      )}
      <SiteFooter settings={settings} branches={branches} delivery={delivery} />
    </>
  );
}
