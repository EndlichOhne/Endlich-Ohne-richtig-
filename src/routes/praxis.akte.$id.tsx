import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { DeskMessage } from "@/components/practice-ui";
import { STATUS_LABEL, euro } from "@/lib/practice-desk";
import { getPracticeCase } from "@/lib/practice-api";

export const Route = createFileRoute("/praxis/akte/$id")({
  component: CasePage,
});

function CasePage() {
  const { id } = Route.useParams();
  const [data, setData] = useState<Awaited<ReturnType<typeof getPracticeCase>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getPracticeCase({ data: { id } })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Nicht gefunden."));
  }, [id]);

  return (
    <DeskMessage loading={!data && !error} error={error}>
      {data ? (
        <div className="space-y-5 text-sm">
          <section>
            <h2 className="font-display text-2xl">{data.customer.name}</h2>
            {data.customer.email ? <p>{data.customer.email}</p> : null}
            <p className="text-muted-foreground">Akte über den Termin, nicht über eine Kunden-URL.</p>
          </section>
          <section className="space-y-2">
            <h3 className="font-medium">Termine an diesem Standort</h3>
            {data.visits.length === 0 ? (
              <p className="text-muted-foreground">Noch keine Kundendaten vorhanden.</p>
            ) : (
              <ul className="space-y-2">
                {data.visits.map((visit) => (
                  <li key={visit.id}>
                    <Link to="/praxis/termin/$id" params={{ id: visit.id }}>
                      {visit.startsAt.replace("T", " ").slice(0, 16)} · {STATUS_LABEL[visit.status] ?? visit.status}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-2">
            <h3 className="font-medium">Tattoo</h3>
            {data.tattoos.length === 0 ? (
              <p className="text-muted-foreground">Keine gespeicherten Tattoo-Daten.</p>
            ) : (
              <ul className="space-y-2">
                {data.tattoos.map((tattoo) => (
                  <li key={tattoo.id} className="rounded-2xl bg-card p-3">
                    {tattoo.name || tattoo.kind} · {tattoo.body_location || "Stelle nicht angegeben"} · Fortschritt {tattoo.progress}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-2">
            <h3 className="font-medium">Dokumentation</h3>
            {data.appointment.treatmentNote ? <p>{data.appointment.treatmentNote}</p> : null}
            {data.sessions.length === 0 && !data.appointment.treatmentNote ? (
              <p className="text-muted-foreground">Keine Einträge.</p>
            ) : (
              <ul className="space-y-2">
                {data.sessions.map((session, index) => (
                  <li key={`${session.date}-${index}`}>
                    {session.date} · {session.title} · {session.status}
                    {session.notes ? ` · ${session.notes}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-2">
            <h3 className="font-medium">Zahlungen</h3>
            <p>
              Termin: {data.appointment.paymentStatus} · bezahlt {euro(data.appointment.paidCents)}
            </p>
            {data.receipts.length === 0 ? (
              <p className="text-muted-foreground">Keine Stripe-Belege.</p>
            ) : (
              <ul className="space-y-1">
                {data.receipts.map((receipt, index) => (
                  <li key={`${receipt.created_at}-${index}`}>
                    {receipt.date || receipt.created_at} · {receipt.method} · {receipt.status} · Anzahlung {euro(receipt.deposit_cents)} · Rest {euro(receipt.rest_cents)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </DeskMessage>
  );
}
