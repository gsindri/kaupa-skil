import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { jaroWinkler } from "https://esm.sh/jaro-winkler";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

function normalize(str: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function extractPack(str: string): { qty: number | null; unit: string | null } {
  const m = str.match(/(\d+[\.,]?\d*)\s*(kg|g|l|ml|pcs|pc|stk)?/i);
  if (!m) return { qty: null, unit: null };
  const qty = parseFloat(m[1].replace(",", "."));
  const unit = m[2] ? m[2].toLowerCase() : null;
  return { qty, unit };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { supplier_item_id } = await req.json();
  if (!supplier_item_id) {
    return new Response("supplier_item_id required", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: si, error } = await supabase
    .from("supplier_items")
    .select("id, gtin, mpn, display_name")
    .eq("id", supplier_item_id)
    .single();
  if (error || !si) {
    return new Response("supplier item not found", { status: 404 });
  }

  let matchMethod: string | null = null;
  let matchScore = 0;
  let matchedItemId: string | null = null;

  if (si.gtin) {
    const { data: m } = await supabase
      .from("items")
      .select("id")
      .eq("gtin", si.gtin)
      .single();
    if (m) {
      matchedItemId = m.id;
      matchMethod = "gtin";
      matchScore = 1;
    }
  }

  if (!matchedItemId && si.mpn) {
    const { data: m } = await supabase
      .from("items")
      .select("id")
      .eq("mpn", si.mpn)
      .single();
    if (m) {
      matchedItemId = m.id;
      matchMethod = "mpn";
      matchScore = 1;
    }
  }

  if (!matchedItemId) {
    const { data: items } = await supabase
      .from("items")
      .select("id, name")
      .limit(500);

    let best = { id: null as string | null, score: 0 };
    const siNorm = normalize(si.display_name);
    const siPack = extractPack(si.display_name);

    for (const item of items || []) {
      const nameNorm = normalize(item.name);
      let score = jaroWinkler(siNorm, nameNorm);
      const itemPack = extractPack(item.name);
      if (
        siPack.qty && itemPack.qty && siPack.unit === itemPack.unit &&
        siPack.qty !== itemPack.qty
      ) {
        score -= 0.1; // penalize different pack sizes
      }
      if (score > best.score) {
        best = { id: item.id, score };
      }
    }

    if (best.id) {
      matchedItemId = best.id;
      matchMethod = "fuzzy";
      matchScore = Number(best.score.toFixed(2));
    }
  }

  const needsReview = matchScore < 0.9;

  if (matchedItemId) {
    await supabase.from("item_matches").insert({
      supplier_item_id: si.id,
      item_id: matchedItemId,
      match_method: matchMethod,
      match_score: matchScore,
      review_required: needsReview,
    });
    if (needsReview) {
      await supabase.from("match_review_queue").insert({
        supplier_item_id: si.id,
        suggested_item_id: matchedItemId,
        match_method: matchMethod,
        match_score: matchScore,
      });
    }
  } else {
    await supabase.from("match_review_queue").insert({
      supplier_item_id: si.id,
      suggested_item_id: null,
      match_method: "none",
      match_score: 0,
    });
  }

  return new Response(
    JSON.stringify({
      matched_item_id: matchedItemId,
      match_method: matchMethod,
      match_score: matchScore,
      review_required: needsReview,
    }),
    { headers: { "content-type": "application/json" } },
  );
});
