import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageIntro } from "@/components/page-intro";
import { Disclaimer } from "@/components/disclaimer";
import { SourceTag } from "@/components/source-tag";
import { RequireAuth } from "@/components/require-auth";
import { KiStatus } from "@/components/ki-status";
import { BRAND } from "@/lib/brand";
import { askTattooAi, getKiStatus } from "@/lib/ai-tattoo";
import { FREE_LIMITS, isLimitError } from "@/lib/premium";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/assistent")({
  component: AssistentPage,
  head: () => ({ meta: [{ title: `Online-KI · ${BRAND.name}` }] }),
});

const CHAT_KEY = "eo-ai-chat";

const STARTERS = [
  "Quali fattori influenzano il numero di sedute?",
  "Perché la rimozione può durare tempi diversi?",
  "Cosa dovrei chiedere a chi mi tratta?",
  "Come documento i progressi in modo utile?",
];

type Msg = { role: "user" | "assistant"; content: string; via?: "ki" | "guide" };

function showText(s: string) {
  return s.replace(/\*\*(.*?)\*\*/g, "$1");
}

function loadChat(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    const v = raw ? (JSON.parse(raw) as Msg[]) : [];
    return Array.isArray(v) ? v.slice(-16) : [];
  } catch {
    return [];
  }
}

function AssistentPage() {
  return (
    <RequireAuth>
      <AssistentInner />
    </RequireAuth>
  );
}

function AssistentInner() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [ready, setReady] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<{ chats: number; isPro?: boolean } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(loadChat());
    setReady(true);
    void getKiStatus()
      .then((s) => {
        setOnline(s.online);
        setUsage({ chats: s.chats, isPro: s.isPro });
      })
      .catch(() => setOnline(false));
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-16)));
  }, [messages, ready]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, busy]);

  async function send(prompt: string) {
    const q = prompt.trim();
    if (!q || busy) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErr("Keine Internetverbindung. Bitte später erneut versuchen.");
      return;
    }
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setText("");
    setBusy(true);
    setErr(null);
    try {
      const res = await askTattooAi({ data: { messages: next } });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOnline(res.via === "ki");
      if (res.via === "ki") {
        setUsage((u) => (u ? { ...u, chats: u.chats + 1 } : u));
      }
      setMessages([
        ...next,
        { role: "assistant", content: res.text, via: res.via },
      ]);
    } catch {
      setErr("Die Online-KI ist gerade nicht erreichbar. Bitte erneut senden.");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => boxRef.current?.focus());
    }
  }

  return (
    <div className="fade-up space-y-6 pb-24">
      <PageIntro
        tag={<KiStatus online={online} />}
        kicker={t("assistant.title")}
        title={t("home.kiTitle")}
      >
        {t("home.kiLead")}
      </PageIntro>

      {usage?.isPro ? (
        <p className="text-xs text-muted-foreground">PRO · unbegrenzte Online-Fragen.</p>
      ) : usage ? (
        <p className="text-xs text-muted-foreground">
          {usage.chats}/{FREE_LIMITS.chatsPerMonth} Online-Fragen diesen Monat.
        </p>
      ) : null}

      <div className="grid gap-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            className="min-h-11 rounded-xl bg-card px-4 py-2 text-left text-sm shadow-[var(--shadow-border)] disabled:opacity-50"
            onClick={() => void send(s)}
            disabled={busy}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="space-y-3" role="log" aria-live="polite">
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}`} className="space-y-1">
            {m.role === "assistant" && m.via === "guide" ? (
              <SourceTag kind="allgemein" />
            ) : null}
            {m.role === "assistant" && m.via === "ki" ? <SourceTag kind="ki" /> : null}
            <div
              className={
                m.role === "user"
                  ? "whitespace-pre-wrap rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"
                  : "whitespace-pre-wrap rounded-2xl bg-card px-4 py-3 text-sm shadow-[var(--shadow-border)]"
              }
            >
              {showText(m.content)}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground shadow-[var(--shadow-border)]">
            <span className="size-2 animate-pulse rounded-full bg-accent" />
            {t("assistant.send")}…
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      {err && isLimitError(err) ? (
        <Button asChild variant="outline" className="min-h-12 w-full rounded-xl">
          <Link to="/pro">PRO ansehen</Link>
        </Button>
      ) : null}
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <Textarea
          ref={boxRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(text);
            }
          }}
          placeholder={t("assistant.placeholder")}
          className="min-h-24"
        />
        <Button className="min-h-12 w-full rounded-xl" disabled={busy || !text.trim()}>
          {busy ? `${t("assistant.send")}…` : t("assistant.send")}
        </Button>
      </form>
      {messages.length ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-12 w-full rounded-xl"
          onClick={() => {
            setMessages([]);
            localStorage.removeItem(CHAT_KEY);
          }}
        >
          {t("mehr.signOut")}
        </Button>
      ) : null}
      <Disclaimer compact />
    </div>
  );
}
