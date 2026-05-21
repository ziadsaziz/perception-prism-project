ALTER TABLE public.daily_checkins ADD COLUMN IF NOT EXISTS move_completed BOOLEAN DEFAULT false;
ALTER TABLE public.daily_checkins ADD COLUMN IF NOT EXISTS date DATE;
CREATE UNIQUE INDEX IF NOT EXISTS daily_checkins_user_date ON public.daily_checkins(user_id, date);