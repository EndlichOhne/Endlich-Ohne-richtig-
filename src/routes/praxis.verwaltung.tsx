import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeskMessage } from "@/components/practice-ui";
import {
  addPracticeLocation,
  addPracticeMember,
  getPracticeHome,
  issuePracticeCode,
  listPracticeAudit,
  resetMemberCode,
  setLocationActive,
  setMemberActive,
  setMemberRole,
  switchPracticeLocation,
} from "@/lib/practice-api";

export const Route = createFileRoute("/praxis/verwaltung")({
  component: AdminPage,
});

function AdminPage() {
  const [home, setHome] = useState<Awaited<ReturnType<typeof getPracticeHome>> | null>(null);
  const [audit, setAudit] = useState<Awaited<ReturnType<typeof listPracticeAudit>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<string | null>(null);
  const [role, setRole] = useState<"staff" | "doctor" | "admin">("staff");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [place, setPlace] = useState("");

  async function refresh() {
    const next = await getPracticeHome();
    setHome(next);
    if (next.session?.role === "admin") setAudit(await listPracticeAudit());
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : "Keine Berechtigung."));
  }, []);

  async function run(task: () => Promise<unknown>) {
    setError(null);
    try {
      await task();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nicht möglich.");
    }
  }

  if (home && home.session?.role !== "admin") {
    return <p className="text-sm">Du hast für diesen Bereich keine Berechtigung.</p>;
  }

  return (
    <DeskMessage loading={!home && !error} error={error && !home ? error : null}>
      {home?.session?.role === "admin" ? (
        <div className="space-y-6 text-sm">
          {error ? <p className="text-destructive">{error}</p> : null}
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const res = await issuePracticeCode({ data: { role } });
                setIssued(res.code);
              });
            }}
          >
            <h2 className="font-display text-xl">Zugangscode</h2>
            <select className="h-11 w-full rounded-md bg-muted px-3" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
              <option value="staff">staff</option>
              <option value="doctor">doctor</option>
              <option value="admin">admin</option>
            </select>
            <Button type="submit">Einmalcode erzeugen</Button>
            {issued ? <p>Einmalig anzeigen: <strong>{issued}</strong></p> : null}
          </form>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const res = await addPracticeMember({ data: { email, role } });
                setIssued(res.code);
                setEmail("");
              });
            }}
          >
            <h2 className="font-display text-xl">Mitglied</h2>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-Mail eines bestehenden Kontos" required />
            <Button type="submit">Mitglied anlegen</Button>
          </form>
          <ul className="space-y-3">
            {home.members.map((member) => (
              <li key={member.id} className="space-y-2 rounded-2xl bg-card p-3">
                <p>{member.emailMasked} · {member.role} · {member.active ? "aktiv" : "inaktiv"}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => void run(() => setMemberActive({ data: { memberId: member.id, active: !member.active } }))}>
                    {member.active ? "Deaktivieren" : "Aktivieren"}
                  </Button>
                  <Button variant="outline" onClick={() => void run(async () => setIssued((await resetMemberCode({ data: { memberId: member.id } })).code))}>
                    Code neu
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void run(() =>
                        setMemberRole({
                          data: { memberId: member.id, role: member.role === "staff" ? "doctor" : member.role === "doctor" ? "admin" : "staff" },
                        }),
                      )
                    }
                  >
                    Rolle wechseln
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <ul className="space-y-2">
            {home.locations.map((location) => (
              <li key={location.id} className="flex items-center justify-between gap-3">
                <span>{location.city}{location.active ? "" : " · inaktiv"}</span>
                <span className="flex gap-2">
                  <Button variant="outline" onClick={() => void run(() => switchPracticeLocation({ data: { locationId: location.id } }))}>
                    Wechseln
                  </Button>
                  <Button variant="outline" onClick={() => void run(() => setLocationActive({ data: { locationId: location.id, active: !location.active } }))}>
                    {location.active ? "Deaktivieren" : "Aktivieren"}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await addPracticeLocation({ data: { city, name: place } });
                setCity("");
                setPlace("");
              });
            }}
          >
            <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Stadt" required />
            <Input value={place} onChange={(event) => setPlace(event.target.value)} placeholder="Name" required />
            <Button type="submit">Standort anlegen</Button>
          </form>
          <section className="space-y-2">
            <h2 className="font-display text-xl">Sitzungen</h2>
            {audit && audit.sessions.length === 0 ? <p className="text-muted-foreground">Keine aktive Praxis-Sitzung.</p> : null}
            <ul className="space-y-1">
              {audit?.sessions.map((session) => (
                <li key={session.expiresAt + session.emailMasked}>
                  {session.emailMasked} · bis {session.expiresAt.slice(0, 16).replace("T", " ")}
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-2">
            <h2 className="font-display text-xl">Audit</h2>
            <ul className="space-y-1">
              {audit?.events.map((event, index) => (
                <li key={`${event.at}-${index}`}>
                  {event.at.slice(0, 16).replace("T", " ")} · {event.action}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </DeskMessage>
  );
}
