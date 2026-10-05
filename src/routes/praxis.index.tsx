import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { getPracticeDesk, searchPracticeDesk } from "@/lib/practice-api";
import { DeskMessage } from "@/components/practice-ui";
import { STATUS_LABEL, clock, euro } from "@/lib/practice-desk";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/praxis/")({
  component: DeskPage,
});

function DeskPage() {
  const [desk, setDesk] = useState<Awaited<ReturnType<typeof getPracticeDesk>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ id: string; startsAt: string; status: string; name: string }[]>([]);

  useEffect(() => {
    void getPracticeDesk()
      .then(setDesk)
      .catch((err) => setError(err instanceof Error ? err.message : "Nicht möglich."));
  }, []);

  async function search() {
    setError(null);
    try {
      const res = await searchPracticeDesk({ data: { q: query } });
      setHits(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nicht möglich.");
    }
  }

  return (
    <DeskMessage loading={!desk && !error} error={error}>
      {desk ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {desk.actorName} · {desk.day}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Card title="Termine heute" value={String(desk.appointments)} />
            <Card title="Abgeschlossen" value={String(desk.completed)} />
            <Card title="Offen" value={String(desk.open)} />
            <Card title="Zahlung offen" value={String(desk.paymentsOpen)} />
            <Card title="Kunden" value={String(desk.customers)} />
            <Card title="Neue Kunden" value={String(desk.newCustomers)} />
          </div>
          {desk.revenueCents != null ? (
            <Card title="Erfasster Umsatz heute" value={euro(desk.revenueCents)} />
          ) : (
            <p className="text-sm text-muted-foreground">Kein erfasster Umsatz für heute.</p>
          )}
          <section className="space-y-2">
            <h2 className="font-display text-xl">Nächster Termin</h2>
            {desk.next ? (
              <Link to="/praxis/termin/$id" params={{ id: desk.next.id }} className="block rounded-2xl bg-card p-4 text-sm">
                {clock(desk.next.startsAt)} · {desk.next.name} · {STATUS_LABEL[desk.next.status] ?? desk.next.status}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Heute sind keine Termine geplant.</p>
            )}
          </section>
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              void search();
            }}
          >
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name oder Termin-ID" />
            <button type="submit" className="text-sm underline">
              Termin suchen
            </button>
          </form>
          {hits.length === 0 ? null : (
            <ul className="space-y-2 text-sm">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <Link to="/praxis/termin/$id" params={{ id: hit.id }}>
                    {clock(hit.startsAt)} · {hit.name} · {STATUS_LABEL[hit.status] ?? hit.status}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </DeskMessage>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}
