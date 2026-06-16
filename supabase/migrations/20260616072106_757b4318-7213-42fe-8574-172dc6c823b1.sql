
DO $$
DECLARE
  b text;
  buckets text[] := ARRAY['product-images','user-info','activity-logs','ai-chat-messages','listings','user-settings','suggest-price','analyze-product-image','generate-seo-description'];
BEGIN
  FOREACH b IN ARRAY buckets LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_select_own');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_insert_own');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_update_own');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_delete_own');

    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)
    $f$, b || '_select_own', b);

    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)
    $f$, b || '_insert_own', b);

    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)
    $f$, b || '_update_own', b, b);

    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)
    $f$, b || '_delete_own', b);
  END LOOP;
END $$;
