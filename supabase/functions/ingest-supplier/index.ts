// deno-lint-ignore-file no-explicit-any
import { runOnce } from '../../../ingestion/runner.ts';
import { csvBarAdapter } from '../../../ingestion/adapters/csv-bar.ts';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const supplierId = url.searchParams.get('supplier_id');
  if (!supplierId) return new Response('supplier_id required', { status: 400 });

  const csvText = await req.text();
  const adapter = csvBarAdapter({ supplierId, csvText });

  await runOnce(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    supplierId,
    adapter
  );

  return new Response('ok', { status: 200 });
});
