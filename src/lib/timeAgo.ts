export function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const units: [number, string][] = [
    [60, 's'],
    [60, 'm'],
    [24, 'h'],
    [7, 'd'],
    [4.348, 'w'],
    [12, 'mo'],
  ];
  let value = seconds;
  let i = 0;
  for (; i < units.length && value >= units[i][0]; i++) {
    value = Math.floor(value / units[i][0]);
  }
  const label = i === 0 ? 's' : units[i - 1][1];
  return `${value}${label} ago`;
}
