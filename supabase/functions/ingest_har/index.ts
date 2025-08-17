
// supabase edge function: ingest_har
// Receives { tenant_id, supplier_id, har }, stores raw HAR, extracts product JSON,
// normalizes, upserts supplier_items and appends price_quotes.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const INGEST_HAR_TOKEN = Deno.env.get("INGEST_HAR_TOKEN") || ""; // optional

const ALLOW_ORIGINS = new Set([
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "https://app.kaupa.is", // add your prod app URL
]);

serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const cors = {
    "access-control-allow-origin": ALLOW_ORIGINS.has(origin) ? origin : "null",
    "access-control-allow-headers": "content-type,x-ingest-token",
    "access-control-allow-methods": "POST,OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    // Optional shared-secret check
    if (INGEST_HAR_TOKEN) {
      const token = req.headers.get("x-ingest-token") || "";
      if (token !== INGEST_HAR_TOKEN) {
        return new Response("unauthorized", { status: 401, headers: cors });
      }
    }

    const body = await req.json();
    const { tenant_id, supplier_id, har } = body ?? {};
    if (!tenant_id || !supplier_id || !har?.log?.entries) {
      return new Response("bad payload", { status: 400, headers: cors });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Save raw HAR to Storage (audit/provenance)
    const fileKey = `har/${tenant_id}/${supplier_id}/${Date.now()}.har.json`;
    const up = await supabase.storage
      .from("supplier-intake")
      .upload(fileKey, new Blob([JSON.stringify(har)], { type: "application/json" }), { upsert: true });
    if (up.error) throw up.error;

    // 2) Extract product arrays from JSON responses in the HAR
    type ItemIn = Record<string, unknown>;
    const itemsIn: ItemIn[] = [];
    for (const e of har.log.entries as any[]) {
      const url: string = e?.request?.url || "";
      const mime = (e?.response?.content?.mimeType || "").toLowerCase();
      if (!mime.includes("application/json")) continue;
      if (!/\/(api|graphql|products|catalog|prices)/i.test(url)) continue;

      const text: string | undefined = e?.response?.content?.text;
      if (!text) continue;
      let data: any;
      try { data = JSON.parse(text); } catch { continue; }

      // Try typical shapes: { items: [...] } or { data: { items: [...] } }
      const arr =
        Array.isArray(data?.items) ? data.items
        : Array.isArray(data?.data?.items) ? data.data.items
        : null;
      if (arr) itemsIn.push(...arr);
    }

    // 3) Normalize into our minimal schema
    const nowIso = new Date().toISOString();
    const relationshipId = `${tenant_id}:${supplier_id}`;
    const items = itemsIn.map((it) => {
      const sku  = String((it as any).sku ?? (it as any).code ?? (it as any).id ?? "").trim();
      const name = String((it as any).name ?? (it as any).title ?? (it as any).Description ?? "").trim();
      const brand = String((it as any).brand ?? (it as any).Brand ?? "").trim();
      const pack  = String((it as any).pack ?? (it as any).unit ?? (it as any).package ?? "").trim();
      const price = Number((it as any).price_ex_vat ?? (it as any).PriceExVAT ?? (it as any).price ?? 0);
      const vatCode = Number((it as any).vat_code ?? (it as any).VATCode ?? 24) === 11 ? 11 : 24;

      const { qty, unit } = parsePack(pack);
      const isk_per_unit = qty > 0 ? Number((price / qty).toFixed(4)) : null;

      return {
        relationship_id: relationshipId,
        supplier_sku: sku || name, // fallback to name if no sku is exposed
        name,
        brand: brand || null,
        pack_qty: qty || 1,
        pack_unit: unit || "each",
        vat_code: vatCode.toString(),
        price_per_pack_ex_vat: price,
        isk_per_unit,
        last_seen_at: nowIso,
        seen_at: nowIso,
      };
    }).filter(x => x.name && x.price_per_pack_ex_vat);

    // 4) Upsert snapshot into supplier_items
    if (items.length) {
      const upsert = await supabase
        .from("supplier_items")
        .upsert(
          items.map(i => ({
            supplier_id: supplier_id,
            ext_sku: i.supplier_sku,
            display_name: i.name,
            brand: i.brand,
            pack_qty: i.pack_qty,
            pack_unit_id: i.pack_unit,
            vat_code: i.vat_code,
            last_seen_at: i.last_seen_at,
          })),
          { onConflict: "supplier_id,ext_sku" }
        );
      if (upsert.error) throw upsert.error;

      // 5) Append time series into price_quotes
      const quotes = await supabase
        .from("price_quotes")
        .insert(items.map(i => ({
          relationship_id: i.relationship_id,
          supplier_sku: i.supplier_sku,
          price_per_pack_ex_vat: i.price_per_pack_ex_vat,
          seen_at: i.seen_at,
          file_key: fileKey,
          source: "har_upload",
        })));
      if (quotes.error) throw quotes.error;
    }

    return new Response(JSON.stringify({ ok: true, items: items.length, fileKey }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("HAR ingest error:", e);
    return new Response(`error: ${e?.message || e}`, { status: 500, headers: cors });
  }
});

// ---- helpers ----
function parsePack(s: string) {
  const t = (s || "").toLowerCase().replace(/\s+/g, "");
  // 12x1l, 6x2l, 1kg, 500g
  const mX = t.match(/^(\d+)x(\d+(?:[\.,]\d+)?)(l|kg|g)$/);
  if (mX) {
    const n = Number(mX[1]);
    let per = Number(mX[2].replace(",", "."));
    let unit = mX[3];
    if (unit === "g") { per = per / 1000; unit = "kg"; }
    return { qty: n * per, unit: unit === "kg" ? "kg" : "L" };
  }
  const mOne = t.match(/^(\d+(?:[\.,]\d+)?)(l|kg|g)$/);
  if (mOne) {
    let qty = Number(mOne[1].replace(",", "."));
    let unit = mOne[2];
    if (unit === "g") { qty = qty / 1000; unit = "kg"; }
    return { qty, unit: unit === "kg" ? "kg" : "L" };
  }
  return { qty: 1, unit: "each" };
}
