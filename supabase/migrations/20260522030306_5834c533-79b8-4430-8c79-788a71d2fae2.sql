CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction TEXT NOT NULL,
  reasoning TEXT,
  category TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  outcome TEXT,
  outcome_note TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON public.predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.predictions FOR UPDATE USING (auth.uid() = user_id);