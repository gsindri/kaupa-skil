import { createClient } from '@supabase/supabase-js';
import type { NormalizedItem } from './types';

export async function matchOrCreateCatalog(
  sb: ReturnType<typeof createClient>, item: NormalizedItem
): Promise<string> {
  if (item.gtin) {
    const { data } = await sb
      .from('catalog_product')
      .select('catalog_id')
      .eq('gtin', item.gtin)
      .maybeSingle();
    if (data?.catalog_id) return data.catalog_id;
  }

  const { data: candidates } = await sb
    .from('catalog_product')
    .select('catalog_id, brand, name, size')
    .ilike('name', `%${item.name.slice(0, 32)}%`)
    .limit(20);

  const pick = candidates?.find(c =>
    (item.brand ? c.brand?.toLowerCase() === item.brand.toLowerCase() : true) &&
    (item.packSize ? c.size?.replace(/\s/g,'').toLowerCase() === item.packSize : true)
  );

  if (pick?.catalog_id) return pick.catalog_id;

  const { data: created, error } = await sb
    .from('catalog_product')
    .insert({
      gtin: item.gtin ?? null,
      brand: item.brand ?? null,
      name: item.name,
      size: item.packSize ?? null,
    })
    .select('catalog_id')
    .single();
  if (error) throw error;
  return created!.catalog_id;
}
