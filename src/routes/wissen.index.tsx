import { createFileRoute, Link } from "@tanstack/react-router";
import { SourceTag } from "@/components/source-tag";
import { PageIntro } from "@/components/page-intro";
import { PhotoTile } from "@/components/photo-tile";
import { ARTICLES } from "@/lib/wissen";
import { ARTICLE_COVER } from "@/lib/covers";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/wissen/")({
  component: WissenIndex,
  head: () => ({ meta: [{ title: "Wissen · ENDLICH OHNE" }] }),
});

function WissenIndex() {
  const { t } = useI18n();
  const [featured, ...rest] = ARTICLES;
  return (
    <div className="fade-up space-y-6">
      <PageIntro tag={<SourceTag kind="allgemein" />} kicker={t("wissen.kicker2")} title={t("wissen.title")}>
        {t("wissen.lead")}
      </PageIntro>

      {featured ? (
        <Link to="/wissen/$slug" params={{ slug: featured.slug }}>
          <PhotoTile
            img={ARTICLE_COVER[featured.slug] ?? "/images/tattoo.webp"}
            title={featured.title}
            hint={featured.teaser}
            imgClass="h-52"
          />
        </Link>
      ) : null}

      <ul className="grid gap-2 md:grid-cols-2">
        {rest.map((a) => (
          <li key={a.slug}>
            <Link
              to="/wissen/$slug"
              params={{ slug: a.slug }}
              className="flex gap-3 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]"
            >
              <img
                src={ARTICLE_COVER[a.slug] ?? "/images/tattoo.webp"}
                alt=""
                className="h-24 w-24 shrink-0 object-cover"
              />
              <span className="flex flex-col justify-center py-3 pr-3">
                <span className="font-medium">{a.title}</span>
                <span className="mt-1 text-sm text-muted-foreground">{a.teaser}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
