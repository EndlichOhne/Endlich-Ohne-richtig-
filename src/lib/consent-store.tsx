import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_CONSENT,
  clearLocalAppData,
  loadConsent,
  requiredOk,
  saveConsent,
  type ConsentRecord,
} from "@/lib/consent";

type ConsentCtx = {
  consent: ConsentRecord;
  ready: boolean;
  accepted: boolean;
  setPartial: (patch: Partial<ConsentRecord>) => void;
  acceptRequired: (extras?: Partial<ConsentRecord>) => void;
  withdraw: () => void;
  finishOnboarding: () => void;
};

const Ctx = createContext<ConsentCtx | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentRecord>(EMPTY_CONSENT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(loadConsent());
    setReady(true);
  }, []);

  const persist = useCallback((next: ConsentRecord) => {
    setConsent(next);
    saveConsent(next);
  }, []);

  const value = useMemo<ConsentCtx>(
    () => ({
      consent,
      ready,
      accepted: requiredOk(consent),
      setPartial: (patch) => persist({ ...consent, ...patch }),
      acceptRequired: (extras) =>
        persist({
          ...consent,
          ...extras,
          agb: true,
          privacy: true,
          medical: true,
          age18: true,
          onboardingDone: true,
          acceptedAt: new Date().toISOString(),
        }),
      withdraw: () => {
        clearLocalAppData();
        persist(EMPTY_CONSENT);
      },
      finishOnboarding: () => persist({ ...consent, onboardingDone: true }),
    }),
    [consent, persist, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConsent() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConsent");
  return ctx;
}
