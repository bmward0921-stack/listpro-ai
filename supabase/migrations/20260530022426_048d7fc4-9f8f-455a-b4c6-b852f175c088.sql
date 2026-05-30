
-- Revoke anon access to all public user data tables (all are user-scoped)
REVOKE SELECT ON public.activity_logs FROM anon;
REVOKE SELECT ON public.ai_chat_messages FROM anon;
REVOKE SELECT ON public.listings FROM anon;
REVOKE SELECT ON public.product_library FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.user_settings FROM anon;

-- Lock down SECURITY DEFINER helper functions
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Storage: per-user folder access policies for all private buckets
DO $$
DECLARE
  b text;
  buckets text[] := ARRAY[
    'product-images','user-info','activity-logs','ai-chat-messages',
    'listings','user-settings','suggest-price',
    'analyze-product-image','generate-seo-description'
  ];
BEGIN
  FOREACH b IN ARRAY buckets LOOP
    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b || '_select_own', b);

    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b || '_insert_own', b);

    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b || '_update_own', b, b);

    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b || '_delete_own', b);
  END LOOP;
END $$;
