import type { ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function AppError({ error, reset }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : "Unbekannter Fehler";
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-lg flex-col justify-center gap-4 px-5 py-16">
      <p className="kicker text-primary">Störung</p>
      <h1 className="font-display text-3xl">Etwas ist schiefgelaufen</h1>
      <p className="text-sm text-muted-foreground">
        Die Ansicht hat nicht geladen. Deine Daten auf dem Gerät bleiben erhalten.
        Bitte erneut versuchen.
      </p>
      <p className="truncate text-xs text-muted-foreground">{message}</p>
      <Button className="min-h-12 rounded-xl" onClick={reset}>
        Erneut versuchen
      </Button>
    </div>
  );
}

export function AppNotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-lg flex-col justify-center gap-4 px-5 py-16">
      <p className="kicker text-primary">404</p>
      <h1 className="font-display text-3xl">Seite nicht gefunden</h1>
      <p className="text-sm text-muted-foreground">
        Dieser Pfad gehört nicht zur App. Zurück zur Startseite.
      </p>
      <Button asChild className="min-h-12 rounded-xl">
        <a href="/">Zur Startseite</a>
      </Button>
    </div>
  );
}
