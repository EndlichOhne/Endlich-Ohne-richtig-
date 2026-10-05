import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/pro/abbruch")({
  component: ProAbbruch,
  head: () => ({ meta: [{ title: `PRO · ${BRAND.name}` }] }),
});

function ProAbbruch() {
  return (
    <div className="fade-up space-y-4">
      <p className="kicker text-primary">PRO</p>
      <h1 className="font-display text-3xl">Nicht abgeschlossen</h1>
      <p className="text-sm text-muted-foreground">
        Es wurde nichts berechnet. Du kannst es später erneut versuchen.
      </p>
      <Button asChild className="min-h-12 w-full rounded-xl">
        <Link to="/pro">Zurück zu PRO</Link>
      </Button>
    </div>
  );
}
