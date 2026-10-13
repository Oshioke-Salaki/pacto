export const USDC_DECIMALS = 6;

export function formatUnits(amount: bigint | string | number, decimals = USDC_DECIMALS, maxFraction = 2): string {
  const v = BigInt(amount);
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  let fracStr = frac.toString().padStart(decimals, "0").slice(0, maxFraction);
  fracStr = fracStr.replace(/0+$/, "");
  const wholeStr = whole.toLocaleString("en-US");
  return `${neg ? "-" : ""}${wholeStr}${fracStr ? "." + fracStr : ""}`;
}

export function formatUsdc(amount: bigint | string | number, decimals = USDC_DECIMALS) {
  return `${formatUnits(amount, decimals)} USDC`;
}

export function parseUnits(input: string, decimals = USDC_DECIMALS): bigint {
  const clean = input.trim().replace(/,/g, "");
  if (!/^\d*(\.\d*)?$/.test(clean) || clean === "" || clean === ".") throw new Error("Invalid amount");
  const [w = "0", f = ""] = clean.split(".");
  const frac = (f + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(w || "0") * 10n ** BigInt(decimals) + BigInt(frac || "0");
}

export function shortAddress(addr: string, chars = 4) {
  return addr.length <= chars * 2 + 3 ? addr : `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function formatDate(unix: number, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }, tag = "en-US") {
  if (!unix) return "-";
  return new Date(unix * 1000).toLocaleDateString(tag, opts);
}

export function formatDateTime(unix: number, tag = "en-US") {
  if (!unix) return "-";
  return new Date(unix * 1000).toLocaleString(tag, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "in 3 days", "2 hours ago", "in 12 minutes". */
export function relativeTime(unix: number, now = Math.floor(Date.now() / 1000), tag = "en") {
  const diff = unix - now;
  const abs = Math.abs(diff);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [86400 * 30, "day"],
    [86400 * 365, "month"],
  ];
  let unit: Intl.RelativeTimeFormatUnit = "year";
  let value = diff / (86400 * 365);
  for (let i = 0; i < units.length; i++) {
    if (abs < units[i][0]) {
      unit = units[i][1];
      const div = i === 0 ? 1 : units[i - 1][0];
      value = diff / div;
      break;
    }
  }
  return new Intl.RelativeTimeFormat(tag, { numeric: "auto" }).format(Math.round(value), unit);
}

export function daysFromSecs(secs: number) {
  return Math.round(secs / 86400);
}

export function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.min(100, Math.round((part / whole) * 100));
}

/** Current unix time in seconds. Kept out of component bodies so render stays pure. */
export function unixNow() {
  return Math.floor(Date.now() / 1000);
}
