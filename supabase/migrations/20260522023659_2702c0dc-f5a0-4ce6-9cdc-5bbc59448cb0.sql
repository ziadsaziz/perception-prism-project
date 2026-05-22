CREATE TABLE public.mirror_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  headline TEXT NOT NULL,
  body TEXT,
  scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mirror_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON public.mirror_feed FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.mirror_feed FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.mirror_feed FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.mirror_feed FOR DELETE USING (auth.uid() = user_id);