CREATE TABLE public.dossier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  core_signal TEXT,
  dominant_pattern TEXT,
  recurring_blind_spot TEXT,
  perception_trajectory TEXT,
  social_archetype TEXT,
  archetype_description TEXT,
  relationship_pattern TEXT,
  strength_profile TEXT,
  risk_profile TEXT,
  full_assessment TEXT,
  classification_level TEXT DEFAULT 'BASIC ACCESS',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.dossier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON public.dossier FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.dossier FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.dossier FOR UPDATE USING (auth.uid() = user_id);