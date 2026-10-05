import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRAND } from "@/lib/brand";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import {
  addPracticeLocation,
  addPracticeMember,
  bootstrapClinicAdmin,
  getPracticeHome,
  issuePracticeCode,
  resetMemberCode,
  savePracticeAppointment,
  setMemberActive,
  setMemberRole,
  setPracticeAppointmentStatus,
  switchPracticeLocation,
} from "@/lib/practice-api";

export const Route = createFileRoute("/praxis")({
  component: PraxisPage,
  head: () => ({ meta: [{ title: `Praxis · ${BRAND.name}` }] }),
});

function PraxisPage() {
  const [home, setHome] = useState<Awaited<ReturnType<typeof getPracticeHome>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<string | null>(null);
  const [role, setRole] = useState<"staff" | "doctor" | "admin">("staff");
  const [email, setEmail] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [note, setNote] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [city, setCity] = useState("");
  const [place, setPlace] = useState("");

  async function refresh() {
    const next = await getPracticeHome();
    setHome(next);
  }

  useEffect(() => {
    void getPracticeHome()
      .then(setHome)
      .catch(() => setHome(null));
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

  return (
    <div className="fade-up mx-auto max-w-lg space-y-6">
      <header>
        <p className="kicker text-primary">Praxis</p>
        <h1 className="mt-2 font-display text-3xl">Standortzugang</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Das Konto bleibt bis zu zwölf Monate gespeichert. Der Arztzugang gilt acht Stunden und wird beim Anmelden mit angelegt.
        </p>
      </header>
      <SignedOut>
        <Button asChild>
          <Link to="/login">Anmelden</Link>
        </Button>
      </SignedOut>
      <SignedIn>
        {!home ? <p className="text-sm text-muted-foreground">Wird geladen.</p> : null}
        {home && error ? <p className="text-sm text-destructive">{error}</p> : null}
        {home && !home.session ? (
          <div className="space-y-3">
            <p className="text-sm">Für den Praxiszugang musst du dich erneut anmelden.</p>
            <Button asChild>
              <Link to="/login">Erneut anmelden</Link>
            </Button>
          </div>
        ) : null}
        {home?.clinicEmail && !home.session ? (
          <Button
            variant="outline"
            onClick={() => void run(() => bootstrapClinicAdmin())}
          >
            Ersten Praxiszugang einrichten
          </Button>
        ) : null}
        {home?.session ? (
          <section className="space-y-4">
            <p className="text-sm">
              {home.session.locationCity} · {home.session.role}
            </p>
            {home.session.role === "admin" ? (
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
                <label className="block text-sm">
                  Rolle
                  <select
                    className="mt-1 h-11 w-full rounded-md bg-muted px-3"
                    value={role}
                    onChange={(event) => setRole(event.target.value as typeof role)}
                  >
                    <option value="staff">staff</option>
                    <option value="doctor">doctor</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <Button type="submit">Einmalcode erzeugen</Button>
                {issued ? (
                  <p className="text-sm">
                    Einmalig anzeigen, danach nicht mehr lesbar: <strong>{issued}</strong>
                  </p>
                ) : null}
              </form>
            ) : null}
            {home.session.role === "admin" ? (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void run(async () => {
                    const res = await addPracticeMember({ data: { email: memberEmail, role } });
                    setIssued(res.code);
                    setMemberEmail("");
                  });
                }}
              >
                <Input
                  type="email"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                  placeholder="E-Mail eines bestehenden Kontos"
                  required
                />
                <Button type="submit">Mitglied anlegen</Button>
              </form>
            ) : null}
            {home.members.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {home.members.map((member) => (
                  <li key={member.id} className="space-y-2">
                    <span>
                      {member.emailMasked} · {member.role}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          void run(() =>
                            setMemberActive({ data: { memberId: member.id, active: !member.active } }),
                          )
                        }
                      >
                        {member.active ? "Deaktivieren" : "Aktivieren"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          void run(async () => {
                            const res = await resetMemberCode({ data: { memberId: member.id } });
                            setIssued(res.code);
                          })
                        }
                      >
                        Code neu
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          void run(() =>
                            setMemberRole({
                              data: {
                                memberId: member.id,
                                role: member.role === "staff" ? "doctor" : "staff",
                              },
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
            ) : null}
            {home.locations.length > 1 ? (
              <ul className="space-y-2 text-sm">
                {home.locations.map((location) => (
                  <li key={location.id} className="flex items-center justify-between gap-3">
                    <span>
                      {location.city}
                      {location.active ? "" : " · inaktiv"}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => void run(() => switchPracticeLocation({ data: { locationId: location.id } }))}
                    >
                      Wechseln
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
            {home.session.role === "admin" ? (
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
            ) : null}
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await savePracticeAppointment({ data: { email, startsAt, note } });
                  setEmail("");
                  setNote("");
                });
              }}
            >
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="E-Mail des Kundenkontos"
                required
              />
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                required
              />
              <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Notiz" />
              <Button type="submit">Termin am eigenen Standort</Button>
            </form>
            <ul className="space-y-2 text-sm">
              {home.staffAppointments.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <span>
                    {item.startsAt} · {item.emailMasked} · {item.status}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void run(() =>
                        setPracticeAppointmentStatus({
                          data: {
                            id: item.id,
                            status: item.status === "cancelled" ? "planned" : "cancelled",
                          },
                        }),
                      )
                    }
                  >
                    Status
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {home && home.ownAppointments.length > 0 ? (
          <section>
            <h2 className="font-display text-xl">Eigene Termine</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {home.ownAppointments.map((item) => (
                <li key={item.id}>
                  {item.city} · {item.startsAt} · {item.status}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </SignedIn>
    </div>
  );
}
