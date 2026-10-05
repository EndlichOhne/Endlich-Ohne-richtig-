import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bot, Camera, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageIntro } from "@/components/page-intro";
import { Disclaimer } from "@/components/disclaimer";
import { RequireAuth } from "@/components/require-auth";
import { ProgressBar } from "@/components/score-card";
import { BRAND } from "@/lib/brand";
import { listReminders, listTattoos, upsertTattoo } from "@/lib/tattoo-api";
import { getAiUsage } from "@/lib/ai-tattoo";
import {
  COST_DISCLAIMER,
  costPlan,
  dayGreeting,
  isOverdue,
  newId,
  passportCode,
  REMINDER_KIND_LABEL,
  scoreFromCheck,
  type TattooRecord,
  type TattooReminder,
} from "@/lib/tattoo";
import { euro } from "@/lib/pricing";
import { SIZE_LABEL, type Size } from "@/lib/check";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { FREE_LIMITS } from "@/lib/premium";
import { loadPhoto, photoKey } from "@/lib/tattoo-photos";

export const Route = createFileRoute("/akte/")({
  component: AktePage,
  head: () => ({ meta: [{ title: `Akte · ${BRAND.name}` }] }),
});

function AktePage() {
  return (
    <RequireAuth>
      <AkteInner />
    </RequireAuth>
  );
}

function AkteInner() {
  const { user } = useCurrentUserState();
  const [rows, setRows] = useState<TattooRecord[] | null>(null);
  const [reminders, setReminders] = useState<TattooReminder[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [usage, setUsage] = useState<{
    scans: number;
    chats: number;
    isPro?: boolean;
    scanCredits?: number;
  } | null>(null);

  async function reload() {
    const [list, u, rem] = await Promise.all([listTattoos(), getAiUsage(), listReminders()]);
    setRows(list);
    setUsage(u);
    setReminders(rem.filter((r) => !r.done).slice(0, 3));
  }

  useEffect(() => {
    void reload().catch(() => setErr("Akte konnte nicht geladen werden."));
  }, []);

  const totals = useMemo(() => {
    if (!rows?.length) return null;
    const sessions = rows.reduce((s, t) => s + Math.round((t.sessionsLow + t.sessionsHigh) / 2), 0);
    const cost = rows.reduce((s, t) => s + costPlan(t).standard.total, 0);
    const progress = Math.round(rows.reduce((s, t) => s + t.progress, 0) / rows.length);
    return { sessions, cost, progress };
  }, [rows]);

  const name = user?.displayName?.split(" ")[0] ?? "zurück";

  return (
    <div className="fade-up space-y-6">
      <PageIntro kicker="Akte" title={`${dayGreeting()}, ${name}`}>
        Deine Tattoos, Schätzungen und Fortschritte – als Orientierung, nicht als
        Behandlungsakte der Praxis.
      </PageIntro>

      {totals ? (
        <section className="grid grid-cols-3 gap-2">
          <Mini n={`${totals.sessions}`} l="Sitzungen ca." />
          <Mini n={euro(totals.cost * 100)} l="Richtwert gesamt" />
          <Mini n={`${totals.progress} %`} l="Fortschritt" />
        </section>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <Action to="/vorschau" icon={Sparkles} label="KI-Vorschau" />
        <Action to="/scanner" icon={Camera} label="Tattoo scannen" />
        <Action to="/check" icon={Plus} label="Check starten" />
        <Action to="/assistent" icon={Bot} label="Frag die KI" />
      </div>

      {usage ? (
        usage.isPro ? (
          <p className="text-xs text-muted-foreground">
            PRO aktiv · unbegrenzte KI-Scans und Tattoos. Fotos bleiben auf dem Gerät.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            KI-Kontingent:{" "}
            {usage.isPro
              ? "PRO · unbegrenzte Scans"
              : `${usage.scanCredits ?? 0} Einzel-Scan${(usage.scanCredits ?? 0) === 1 ? "" : "s"} · ${usage.chats}/${FREE_LIMITS.chatsPerMonth} Fragen`}
            . Fotos bleiben auf dem Gerät.{" "}
            <Link to="/pro" className="text-primary">
              PRO
            </Link>
          </p>
        )
      ) : null}

      {reminders.length ? (
        <section className="space-y-2">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-xl">Erinnerungen</h2>
            <Link to="/erinnerungen" className="text-sm text-primary">
              Alle
            </Link>
          </div>
          <ul className="space-y-2">
            {reminders.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl bg-card px-4 py-3 text-sm shadow-[var(--shadow-border)]"
              >
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {r.dueDate || "ohne Datum"}
                  {isOverdue(r.dueDate, r.done) ? " · überfällig" : ""} ·{" "}
                  {REMINDER_KIND_LABEL[r.kind] ?? r.kind}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex items-end justify-between">
        <h2 className="font-display text-2xl">Meine Tattoos</h2>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/scanner">Scannen</Link>
        </Button>
      </div>

      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      {rows === null ? (
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">
          Noch kein Tattoo in der Akte. Scanne ein Foto, starte den Check oder lege
          eines manuell an
          {usage?.isPro ? "." : `. Kostenlos: bis zu ${FREE_LIMITS.tattoos} Tattoos.`}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((t) => (
            <li key={t.id}>
              <TattooCard t={t} />
            </li>
          ))}
        </ul>
      )}

      <AddManual
        disabled={!usage?.isPro && (rows?.length ?? 0) >= FREE_LIMITS.tattoos}
        onCreated={() => void reload()}
      />
      <p className="text-xs text-muted-foreground">{COST_DISCLAIMER}</p>
      <Disclaimer compact />
    </div>
  );
}

function TattooCard({ t }: { t: TattooRecord }) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    void loadPhoto(photoKey(t.id, "base")).then(setThumb);
  }, [t.id]);
  return (
    <Link
      to="/akte/$id"
      params={{ id: t.id }}
      className="block rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]"
    >
      <div className="flex items-start gap-3">
        {thumb ? (
          <img src={thumb} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="kicker text-primary">{passportCode(t.id)}</p>
              <p className="mt-1 font-medium">{t.name}</p>
              <p className="text-sm text-muted-foreground">
                {t.bodyLocation || "Region offen"} · Score {t.difficulty.toFixed(1)}
              </p>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">{t.progress} %</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={t.progress} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function AddManual({ disabled, onCreated }: { disabled: boolean; onCreated: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loc, setLoc] = useState("");
  const [size, setSize] = useState<Size>("m");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setErr("Bitte einen Namen angeben.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const scored = scoreFromCheck({
        kind: "tattoo",
        size,
        widthCm: "",
        heightCm: "",
        colors: ["Schwarz"],
        age: "over5",
        origin: "unknown",
        region: "other",
        photoNoteAck: true,
      });
      const id = newId("t");
      await upsertTattoo({
        data: {
          id,
          name: name.trim(),
          kind: "tattoo",
          bodyLocation: loc.trim(),
          sizeKey: size,
          widthCm: "",
          heightCm: "",
          colors: ["Schwarz"],
          originGuess: "unbekannt",
          ...scored,
          analysisJson: "{}",
          progress: 0,
          journalWhy: "",
          source: "manual",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      await navigate({ to: "/akte/$id", params: { id } });
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between text-left text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        Tattoo manuell anlegen
        <span className="text-muted-foreground">{open ? "Schließen" : "Öffnen"}</span>
      </button>
      {open ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <p className="text-xs text-muted-foreground">
            Ohne Foto. Score aus Größe – später per Scan oder Check verfeinern.
          </p>
          <div>
            <Label htmlFor="mn">Name</Label>
            <Input
              id="mn"
              className="mt-2"
              placeholder="z. B. Unterarm links"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ml">Körperstelle</Label>
            <Input
              id="ml"
              className="mt-2"
              placeholder="z. B. Unterarm"
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ms">Größe</Label>
            <select
              id="ms"
              className="mt-2 h-11 w-full rounded-lg bg-muted px-3"
              value={size}
              onChange={(e) => setSize(e.target.value as Size)}
            >
              {(Object.keys(SIZE_LABEL) as Size[]).map((k) => (
                <option key={k} value={k}>
                  {SIZE_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
          {disabled ? (
            <Button asChild variant="outline" className="min-h-12 w-full rounded-xl">
              <Link to="/pro">Free-Limit erreicht · PRO ansehen</Link>
            </Button>
          ) : (
            <Button className="min-h-12 w-full rounded-xl" disabled={busy}>
              {busy ? "Speichert…" : "Anlegen"}
            </Button>
          )}
        </form>
      ) : null}
    </section>
  );
}

function Mini({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-2xl bg-card px-2 py-4 text-center shadow-[var(--shadow-border)]">
      <p className="font-display text-sm md:text-lg">{n}</p>
      <p className="mt-1 text-xs text-muted-foreground">{l}</p>
    </div>
  );
}

function Action({
  to,
  icon: Icon,
  label,
}: {
  to: "/scanner" | "/check" | "/assistent" | "/anbieter" | "/vorschau";
  icon: typeof Camera;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-14 items-center gap-3 rounded-2xl bg-card px-4 text-sm font-medium shadow-[var(--shadow-border)]"
    >
      <Icon className="size-4 text-primary" />
      {label}
    </Link>
  );
}
