CREATE TABLE public.platform_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric TEXT NOT NULL UNIQUE,
  avg_value NUMERIC NOT NULL,
  p25_value NUMERIC NOT NULL,
  p50_value NUMERIC NOT NULL,
  p75_value NUMERIC NOT NULL,
  p90_value NUMERIC NOT NULL,
  sample_count INT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select" ON public.platform_benchmarks FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.refresh_platform_benchmarks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.platform_benchmarks (metric, avg_value, p25_value, p50_value, p75_value, p90_value, sample_count, updated_at)
  SELECT
    'mirror_score',
    ROUND(AVG(mirror_score), 1),
    ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY mirror_score)::numeric, 1),
    ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY mirror_score)::numeric, 1),
    ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY mirror_score)::numeric, 1),
    ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY mirror_score)::numeric, 1),
    COUNT(*),
    now()
  FROM (
    SELECT DISTINCT ON (user_id) mirror_score
    FROM public.perception_scores
    WHERE mirror_score > 0
    ORDER BY user_id, created_at DESC
  ) latest
  ON CONFLICT (metric) DO UPDATE SET
    avg_value = EXCLUDED.avg_value,
    p25_value = EXCLUDED.p25_value,
    p50_value = EXCLUDED.p50_value,
    p75_value = EXCLUDED.p75_value,
    p90_value = EXCLUDED.p90_value,
    sample_count = EXCLUDED.sample_count,
    updated_at = now();

  INSERT INTO public.platform_benchmarks (metric, avg_value, p25_value, p50_value, p75_value, p90_value, sample_count, updated_at)
  SELECT
    'confidence_score',
    ROUND(AVG(confidence_score), 1),
    ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY confidence_score)::numeric, 1),
    ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY confidence_score)::numeric, 1),
    ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY confidence_score)::numeric, 1),
    ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY confidence_score)::numeric, 1),
    COUNT(*),
    now()
  FROM (
    SELECT DISTINCT ON (user_id) confidence_score
    FROM public.perception_scores
    WHERE confidence_score > 0
    ORDER BY user_id, created_at DESC
  ) latest
  ON CONFLICT (metric) DO UPDATE SET
    avg_value = EXCLUDED.avg_value,
    p25_value = EXCLUDED.p25_value,
    p50_value = EXCLUDED.p50_value,
    p75_value = EXCLUDED.p75_value,
    p90_value = EXCLUDED.p90_value,
    sample_count = EXCLUDED.sample_count,
    updated_at = now();
END;
$$;

INSERT INTO public.platform_benchmarks (metric, avg_value, p25_value, p50_value, p75_value, p90_value, sample_count)
VALUES
  ('mirror_score',       520, 380, 520, 670, 790, 1000),
  ('perception_score',   54,  42,  54,  67,  79,  1000),
  ('confidence_score',   56,  43,  56,  69,  81,  1000),
  ('attraction_score',   52,  40,  52,  65,  77,  1000),
  ('authority_score',    50,  38,  50,  63,  75,  1000),
  ('approachability_score', 58, 45, 58, 71, 83, 1000),
  ('authenticity_score', 55,  43,  55,  68,  80,  1000),
  ('emotional_control_score', 51, 39, 51, 64, 76, 1000),
  ('mystery_score',      49,  37,  49,  62,  74,  1000)
ON CONFLICT (metric) DO NOTHING;