import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { authEnabled, signOut } from "@/lib/auth/client";
import { bootstrapClinicAdmin, endPracticeSession, getPracticeHome, redeemPracticeCode } from "@/lib/practice-api";
import { PracticeNav } from "@/components/practice-ui";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/praxis")({
  component: PraxisLayout,
  head: () => ({ meta: [{ title: `Praxis · ${BRAND.name}` }] }),
});

function PraxisLayout() {
  const navigate = useNavigate();
  const [home, setHome] = useState<Awaited<ReturnType<typeof getPracticeHome>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    void getPracticeHome()
      .then(setHome)
      .catch(() => setHome(null));
  }, []);

  async function leave() {
    await endPracticeSession().catch(() => undefined);
    if (authEnabled) await signOut().catch(() => undefined);
    void navigate({ to: "/login" });
  }

  return (
    <div className="fade-up mx-auto max-w-lg space-y-5 pb-8">
      <header className="space-y-1">
        <p className="text-xs tracking-wide text-primary">ENDLICH OHNE</p>
        <h1 className="font-display text-3xl">Praxisbereich</h1>
      </header>
      <SignedOut>
        <p className="text-sm text-muted-foreground">Bitte zuerst das Konto anmelden.</p>
        <Button asChild>
          <Link to="/login">Anmelden</Link>
        </Button>
      </SignedOut>
      <SignedIn>
        {!home ? <p className="text-sm text-muted-foreground">Wird geladen.</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {home && !home.session ? (
          <div className="space-y-3">
            <p className="text-sm">Für den Praxisbereich brauchst du dein Konto und einen gültigen Praxiscode. Die Sitzung gilt acht Stunden.</p>
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                setError(null);
                void redeemPracticeCode({ data: { code } })
                  .then(() => getPracticeHome().then(setHome))
                  .catch((err) => setError(err instanceof Error ? err.message : "Code ungültig oder gesperrt."));
              }}
            >
              <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Praxiscode" autoComplete="off" />
              <Button type="submit">Praxis öffnen</Button>
            </form>
            <Button asChild>
              <Link to="/login">Erneut anmelden</Link>
            </Button>
            {home.clinicEmail ? (
              <Button
                variant="outline"
                onClick={() =>
                  void bootstrapClinicAdmin()
                    .then(() => getPracticeHome().then(setHome))
                    .catch((err) => setError(err instanceof Error ? err.message : "Nicht möglich."))
                }
              >
                Ersten Praxiszugang einrichten
              </Button>
            ) : null}
          </div>
        ) : null}
        {home && !home.session && home.ownAppointments.length > 0 ? (
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
        {home?.session ? (
          <>
            <div className="rounded-2xl bg-card p-4 text-sm shadow-[var(--shadow-border)]">
              <p>{home.session.locationName}</p>
              <p className="text-muted-foreground">
                {home.session.locationCity} · {home.session.role}
              </p>
              <button type="button" className="mt-3 text-sm underline" onClick={() => void leave()}>
                Logout
              </button>
            </div>
            <PracticeNav role={home.session.role} />
            <Outlet />
          </>
        ) : null}
      </SignedIn>
    </div>
  );
}
