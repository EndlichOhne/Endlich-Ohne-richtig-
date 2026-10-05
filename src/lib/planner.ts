export const PLANNER_KEY = "eo-planner";

export type PlanItem = {
  id: string;
  title: string;
  date: string;
  note: string;
  paymentId?: string;
  depositCents?: number;
  restCents?: number;
  totalCents?: number;
};

export function loadPlan(): PlanItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PLANNER_KEY);
    return raw ? (JSON.parse(raw) as PlanItem[]) : [];
  } catch {
    return [];
  }
}

export function savePlan(items: PlanItem[]) {
  localStorage.setItem(PLANNER_KEY, JSON.stringify(items));
}
