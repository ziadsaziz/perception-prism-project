ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_selfie_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_voice_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_social_used BOOLEAN DEFAULT false;