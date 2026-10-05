import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageIntro } from "@/components/page-intro";
import { Disclaimer } from "@/components/disclaimer";
import { RequireAuth } from "@/components/require-auth";
import { BRAND } from "@/lib/brand";
import { newId, REMINDER_KIND_LABEL, isOverdue, type TattooRecord, type TattooReminder } from "@/lib/tattoo";
import { deleteReminder, listReminders, listTattoos, upsertReminder } from "@/lib/tattoo-api";

export const Route = createFileRoute("/erinnerungen")({
  component: ErinnerungenPage,
  head: () => ({ meta: [{ title: `Erinnerungen · ${BRAND.name}` }] }),
});

const KINDS = [
  { id: "sitzung", label: "Nächste Sitzung" },
  { id: "foto", label: "Foto für Vergleich" },
  { id: "fortschritt", label: "Fortschritt aktualisieren" },
  { id: "studio", label: "Studio kontaktieren" },
  { id: "notiz", label: "Eigene Notiz" },
] as const;

function ErinnerungenPage() {
  return (
    <RequireAuth>
      <ErinnerungenInner />
    </RequireAuth>
  );
}

function ErinnerungenInner() {
  const [rows, setRows] = useState<TattooReminder[]>([]);
  const [tattoos, setTattoos] = useState<TattooRecord[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [kind, setKind] = useState("sitzung");
  const [tattooId, setTattooId] = useState("");

  async function reload() {
    const [r, t] = await Promise.all([listReminders(), listTattoos()]);
    setRows(r);
    setTattoos(t);
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <div className="fade-up space-y-6">
      <PageIntro kicker="Organisation" title="Erinnerungen">
        Eigene Termine und Foto-Erinnerungen. Keine medizinisch verbindlichen
        Behandlungsintervalle.
      </PageIntro>
      <ul className="space-y-2">
        {rows.length === 0 ? (
          <li className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Noch keine Erinnerung.</li>
        ) : (
          rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]"
            >
              <div>
                <p className={r.done ? "text-muted-foreground line-through" : "font-medium"}>{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {r.dueDate || "ohne Datum"}
                  {isOverdue(r.dueDate, r.done) ? " · überfällig" : ""} ·{" "}
                  {REMINDER_KIND_LABEL[r.kind] ?? r.kind}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() =>
                    void upsertReminder({ data: { ...r, done: !r.done } }).then(reload)
                  }
                >
                  {r.done ? "Offen" : "Erledigt"}
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => void deleteReminder({ data: { id: r.id } }).then(reload)}
                >
                  Weg
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
      <form
        className="space-y-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          void upsertReminder({
            data: {
              id: newId("r"),
              tattooId: tattooId || undefined,
              title: title.trim(),
              dueDate: due,
              kind,
              done: false,
              createdAt: new Date().toISOString(),
            },
          }).then(() => {
            setTitle("");
            reload();
          });
        }}
      >
        <p className="font-medium">Neue Erinnerung</p>
        <div>
          <Label htmlFor="rt">Titel</Label>
          <Input id="rt" className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="rd">Datum</Label>
          <Input id="rd" type="date" className="mt-2" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        {tattoos.length ? (
          <div>
            <Label htmlFor="rtat">Tattoo (optional)</Label>
            <select
              id="rtat"
              className="mt-2 h-11 w-full rounded-lg bg-muted px-3"
              value={tattooId}
              onChange={(e) => setTattooId(e.target.value)}
            >
              <option value="">keines</option>
              {tattoos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <Label htmlFor="rk">Art</Label>
          <select
            id="rk"
            className="mt-2 h-11 w-full rounded-lg bg-muted px-3"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <Button className="min-h-12 w-full rounded-xl">Speichern</Button>
      </form>
      <Disclaimer compact />
    </div>
  );
}
