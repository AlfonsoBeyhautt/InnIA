/** Legacy demo owner UUID used in SQL seed — reassigned to real auth users via claim. */
export const DEMO_OWNER_LEGACY = "00000000-0000-4000-8000-000000000001";

export const DEMO_PROPERTY_IDS = {
  pdd: "10000000-0000-4000-8000-000000000001",
  rocha: "10000000-0000-4000-8000-000000000002",
  paloma: "10000000-0000-4000-8000-000000000003",
} as const;

export const DEMO_UNIT_IDS: Record<string, string> = {
  "pdd-1": "20000000-0000-4000-8000-000000000001",
  "rocha-1": "20000000-0000-4000-8000-000000000002",
  "paloma-1": "20000000-0000-4000-8000-000000000003",
  "pdd-2": "20000000-0000-4000-8000-000000000011",
  "pdd-3": "20000000-0000-4000-8000-000000000012",
  "paloma-2": "20000000-0000-4000-8000-000000000013",
};

/** Cuenta demo compartida (ChatGPT / pruebas). */
export const DEMO_ACCOUNT_EMAIL = "demo@innia.com";

/** Email patterns that auto-claim legacy demo rows (substring match, case-insensitive). */
export const DEMO_CLAIM_EMAIL_PATTERNS = [
  "alfonsobeyhaut",
  "beyhaut",
  "alfonso",
  "demo@innia",
];

export function isDemoAccountEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  if (lower === DEMO_ACCOUNT_EMAIL) return true;
  return DEMO_CLAIM_EMAIL_PATTERNS.some((p) => lower.includes(p));
}
