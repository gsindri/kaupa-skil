export type CatalogView = 'grid' | 'table';

export interface CatalogState {
  q: string;
  view: CatalogView;
  sort: string;
  pageSize: number;
  vat?: 'inc' | 'ex';
  filters: {
    categories?: string[];
    brands?: string[];
    suppliers?: Record<string, -1 | 0 | 1>;
    availability?: 'in_stock' | 'all' | 'preorder';
  };
}

/** Stable stringify (sort object keys) */
export function stableStringify(value: unknown): string {
  const seen = new WeakSet();
  const stringify = (v: any): any => {
    if (v && typeof v === 'object') {
      if (seen.has(v)) return;
      seen.add(v);
      if (Array.isArray(v)) return v.map(stringify);
      return Object.keys(v)
        .sort()
        .reduce((acc, k) => {
          acc[k] = stringify((v as any)[k]);
          return acc;
        }, {} as any);
    }
    return v;
  };
  return JSON.stringify(stringify(value));
}

/** Tiny hash so query keys stay short */
export function tinyHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  // unsigned 32-bit to base36
  return (h >>> 0).toString(36);
}

/** Build a deterministic key fragment for React Query + URL */
export function stateKeyFragment(state: CatalogState): string {
  return tinyHash(stableStringify(state));
}
