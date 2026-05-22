ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN DEFAULT false;