import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type { Group, Mesh } from "three";
import { Color } from "three";
import type { Region } from "@/lib/check";
import { REGION_LABEL } from "@/lib/check";
import { cn } from "@/lib/utils";

const SKIN = "#d2bfad";
const HAIR = "#2a2420";
const INK = "#1a1410";
const TEAL = "#00a8a8";
const STUDIO = "#071617";
const SHORTS = "#1b2626";

const PARTS: { id: Region; label: string }[] = [
  { id: "face", label: REGION_LABEL.face },
  { id: "brows", label: REGION_LABEL.brows },
  { id: "lips", label: REGION_LABEL.lips },
  { id: "shoulder", label: REGION_LABEL.shoulder },
  { id: "chest", label: REGION_LABEL.chest },
  { id: "back", label: REGION_LABEL.back },
  { id: "belly", label: REGION_LABEL.belly },
  { id: "arm", label: REGION_LABEL.arm },
  { id: "forearm", label: REGION_LABEL.forearm },
  { id: "hand", label: REGION_LABEL.hand },
  { id: "hip", label: REGION_LABEL.hip },
  { id: "leg", label: REGION_LABEL.leg },
  { id: "foot", label: REGION_LABEL.foot },
];

const MARK: Record<Region, [number, number, number]> = {
  face: [0, 2.08, 0.27],
  brows: [0, 2.18, 0.27],
  lips: [0, 1.96, 0.27],
  shoulder: [0.44, 1.58, 0.12],
  chest: [0, 1.4, 0.3],
  back: [0, 1.38, -0.3],
  belly: [0, 0.94, 0.26],
  arm: [0.58, 1.22, 0.12],
  forearm: [0.74, 0.78, 0.12],
  hand: [0.8, 0.5, 0.1],
  hip: [0.22, 0.62, 0.2],
  leg: [0.18, 0.12, 0.14],
  foot: [0.16, -0.2, 0.18],
  other: [0.32, 1.12, 0.28],
};

function Part({
  region,
  selected,
  hovered,
  interactive,
  onSelect,
  onHover,
  children,
  position,
  rotation,
  scale,
}: {
  region: Region;
  selected: Region | null;
  hovered: Region | null;
  interactive?: boolean;
  onSelect?: (r: Region) => void;
  onHover?: (r: Region | null) => void;
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
}) {
  const active = selected === region;
  const hot = hovered === region;
  const color = useMemo(
    () => new Color(active ? TEAL : hot ? "#b9d4d0" : SKIN),
    [active, hot],
  );
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow
      receiveShadow
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation();
              onSelect?.(region);
            }
          : undefined
      }
      onPointerOver={
        interactive
          ? (e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
              onHover?.(region);
            }
          : undefined
      }
      onPointerOut={
        interactive
          ? () => {
              document.body.style.cursor = "";
              onHover?.(null);
            }
          : undefined
      }
    >
      {children}
      <meshStandardMaterial
        color={color}
        roughness={0.48}
        metalness={0.06}
        emissive={active ? TEAL : "#000000"}
        emissiveIntensity={active ? 0.32 : 0}
      />
    </mesh>
  );
}

function Mark({ region }: { region: Region | null }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.14;
    ref.current.scale.setScalar(region ? s : 0);
  });
  if (!region) return null;
  const p = MARK[region];
  return (
    <mesh ref={ref} position={p}>
      <sphereGeometry args={[0.055, 18, 18]} />
      <meshStandardMaterial color={INK} roughness={0.85} metalness={0} />
    </mesh>
  );
}

function Figure({
  selected,
  interactive,
  onSelect,
  idle,
}: {
  selected: Region | null;
  interactive?: boolean;
  onSelect?: (r: Region) => void;
  idle?: boolean;
}) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState<Region | null>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    const d = Math.min(delta, 0.05);
    if (idle) group.current.rotation.y += d * 0.22;
  });
  const p = { selected, hovered, interactive, onSelect, onHover: setHovered };
  return (
    <group ref={group} position={[0, -1.12, 0]}>
      <mesh position={[0, 2.18, -0.02]} castShadow>
        <sphereGeometry args={[0.27, 28, 22, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshStandardMaterial color={HAIR} roughness={0.9} metalness={0} />
      </mesh>
      <Part region="face" {...p} position={[0, 2.06, 0.02]}>
        <sphereGeometry args={[0.26, 32, 32]} />
      </Part>
      <Part region="brows" {...p} position={[0, 2.14, 0.22]} scale={[0.2, 0.035, 0.06]}>
        <boxGeometry args={[1, 1, 1]} />
      </Part>
      <Part region="lips" {...p} position={[0, 1.95, 0.23]} scale={[0.1, 0.032, 0.05]}>
        <boxGeometry args={[1, 1, 1]} />
      </Part>
      <mesh position={[0, 1.76, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.16, 16]} />
        <meshStandardMaterial color={SKIN} roughness={0.5} metalness={0.06} />
      </mesh>
      <Part region="shoulder" {...p} position={[-0.4, 1.56, 0]}>
        <sphereGeometry args={[0.15, 20, 20]} />
      </Part>
      <Part region="shoulder" {...p} position={[0.4, 1.56, 0]}>
        <sphereGeometry args={[0.15, 20, 20]} />
      </Part>
      <Part region="chest" {...p} position={[0, 1.36, 0.04]}>
        <capsuleGeometry args={[0.3, 0.4, 8, 18]} />
      </Part>
      <Part region="back" {...p} position={[0, 1.34, -0.15]}>
        <capsuleGeometry args={[0.26, 0.38, 8, 16]} />
      </Part>
      <Part region="belly" {...p} position={[0, 0.92, 0.02]}>
        <capsuleGeometry args={[0.24, 0.2, 8, 16]} />
      </Part>
      <Part region="arm" {...p} position={[-0.56, 1.2, 0]} rotation={[0, 0, 0.38]}>
        <capsuleGeometry args={[0.085, 0.4, 6, 14]} />
      </Part>
      <Part region="arm" {...p} position={[0.56, 1.2, 0]} rotation={[0, 0, -0.38]}>
        <capsuleGeometry args={[0.085, 0.4, 6, 14]} />
      </Part>
      <Part region="forearm" {...p} position={[-0.7, 0.78, 0.04]} rotation={[0.16, 0, 0.22]}>
        <capsuleGeometry args={[0.07, 0.34, 6, 14]} />
      </Part>
      <Part region="forearm" {...p} position={[0.7, 0.78, 0.04]} rotation={[0.16, 0, -0.22]}>
        <capsuleGeometry args={[0.07, 0.34, 6, 14]} />
      </Part>
      <Part region="hand" {...p} position={[-0.76, 0.5, 0.08]}>
        <sphereGeometry args={[0.075, 14, 14]} />
      </Part>
      <Part region="hand" {...p} position={[0.76, 0.5, 0.08]}>
        <sphereGeometry args={[0.075, 14, 14]} />
      </Part>
      <mesh position={[0, 0.68, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.12, 6, 16]} />
        <meshStandardMaterial color={SHORTS} roughness={0.7} metalness={0.05} />
      </mesh>
      <Part region="hip" {...p} position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.22, 20, 20]} />
      </Part>
      <Part region="leg" {...p} position={[-0.15, 0.16, 0]}>
        <capsuleGeometry args={[0.11, 0.52, 6, 14]} />
      </Part>
      <Part region="leg" {...p} position={[0.15, 0.16, 0]}>
        <capsuleGeometry args={[0.11, 0.52, 6, 14]} />
      </Part>
      <Part region="foot" {...p} position={[-0.15, -0.22, 0.08]} scale={[1, 0.42, 1.55]}>
        <sphereGeometry args={[0.095, 12, 12]} />
      </Part>
      <Part region="foot" {...p} position={[0.15, -0.22, 0.08]} scale={[1, 0.42, 1.55]}>
        <sphereGeometry args={[0.095, 12, 12]} />
      </Part>
      <Mark region={selected} />
    </group>
  );
}

function ScanRing() {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (Math.sin(clock.elapsedTime * 0.85) + 1) / 2;
    ref.current.position.y = -0.85 + t * 2.15;
    const mat = ref.current.material as { opacity: number };
    mat.opacity = 0.22 + t * 0.28;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.42, 0.46, 48]} />
      <meshBasicMaterial color={TEAL} transparent opacity={0.35} />
    </mesh>
  );
}

function LaserRing({ region }: { region: Region | null }) {
  const ref = useRef<Mesh>(null);
  const pos = MARK[region ?? "forearm"];
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = clock.elapsedTime * 0.55;
    const mat = ref.current.material as { opacity: number };
    mat.opacity = 0.38 + Math.sin(clock.elapsedTime * 2.1) * 0.16;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2.35, 0, 0]} position={[pos[0], pos[1] - 1.12, pos[2] + 0.12]}>
      <torusGeometry args={[0.32, 0.01, 10, 56]} />
      <meshBasicMaterial color={TEAL} transparent opacity={0.5} />
    </mesh>
  );
}

function Platform() {
  return (
    <group position={[0, -1.2, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.55, 56]} />
        <meshStandardMaterial color="#0c1c1d" metalness={0.45} roughness={0.32} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.48, 1.58, 64]} />
        <meshBasicMaterial color={TEAL} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Studio({
  selected,
  interactive,
  onSelect,
  idle,
  dark,
}: {
  selected: Region | null;
  interactive?: boolean;
  onSelect?: (r: Region) => void;
  idle?: boolean;
  dark?: boolean;
}) {
  return (
    <>
      {dark ? <color attach="background" args={[STUDIO]} /> : null}
      {dark ? <fog attach="fog" args={[STUDIO, 5.5, 13]} /> : null}
      <ambientLight intensity={0.42} />
      <directionalLight position={[3.4, 4.6, 2.4]} intensity={1.4} color="#f4f7f7" castShadow />
      <directionalLight position={[-3.2, 1.6, -2.2]} intensity={0.62} color={TEAL} />
      <pointLight position={[0.2, 2.4, 2]} intensity={0.35} color={TEAL} />
      <Platform />
      <ScanRing />
      <Figure selected={selected} interactive={interactive} onSelect={onSelect} idle={idle} />
      <LaserRing region={selected} />
      <ContactShadows position={[0, -1.19, 0]} opacity={0.5} scale={6.4} blur={2.6} far={3.2} color="#031010" />
    </>
  );
}

function useCanvasReady() {
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setReady(true);
  }, []);
  return { ready, reduced };
}

export function HeroScene({ className }: { className?: string }) {
  const { ready, reduced } = useCanvasReady();
  if (!ready || reduced) {
    return <div className={cn("h-full w-full bg-hero", className)} aria-hidden />;
  }
  return (
    <div className={cn("h-full w-full bg-hero", className)} aria-hidden>
      <Canvas
        camera={{ position: [0.45, 0.38, 3.15], fov: 35 }}
        dpr={[1, 1.25]}
        gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
      >
        <Suspense fallback={null}>
          <Studio selected="forearm" idle dark />
        </Suspense>
      </Canvas>
    </div>
  );
}

export function BodyExplorer({
  selected,
  onSelect,
  className,
}: {
  selected: Region | null;
  onSelect: (r: Region) => void;
  className?: string;
}) {
  const { ready, reduced } = useCanvasReady();
  const host = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(true);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setLive(entry.isIntersecting && document.visibilityState === "visible"),
      { threshold: 0.12 },
    );
    io.observe(el);
    const onVis = () =>
      setLive(document.visibilityState === "visible" && el.getBoundingClientRect().height > 0);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      document.body.style.cursor = "";
    };
  }, [ready, reduced]);
  return (
    <div ref={host} className={cn("overflow-hidden rounded-2xl bg-hero", className)}>
      {!ready || reduced ? (
        <p className="px-4 py-16 text-center text-sm text-hero-foreground/80">
          {reduced
            ? "3D ist bei reduzierter Bewegung aus. Region unten wählen."
            : "Modell wird geladen."}
        </p>
      ) : (
        <div className="h-[22rem] w-full touch-none md:h-[30rem]">
          <Canvas
            camera={{ position: [0.2, 0.4, 4.5], fov: 32 }}
            dpr={[1, 1.25]}
            frameloop={live ? "always" : "never"}
            gl={{
              antialias: false,
              alpha: false,
              powerPreference: "low-power",
              stencil: false,
            }}
          >
            <Suspense fallback={null}>
              <Studio selected={selected} interactive onSelect={onSelect} dark />
              <OrbitControls
                enablePan={false}
                enableDamping
                minDistance={3.2}
                maxDistance={6.2}
                minPolarAngle={Math.PI / 3.4}
                maxPolarAngle={Math.PI / 1.72}
              />
            </Suspense>
          </Canvas>
        </div>
      )}
      <div className="grid grid-cols-3 gap-1.5 p-3 md:grid-cols-4">
        {PARTS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "min-h-10 rounded-lg px-2 text-xs font-medium",
              selected === p.id
                ? "bg-accent text-accent-foreground"
                : "bg-hero-foreground/10 text-hero-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onSelect("other")}
          className={cn(
            "min-h-10 rounded-lg px-2 text-xs font-medium",
            selected === "other"
              ? "bg-accent text-accent-foreground"
              : "bg-hero-foreground/10 text-hero-foreground",
          )}
        >
          {REGION_LABEL.other}
        </button>
      </div>
    </div>
  );
}
