import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/lib/consent-store";
import { SmartImg } from "@/components/smart-img";

const SCREENS = [
  {
    kicker: "01",
    title: "Verstehe deine Möglichkeiten.",
    text: "Tattoo, PMU, Microblading oder Aufhellung – sachlich erklärt, ohne Heilversprechen.",
    img: "/images/tattoo.webp",
  },
  {
    kicker: "02",
    title: "Vergleiche Aufwand, Kosten und Anbieter.",
    text: "Richtwerte und algorithmische Spannen. Verbindlich wird es erst in der Beratung vor Ort.",
    img: "/images/praxis-hq.webp",
  },
  {
    kicker: "03",
    title: "Triff informierte Entscheidungen.",
    text: "Konto für Planer und Belege. Check bleibt auf dem Gerät. Risiken und Einwilligungen bleiben sichtbar.",
    img: "/images/portrait.webp",
  },
];

export function Onboarding() {
  const { consent, accepted, finishOnboarding } = useConsent();
  const [i, setI] = useState(0);
  if (!accepted || consent.onboardingDone) return null;
  const screen = SCREENS[i];
  const last = i === SCREENS.length - 1;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-hero text-hero-foreground">
      <SmartImg
        src={screen.img}
        alt=""
        className="kenburns absolute inset-0 size-full"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-hero via-hero/70 to-hero/25" />
      <div className="relative flex min-h-dvh flex-col safe-pad">
        <img
          src="/brand/logo-white.svg"
          alt="ENDLICH OHNE"
          className="h-8 w-auto self-start"
        />
        <p className="kicker mt-auto text-accent">{screen.kicker} / 03</p>
        <h1 className="mt-4 max-w-lg font-display text-4xl md:text-5xl">
          {screen.title}
        </h1>
        <p className="mt-4 max-w-lg text-base text-hero-foreground/80">
          {screen.text}
        </p>
        <div className="mt-8 flex gap-2">
          {SCREENS.map((_, idx) => (
            <span
              key={idx}
              className={
                idx === i
                  ? "h-1 flex-1 rounded-full bg-accent"
                  : "h-1 flex-1 rounded-full bg-hero-foreground/20"
              }
            />
          ))}
        </div>
        <div className="mt-8 flex gap-3">
          {!last ? (
            <Button
              variant="ghost"
              className="min-h-12 flex-1 rounded-xl text-hero-foreground hover:bg-hero-foreground/10"
              onClick={finishOnboarding}
            >
              Überspringen
            </Button>
          ) : null}
          <Button
            className="min-h-12 flex-1 rounded-xl"
            onClick={() => (last ? finishOnboarding() : setI(i + 1))}
          >
            {last ? "Los geht’s" : "Weiter"}
          </Button>
        </div>
      </div>
    </div>
  );
}
