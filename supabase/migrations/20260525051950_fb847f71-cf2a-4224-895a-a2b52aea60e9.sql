CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  known_since TEXT,
  key_facts TEXT,
  what_you_want TEXT,
  avatar_color TEXT DEFAULT '#C9A84C',
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_dossier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dominant_pattern TEXT,
  communication_style TEXT,
  when_interested TEXT,
  when_pulling_away TEXT,
  what_triggers_them TEXT,
  what_they_respond_to TEXT,
  honesty_read TEXT,
  attachment_style TEXT,
  what_they_want TEXT,
  relationship_trajectory TEXT,
  full_profile TEXT,
  scan_count INT DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contact_id)
);

CREATE TABLE public.contact_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES public.scans(id) ON DELETE SET NULL,
  input_text TEXT,
  summary TEXT,
  their_mood TEXT,
  their_pattern TEXT,
  relationship_shift TEXT,
  mirror_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction TEXT NOT NULL,
  reasoning TEXT,
  timeframe TEXT,
  outcome TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_dossier ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own" ON public.contacts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own" ON public.contact_dossier FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own" ON public.contact_scans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own" ON public.contact_predictions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_contacts_user ON public.contacts(user_id) WHERE archived = false;
CREATE INDEX idx_contact_scans_contact ON public.contact_scans(contact_id, created_at DESC);
CREATE INDEX idx_contact_predictions_contact ON public.contact_predictions(contact_id, created_at DESC);