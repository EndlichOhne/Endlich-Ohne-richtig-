import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Monitor, Share, Smartphone, SquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/page-intro";
import { BRAND } from "@/lib/brand";
import { STORE } from "@/lib/store";
import { detectPlatform, isStandalone } from "@/lib/device";
import type { BeforeInstallPromptEvent } from "@/lib/install";

export const Route = createFileRoute("/installieren")({
  component: InstallPage,
  head: () => ({ meta: [{ title: `App installieren · ${BRAND.name}` }] }),
});

function InstallPage() {
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">(
    "desktop",
  );
  const [standalone, setStandalone] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    setPlatform(detectPlatform());
    setStandalone(isStandalone());
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const installNative = async () => {
    if (!deferred) return;
    await deferred.prompt();
    setDeferred(null);
  };

  return (
    <div className="fade-up space-y-8">
      <PageIntro kicker="Alle Geräte" title="App aufs Handy">
        ENDLICH OHNE läuft auf iPhone, iPad, Android und am Computer. Du
        installierst sie über Safari oder Chrome auf den Startbildschirm. Check,
        Planer und 3D brauchen ein Konto. Der native App-Store-Eintrag der Praxis
        folgt über das Entwicklerkonto; die Texte liegen als Entwurf bereit.
      </PageIntro>

      {standalone ? (
        <p className="rounded-2xl bg-muted p-4 text-sm">
          Diese App ist auf diesem Gerät bereits installiert.
        </p>
      ) : null}

      {deferred ? (
        <Button
          className="min-h-12 w-full rounded-xl"
          onClick={() => void installNative()}
        >
          Jetzt installieren
        </Button>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-2xl">
          {platform === "ios"
            ? "iPhone und iPad"
            : platform === "android"
              ? "Android"
              : "So geht’s auf deinem Gerät"}
        </h2>
        {platform === "ios" ? <IosSteps /> : null}
        {platform === "android" ? <AndroidSteps /> : null}
        {platform === "desktop" ? (
          <div className="space-y-6">
            <IosSteps />
            <AndroidSteps />
            <DesktopSteps />
          </div>
        ) : null}
      </section>

      {platform !== "desktop" ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Andere Geräte</h2>
          {platform === "ios" ? <AndroidSteps /> : <IosSteps />}
          <DesktopSteps />
        </section>
      ) : null}

      <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="kicker text-primary">Stores</p>
        <h2 className="mt-2 font-display text-2xl">App Store und Play</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Name: {STORE.name}. Untertitel: {STORE.subtitle}. Einreichung nur durch
          die Praxis (Apple- und Google-Entwicklerkonto, Prüfung der Rechtstexte).
          Bis dahin ist die installierbare Web-App der offizielle Weg auf jedes
          Handy.
        </p>
        <img
          src={BRAND.profile}
          alt="App-Symbol ENDLICH OHNE"
          className="mt-4 size-20 rounded-2xl object-cover shadow-[var(--shadow-border)]"
          width={1024}
          height={1024}
        />
      </section>
    </div>
  );
}

function IosSteps() {
  return (
    <ol className="space-y-2 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
      <Step n={1} icon={Smartphone} t="In Safari öffnen">
        Chrome auf dem iPhone kann nicht auf den Home-Bildschirm legen. Safari
        nutzen.
      </Step>
      <Step n={2} icon={Share} t="Teilen-Symbol">
        Unten in der Mitte (Quadrat mit Pfeil nach oben).
      </Step>
      <Step n={3} icon={SquarePlus} t="Zum Home-Bildschirm">
        Nach unten scrollen, tippen, hinzufügen. Das Symbol erscheint neben den
        anderen Apps.
      </Step>
    </ol>
  );
}

function AndroidSteps() {
  return (
    <ol className="space-y-2 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
      <Step n={1} icon={Smartphone} t="Chrome oder Samsung Internet">
        Menü oben rechts (drei Punkte).
      </Step>
      <Step n={2} icon={SquarePlus} t="App installieren">
        „App installieren“ oder „Zum Startbildschirm hinzufügen“. Bestätigen.
      </Step>
      <Step n={3} icon={Check} t="Wie eine App öffnen">
        Das Symbol liegt im App-Drawer. Volle Breite, ohne Browserleiste.
      </Step>
    </ol>
  );
}

function DesktopSteps() {
  return (
    <ol className="space-y-2 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
      <Step n={1} icon={Monitor} t="Chrome, Edge oder Safari">
        In der Adressleiste das Installieren-Symbol oder Datei → Zum Dock.
      </Step>
      <Step n={2} icon={Check} t="Eigene Fenster-App">
        Startet ohne Browser-Tabs, mit dem ENDLICH-OHNE-Symbol.
      </Step>
    </ol>
  );
}

function Step({
  n,
  icon: Icon,
  t,
  children,
}: {
  n: number;
  icon: typeof Check;
  t: string;
  children: string;
}) {
  return (
    <li className="flex gap-3 py-2">
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block font-medium">
          {n}. {t}
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {children}
        </span>
      </span>
    </li>
  );
}
