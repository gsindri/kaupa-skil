import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { parsePack } from "./parsePack.ts";

// Helper function to create SHA-256 hash using Web Crypto API
async function createSHA256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const INGEST_HAR_TOKEN = Deno.env.get("INGEST_HAR_TOKEN") || "";
const MISSING_CYCLE_THRESHOLD =
  Number(Deno.env.get("MISSING_CYCLE_THRESHOLD")) || 3;
const DELTA_ALERT_THRESHOLD =
  Number(Deno.env.get("DELTA_ALERT_THRESHOLD")) || 100;
const SLACK_WEBHOOK_URL = Deno.env.get("SLACK_WEBHOOK_URL");
const ALERT_EMAIL_URL = Deno.env.get("ALERT_EMAIL_URL");

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

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const cors = {
    "access-control-allow-origin": ALLOW_ORIGINS.has(origin) ? origin : "null",
    "access-control-allow-headers": "content-type,x-ingest-token",
    "access-control-allow-methods": "POST,OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const startTime = Date.now();
  let supabase: any;
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

    supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
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

      const rawHash = await createSHA256Hash(JSON.stringify(it));

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
        raw_hash: rawHash,
      });
    }
    let newCount = 0;
    let changedCount = 0;
    let unavailableCount = 0;
    let upsertedItems: any[] = [];

    const { data: existingRows, error: existingErr } = await supabase
      .from("supplier_items")
      .select("id, ext_sku, raw_hash, missing_cycles, status")
      .eq("supplier_id", supplier_id);
    if (existingErr) throw existingErr;
    const existingMap = new Map((existingRows || []).map((r: any) => [r.ext_sku, r]));

    const itemsToUpsert: any[] = [];
    const unchangedIds: string[] = [];

    for (const item of processedItems) {
      const existing = existingMap.get(item.ext_sku);
      if (!existing) {
        itemsToUpsert.push({ ...item, status: "available", missing_cycles: 0 });
        newCount++;
      } else if (existing.raw_hash !== item.raw_hash) {
        itemsToUpsert.push({
          ...item,
          id: existing.id,
          status: "available",
          missing_cycles: 0,
        });
        changedCount++;
        existingMap.delete(item.ext_sku);
      } else {
        unchangedIds.push(existing.id);
        existingMap.delete(item.ext_sku);
      }
    }

    if (itemsToUpsert.length) {
      const upsert = await supabase.from("supplier_items").upsert(
        itemsToUpsert,
        { onConflict: "supplier_id,ext_sku", ignoreDuplicates: false },
      ).select();
      if (upsert.error) {
        console.error("Supplier items upsert error:", upsert.error);
        throw upsert.error;
      }
      upsertedItems = upsert.data || [];
    }

    if (unchangedIds.length) {
      const upd = await supabase.from("supplier_items").update({
        last_seen_at: nowIso,
        missing_cycles: 0,
        status: "available",
      }).in("id", unchangedIds);
      if (upd.error) {
        console.error("Supplier items update error:", upd.error);
        throw upd.error;
      }
    }

    const unseen = Array.from(existingMap.values());
    if (unseen.length) {
      const updates = unseen.map((r: any) => {
        const mc = (r.missing_cycles || 0) + 1;
        const status = mc >= MISSING_CYCLE_THRESHOLD ? "unavailable" : r.status || "available";
        if (status === "unavailable" && r.status !== "unavailable") unavailableCount++;
        return { id: r.id, missing_cycles: mc, status };
      });
      const upd = await supabase.from("supplier_items").upsert(updates);
      if (upd.error) {
        console.error("Supplier items missing update error:", upd.error);
        throw upd.error;
      }
    }

    if (upsertedItems.length) {
      const priceQuotes = upsertedItems.map((item) => {
        const processedItem = processedItems.find((p) => p.ext_sku === item.ext_sku);
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

    const latencyMs = Date.now() - startTime;
    await supabase.from("ingestion_runs").insert({
      tenant_id,
      supplier_id,
      started_at: new Date(startTime).toISOString(),
      finished_at: new Date().toISOString(),
      status: "succeeded",
      latency_ms: latencyMs,
      new_count: newCount,
      changed_count: changedCount,
      unavailable_count: unavailableCount,
    });

    if (
      SLACK_WEBHOOK_URL &&
      (changedCount + newCount > DELTA_ALERT_THRESHOLD || unavailableCount > 0)
    ) {
      const msg =
        `Ingestion alert for supplier ${supplier_id}: ${newCount} new, ${changedCount} changed, ${unavailableCount} unavailable`;
      await fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: msg }),
      }).catch(() => {});
      if (ALERT_EMAIL_URL) {
        await fetch(ALERT_EMAIL_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subject: "Ingestion alert", text: msg }),
        }).catch(() => {});
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        items: processedItems.length,
        fileKey,
        processed: upsertedItems.length,
        new: newCount,
        changed: changedCount,
        unavailable: unavailableCount,
        latency_ms: latencyMs,
      }),
      {
        headers: { ...cors, "content-type": "application/json" },
      },
    );
  } catch (e) {
    console.error("Ingest error:", e);
    const msg = `Ingestion failed for supplier ${tenant_id}/${supplier_id}: ${e?.message || e}`;
    await supabase
      .from("ingestion_runs")
      .insert({
        tenant_id,
        supplier_id,
        started_at: new Date(startTime).toISOString(),
        finished_at: new Date().toISOString(),
        status: "failed",
        error: String(e?.message || e),
      })
      .catch(() => {});
    if (SLACK_WEBHOOK_URL) {
      await fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: msg }),
      }).catch(() => {});
      if (ALERT_EMAIL_URL) {
        await fetch(ALERT_EMAIL_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subject: "Ingestion failed", text: msg }),
        }).catch(() => {});
      }
    }
    return new Response(`error: ${e?.message || e}`, {
      status: 500,
      headers: cors,
    });
  }
});
