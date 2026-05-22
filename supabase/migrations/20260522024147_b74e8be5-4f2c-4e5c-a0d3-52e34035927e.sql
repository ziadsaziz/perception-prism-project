CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date DATE;
  v_current INT;
  v_longest INT;
  v_today DATE := CURRENT_DATE;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT last_active_date, current_streak, longest_streak
  INTO v_last_date, v_current, v_longest
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF v_last_date IS NULL OR v_last_date < v_today - INTERVAL '1 day' THEN
    IF v_last_date = v_today - INTERVAL '1 day' THEN
      v_current := COALESCE(v_current, 0) + 1;
    ELSE
      v_current := 1;
    END IF;
  ELSIF v_last_date = v_today THEN
    RETURN;
  END IF;

  v_longest := GREATEST(COALESCE(v_longest, 0), v_current);

  UPDATE public.profiles
  SET 
    current_streak = v_current,
    longest_streak = v_longest,
    last_active_date = v_today
  WHERE user_id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_user_streak(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_user_streak(UUID) TO authenticated, service_role;