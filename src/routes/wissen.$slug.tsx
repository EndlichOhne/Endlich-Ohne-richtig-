import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SourceTag } from "@/components/source-tag";
import { Disclaimer } from "@/components/disclaimer";
import { findArticle } from "@/lib/wissen";
import { ARTICLE_COVER } from "@/lib/covers";

export const Route = createFileRoute("/wissen/$slug")({
  component: WissenArticle,
});

function WissenArticle() {
  const { slug } = Route.useParams();
  const a = findArticle(slug);
  if (!a) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl">Beitrag nicht gefunden</h1>
        <Button asChild className="rounded-xl">
          <Link to="/wissen">Zum Wissen</Link>
        </Button>
      </div>
    );
  }
  return (
    <article className="fade-up space-y-5">
      <img
        src={ARTICLE_COVER[a.slug] ?? "/images/tattoo.webp"}
        alt=""
        className="h-52 w-full rounded-2xl object-cover md:h-80"
      />
      <SourceTag kind="allgemein" />
      <h1 className="font-display text-4xl">{a.title}</h1>
      {a.body.map((p) => (
        <p key={p} className="text-sm leading-relaxed text-muted-foreground">
          {p}
        </p>
      ))}
      <Disclaimer compact />
      <Link
        to="/wissen"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary"
      >
        Alle Themen
      </Link>
    </article>
  );
}
