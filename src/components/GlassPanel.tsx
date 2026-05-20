import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassPanel({ children, className, glow = false }: { children: ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={cn(
      "relative rounded-3xl bg-glass shadow-glass ring-hairline overflow-hidden",
      glow && "glow-gold",
      className
    )}>
      {children}
    </div>
  );
}
