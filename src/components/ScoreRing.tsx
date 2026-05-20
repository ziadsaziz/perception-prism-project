interface Props { value: number; label: string; size?: number; }

export function ScoreRing({ value, label, size = 84 }: Props) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} stroke="oklch(0.22 0.01 270)" strokeWidth="4" fill="none" />
          <circle
            cx={size/2} cy={size/2} r={r}
            stroke="url(#g)" strokeWidth="4" strokeLinecap="round" fill="none"
            strokeDasharray={c} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)" }}
          />
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.88 0.13 85)" />
              <stop offset="100%" stopColor="oklch(0.72 0.14 60)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-xl text-gradient">{value}</span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
    </div>
  );
}
