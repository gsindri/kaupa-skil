
-- Create the supplier-intake storage bucket for storing raw HAR files and bookmarklet captures
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-intake', 'supplier-intake', false);

-- Create RLS policy to allow authenticated users to upload files to their tenant's folder
CREATE POLICY "Users can upload to their tenant folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'supplier-intake' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT t.id::text 
    FROM tenants t 
    JOIN memberships m ON m.tenant_id = t.id 
    WHERE m.user_id = auth.uid()
  )
);

-- Create RLS policy to allow users to read files from their tenant's folder
CREATE POLICY "Users can read from their tenant folder"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'supplier-intake'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT t.id::text 
    FROM tenants t 
    JOIN memberships m ON m.tenant_id = t.id 
    WHERE m.user_id = auth.uid()
  )
);
