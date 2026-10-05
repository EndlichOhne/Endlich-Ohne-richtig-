import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function MaskDraw({
  photo,
  onMask,
}: {
  photo: string;
  onMask: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"paint" | "erase">("paint");
  const drawing = useRef(false);

  function sizeCanvas() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const img = wrap?.querySelector("img");
    if (!canvas || !img) return;
    const w = img.clientWidth;
    const h = img.clientHeight;
    if (w < 8 || h < 8) return;
    if (canvas.width !== w || canvas.height !== h) {
      const prev = canvas.toDataURL();
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx && prev.startsWith("data:image")) {
        const restore = new Image();
        restore.onload = () => ctx.drawImage(restore, 0, 0, w, h);
        restore.src = prev;
      }
    }
  }

  useEffect(() => {
    sizeCanvas();
    const onResize = () => sizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [photo]);

  function emit() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let painted = 0;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] > 20) painted += 1;
    }
    onMask(painted > 8 ? canvas.toDataURL("image/png") : null);
  }

  function paintAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const r = canvas.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * canvas.width;
    const y = ((clientY - r.top) / r.height) * canvas.height;
    const radius = Math.max(10, canvas.width * 0.028);
    ctx.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";
    ctx.fillStyle = "rgba(0, 168, 168, 0.55)";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  return (
    <div className="space-y-3">
      <div ref={wrapRef} className="relative overflow-hidden rounded-2xl bg-hero">
        <img src={photo} alt="" className="block w-full" onLoad={() => sizeCanvas()} />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full touch-none"
          onPointerDown={(e) => {
            drawing.current = true;
            (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
            paintAt(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            paintAt(e.clientX, e.clientY);
          }}
          onPointerUp={() => {
            drawing.current = false;
            emit();
          }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant={mode === "paint" ? "default" : "outline"}
          className="min-h-11 rounded-xl"
          onClick={() => setMode("paint")}
        >
          Markieren
        </Button>
        <Button
          type="button"
          variant={mode === "erase" ? "default" : "outline"}
          className="min-h-11 rounded-xl"
          onClick={() => setMode("erase")}
        >
          Radieren
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 rounded-xl"
          onClick={() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            onMask(null);
          }}
        >
          Löschen
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Mit dem Finger das Tattoo übermalen, wenn die automatische Erkennung danebenliegt.
      </p>
    </div>
  );
}
