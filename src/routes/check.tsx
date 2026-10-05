import { useEffect, useRef, useState, type ReactNode, lazy, Suspense } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Choice, ChoiceGrid } from "@/components/choice-grid";
import { SourceTag } from "@/components/source-tag";
import { PhotoTile } from "@/components/photo-tile";
import { RequireAuth } from "@/components/require-auth";

const BodyExplorer = lazy(() =>
  import("@/components/body-scene").then((m) => ({ default: m.BodyExplorer })),
);
import { COLOR_TONE, KIND_IMG } from "@/lib/covers";
import { cn } from "@/lib/utils";
import {
  AGE_LABEL,
  COLORS,
  EMPTY_CHECK,
  KIND_LABEL,
  ORIGIN_LABEL,
  REGION_LABEL,
  SIZE_LABEL,
  loadCheck,
  saveCheck,
  type Age,
  type CheckAnswers,
  type Kind,
  type Origin,
  type Region,
  type Size,
} from "@/lib/check";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/check")({
  component: CheckPage,
  head: () => ({ meta: [{ title: "Check · ENDLICH OHNE" }] }),
});

const STEPS = 7;
const KINDS = Object.keys(KIND_LABEL) as Kind[];

function CheckPage() {
  return (
    <RequireAuth>
      <CheckInner />
    </RequireAuth>
  );
}

function CheckInner() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [a, setA] = useState<CheckAnswers>(EMPTY_CHECK);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const photoRef = useRef<string | null>(null);

  useEffect(() => {
    setA(loadCheck());
  }, []);

  useEffect(() => {
    photoRef.current = photoUrl;
  }, [photoUrl]);

  useEffect(() => {
    return () => {
      if (photoRef.current) URL.revokeObjectURL(photoRef.current);
      document.body.style.cursor = "";
    };
  }, []);

  function patch(p: Partial<CheckAnswers>) {
    setA((cur) => {
      const next = { ...cur, ...p };
      saveCheck(next);
      return next;
    });
  }

  const canNext =
    (step === 1 && a.kind) ||
    (step === 2 && a.size) ||
    (step === 3 && a.colors.length > 0) ||
    (step === 4 && a.age) ||
    (step === 5 && a.origin) ||
    (step === 6 && a.region) ||
    step === 7;

  return (
    <div className="fade-up space-y-6">
      <div className="flex items-center justify-between">
        <p className="kicker text-primary">
          {t("home.step", { n: `${step} / ${STEPS}` })}
        </p>
        <SourceTag kind="nutzer" />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: STEPS }, (_, i) => (
          <span
            key={i}
            className={
              i < step ? "h-1 flex-1 rounded-full bg-primary" : "h-1 flex-1 rounded-full bg-muted"
            }
          />
        ))}
      </div>

      {step === 1 && (
        <Block title={t("check.what")}>
          <div className="grid grid-cols-2 gap-3">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={a.kind === k}
                onClick={() => patch({ kind: k })}
                className={cn(
                  "rounded-2xl text-left",
                  a.kind === k && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <PhotoTile img={KIND_IMG[k]} title={t(`kind.${k}`)} hint={t(`hint.${k}`)} />
              </button>
            ))}
          </div>
        </Block>
      )}

      {step === 2 && (
        <Block title={t("check.sizeQ")}>
          <ChoiceGrid>
            {(Object.keys(SIZE_LABEL) as Size[]).map((k) => (
              <Choice key={k} selected={a.size === k} onClick={() => patch({ size: k })}>
                {t(`size.${k}`)}
              </Choice>
            ))}
          </ChoiceGrid>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="w">{t("check.width")}</Label>
              <Input
                id="w"
                className="mt-2"
                inputMode="decimal"
                value={a.widthCm}
                onChange={(e) => patch({ widthCm: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="h">{t("check.height")}</Label>
              <Input
                id="h"
                className="mt-2"
                inputMode="decimal"
                value={a.heightCm}
                onChange={(e) => patch({ heightCm: e.target.value })}
              />
            </div>
          </div>
        </Block>
      )}

      {step === 3 && (
        <Block title={t("check.colorsQ")}>
          <p className="text-sm text-muted-foreground">{t("check.multi")}</p>
          <ChoiceGrid className="mt-3">
            {COLORS.map((c) => {
              const on = a.colors.includes(c);
              return (
                <Choice
                  key={c}
                  selected={on}
                  onClick={() =>
                    patch({
                      colors: on
                        ? a.colors.filter((x) => x !== c)
                        : [...a.colors, c],
                    })
                  }
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("swatch", COLOR_TONE[c] ?? "bg-ink-other")} />
                    {t(`color.${c}`)}
                  </span>
                </Choice>
              );
            })}
          </ChoiceGrid>
        </Block>
      )}

      {step === 4 && (
        <Block title={t("check.age")}>
          <ChoiceGrid>
            {(Object.keys(AGE_LABEL) as Age[]).map((k) => (
              <Choice key={k} selected={a.age === k} onClick={() => patch({ age: k })}>
                {t(`age.${k}`)}
              </Choice>
            ))}
          </ChoiceGrid>
        </Block>
      )}

      {step === 5 && (
        <Block title={t("check.origin")}>
          <ChoiceGrid>
            {(Object.keys(ORIGIN_LABEL) as Origin[]).map((k) => (
              <Choice
                key={k}
                selected={a.origin === k}
                onClick={() => patch({ origin: k })}
              >
                {t(`origin.${k}`)}
              </Choice>
            ))}
          </ChoiceGrid>
        </Block>
      )}

      {step === 6 && (
        <Block title={t("check.region")}>
          <Suspense fallback={<div className="mb-4 h-[22rem] rounded-2xl bg-hero" />}>
            <BodyExplorer
              selected={a.region}
              onSelect={(region) => patch({ region })}
              className="mb-4"
            />
          </Suspense>
          <ChoiceGrid>
            {(Object.keys(REGION_LABEL) as Region[]).map((k) => (
              <Choice
                key={k}
                selected={a.region === k}
                onClick={() => patch({ region: k })}
              >
                {t(`region.${k}`)}
              </Choice>
            ))}
          </ChoiceGrid>
        </Block>
      )}

      {step === 7 && (
        <Block title="Foto (optional, nur lokal)">
          <p className="text-sm text-muted-foreground">
            Das Foto ersetzt keine professionelle Untersuchung oder Beratung.
            Eine automatische Einschätzung kann ungenau sein. Es wird nicht
            hochgeladen, nicht gespeichert und nicht für KI-Training genutzt.
          </p>
          <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-card px-4 text-sm font-medium shadow-[var(--shadow-border)]">
            Foto wählen
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPhotoErr(null);
                if (!file) return;
                if (file.size > 8 * 1024 * 1024) {
                  setPhotoErr("Foto zu groß (max. 8 MB).");
                  return;
                }
                if (!file.type.startsWith("image/")) {
                  setPhotoErr("Dieses Format wird nicht unterstützt.");
                  return;
                }
                if (photoUrl) URL.revokeObjectURL(photoUrl);
                setPhotoUrl(URL.createObjectURL(file));
                patch({ photoNoteAck: true });
              }}
            />
          </label>
          {photoErr ? (
            <p className="mt-2 text-sm text-destructive">{photoErr}</p>
          ) : null}
          {photoUrl ? (
            <div className="mt-4 space-y-3">
              <img
                src={photoUrl}
                alt="Vorschau, nur auf diesem Gerät"
                className="max-h-56 w-full rounded-xl object-cover"
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  URL.revokeObjectURL(photoUrl);
                  setPhotoUrl(null);
                }}
              >
                Foto sofort verwerfen
              </Button>
            </div>
          ) : null}
        </Block>
      )}

      <div className="flex gap-3 pt-2">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-12 flex-1 rounded-xl"
            onClick={() => setStep(step - 1)}
          >
            Zurück
          </Button>
        ) : null}
        <Button
          type="button"
          className="min-h-12 flex-1 rounded-xl"
          disabled={!canNext}
          onClick={() => {
            if (step < STEPS) setStep(step + 1);
            else void navigate({ to: "/ergebnis" });
          }}
        >
          {step < STEPS ? "Weiter" : "Einschätzung anzeigen"}
        </Button>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h1 className="font-display text-3xl">{title}</h1>
      <div className="mt-5 space-y-3">{children}</div>
    </section>
  );
}
