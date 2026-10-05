import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { DeskMessage } from "@/components/practice-ui";
import { euro } from "@/lib/practice-desk";
import { listPracticePayments } from "@/lib/practice-api";

export const Route = createFileRoute("/praxis/zahlungen")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof listPracticePayments>>["items"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listPracticePayments()
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Nicht möglich."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DeskMessage loading={loading} error={error} empty={!loading && items.length === 0} emptyText="Keine hinterlegten Zahlungen.">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link to="/praxis/termin/$id" params={{ id: item.id }} className="block rounded-2xl bg-card p-4 text-sm">
              <p className="font-medium">
                {item.name} · {item.paymentStatus}
              </p>
              <p className="text-muted-foreground">
                Anzahlung {euro(item.depositCents)} · Rest {euro(item.restCents)} · bezahlt {euro(item.paidCents)}
              </p>
              {item.paymentMethod ? <p>{item.paymentMethod}</p> : null}
            </Link>
          </li>
        ))}
      </ul>
    </DeskMessage>
  );
}
