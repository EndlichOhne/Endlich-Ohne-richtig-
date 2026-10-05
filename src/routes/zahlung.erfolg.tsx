import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { retrieveCheckout } from "@/lib/checkout";
import { addPayment, maskEmail, type Payment } from "@/lib/payments";
import { euro } from "@/lib/pricing";
import { PROVIDERS } from "@/lib/providers";
import { loadPlan, savePlan } from "@/lib/planner";
import { upsertReceipt, replacePlanItems } from "@/lib/account";

export const Route = createFileRoute("/zahlung/erfolg")({
  component: ErfolgPage,
  head: () => ({ meta: [{ title: `Zahlung · ${BRAND.name}` }] }),
});

function ErfolgPage() {
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("session_id") ?? "";
    void (async () => {
      try {
        const res = await retrieveCheckout({ data: { sessionId: id } });
        if (!res.ok) {
          setErr(
            res.code === "unpaid"
              ? "Die Zahlung ist noch nicht bestätigt."
              : "Beleg konnte nicht geladen werden.",
          );
          return;
        }
        const loc = PROVIDERS.find((p) => p.slug === res.payment.locationSlug);
        const payment: Payment = {
          id: res.payment.id,
          createdAt: res.payment.createdAt,
          sizeId: res.payment.sizeId,
          sizeLabel: res.payment.sizeLabel,
          locationSlug: loc?.slug ?? res.payment.locationSlug,
          locationName: loc?.city ?? null,
          date: res.payment.date,
          totalCents: res.payment.totalCents,
          depositCents: res.payment.depositCents,
          restCents: res.payment.restCents,
          method: res.payment.method,
          methodLabel: res.payment.methodLabel,
          status: "paid",
          provider: "stripe",
          stripeMode: res.mode,
          last4: res.payment.last4,
          cardBrand: res.payment.cardBrand,
          emailMasked: maskEmail(res.payment.email),
        };
        addPayment(payment);
        try {
          await upsertReceipt({ data: payment });
        } catch {
          /* Beleg bleibt lokal, wenn die Session fehlt */
        }
        if (payment.date) {
          const next = [
            ...loadPlan(),
            {
              id: crypto.randomUUID(),
              title: `Sitzung (${payment.sizeLabel})`,
              date: payment.date,
              note: `Anzahlung ${euro(payment.depositCents)} über Stripe`,
              paymentId: payment.id,
              depositCents: payment.depositCents,
              restCents: payment.restCents,
              totalCents: payment.totalCents,
            },
          ];
          savePlan(next);
          void replacePlanItems({ data: next }).catch(() => undefined);
        }
        await navigate({ to: "/zahlung/$id", params: { id: payment.id } });
      } catch {
        setErr("Die Bestätigung ist fehlgeschlagen. Keine Kartendaten liegen in der App.");
      }
    })();
  }, [navigate]);

  return (
    <div className="fade-up space-y-4">
      {err ? (
        <>
          <h1 className="font-display text-3xl">Zahlung nicht bestätigt</h1>
          <p className="text-sm text-muted-foreground">{err}</p>
          <Button asChild className="rounded-xl">
            <Link to="/zahlung">Zurück zur Anzahlung</Link>
          </Button>
        </>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Zahlung wird bei Stripe bestätigt.
        </p>
      )}
    </div>
  );
}
