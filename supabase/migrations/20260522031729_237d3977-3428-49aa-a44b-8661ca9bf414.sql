ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by TEXT,
  ADD COLUMN IF NOT EXISTS bonus_scans INT DEFAULT 0;

CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  bonus_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_select" ON public.referrals FOR SELECT USING (auth.uid() = referrer_user_id);

CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  LOOP
    v_code := upper(substr(md5(p_user_id::text || random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  UPDATE public.profiles SET referral_code = v_code WHERE user_id = p_user_id;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_referral(p_referred_user_id UUID, p_referral_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_already_referred BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_referred_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT user_id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NULL OR v_referrer_id = p_referred_user_id THEN
    RETURN false;
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referred_user_id = p_referred_user_id)
  INTO v_already_referred;

  IF v_already_referred THEN RETURN false; END IF;

  INSERT INTO public.referrals (referrer_user_id, referred_user_id, referral_code, bonus_granted)
  VALUES (v_referrer_id, p_referred_user_id, p_referral_code, true);

  UPDATE public.profiles SET bonus_scans = COALESCE(bonus_scans, 0) + 10
  WHERE user_id = v_referrer_id;

  UPDATE public.profiles SET bonus_scans = COALESCE(bonus_scans, 0) + 10, referred_by = p_referral_code
  WHERE user_id = p_referred_user_id;

  RETURN true;
END;
$$;