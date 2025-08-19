import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { parsePack } from "./parsePack.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const INGEST_HAR_TOKEN = Deno.env.get("INGEST_HAR_TOKEN") || "";

const ALLOW_ORIGINS = new Set([
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "https://app.kaupa.is",
]);

type CapturedRecord = {
  url?: string;
  u?: string;
  data?: any;
  d?: any;
  ts?: number;
};

serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const cors = {
    "access-control-allow-origin": ALLOW_ORIGINS.has(origin) ? origin : "null",
    "access-control-allow-headers": "content-type,x-ingest-token",
    "access-control-allow-methods": "POST,OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    if (INGEST_HAR_TOKEN) {
      const token = req.headers.get("x-ingest-token") || "";
      if (token !== INGEST_HAR_TOKEN) {
        return new Response("unauthorized", { status: 401, headers: cors });
      }
    }

    const body = await req.json().catch(() => ({}));
    const { tenant_id, supplier_id, har, _captured } = body ?? {};
    if (!tenant_id || !supplier_id) {
      return new Response("bad payload", { status: 400, headers: cors });
    }

    // Build a unified array of {url, data} from either HAR or _captured
    const records: { url: string; data: any }[] = [];

    if (har?.log?.entries?.length) {
      for (const e of har.log.entries as any[]) {
        const url: string = e?.request?.url || "";
        const mime = (e?.response?.content?.mimeType || "").toLowerCase();
        if (!mime.includes("application/json")) continue;
        if (!/\/(api|graphql|products|catalog|prices)/i.test(url)) continue;
        const text: string | undefined = e?.response?.content?.text;
        if (!text) continue;
        try {
          records.push({ url, data: JSON.parse(text) });
        } catch { /* ignore */ }
      }
    } else if (Array.isArray(_captured)) {
      for (const r of _captured as CapturedRecord[]) {
        const url = String(r.url ?? r.u ?? "");
        const data = r.data ?? r.d;
        if (!url || data == null) continue;
        if (!/\/(api|graphql|products|catalog|prices)/i.test(url)) continue;
        records.push({ url, data });
      }
    } else {
      return new Response("nothing to ingest", { status: 400, headers: cors });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Store raw payload for audit/provenance
    const fileKeyBase = har?.log?.entries?.length ? "har" : "bookmarklet";
    const fileKey =
      `${fileKeyBase}/${tenant_id}/${supplier_id}/${Date.now()}.json`;
    const rawBlob = new Blob([
      JSON.stringify(har?.log?.entries?.length ? har : _captured),
    ], { type: "application/json" });
    const up = await supabase.storage.from("supplier-intake").upload(
      fileKey,
      rawBlob,
      { upsert: true },
    );
    if (up.error) throw up.error;

    // Extract product items from JSON shapes
    const itemsIn: any[] = [];
    for (const r of records) {
      const d = r?.data;
      const arr = Array.isArray(d?.items)
        ? d.items
        : Array.isArray(d?.data?.items)
        ? d.data.items
        : null;
      if (arr) itemsIn.push(...arr);
    }

    const nowIso = new Date().toISOString();
    const processedItems: any[] = [];

    for (const it of itemsIn) {
      const sku = String(
        (it as any).sku ?? (it as any).code ?? (it as any).id ?? "",
      ).trim();
      const name = String(
        (it as any).name ?? (it as any).title ?? (it as any).Description ?? "",
      ).trim();
      const brand = String((it as any).brand ?? (it as any).Brand ?? "").trim();
      const pack = String(
        (it as any).pack ?? (it as any).unit ?? (it as any).package ?? "",
      ).trim();
      const price = Number(
        (it as any).price_ex_vat ?? (it as any).PriceExVAT ??
          (it as any).price ?? 0,
      );
      const vatCode =
        Number((it as any).vat_code ?? (it as any).VATCode ?? 24) === 11
          ? 11
          : 24;

      const { qty, unit } = parsePack(pack);

      if (!name || !price) continue;

      processedItems.push({
        supplier_id,
        ext_sku: sku || name,
        display_name: name,
        brand: brand || null,
        pack_qty: qty || 1,
        pack_unit_id: unit || "each",
        vat_code: vatCode,
        price: price,
        unit_price_ex_vat: qty > 0 ? Number((price / qty).toFixed(4)) : null,
        last_seen_at: nowIso,
      });
    }

    let upsertedItems: any[] = [];

    if (processedItems.length) {
      // Upsert supplier items
      const upsert = await supabase.from("supplier_items").upsert(
        processedItems.map((i) => ({
          supplier_id: i.supplier_id,
          ext_sku: i.ext_sku,
          display_name: i.display_name,
          brand: i.brand,
          pack_qty: i.pack_qty,
          pack_unit_id: i.pack_unit_id,
          vat_code: i.vat_code,
          last_seen_at: i.last_seen_at,
        })),
        {
          onConflict: "supplier_id,ext_sku",
          ignoreDuplicates: false,
        },
      ).select();

      if (upsert.error) {
        console.error("Supplier items upsert error:", upsert.error);
        throw upsert.error;
      }

      upsertedItems = upsert.data || [];

      // Create price quotes for the upserted items
      if (upsertedItems.length > 0) {
        const priceQuotes = upsertedItems.map((item) => {
          const processedItem = processedItems.find((p) =>
            p.ext_sku === item.ext_sku
          );
          return {
            supplier_item_id: item.id,
            observed_at: nowIso,
            pack_price: processedItem?.price || 0,
            currency: "ISK",
            vat_code: String(processedItem?.vat_code || 24),
            unit_price_ex_vat: processedItem?.unit_price_ex_vat,
            unit_price_inc_vat: processedItem?.unit_price_ex_vat
              ? processedItem.unit_price_ex_vat *
                (1 + (processedItem.vat_code === 11 ? 0.11 : 0.24))
              : null,
            source: har?.log?.entries?.length ? "har_upload" : "bookmarklet",
          };
        });

        const quotes = await supabase.from("price_quotes").insert(priceQuotes);
        if (quotes.error) {
          console.error("Price quotes insert error:", quotes.error);
          throw quotes.error;
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        items: processedItems.length,
        fileKey,
        processed: upsertedItems.length,
      }),
      {
        headers: { ...cors, "content-type": "application/json" },
      },
    );
  } catch (e) {
    console.error("Ingest error:", e);
    return new Response(`error: ${e?.message || e}`, {
      status: 500,
      headers: cors,
    });
  }
});
