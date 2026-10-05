import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageIntro } from "@/components/page-intro";
import { RequireAuth } from "@/components/require-auth";
import { BRAND } from "@/lib/brand";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import {
  confirmEmailCode,
  getEmailStatus,
  startEmailVerification,
} from "@/lib/verify-api";

export const Route = createFileRoute("/bestaetigen")({
  component: BestaetigenPage,
  head: () => ({ meta: [{ title: `E-Mail bestätigen · ${BRAND.name}` }] }),
});

function BestaetigenPage() {
  return (
    <RequireAuth needVerified={false}>
      <BestaetigenInner />
    </RequireAuth>
  );
}

function BestaetigenInner() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<string | undefined>();
  const [masked, setMasked] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      const st = await getEmailStatus();
      if (!live) return;
      if (st.verified) {
        if (user?.id) sessionStorage.setItem("eo-email-ok", user.id);
        await navigate({ to: "/" });
        return;
      }
      setMasked(st.emailMasked);
      const start = await startEmailVerification();
      if (!live) return;
      if ("already" in start && start.already) {
        if (user?.id) sessionStorage.setItem("eo-email-ok", user.id);
        await navigate({ to: "/" });
        return;
      }
      setSent(Boolean(start.sent));
      setPreview("previewCode" in start ? start.previewCode : undefined);
      setMasked(start.emailMasked ?? st.emailMasked);
    })().catch(() => {
      if (live) setErr("Bestätigung konnte nicht gestartet werden.");
    });
    return () => {
      live = false;
    };
  }, [navigate]);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await confirmEmailCode({ data: { code } });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      if (user?.id) sessionStorage.setItem("eo-email-ok", user.id);
      await navigate({ to: "/" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Code ungültig.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setErr(null);
    try {
      const start = await startEmailVerification();
      if ("wait" in start && start.wait) {
        setErr("Bitte kurz warten, dann erneut senden.");
        return;
      }
      setSent(Boolean(start.sent));
      setPreview("previewCode" in start ? start.previewCode : undefined);
    } catch {
      setErr("Erneut senden fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-up space-y-6">
      <PageIntro kicker="Konto" title="E-Mail bestätigen">
        Wir prüfen, dass die Adresse dir gehört. Ohne Bestätigung bleiben Akte,
        Scanner und Anzahlung gesperrt.
      </PageIntro>
      <p className="text-sm text-muted-foreground">
        Code an {masked ?? "deine E-Mail"}
        {sent ? " gesendet" : ""}. 15 Minuten gültig.
      </p>
      {preview ? (
        <p className="rounded-2xl bg-muted px-4 py-3 text-sm">
          In dieser Vorschau ist kein Praxis-Postfach angebunden. Dein Code:{" "}
          <span className="font-medium tracking-widest">{preview}</span>
          . Sobald der Versand aktiv ist, kommt er nur per Mail.
        </p>
      ) : null}
      <form
        className="space-y-3 rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Label htmlFor="code">6-stelliger Code</Label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="mt-2 tracking-widest"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        {err ? <p className="text-sm text-destructive">{err}</p> : null}
        <Button className="min-h-12 w-full rounded-xl" disabled={busy || code.length !== 6}>
          Bestätigen
        </Button>
      </form>
      <Button
        type="button"
        variant="outline"
        className="min-h-12 w-full rounded-xl"
        disabled={busy}
        onClick={() => void resend()}
      >
        Code erneut senden
      </Button>
    </div>
  );
}
