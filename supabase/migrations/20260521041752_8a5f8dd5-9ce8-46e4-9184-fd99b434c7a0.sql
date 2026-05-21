CREATE TABLE public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  dominant_pattern TEXT,
  blind_spot TEXT,
  perception_shift TEXT,
  full_report TEXT NOT NULL,
  score_delta INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON public.weekly_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.weekly_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.weekly_reports FOR UPDATE USING (auth.uid() = user_id);