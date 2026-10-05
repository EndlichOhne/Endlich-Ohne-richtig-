import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeskMessage } from "@/components/practice-ui";
import { listPracticeDay, savePracticeAppointment } from "@/lib/practice-api";
import { berlinDay, STATUS_LABEL, clock } from "@/lib/practice-desk";

export const Route = createFileRoute("/praxis/kalender")({
  component: CalendarPage,
});

function CalendarPage() {
  const [day, setDay] = useState(berlinDay());
  const [items, setItems] = useState<Awaited<ReturnType<typeof listPracticeDay>>["items"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [note, setNote] = useState("");

  async function load(nextDay: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await listPracticeDay({ data: { day: nextDay } });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nicht möglich.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(day);
  }, [day]);

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        Tag
        <Input type="date" value={day} onChange={(event) => setDay(event.target.value)} className="mt-1" />
      </label>
      <DeskMessage
        loading={loading}
        error={error}
        empty={!loading && items.length === 0}
        emptyText="Heute sind keine Termine geplant."
      >
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to="/praxis/termin/$id"
                params={{ id: item.id }}
                className="block rounded-2xl bg-card p-4 text-sm shadow-[var(--shadow-border)]"
              >
                <p className="font-medium">
                  {clock(item.startsAt)} · {item.name}
                </p>
                <p className="text-muted-foreground">
                  {STATUS_LABEL[item.status] ?? item.status} · {item.location}
                  {item.assignee ? ` · ${item.assignee}` : ""}
                </p>
                {item.note ? <p className="mt-1">{item.note}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      </DeskMessage>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          void savePracticeAppointment({ data: { email, startsAt, note } })
            .then(() => {
              setEmail("");
              setNote("");
              return load(day);
            })
            .catch((err) => setError(err instanceof Error ? err.message : "Nicht möglich."));
        }}
      >
        <h2 className="font-display text-xl">Termin anlegen</h2>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-Mail des Kundenkontos" required />
        <Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required />
        <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Notiz" />
        <Button type="submit">Am eigenen Standort speichern</Button>
      </form>
    </div>
  );
}
