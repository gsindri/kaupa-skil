// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const { catalogId, imageUrl } = await req.json();
    if (!catalogId || !imageUrl) {
      return new Response('catalogId and imageUrl required', { status: 400 });
    }

    const res = await fetch(imageUrl, { headers: { 'User-Agent': 'kaupa-ingestion-bot' } });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await sb.storage.from('product-images').upload(
      `${catalogId}.jpg`,
      arrayBuffer,
      { contentType: res.headers.get('content-type') ?? 'image/jpeg', upsert: true }
    );

    const { data } = sb.storage.from('product-images').getPublicUrl(`${catalogId}.jpg`);
    await sb.from('catalog_product').update({ image_main: data.publicUrl }).eq('catalog_id', catalogId);

    return new Response('ok', { status: 200 });
  } catch (err: any) {
    return new Response(String(err?.message ?? err), { status: 500 });
  }
});
