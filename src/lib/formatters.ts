export type CurrencyCode = "ZAR" | "USD";

const southAfricaTimeZone = "Africa/Johannesburg";

export function formatCurrency(amount: number, currency: CurrencyCode = "ZAR"): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: southAfricaTimeZone,
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: southAfricaTimeZone,
  }).format(new Date(value));
}
