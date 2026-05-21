import { useRef, useState } from "react";

interface MirrorCardProps {
  read: string;
  score: number;
  onClose: () => void;
}

export function MirrorCard({ read, score, onClose }: MirrorCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Mirror Read",
          text: `"${read}"\n\nPerception score: ${score}\n\nSee yourself the way the world sees you. mirror.app`,
        });
      } else {
        await navigator.clipboard.writeText(
          `"${read}"\n\nPerception score: ${score}\n\nSee yourself the way the world sees you. mirror.app`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm px-6">
      {/* The card itself */}
      <div
        ref={cardRef}
        className="w-full max-w-[340px] bg-[#0d0d0d] rounded-3xl border border-[#C9A84C]/25 p-8 space-y-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#C9A84C] font-medium">Mirror</p>
          <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground/60">Private intelligence</p>
        </div>

        {/* The read */}
        <div className="space-y-3">
          <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground/50">The read</p>
          <p className="font-display text-lg text-foreground/95 leading-relaxed italic">
            &ldquo;{read}&rdquo;
          </p>
        </div>

        {/* Score */}
        <div className="flex items-center justify-between pt-4 border-t border-[#C9A84C]/15">
          <div>
            <p className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground/50">Mirror Score</p>
            <p className="font-display text-3xl text-[#C9A84C] mt-1">{score}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground/60 leading-snug">See yourself</p>
            <p className="text-[10px] text-muted-foreground/60 leading-snug">the way the</p>
            <p className="text-[10px] text-muted-foreground/60 leading-snug">world sees you.</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleShare}
          className="rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/40 text-[#C9A84C] px-6 py-2.5 text-[11px] uppercase tracking-[0.24em] hover:bg-[#C9A84C]/25 transition-colors"
        >
          {copied ? "Copied to clipboard" : "Share your read"}
        </button>
        <button
          onClick={onClose}
          className="rounded-full border border-border/50 text-muted-foreground px-6 py-2.5 text-[11px] uppercase tracking-[0.24em] hover:bg-glass transition-colors"
        >
          Close
        </button>
      </div>

      {/* Instruction */}
      <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-muted-foreground/50">
        Screenshot this card to share
      </p>
    </div>
  );
}
