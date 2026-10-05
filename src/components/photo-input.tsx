import { useState } from "react";
import { compressImage } from "@/lib/tattoo-photos";

export function PhotoInput({
  onReady,
  label = "Foto wählen oder Kamera",
}: {
  onReady: (dataUrl: string) => void;
  label?: string;
}) {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handle(file: File | undefined) {
    setErr(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Dieses Format wird nicht unterstützt.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setErr("Foto zu groß (max. 12 MB).");
      return;
    }
    setBusy(true);
    try {
      onReady(await compressImage(file));
    } catch {
      setErr("Bitte ein helleres und schärferes Foto hochladen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-card px-4 text-sm font-medium shadow-[var(--shadow-border)]">
        {busy ? "Wird vorbereitet…" : label}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          disabled={busy}
          onChange={(e) => void handle(e.target.files?.[0])}
        />
      </label>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
    </div>
  );
}
