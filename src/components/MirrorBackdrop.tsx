export function MirrorBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-aurora opacity-90" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full blur-[120px] opacity-30"
           style={{ background: "radial-gradient(circle, oklch(0.40 0.15 280), transparent 60%)" }} />
      <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full blur-[140px] opacity-20"
           style={{ background: "radial-gradient(circle, oklch(0.55 0.18 22), transparent 60%)" }} />
      <div className="absolute inset-0 grain" />
    </div>
  );
}
