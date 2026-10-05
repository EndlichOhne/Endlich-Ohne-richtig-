export const PRO_TEASER_KEY = "eo-pro-teaser";

export type BillingSku = "scan" | "month" | "year";
export type ProPlan = "month" | "year";

export const SCAN_CENTS = 50;
export const PRO_MONTH_CENTS = 399;
export const PRO_YEAR_CENTS = 2200;

/** @deprecated use PRO_YEAR_CENTS — kept so old imports still typecheck during edits */
export const PRO_CENTS = PRO_YEAR_CENTS;
export const PRO_DAYS = 365;

export const SCAN_PRICE_LABEL = "0,50 €";
export const PRO_MONTH_LABEL = "3,99 € / Monat";
export const PRO_YEAR_LABEL = "22,00 € / Jahr";
export const PRO_PRICE_LABEL = PRO_YEAR_LABEL;
export const PRO_YEAR_BADGE = "Bestes Angebot";
export const PRO_YEAR_SAVE = "Über 50 % günstiger als monatlich";
export const PRO_PRICE_HINT =
  "Digitaler Extra-Zugang. Kein Behandlungsvertrag, keine Diagnose, keine Garantie.";

export function skuCents(sku: BillingSku) {
  if (sku === "scan") return SCAN_CENTS;
  if (sku === "month") return PRO_MONTH_CENTS;
  return PRO_YEAR_CENTS;
}

export function skuDays(sku: Exclude<BillingSku, "scan">) {
  return sku === "month" ? 31 : 365;
}

export function skuLabel(sku: BillingSku) {
  if (sku === "scan") return `Einzel-Scan · ${SCAN_PRICE_LABEL}`;
  if (sku === "month") return `PRO Monatlich · ${PRO_MONTH_LABEL}`;
  return `PRO Jährlich · ${PRO_YEAR_LABEL}`;
}
