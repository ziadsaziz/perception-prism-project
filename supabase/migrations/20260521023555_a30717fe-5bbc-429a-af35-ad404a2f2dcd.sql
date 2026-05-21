CREATE TABLE public.daily_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read TEXT NOT NULL,
  mission TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  seen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON public.daily_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.daily_reads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.daily_reads FOR UPDATE USING (auth.uid() = user_id);