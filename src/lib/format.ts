export function money(value: string | number | null | undefined) {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return "$" + (isNaN(n as number) ? 0 : (n as number)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function date(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function stars(rating: string | number | null | undefined) {
  const r = Math.round(typeof rating === "string" ? parseFloat(rating) : rating ?? 0);
  return Array.from({ length: 5 }, (_, i) => (i < r ? "fa-solid" : "fa-regular"));
}

// "Fri, Oct 9 · 3:30 – 4:30 PM" in the viewer's own time zone.
export function meetingWhen(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const day = s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const t = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${t(s)} – ${t(e)}`;
}
