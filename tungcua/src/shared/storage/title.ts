/** Human-readable default document title, e.g. "Scan 2026-10-18 14:30". */
export function documentTitle(prefix: string, now: Date = new Date()): string {
  const pad = (value: number) => value.toString().padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return `${prefix} ${date} ${time}`;
}
