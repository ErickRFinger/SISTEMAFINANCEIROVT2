ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- Policy for Storage is handled via Supabase Dashboard usually, but we can try to hint it here
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'produtos' );
-- CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'produtos' AND auth.role() = 'authenticated' );
