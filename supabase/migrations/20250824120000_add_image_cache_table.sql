-- Create table for caching external images
create table if not exists image_cache (
  id uuid primary key default gen_random_uuid(),
  original_image_url text not null,
  cached_image_path text,
  etag text,
  last_modified timestamptz,
  last_fetched_at timestamptz
);
