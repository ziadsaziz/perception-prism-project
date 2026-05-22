ALTER TABLE public.daily_checkins
  ADD COLUMN IF NOT EXISTS mood TEXT,
  ADD COLUMN IF NOT EXISTS energy_level INT,
  ADD COLUMN IF NOT EXISTS what_happened TEXT,
  ADD COLUMN IF NOT EXISTS checkin_completed BOOLEAN DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS daily_checkins_user_date_uniq ON public.daily_checkins(user_id, date);