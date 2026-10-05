import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/page-intro";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/zahlung/abbruch")({
  component: AbbruchPage,
  head: () => ({ meta: [{ title: `Zahlung abgebrochen · ${BRAND.name}` }] }),
});

function AbbruchPage() {
  return (
    <div className="fade-up space-y-6">
      <PageIntro kicker="Stripe" title="Zahlung abgebrochen">
        Es wurde kein Betrag eingezogen. Kartendaten liegen nicht in dieser App.
      </PageIntro>
      <Button asChild className="min-h-12 w-full rounded-xl">
        <Link to="/zahlung">Erneut zur Kasse</Link>
      </Button>
    </div>
  );
}
