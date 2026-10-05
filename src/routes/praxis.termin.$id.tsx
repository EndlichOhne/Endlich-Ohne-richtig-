import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeskMessage } from "@/components/practice-ui";
import { STATUS_LABEL, euro, roleAllowsAction, type DeskAction } from "@/lib/practice-desk";
import {
  advancePracticeAppointment,
  getPracticeCase,
  getPracticeHome,
  recordPracticePayment,
  savePracticeNote,
  setPracticeQuote,
} from "@/lib/practice-api";

export const Route = createFileRoute("/praxis/termin/$id")({
  component: AppointmentPage,
});

const ACTIONS: { action: DeskAction; label: string }[] = [
  { action: "confirm", label: "Termin bestätigen" },
  { action: "arrive", label: "Kunde angekommen" },
  { action: "start", label: "Behandlung starten" },
  { action: "complete", label: "Behandlung abschließen" },
  { action: "cancel", label: "Termin absagen" },
  { action: "noshow", label: "Nicht erschienen" },
];

function AppointmentPage() {
  const { id } = Route.useParams();
  const [data, setData] = useState<Awaited<ReturnType<typeof getPracticeCase>> | null>(null);
  const [role, setRole] = useState("staff");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [deposit, setDeposit] = useState("");
  const [rest, setRest] = useState("");
  const [cents, setCents] = useState("");
  const [method, setMethod] = useState("cash");

  async function load() {
    setError(null);
    const [next, home] = await Promise.all([getPracticeCase({ data: { id } }), getPracticeHome()]);
    setData(next);
    setNote(next.appointment.treatmentNote);
    setRole(home.session?.role ?? "staff");
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : "Nicht gefunden."));
  }, [id]);

  async function run(task: () => Promise<unknown>) {
    setError(null);
    try {
      await task();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nicht möglich.");
    }
  }

  const appointment = data?.appointment;

  return (
    <DeskMessage loading={!data && !error} error={error && !data ? error : null}>
      {appointment ? (
        <div className="space-y-4 text-sm">
          {error ? <p className="text-destructive">{error}</p> : null}
          <section className="space-y-1 rounded-2xl bg-card p-4">
            <h2 className="font-display text-2xl">{appointment.name}</h2>
            <p>{appointment.startsAt.replace("T", " ").slice(0, 16)}</p>
            <p>{STATUS_LABEL[appointment.status] ?? appointment.status}</p>
            <p className="text-muted-foreground">{appointment.location}</p>
            {appointment.assignee ? <p>Behandelnde Person: {appointment.assignee}</p> : null}
            {appointment.note ? <p>Notiz: {appointment.note}</p> : null}
          </section>
          <section className="space-y-1">
            <h3 className="font-medium">Zahlung</h3>
            <p>Status: {appointment.paymentStatus}</p>
            <p>Anzahlung: {euro(appointment.depositCents)}</p>
            <p>Rest: {euro(appointment.restCents)}</p>
            <p>Bezahlt: {euro(appointment.paidCents)}</p>
            {appointment.paymentMethod ? <p>Methode: {appointment.paymentMethod}</p> : null}
          </section>
          <div className="flex flex-col gap-2">
            {ACTIONS.filter((item) => roleAllowsAction(role, item.action)).map((item) => (
              <Button
                key={item.action}
                variant="outline"
                onClick={() => void run(() => advancePracticeAppointment({ data: { id, action: item.action } }))}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <Link to="/praxis/akte/$id" params={{ id }} className="underline">
            Kundenakte
          </Link>
          {roleAllowsAction(role, "note") ? (
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                void run(() => savePracticeNote({ data: { id, note } }));
              }}
            >
              <textarea
                className="min-h-24 w-full rounded-xl bg-muted p-3"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Behandlungsnotiz"
              />
              <Button type="submit">Notiz speichern</Button>
            </form>
          ) : null}
          {roleAllowsAction(role, "quote") ? (
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                void run(() =>
                  setPracticeQuote({
                    data: {
                      id,
                      depositCents: Math.round(Number(deposit) * 100),
                      restCents: Math.round(Number(rest) * 100),
                    },
                  }),
                );
              }}
            >
              <Input value={deposit} onChange={(event) => setDeposit(event.target.value)} placeholder="Anzahlung in Euro" inputMode="decimal" />
              <Input value={rest} onChange={(event) => setRest(event.target.value)} placeholder="Rest in Euro" inputMode="decimal" />
              <Button type="submit" variant="outline">
                Beträge hinterlegen
              </Button>
            </form>
          ) : null}
          {roleAllowsAction(role, "pay") ? (
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                void run(() =>
                  recordPracticePayment({
                    data: { id, cents: Math.round(Number(cents) * 100), method },
                  }),
                );
              }}
            >
              <Input value={cents} onChange={(event) => setCents(event.target.value)} placeholder="Erhaltener Betrag in Euro" inputMode="decimal" />
              <select className="h-11 w-full rounded-md bg-muted px-3" value={method} onChange={(event) => setMethod(event.target.value)}>
                <option value="cash">Bar</option>
                <option value="card">Karte vor Ort</option>
                <option value="transfer">Überweisung</option>
              </select>
              <Button type="submit">Zahlung erfassen</Button>
              <p className="text-xs text-muted-foreground">Stripe bleibt im Checkout. Hier wird nichts als bezahlt markiert, nur weil es so geschickt wird.</p>
            </form>
          ) : null}
        </div>
      ) : null}
    </DeskMessage>
  );
}
