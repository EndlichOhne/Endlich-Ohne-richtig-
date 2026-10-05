import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Disclaimer } from "@/components/disclaimer";
import { RequireAuth } from "@/components/require-auth";
import { ScoreCard, ProgressBar } from "@/components/score-card";
import { BeforeAfter } from "@/components/before-after";
import { PhotoInput } from "@/components/photo-input";
import { BRAND } from "@/lib/brand";
import { euro } from "@/lib/pricing";
import {
  COST_DISCLAIMER,
  costPlan,
  formatShortDate,
  LEVEL_LABEL,
  newId,
  passportCode,
  sizeDisplay,
  SOURCE_LABEL,
  STATUS_LABEL,
  addDays,
  todayIso,
  type SessionStatus,
  type TattooRecord,
  type TattooSession,
} from "@/lib/tattoo";
import {
  deleteSession,
  deleteTattoo,
  getTattoo,
  listSessions,
  upsertReminder,
  upsertSession,
  upsertTattoo,
} from "@/lib/tattoo-api";
import { loadPhoto, photoKey, savePhotoForTattoo, simulateFade } from "@/lib/tattoo-photos";
import { getProStatus } from "@/lib/pro-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/akte/$id")({
  component: PassportPage,
  head: () => ({ meta: [{ title: `Passport · ${BRAND.name}` }] }),
});

const TABS = ["passport", "plan", "fortschritt", "journal", "simulation"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  passport: "Passport",
  plan: "Plan",
  fortschritt: "Fortschritt",
  journal: "Journal",
  simulation: "Simulation",
};

function PassportPage() {
  return (
    <RequireAuth>
      <PassportInner />
    </RequireAuth>
  );
}

function PassportInner() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("passport");
  const [loading, setLoading] = useState(true);
  const [tattoo, setTattoo] = useState<TattooRecord | null>(null);
  const [sessions, setSessions] = useState<TattooSession[]>([]);
  const [basePhoto, setBasePhoto] = useState<string | null>(null);
  const [latestPhoto, setLatestPhoto] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [unlimited, setUnlimited] = useState(false);

  async function reload() {
    const t = await getTattoo({ data: { id } });
    setTattoo(t);
    if (!t) return;
    const s = await listSessions({ data: { tattooId: id } });
    setSessions(s);
    const base = await loadPhoto(photoKey(id, "base"));
    setBasePhoto(base);
    let last: string | null = await loadPhoto(photoKey(id, "now"));
    for (const row of [...s].reverse()) {
      const shot = await loadPhoto(photoKey(id, `s-${row.id}`));
      if (shot) {
        last = shot;
        break;
      }
    }
    setLatestPhoto(last);
  }

  useEffect(() => {
    setLoading(true);
    void reload()
      .catch(() => setErr("Akte nicht geladen."))
      .finally(() => setLoading(false));
    void getProStatus()
      .then((s) => setUnlimited(s.isPro))
      .catch(() => undefined);
  }, [id]);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  }

  if (!tattoo) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl">Tattoo nicht gefunden</h1>
        <p className="text-sm text-muted-foreground">
          {err ?? "Dieses Tattoo gehört nicht zu deinem Konto oder wurde gelöscht."}
        </p>
        <Button asChild className="rounded-xl">
          <Link to="/akte">Zurück zur Akte</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="fade-up space-y-6">
      <p className="kicker text-primary">{passportCode(tattoo.id)}</p>
      <h1 className="font-display text-3xl">{tattoo.name}</h1>
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              "min-h-11 shrink-0 rounded-xl px-3 text-sm font-medium",
              tab === k
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground shadow-[var(--shadow-border)]",
            )}
          >
            {TAB_LABEL[k]}
          </button>
        ))}
      </div>

      {tab === "passport" ? (
        <PassportTab tattoo={tattoo} sessions={sessions} basePhoto={basePhoto} />
      ) : null}
      {tab === "plan" ? (
        <PlanTab tattoo={tattoo} sessions={sessions} onChange={() => void reload()} />
      ) : null}
      {tab === "fortschritt" ? (
        <ProgressTab
          tattoo={tattoo}
          sessions={sessions}
          basePhoto={basePhoto}
          latestPhoto={latestPhoto}
          unlimited={unlimited}
          onChange={() => void reload()}
        />
      ) : null}
      {tab === "journal" ? (
        <JournalTab
          tattoo={tattoo}
          sessions={sessions}
          onSave={async (next) => {
            await upsertTattoo({ data: next });
            setTattoo(next);
          }}
        />
      ) : null}
      {tab === "simulation" ? (
        <SimTab
          tattooId={tattoo.id}
          basePhoto={basePhoto}
          unlimited={unlimited}
          onChange={() => void reload()}
        />
      ) : null}

      <Button
        variant="outline"
        className="min-h-12 w-full rounded-xl text-destructive"
        onClick={async () => {
          if (!window.confirm("Dieses Tattoo und seine Sitzungen löschen?")) return;
          await deleteTattoo({ data: { id } });
          await navigate({ to: "/akte" });
        }}
      >
        Tattoo aus der Akte entfernen
      </Button>
      <Disclaimer compact />
    </div>
  );
}

function extraFromAnalysis(json: string) {
  try {
    const o = JSON.parse(json) as Record<string, unknown>;
    return {
      blackShare: typeof o.blackShare === "string" ? o.blackShare : "",
      pigmentDensity: typeof o.pigmentDensity === "string" ? o.pigmentDensity : "",
      depthGuess: typeof o.depthGuess === "string" ? o.depthGuess : "",
    };
  } catch {
    return null;
  }
}

function PassportTab({
  tattoo,
  sessions,
  basePhoto,
}: {
  tattoo: TattooRecord;
  sessions: TattooSession[];
  basePhoto: string | null;
}) {
  const plan = costPlan(tattoo);
  const spent = sessions.reduce((s, x) => s + (x.costCents ?? 0), 0);
  const extra = extraFromAnalysis(tattoo.analysisJson);
  const done = sessions.filter((s) => s.status === "erledigt").length;

  return (
    <div className="space-y-4">
      {basePhoto ? (
        <img src={basePhoto} alt="" className="max-h-52 w-full rounded-2xl object-cover" />
      ) : null}
      <ScoreCard tattoo={tattoo} />
      <dl className="space-y-2 rounded-2xl bg-card p-5 text-sm shadow-[var(--shadow-border)]">
        <Line k="Körperstelle" v={tattoo.bodyLocation || "—"} />
        <Line k="Größe" v={sizeDisplay(tattoo)} />
        <Line k="Farben" v={tattoo.colors.join(", ") || "—"} />
        <Line
          k="Geschätzte Sitzungen"
          v={`${tattoo.sessionsLow}–${tattoo.sessionsHigh} (Richtwert)`}
        />
        <Line k="Geschätzte Kosten (Standard)" v={euro(plan.standard.total * 100)} />
        {extra?.depthGuess ? <Line k="Tiefe (visuell)" v={extra.depthGuess} /> : null}
        {extra?.blackShare ? (
          <Line
            k="Schwarzanteil"
            v={LEVEL_LABEL[extra.blackShare as keyof typeof LEVEL_LABEL] ?? extra.blackShare}
          />
        ) : null}
        {extra?.pigmentDensity ? (
          <Line
            k="Pigmentdichte"
            v={
              LEVEL_LABEL[extra.pigmentDensity as keyof typeof LEVEL_LABEL] ?? extra.pigmentDensity
            }
          />
        ) : null}
      </dl>
      <ProgressBar value={tattoo.progress} label="Removal Progress" />
      <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="kicker text-primary">Warum schwierig / eher einfach</p>
        <p className="mt-2 text-sm">{tattoo.whyText}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {tattoo.factors.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="kicker text-primary">Kostenplaner</p>
        <div className="mt-3 space-y-2">
          {Object.values(plan).map((p) => (
            <div key={p.label} className="flex justify-between rounded-xl bg-muted px-3 py-3 text-sm">
              <span>
                {p.label}
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {p.sessions} × {p.per} €
                </span>
              </span>
              <span className="tabular-nums font-medium">{euro(p.total * 100)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{COST_DISCLAIMER}</p>
      </section>
      <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="kicker text-primary">Verlauf</p>
        <dl className="mt-3 space-y-2 text-sm">
          <Line k="Scan History" v={`${SOURCE_LABEL[tattoo.source]} · ${formatShortDate(tattoo.createdAt)}`} />
          <Line k="Session History" v={`${done} erledigt / ${sessions.length} erfasst`} />
          <Line k="Photo History" v={basePhoto ? "Ausgangsfoto auf diesem Gerät" : "Noch kein Foto"} />
          <Line k="Cost History" v={spent ? euro(spent) : "Noch keine Kosten erfasst"} />
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Fotos bleiben lokal (Art. 9). Metadaten liegen im Konto.
        </p>
      </section>
      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" className="min-h-12 rounded-xl">
          <Link to="/anbieter">Studio finden</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-12 rounded-xl">
          <Link to="/erinnerungen">Erinnerung</Link>
        </Button>
      </div>
    </div>
  );
}

function PlanTab({
  tattoo,
  sessions,
  onChange,
}: {
  tattoo: TattooRecord;
  sessions: TattooSession[];
  onChange: () => void;
}) {
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [studio, setStudio] = useState("");
  const [area, setArea] = useState("");
  const [cost, setCost] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setErr(null);
    try {
      const n = sessions.length + 1;
      await upsertSession({
        data: {
          id: newId("s"),
          tattooId: tattoo.id,
          title: `Sitzung ${n}`,
          date,
          notes,
          studio,
          area,
          costCents: cost ? Math.round(Number(cost) * 100) : undefined,
          status: n === 1 ? "geplant" : "ausstehend",
          createdAt: new Date().toISOString(),
        },
      });
      setDate("");
      setNotes("");
      setCost("");
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sitzung nicht gespeichert.");
    } finally {
      setBusy(false);
    }
  }

  async function suggest() {
    setBusy(true);
    setErr(null);
    try {
      const n = Math.min(6, Math.max(3, Math.round((tattoo.sessionsLow + tattoo.sessionsHigh) / 2)));
      const start = todayIso();
      for (let i = 0; i < n; i++) {
        await upsertSession({
          data: {
            id: newId("s"),
            tattooId: tattoo.id,
            title: `Sitzung ${i + 1}`,
            date: addDays(start, i * 49),
            notes: "Organisatorischer Platzhalter – Abstand legt das Fachpersonal fest.",
            studio: "",
            area: "",
            status: i === 0 ? "geplant" : "ausstehend",
            createdAt: new Date().toISOString(),
          },
        });
      }
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Plan nicht erzeugt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Organisatorischer Plan, keine medizinisch verbindlichen Intervalle. Abstände legt das
        Fachpersonal fest.
      </p>
      {sessions.length === 0 ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-12 w-full rounded-xl"
          disabled={busy}
          onClick={() => void suggest()}
        >
          {busy ? "Legt an…" : `Plan vorschlagen (${tattoo.sessionsLow}–${tattoo.sessionsHigh} Sitzungen)`}
        </Button>
      ) : null}
      <ol className="space-y-2">
        {sessions.length === 0 ? (
          <li className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
            Noch keine Sitzung. Richtwert: {tattoo.sessionsLow}–{tattoo.sessionsHigh}.
          </li>
        ) : (
          sessions.map((s) => (
            <li key={s.id} className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.date || "Datum offen"} · {STATUS_LABEL[s.status]}
                  </p>
                  {s.studio ? <p className="text-sm">{s.studio}</p> : null}
                  {s.area ? <p className="text-sm text-muted-foreground">{s.area}</p> : null}
                  {s.costCents ? (
                    <p className="text-sm tabular-nums">{euro(s.costCents)}</p>
                  ) : null}
                  {s.notes ? <p className="mt-1 text-sm text-muted-foreground">{s.notes}</p> : null}
                </div>
                <StatusBtn session={s} onChange={onChange} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl text-xs"
                  onClick={() =>
                    void upsertReminder({
                      data: {
                        id: newId("r"),
                        tattooId: tattoo.id,
                        title: `${s.title} · ${tattoo.name}`,
                        dueDate: s.date || todayIso(),
                        kind: "sitzung",
                        done: false,
                        createdAt: new Date().toISOString(),
                      },
                    }).then(() => setHint("Erinnerung gespeichert."))
                  }
                >
                  Erinnern
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 rounded-xl text-xs text-destructive"
                  onClick={() =>
                    void deleteSession({ data: { id: s.id } }).then(onChange)
                  }
                >
                  Weg
                </Button>
              </div>
            </li>
          ))
        )}
      </ol>
      {hint ? <p className="text-sm text-primary">{hint}</p> : null}
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      <form
        className="space-y-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <p className="font-medium">Sitzung hinzufügen</p>
        <div>
          <Label htmlFor="sd">Datum</Label>
          <Input id="sd" type="date" className="mt-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="st">Studio</Label>
          <Input id="st" className="mt-2" value={studio} onChange={(e) => setStudio(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="sa">Behandelte Fläche</Label>
          <Input id="sa" className="mt-2" value={area} onChange={(e) => setArea(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="sc">Kosten € (optional)</Label>
          <Input id="sc" type="number" className="mt-2" value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="sn">Notizen</Label>
          <Textarea id="sn" className="mt-2 min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button className="min-h-12 w-full rounded-xl" disabled={busy}>
          Speichern
        </Button>
      </form>
    </div>
  );
}

function StatusBtn({ session, onChange }: { session: TattooSession; onChange: () => void }) {
  const next: Record<SessionStatus, SessionStatus> = {
    geplant: "ausstehend",
    ausstehend: "erledigt",
    erledigt: "geplant",
  };
  return (
    <button
      type="button"
      className={cn(
        "min-h-11 shrink-0 rounded-full px-3 text-xs font-medium",
        session.status === "erledigt"
          ? "bg-primary text-primary-foreground"
          : session.status === "geplant"
            ? "bg-muted"
            : "bg-card shadow-[var(--shadow-border)]",
      )}
      onClick={() =>
        void upsertSession({ data: { ...session, status: next[session.status] } }).then(onChange)
      }
    >
      {STATUS_LABEL[session.status]}
    </button>
  );
}

function ProgressTab({
  tattoo,
  sessions,
  basePhoto,
  latestPhoto,
  unlimited,
  onChange,
}: {
  tattoo: TattooRecord;
  sessions: TattooSession[];
  basePhoto: string | null;
  latestPhoto: string | null;
  unlimited: boolean;
  onChange: () => void;
}) {
  const [p, setP] = useState(tattoo.progress);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  useEffect(() => setP(tattoo.progress), [tattoo.progress]);

  async function store(slot: string, url: string) {
    setPhotoErr(null);
    try {
      await savePhotoForTattoo(tattoo.id, slot, url, unlimited);
      onChange();
    } catch (e) {
      setPhotoErr(e instanceof Error ? e.message : "Foto nicht gespeichert.");
    }
  }

  return (
    <div className="space-y-5">
      <ProgressBar value={p} label="Removal Progress" />
      <p className="text-xs text-muted-foreground">
        {tattoo.progress === 0
          ? "Noch keine erledigte Sitzung – oder eigenen Wert setzen."
          : "Aus erledigten Sitzungen bzw. deiner Angabe."}
      </p>
      <label className="block text-xs text-muted-foreground">
        Eigenen Fortschritt
        <input
          type="range"
          min={0}
          max={95}
          value={p}
          onChange={(e) => setP(Number(e.target.value))}
          className="mt-2 h-11 w-full accent-primary"
        />
      </label>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full rounded-xl"
        onClick={() => void upsertTattoo({ data: { ...tattoo, progress: p } }).then(onChange)}
      >
        Fortschritt speichern ({p} %)
      </Button>
      {basePhoto && latestPhoto && basePhoto !== latestPhoto ? (
        <BeforeAfter before={basePhoto} after={latestPhoto} afterLabel="Aktuell" />
      ) : (
        <p className="text-sm text-muted-foreground">
          Lade ein Ausgangsfoto und ein aktuelles Foto, um den Vergleich zu sehen – Sitzungen sind
          nicht nötig.
        </p>
      )}
      {photoErr ? <p className="text-sm text-destructive">{photoErr}</p> : null}
      <ol className="space-y-4">
        <li className="space-y-2">
          <p className="text-sm font-medium">Vorher</p>
          {basePhoto ? (
            <img src={basePhoto} alt="" className="max-h-48 w-full rounded-xl object-cover" />
          ) : (
            <p className="text-sm text-muted-foreground">Noch kein Ausgangsfoto.</p>
          )}
          <PhotoInput label="Ausgangsfoto setzen" onReady={(url) => void store("base", url)} />
        </li>
        <li className="space-y-2">
          <p className="text-sm font-medium">Aktuell</p>
          {latestPhoto && latestPhoto !== basePhoto ? (
            <img src={latestPhoto} alt="" className="max-h-48 w-full rounded-xl object-cover" />
          ) : (
            <p className="text-sm text-muted-foreground">Noch kein Vergleichsfoto.</p>
          )}
          <PhotoInput label="Aktuelles Foto setzen" onReady={(url) => void store("now", url)} />
        </li>
        {sessions.map((s, i) => (
          <SessionPhoto
            key={s.id}
            session={s}
            index={i + 1}
            tattooId={tattoo.id}
            unlimited={unlimited}
            onChange={onChange}
          />
        ))}
      </ol>
    </div>
  );
}

function SessionPhoto({
  session,
  index,
  tattooId,
  unlimited,
  onChange,
}: {
  session: TattooSession;
  index: number;
  tattooId: string;
  unlimited: boolean;
  onChange: () => void;
}) {
  const [img, setImg] = useState<string | null>(null);
  useEffect(() => {
    void loadPhoto(photoKey(tattooId, `s-${session.id}`)).then(setImg);
  }, [tattooId, session.id]);
  return (
    <li className="space-y-2">
      <p className="text-sm font-medium">
        Sitzung {index} · {session.status}
      </p>
      {img ? <img src={img} alt="" className="max-h-48 w-full rounded-xl object-cover" /> : null}
      <PhotoInput
        label="Foto zu dieser Sitzung"
        onReady={async (url) => {
          try {
            await savePhotoForTattoo(tattooId, `s-${session.id}`, url, unlimited);
            await upsertSession({ data: { ...session, status: "erledigt" } });
            onChange();
          } catch {
            /* limit or store error surfaces via next reload */
          }
        }}
      />
    </li>
  );
}

function JournalTab({
  tattoo,
  sessions,
  onSave,
}: {
  tattoo: TattooRecord;
  sessions: TattooSession[];
  onSave: (t: TattooRecord) => Promise<void>;
}) {
  const [why, setWhy] = useState(tattoo.journalWhy);
  const [w, setW] = useState(tattoo.widthCm);
  const [h, setH] = useState(tattoo.heightCm);
  const spent = sessions.reduce((s, x) => s + (x.costCents ?? 0), 0);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Persönliche digitale Notizen – nicht die Praxisakte.</p>
      <div>
        <Label htmlFor="why">Warum entferne ich dieses Tattoo?</Label>
        <Textarea id="why" className="mt-2" value={why} onChange={(e) => setWhy(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="jw">Breite cm</Label>
          <Input id="jw" className="mt-2" value={w} onChange={(e) => setW(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="jh">Höhe cm</Label>
          <Input id="jh" className="mt-2" value={h} onChange={(e) => setH(e.target.value)} />
        </div>
      </div>
      <Button
        className="min-h-12 w-full rounded-xl"
        onClick={() => void onSave({ ...tattoo, journalWhy: why, widthCm: w, heightCm: h })}
      >
        Notiz speichern
      </Button>
      <ul className="space-y-2 text-sm">
        <li className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
          Sitzungen: {sessions.length} · erfasst {euro(spent)}
        </li>
        {sessions.map((s) => (
          <li key={s.id} className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
            <p className="font-medium">{s.title}</p>
            <p className="text-muted-foreground">
              {s.date || "ohne Datum"} · {s.studio || "Studio offen"}
            </p>
            {s.notes ? <p className="mt-1">{s.notes}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SimTab({
  tattooId,
  basePhoto,
  unlimited,
  onChange,
}: {
  tattooId: string;
  basePhoto: string | null;
  unlimited: boolean;
  onChange: () => void;
}) {
  const [local, setLocal] = useState<string | null>(basePhoto);
  const [frames, setFrames] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLocal(basePhoto);
  }, [basePhoto]);

  async function run() {
    if (!local) {
      setErr("Bitte zuerst ein Foto laden.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const f = [
        local,
        await simulateFade(local, 0.28),
        await simulateFade(local, 0.52),
        await simulateFade(local, 0.78),
      ];
      setFrames(f);
    } catch {
      setErr("Simulation fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-muted p-4 text-sm">
        Visuelle Simulation – tatsächliche Ergebnisse können deutlich abweichen. Keine Garantie.
        Die Aufhellung wird lokal aus deinem Foto gerechnet, nicht als Behandlungsvorhersage.
      </p>
      {local ? (
        <img src={local} alt="" className="max-h-48 w-full rounded-xl object-cover" />
      ) : (
        <p className="text-sm text-muted-foreground">Noch kein Foto für die Simulation.</p>
      )}
      <PhotoInput
        label="Foto für Simulation"
        onReady={async (url) => {
          try {
            await savePhotoForTattoo(tattooId, "base", url, unlimited);
            setLocal(url);
            setFrames([]);
            onChange();
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Foto nicht gespeichert.");
          }
        }}
      />
      <Button className="min-h-12 w-full rounded-xl" disabled={busy} onClick={() => void run()}>
        {busy ? "Rechnet…" : "Simulation anzeigen"}
      </Button>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      {frames.length ? (
        <>
          <BeforeAfter before={frames[0]} after={frames[3]} afterLabel="Stärkere Aufhellung" />
          <div className="grid grid-cols-2 gap-2">
            {["Aktuell", "Mögliche Aufhellung", "Weitere Sitzungen", "Stärkere Aufhellung"].map(
              (cap, i) => (
                <figure key={cap} className="overflow-hidden rounded-xl bg-card">
                  <img src={frames[i]} alt="" className="aspect-square w-full object-cover" />
                  <figcaption className="px-2 py-2 text-xs text-muted-foreground">{cap}</figcaption>
                </figure>
              ),
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="mt-0.5">{v}</dd>
    </div>
  );
}
