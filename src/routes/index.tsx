import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Disclaimer } from "@/components/disclaimer";
import { SourceTag } from "@/components/source-tag";
import { PhotoTile } from "@/components/photo-tile";
import { HeroPhoto, SmartImg } from "@/components/smart-img";
import { ProTeaser } from "@/components/pro-teaser";
import { PreviewPromo } from "@/components/preview-promo";
import { BRAND } from "@/lib/brand";
import { PROVIDERS } from "@/lib/providers";
import { KIND_IMG } from "@/lib/covers";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({ meta: [{ title: BRAND.name }] }),
});

const KINDS = [
  { to: "/check" as const, key: "tattoo" as const },
  { to: "/check" as const, key: "pmu" as const },
  { to: "/check" as const, key: "microblading" as const },
  { to: "/check" as const, key: "coverup" as const },
];

function Home() {
  const { t } = useI18n();
  const STEPS = [
    { n: "01", t: t("home.step1.t"), d: t("home.step1.d"), img: "/images/laser-hq.webp" },
    { n: "02", t: t("home.step2.t"), d: t("home.step2.d"), img: "/images/tattoo.webp" },
    { n: "03", t: t("home.step3.t"), d: t("home.step3.d"), img: "/images/step-3.webp" },
    { n: "04", t: t("home.step4.t"), d: t("home.step4.d"), img: "/images/praxis-hq.webp" },
  ];
  const STRIP = [
    { src: "/images/praxis-hq.webp", cap: t("home.strip.praxis") },
    { src: "/images/laser-hq.webp", cap: t("home.strip.laser") },
    { src: "/images/tattoo-ba.webp", cap: t("home.strip.tattoo") },
    { src: "/images/pmu-ba.webp", cap: t("home.strip.pmu") },
  ];
  const FAQ = [1, 2, 3, 4, 5, 6].map((n) => ({
    q: t(`home.faq${n}.q`),
    a: t(`home.faq${n}.a`),
  }));
  const KIND_LABEL = {
    tattoo: t("home.kind.tattoo"),
    pmu: t("home.kind.pmu"),
    microblading: t("home.kind.microblading"),
    coverup: t("home.kind.coverup"),
  } as const;
  const KIND_HINT_L = {
    tattoo: t("hint.tattoo"),
    pmu: t("hint.pmu"),
    microblading: t("hint.microblading"),
    coverup: t("hint.coverup"),
  } as const;
  return (
    <div className="pb-4">
      <section className="relative isolate flex min-h-hero flex-col justify-end overflow-hidden bg-hero text-hero-foreground">
        <HeroPhoto />
        <div className="absolute inset-0 bg-gradient-to-t from-hero via-hero/55 to-hero/15" />
        <div className="relative page-pad safe-top pb-10 pt-8 md:pb-14">
          <img
            src="/brand/logo-white.svg"
            alt="ENDLICH OHNE"
            className="h-10 w-auto self-start md:h-12"
          />
          <p className="kicker mt-10 text-accent md:mt-16">{t("brand.tagline")}</p>
          <h1 className="mt-3 max-w-sm font-display text-4xl leading-tight md:max-w-2xl md:text-6xl">
            {t("brand.hero")}
          </h1>
          <p className="mt-4 max-w-sm text-sm text-hero-foreground/80 md:max-w-xl md:text-base">
            {t("home.lead")}
          </p>
          <div className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="min-h-12 flex-1 rounded-xl">
              <Link to="/vorschau">{t("home.previewCta")}</Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="min-h-12 flex-1 rounded-xl bg-hero-foreground text-hero hover:bg-hero-foreground/90"
            >
              <Link to="/check">{t("home.start")}</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="min-h-12 rounded-xl text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground">
              <Link to="/anbieter">{t("home.find")}</Link>
            </Button>
          </div>
          <SignedOut>
            <p className="mt-4 max-w-xl text-xs text-hero-foreground/70">
              {t("home.needAccount")}{" "}
              <Link to="/login" className="underline">
                {t("home.signIn")}
              </Link>
              . {t("home.stayLocal")}
            </p>
          </SignedOut>
          <SignedIn>
            <p className="mt-4 max-w-xl text-xs text-hero-foreground/70">
              {t("home.signedIn")}
            </p>
          </SignedIn>
        </div>
      </section>

      <div className="space-y-14 page-pad pt-12 md:space-y-20">
        <section className="fade-up grid grid-cols-3 gap-2 md:gap-4">
          <Stat n={`${PROVIDERS.length}`} l={t("home.statSites")} />
          <Stat n={t("home.statMed")} l={t("home.statLed")} />
          <Stat n={t("home.statWithout")} l={t("home.statPromise")} />
        </section>

        <ProTeaser />

        <PreviewPromo />

        <section className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
          <div className="grid md:grid-cols-2">
            <img
              src="/gallery/geo-after.webp"
              alt=""
              width={720}
              height={900}
              className="h-52 w-full object-cover md:h-full"
              loading="lazy"
              decoding="async"
            />
            <div className="flex flex-col justify-center p-5 md:p-8">
              <p className="kicker text-primary">{t("home.galleryKicker")}</p>
              <h2 className="mt-2 font-display text-2xl md:text-3xl">
                {t("home.galleryTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("home.galleryLead")}
              </p>
              <Button asChild className="mt-5 min-h-12 w-full rounded-xl sm:w-auto">
                <Link to="/ergebnisse">{t("home.galleryCta")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <SignedOut>
          <section className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="kicker text-primary">{t("home.accountKicker")}</p>
              <h2 className="mt-2 font-display text-2xl">{t("home.accountTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("home.accountLead")}
              </p>
            </div>
            <Button asChild className="min-h-12 shrink-0 rounded-xl">
              <Link to="/login">{t("home.register")}</Link>
            </Button>
          </section>
        </SignedOut>

        <SignedIn>
          <section className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="kicker text-primary">{t("home.akteKicker")}</p>
              <h2 className="mt-2 font-display text-2xl">{t("home.akteTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("home.akteLead")}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:w-48">
              <Button asChild className="min-h-12 rounded-xl">
                <Link to="/vorschau">{t("home.previewCta")}</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-12 rounded-xl">
                <Link to="/akte">{t("home.toAkte")}</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-12 rounded-xl">
                <Link to="/scanner">{t("home.kiScan")}</Link>
              </Button>
            </div>
          </section>
          <section className="flex flex-col gap-4 rounded-2xl bg-hero p-5 text-hero-foreground shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="kicker text-accent">{t("home.kiKicker")}</p>
              <h2 className="mt-2 font-display text-2xl">{t("home.kiTitle")}</h2>
              <p className="mt-2 text-sm text-hero-foreground/75">
                {t("home.kiLead")}
              </p>
            </div>
            <Button asChild className="min-h-12 shrink-0 rounded-xl sm:w-48">
              <Link to="/assistent">{t("home.askNow")}</Link>
            </Button>
          </section>
        </SignedIn>

        <div className="below-fold space-y-14 md:space-y-20">
          <section className="overflow-hidden rounded-2xl bg-hero text-hero-foreground shadow-[var(--shadow-border)]">
            <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="flex flex-col justify-end p-5 md:p-8">
                <p className="kicker text-accent">{t("home.studioKicker")}</p>
                <h2 className="mt-2 font-display text-3xl md:text-4xl">
                  {t("home.studioTitle")}
                </h2>
                <p className="mt-3 text-sm text-hero-foreground/75">
                  {t("home.studioLead")}
                </p>
                <Button asChild className="mt-5 min-h-12 w-full rounded-xl sm:w-auto">
                  <Link to="/koerper">{t("home.mark3d")}</Link>
                </Button>
              </div>
              <Link to="/koerper" className="relative block h-52 md:h-80">
                <SmartImg
                  src="/images/coverup-arm.webp"
                  alt={t("home.mark3d")}
                  className="size-full"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
                <p className="pointer-events-none absolute bottom-3 left-4 right-4 text-xs text-hero-foreground/80">
                  {t("home.genericModel")}
                </p>
              </Link>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="kicker text-primary">{t("home.services")}</p>
                <h2 className="mt-2 font-display text-2xl md:text-3xl">{t("home.treatments")}</h2>
              </div>
              <SourceTag kind="allgemein" />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {KINDS.map((k) => (
                <Link key={k.key} to={k.to}>
                  <PhotoTile
                    img={KIND_IMG[k.key]}
                    title={KIND_LABEL[k.key]}
                    hint={KIND_HINT_L[k.key]}
                  />
                </Link>
              ))}
            </div>
          </section>

          <section>
            <p className="kicker text-primary">{t("home.insight")}</p>
            <h2 className="mt-2 font-display text-2xl md:text-3xl">{t("home.fromPraxis")}</h2>
            <div className="filmstrip mt-4">
              {STRIP.map((s) => (
                <figure key={s.src} className="relative overflow-hidden rounded-2xl">
                  <SmartImg
                    src={s.src}
                    alt=""
                    className="h-52 w-full md:h-72"
                    sizes="(min-width: 1024px) 22rem, (min-width: 768px) 40vw, 78vw"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-hero to-transparent px-4 pb-3 pt-10 text-sm text-hero-foreground">
                    {s.cap}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="kicker text-primary">{t("home.process")}</p>
                <h2 className="mt-2 font-display text-2xl md:text-3xl">{t("home.howLaser")}</h2>
              </div>
              <SourceTag kind="allgemein" />
            </div>
            <ol className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <li
                  key={s.n}
                  className="flex gap-3 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)] md:flex-col"
                >
                  <SmartImg
                    src={s.img}
                    alt=""
                    className="h-24 w-24 shrink-0 md:h-40 md:w-full"
                    sizes="(min-width: 1024px) 16rem, 6rem"
                  />
                  <span className="flex flex-col justify-center py-3 pr-3 md:px-4 md:pb-4">
                    <span className="kicker text-primary">{t("home.step", { n: s.n })}</span>
                    <span className="mt-1 font-medium">{s.t}</span>
                    <span className="mt-0.5 text-sm text-muted-foreground">{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <Link
              to="/wissen/$slug"
              params={{ slug: "ablauf" }}
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
            >
              {t("home.moreWissen")} <ArrowRight className="size-4" />
            </Link>
          </section>

          <section className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)] md:grid md:grid-cols-2">
            <SmartImg
              src="/images/portrait.webp"
              alt="Ärztliche Leitung"
              className="h-72 w-full object-top md:h-full min-h-72"
              sizes="(min-width: 1024px) 36rem, 100vw"
            />
            <div className="p-5 md:flex md:flex-col md:justify-center md:p-8">
              <p className="kicker text-primary">{t("home.branch")}</p>
              <h2 className="mt-2 font-display text-2xl md:text-3xl">{BRAND.praxis}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {BRAND.street}, {BRAND.zip} {BRAND.city}
              </p>
              <Button asChild className="mt-4 min-h-11 rounded-xl">
                <Link to="/anbieter/$slug" params={{ slug: "karlsruhe" }}>
                  {t("home.viewSite")}
                </Link>
              </Button>
            </div>
          </section>

          <section className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="kicker text-primary">{t("home.orient")}</p>
              <h2 className="mt-2 font-display text-2xl md:text-3xl">{t("home.faq")}</h2>
              <Accordion type="single" collapsible className="mt-4">
                {FAQ.map((f) => (
                  <AccordionItem key={f.q} value={f.q}>
                    <AccordionTrigger>{f.q}</AccordionTrigger>
                    <AccordionContent>{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            <div className="space-y-3">
              <SmartImg
                src="/images/medien.webp"
                alt="Bekannt aus Medien"
                className="w-full rounded-2xl object-contain"
                sizes="(min-width: 1024px) 36rem, 100vw"
              />
              <SmartImg
                src="/images/tafel.webp"
                alt="Leistungen ENDLICH OHNE"
                className="w-full rounded-2xl object-contain"
                sizes="(min-width: 1024px) 36rem, 100vw"
              />
            </div>
          </section>

          <section className="rounded-2xl bg-hero p-6 text-hero-foreground md:p-10">
            <p className="kicker text-accent">{t("home.next")}</p>
            <h2 className="mt-2 font-display text-2xl md:text-3xl">
              {t("home.nextTitle")}
            </h2>
            <p className="mt-3 max-w-xl text-sm text-hero-foreground/75">
              {t("home.nextLead")}
            </p>
            <div className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="min-h-12 flex-1 rounded-xl bg-hero-foreground text-hero hover:bg-hero-foreground/90"
              >
                <Link to="/check">{t("home.startCheck")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="min-h-12 flex-1 rounded-xl border-hero-foreground/20 bg-transparent text-hero-foreground hover:bg-hero-foreground/10"
              >
                <Link to="/installieren">
                  <Download className="size-4" />
                  {t("home.appPhone")}
                </Link>
              </Button>
            </div>
          </section>

          <section className="rounded-2xl bg-muted p-5">
            <Disclaimer compact />
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-2xl bg-card px-3 py-4 text-center shadow-[var(--shadow-border)] md:py-6">
      <p className="font-display text-lg text-primary md:text-2xl">{n}</p>
      <p className="mt-1 text-xs text-muted-foreground md:text-sm">{l}</p>
    </div>
  );
}
