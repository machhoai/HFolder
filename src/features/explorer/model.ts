import type { Entry } from "@/contracts";
export const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase();
export function selectRange(
  ids: string[],
  previous: string[],
  clicked: string,
  anchor: string | null,
  ctrl: boolean,
  shift: boolean,
): string[] {
  const a = anchor ? ids.indexOf(anchor) : -1;
  const b = ids.indexOf(clicked);
  if (shift && a >= 0 && b >= 0) {
    const range = ids.slice(Math.min(a, b), Math.max(a, b) + 1);
    return ctrl ? [...new Set([...previous, ...range])] : range;
  }
  if (ctrl)
    return previous.includes(clicked)
      ? previous.filter((id) => id !== clicked)
      : [...previous, clicked];
  return [clicked];
}
export function displayPath(root: string, relative: string) {
  const clean = root.replace(/^\\\\\?\\/, "");
  return relative ? `${clean.replace(/[\\/]$/, "")}\\${relative}` : clean;
}
export function ancestorIssues(entries: Entry[], relative: string) {
  const prefix = `${relative}\\`;
  return entries.filter(
    (e) =>
      e.issues.length &&
      (e.relativePath === relative || e.relativePath.startsWith(prefix)),
  ).length;
}
