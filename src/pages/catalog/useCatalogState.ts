import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CatalogState, CatalogView } from '@/lib/catalogState';

const LS_KEY = 'catalog:last';

const DEFAULTS: CatalogState = {
  q: '',
  view: 'grid',
  sort: 'relevance',
  pageSize: 48,
  filters: { availability: 'all', suppliers: {} },
  vat: 'inc',
};

function parseJSON<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function useCatalogState(): [
  CatalogState,
  (next: Partial<CatalogState>) => void,
] {
  const [params, setParams] = useSearchParams();

  const fromUrl: Partial<CatalogState> = useMemo(() => {
    const q = params.get('q') ?? undefined;
    const view = (params.get('view') as CatalogView) ?? undefined;
    const sort = params.get('sort') ?? undefined;
    const pageSize = params.get('ps') ? Number(params.get('ps')) : undefined;
    const filters = parseJSON<CatalogState['filters']>(params.get('filters'));
    const vat = params.get('vat') as CatalogState['vat'] | null;
    return { q, view, sort, pageSize, filters, vat: vat ?? undefined };
  }, [params]);

  const fromStorage = useMemo(
    () => parseJSON<CatalogState>(localStorage.getItem(LS_KEY)),
    [],
  );

  const state: CatalogState = useMemo(() => {
    return {
      ...DEFAULTS,
      ...(fromStorage || {}),
      ...(fromUrl || {}),
      q: (fromUrl.q ?? fromStorage?.q ?? DEFAULTS.q) || '',
      view: (fromUrl.view ?? fromStorage?.view ?? DEFAULTS.view) as CatalogView,
      sort: (fromUrl.sort ?? fromStorage?.sort ?? DEFAULTS.sort)!,
      pageSize: Number(
        fromUrl.pageSize ?? fromStorage?.pageSize ?? DEFAULTS.pageSize,
      ),
      vat: (fromUrl.vat ?? fromStorage?.vat ?? DEFAULTS.vat) as any,
      filters: {
        ...DEFAULTS.filters,
        ...(fromStorage?.filters || {}),
        ...(fromUrl.filters || {}),
      },
    };
  }, [fromStorage, fromUrl]);

  const update = (next: Partial<CatalogState>) => {
    const merged = { ...state, ...next };
    localStorage.setItem(LS_KEY, JSON.stringify(merged));

    const nextParams = new URLSearchParams(params);
    if (merged.q) nextParams.set('q', merged.q);
    else nextParams.delete('q');
    nextParams.set('view', merged.view);
    nextParams.set('sort', merged.sort);
    nextParams.set('ps', String(merged.pageSize));
    if (merged.vat) nextParams.set('vat', merged.vat);
    else nextParams.delete('vat');
    const filters = JSON.stringify(merged.filters || {});
    if (filters !== '{}' && filters !== 'null')
      nextParams.set('filters', filters);
    else nextParams.delete('filters');

    setParams(nextParams, { replace: true });
  };

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  return [state, update];
}
