export function normalizeBasics(i: { name?: string; brand?: string; packSize?: string }) {
  const name = (i.name ?? '').replace(/\s+/g, ' ').trim();
  const brand = i.brand?.trim();
  const packSize = i.packSize?.toLowerCase().replace(/\s/g, '');
  return { name, brand, packSize };
}
