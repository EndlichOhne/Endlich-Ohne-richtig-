import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsentCheck } from "@/components/consent-check";
import { Disclaimer } from "@/components/disclaimer";
import { BRAND } from "@/lib/brand";
import { emailOk } from "@/lib/payments";
import { inspectEmail } from "@/lib/verify-api";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: `Konto · ${BRAND.name}` }] }),
});

function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [reauth, setReauth] = useState(false);
  useEffect(() => {
    setReauth(new URLSearchParams(window.location.search).get("reauth") === "1");
  }, []);
  return (
    <div className="fade-up space-y-6">
      <section className="relative -mx-5 -mt-5 overflow-hidden bg-hero text-hero-foreground md:-mx-8 md:rounded-2xl md:grid md:grid-cols-2 md:items-stretch">
        <div className="relative z-10 flex flex-col justify-end p-5 pb-6 md:p-8">
          <p className="kicker text-accent">Konto</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            {mode === "in" ? "Anmelden" : "Registrieren"}
          </h1>
          <p className="mt-2 max-w-md text-sm text-hero-foreground/75">
            {reauth
              ? "Aus Sicherheitsgründen musst du dich erneut anmelden."
              : "Einmal registrieren. Die Anmeldung bleibt gespeichert, spätestens nach zwölf Monaten erneut."}
          </p>
        </div>
        <div className="h-52 md:h-72">
          <img
            src="/images/praxis-hq.webp"
            alt=""
            className="size-full object-cover"
          />
        </div>
      </section>
      {!authEnabled ? (
        <p className="text-sm text-muted-foreground">Anmeldung ist nicht aktiv.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
            <Button
              type="button"
              variant={mode === "in" ? "default" : "ghost"}
              className="rounded-xl"
              onClick={() => setMode("in")}
            >
              Anmelden
            </Button>
            <Button
              type="button"
              variant={mode === "up" ? "default" : "ghost"}
              className="rounded-xl"
              onClick={() => setMode("up")}
            >
              Registrieren
            </Button>
          </div>
          {mode === "in" ? <SignInForm /> : <SignUpForm />}
          <div className="relative py-1 text-center text-xs text-muted-foreground">
            oder
          </div>
          <div className="space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="outline"
                className="min-h-12 w-full rounded-xl"
                onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
              >
                Weiter mit {p.label}
              </Button>
            ))}
          </div>
        </>
      )}
      <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <li className="rounded-xl bg-card px-3 py-2 shadow-[var(--shadow-border)]">Ab 16 Jahren</li>
        <li className="rounded-xl bg-card px-3 py-2 shadow-[var(--shadow-border)]">Check nur lokal</li>
        <li className="rounded-xl bg-card px-3 py-2 shadow-[var(--shadow-border)]">Kein Heilversprechen</li>
      </ul>
      <p className="text-xs text-muted-foreground">
        Mit der Registrierung gelten{" "}
        <Link to="/agb" className="underline">
          AGB
        </Link>
        ,{" "}
        <Link to="/datenschutz" className="underline">
          Datenschutz
        </Link>{" "}
        und der medizinische Hinweis (Entwürfe).
      </p>
      <Disclaimer compact />
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(null);
    if (!emailOk(email) || password.length < 8) {
      setErr("E-Mail und Passwort (mind. 8 Zeichen) prüfen.");
      return;
    }
    setBusy(true);
    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
      callbackURL: "/",
    });
    setBusy(false);
    if (error) {
      setErr(error.message ?? "Anmeldung fehlgeschlagen.");
      return;
    }
    await navigate({ to: "/" });
  }

  return (
    <form
      className="space-y-3 rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div>
        <Label htmlFor="mail">E-Mail</Label>
        <Input
          id="mail"
          type="email"
          autoComplete="email"
          className="mt-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="pw">Passwort</Label>
        <Input
          id="pw"
          type="password"
          autoComplete="current-password"
          className="mt-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      <Button className="min-h-12 w-full rounded-xl" disabled={busy}>
        Anmelden
      </Button>
    </form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agb, setAgb] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [age18, setAge18] = useState(false);
  const [medical, setMedical] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const can =
    agb &&
    privacy &&
    age18 &&
    medical &&
    emailOk(email) &&
    password.length >= 8 &&
    name.trim().length >= 2;

  async function submit() {
    if (!can) return;
    setErr(null);
    setBusy(true);
    const check = await inspectEmail({ data: { email: email.trim() } });
    if (!check.ok) {
      setBusy(false);
      setErr(check.error);
      return;
    }
    const { error } = await authClient.signUp.email({
      email: email.trim().toLowerCase(),
      password,
      name: name.trim().slice(0, 80),
      callbackURL: "/bestaetigen",
    });
    setBusy(false);
    if (error) {
      setErr(error.message ?? "Registrierung fehlgeschlagen.");
      return;
    }
    await navigate({ to: "/bestaetigen" });
  }

  return (
    <form
      className="space-y-3 rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          autoComplete="name"
          className="mt-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="up-mail">E-Mail</Label>
        <Input
          id="up-mail"
          type="email"
          autoComplete="email"
          className="mt-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Echte Adresse – wir senden einen Bestätigungscode. Kein Newsletter.
        </p>
      </div>
      <div>
        <Label htmlFor="up-pw">Passwort (mind. 8 Zeichen)</Label>
        <Input
          id="up-pw"
          type="password"
          autoComplete="new-password"
          className="mt-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <ConsentCheck
        id="r-agb"
        checked={agb}
        onChange={setAgb}
        required
        label="Ich akzeptiere die Nutzungsbedingungen (Entwurf)."
      />
      <ConsentCheck
        id="r-ds"
        checked={privacy}
        onChange={setPrivacy}
        required
        label="Ich habe die Datenschutzerklärung (Entwurf) gelesen."
      />
      <ConsentCheck
        id="r-16"
        checked={age18}
        onChange={setAge18}
        required
        label="Ich bin mindestens 16 Jahre alt."
      />
      <ConsentCheck
        id="r-med"
        checked={medical}
        onChange={setMedical}
        required
        label="Ich bestätige: keine Diagnose, kein Heilversprechen, keine Garantie."
      />
      <Button
        type="button"
        variant="outline"
        className="min-h-12 w-full rounded-xl"
        onClick={() => {
          setAgb(true);
          setPrivacy(true);
          setAge18(true);
          setMedical(true);
        }}
      >
        Ich akzeptiere alles
      </Button>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      <Button className="min-h-12 w-full rounded-xl" disabled={!can || busy}>
        Konto anlegen
      </Button>
    </form>
  );
}
