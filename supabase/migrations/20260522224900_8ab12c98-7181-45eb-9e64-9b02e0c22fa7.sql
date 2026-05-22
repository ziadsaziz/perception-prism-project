
-- 1. Subscriptions: remove client INSERT/UPDATE (handle_new_user trigger + service_role still work)
DROP POLICY IF EXISTS "own_insert" ON public.subscriptions;
DROP POLICY IF EXISTS "own_update" ON public.subscriptions;
DROP POLICY IF EXISTS "own_delete" ON public.subscriptions;

-- 2. Referrals: allow the referred user to see their referral record
CREATE POLICY "referred_select" ON public.referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = referred_user_id);

-- 3. Storage: explicit UPDATE policy scoped to owner's folder
CREATE POLICY "mirror_uploads_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'mirror-uploads' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'mirror-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Realtime: restrict channel subscriptions to user's own notification topic
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_users_own_topic_select" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() = 'notifications:' || auth.uid()::text
    OR realtime.topic() = 'user:' || auth.uid()::text
  );

CREATE POLICY "auth_users_own_topic_insert" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    realtime.topic() = 'notifications:' || auth.uid()::text
    OR realtime.topic() = 'user:' || auth.uid()::text
  );

-- 5. SECURITY DEFINER functions: revoke broad EXECUTE, grant only where needed
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_mirror_score(integer, integer, integer, integer, integer, integer, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refresh_platform_benchmarks() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.generate_referral_code(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.apply_referral(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.generate_referral_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streak(uuid) TO authenticated;
