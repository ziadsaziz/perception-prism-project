ALTER TABLE public.perception_scores ADD COLUMN IF NOT EXISTS mirror_score INT DEFAULT 0;

CREATE OR REPLACE FUNCTION public.calculate_mirror_score(
  perception INT, confidence INT, attraction INT,
  authority INT, approachability INT, authenticity INT,
  emotional_control INT, mystery INT
) RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  raw NUMERIC;
BEGIN
  raw := (
    perception * 0.20 +
    confidence * 0.15 +
    attraction * 0.13 +
    authority * 0.12 +
    approachability * 0.10 +
    authenticity * 0.12 +
    emotional_control * 0.10 +
    mystery * 0.08
  );
  RETURN LEAST(1000, GREATEST(0, ROUND(raw * 10)));
END;
$$;