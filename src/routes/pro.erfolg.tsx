import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { retrieveProCheckout } from "@/lib/checkout";
import { RequireAuth } from "@/components/require-auth";
import { PRO_TEASER_KEY } from "@/lib/pro";

export const Route = createFileRoute("/pro/erfolg")({
  component: ProErfolg,
  head: () => ({ meta: [{ title: `PRO · ${BRAND.name}` }] }),
});

function ProErfolg() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const [err, setErr] = useState<string | null>(null);
  const [kind, setKind] = useState<"pro" | "scan" | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("session_id") ?? "";
    void retrieveProCheckout({ data: { sessionId: id } })
      .then((res) => {
        if (!res.ok) {
          setErr("Die Zahlung ist noch nicht bestätigt.");
          return;
        }
        setKind(res.kind);
        try {
          if (res.kind === "pro") localStorage.setItem(PRO_TEASER_KEY, "1");
        } catch {
          /* ignore */
        }
      })
      .catch(() => setErr("Beleg konnte nicht geladen werden."));
  }, []);

  if (kind === "scan") {
    return (
      <div className="fade-up space-y-4">
        <p className="kicker text-primary">Einzel-Scan</p>
        <h1 className="font-display text-3xl">Scan bereit</h1>
        <p className="text-sm text-muted-foreground">
          Du kannst jetzt genau einen Online-KI-Scan durchführen. Danach ist das
          Guthaben verbraucht. Keine Diagnose, keine Garantie.
        </p>
        <Button asChild className="min-h-12 w-full rounded-xl">
          <Link to="/scanner">Zum Scanner</Link>
        </Button>
      </div>
    );
  }

  if (kind === "pro") {
    return (
      <div className="fade-up space-y-4">
        <p className="kicker text-primary">PRO</p>
        <h1 className="font-display text-3xl">Abo aktiv</h1>
        <p className="text-sm text-muted-foreground">
          Unbegrenzte Scans und PRO-Funktionen in diesem Konto, solange das Abo
          läuft. Keine Diagnose, kein Heilversprechen.
        </p>
        <Button asChild className="min-h-12 w-full rounded-xl">
          <Link to="/scanner">Zum Scanner</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {err ? (
        <p className="text-sm text-destructive">{err}</p>
      ) : (
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Zahlung wird bestätigt…
        </p>
      )}
    </div>
  );
}
