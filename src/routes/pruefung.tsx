import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageIntro } from "@/components/page-intro";
import { RequireAuth } from "@/components/require-auth";
import { BeforeAfter } from "@/components/before-after";
import { BRAND } from "@/lib/brand";
import { getGalleryAdmin, listReviewQueue, moderateGalleryResult } from "@/lib/gallery-api";
import { LOCATION_LABEL, STATUS_LABEL, type GalleryResult } from "@/lib/gallery";

export const Route = createFileRoute("/pruefung")({
  component: PruefungPage,
  head: () => ({ meta: [{ title: `Prüfung · ${BRAND.name}` }] }),
});

function PruefungPage() {
  return (
    <RequireAuth>
      <PruefungInner />
    </RequireAuth>
  );
}

function PruefungInner() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [items, setItems] = useState<GalleryResult[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function reload() {
    const role = await getGalleryAdmin();
    setAdmin(role.admin);
    if (!role.admin) return;
    const q = await listReviewQueue();
    if (!q.ok) {
      setErr(q.error);
      return;
    }
    setItems(q.items);
  }

  useEffect(() => {
    void reload().catch(() => setErr("Warteschlange nicht ladbar."));
  }, []);

  async function act(id: string, action: "publish" | "reject" | "remove") {
    setBusy(id);
    setErr(null);
    try {
      await moderateGalleryResult({
        data: { id, action, reason: reason[id] },
      });
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Aktion fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  }

  if (admin === false) {
    return (
      <div className="space-y-4">
        <PageIntro kicker="Praxis" title="Prüfung">
          Nur die Praxis ({BRAND.email}) kann Einreichungen freigeben oder ablehnen.
        </PageIntro>
        <Button asChild className="min-h-12 w-full rounded-xl">
          <Link to="/ergebnisse">Zur Galerie</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="fade-up space-y-6 pb-8">
      <PageIntro kicker="Praxis" title="Einreichungen prüfen">
        Genehmigen, ablehnen oder entfernen. Öffentlich nur nach Freigabe.
      </PageIntro>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      {admin === null ? <div className="h-40 animate-pulse rounded-2xl bg-muted" /> : null}
      {admin && items.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-5 text-sm shadow-[var(--shadow-border)]">
          Keine offenen Einreichungen.
        </p>
      ) : null}
      {items.map((r) => (
        <article key={r.id} className="space-y-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
          <BeforeAfter before={r.beforeUrl} after={r.currentUrl} afterLabel="Aktuell" />
          <p className="font-medium">
            {LOCATION_LABEL[r.bodyLocation]} · {STATUS_LABEL[r.progressStatus]} · {r.sessionCount} Sitzungen
          </p>
          <p className="text-sm text-muted-foreground">{r.description || "Ohne Beschreibung."}</p>
          <Textarea
            placeholder="Grund bei Ablehnung"
            value={reason[r.id] ?? ""}
            onChange={(e) => setReason((p) => ({ ...p, [r.id]: e.target.value }))}
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              className="min-h-12 rounded-xl"
              disabled={busy === r.id}
              onClick={() => void act(r.id, "publish")}
            >
              Genehmigen
            </Button>
            <Button
              variant="outline"
              className="min-h-12 rounded-xl"
              disabled={busy === r.id}
              onClick={() => void act(r.id, "reject")}
            >
              Ablehnen
            </Button>
            <Button
              variant="ghost"
              className="min-h-12 rounded-xl text-destructive"
              disabled={busy === r.id}
              onClick={() => void act(r.id, "remove")}
            >
              Entfernen
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
