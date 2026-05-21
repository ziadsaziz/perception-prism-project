interface ScoreRingProps {
  value: number;
  label: string;
  locked?: boolean;
  delta?: number;
}

export function ScoreRing({ value, label, locked = false, delta }: ScoreRingProps) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const fill = locked ? 0 : (value / 100) * circ;
  const color = locked
    ? "rgba(255,255,255,0.08)"
    : value >= 70
    ? "#C9A84C"
    : value >= 45
    ? "rgba(255,255,255,0.6)"
    : "#8B0000";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-12 w-12">
        <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
          <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
          <circle
            cx="24" cy="24" r={r} fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {locked ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          ) : (
            <span className="text-[11px] font-medium text-white leading-none" ref={el => { if (el) navigator.vibrate?.(6); }}>{value}</span>
          )}
        </div>
        {delta !== undefined && delta !== 0 && !locked && (
          <div className={`absolute -top-1 -right-1 text-[8px] font-medium rounded-full px-1 ${delta > 0 ? "text-[#C9A84C]" : "text-red-400"}`}>
            {delta > 0 ? `+${delta}` : delta}
          </div>
        )}
      </div>
      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground text-center leading-tight">
        {locked ? "——" : label}
      </span>
    </div>
  );
}
