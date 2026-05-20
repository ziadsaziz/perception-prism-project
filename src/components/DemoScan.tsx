import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

const READ_TEXT = "You come across like someone who has already decided how a situation will go — before it does.";

const TRUTH_LINES = [
  "You read rooms faster than most people. That's not the problem.",
  "The problem is what you do with that read — you pre-adjust.",
  "You soften something you were about to say. You pull back an instinct that was correct.",
  "You perform a version of yourself that's slightly smaller than the one you walked in with.",
  "People don't see the full version of you. They see the edited version.",
  "And the edited version, while polished, doesn't land the way the real one would.",
];

const TRUTH_BLUR = [0, 0, 3, 4, 5, 6];

const BLIND_SPOT = "You think the adjustment protects you. It doesn't. It creates distance. The people who matter most to you are reacting to a signal you're sending without knowing — that you don't fully trust the room with who you actually are.";

const FIRST_MOVE = "Say the first thing. Not the second. Not the safe version. The one that came before you edited it. Do it once today and watch what happens.";

export function DemoScan() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [typed, setTyped] = useState("");
  const [revealRest, setRevealRest] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !hasStartedRef.current) {
          hasStartedRef.current = true;
          setVisible(true);
          io.disconnect();
        }
      }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(READ_TEXT.slice(0, i));
      if (i >= READ_TEXT.length) {
        clearInterval(id);
        setTimeout(() => setRevealRest(true), 250);
      }
    }, 35);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <section className="bg-black px-6 py-20">
      <p className="text-center text-[12px] tracking-[0.42em] uppercase text-white/40">
        Live signal — example read
      </p>

      <div
        ref={ref}
        className="mx-auto mt-6 max-w-[680px] rounded-2xl bg-[#111111] border-t-2 border-t-[#C9A84C] border-x border-b border-white/[0.06] px-6 sm:px-10 py-10 transition-opacity duration-500"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <Label>The read</Label>
        <p className="mt-3 text-white text-[16px] sm:text-[17px] leading-[1.6] font-display tracking-tight min-h-[3em]">
          {typed}
        </p>

        <div
          className="transition-opacity duration-700"
          style={{ opacity: revealRest ? 1 : 0 }}
        >
          <div className="mt-8">
            <Label>The truth</Label>
            <div className="mt-3 space-y-2">
              {TRUTH_LINES.map((line, i) => (
                <p
                  key={i}
                  className="text-white text-[15px] leading-[1.8] select-none"
                  style={{ filter: TRUTH_BLUR[i] ? `blur(${TRUTH_BLUR[i]}px)` : undefined }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <Label>The blind spot</Label>
            <p
              className="mt-3 text-white text-[15px] leading-[1.8] select-none"
              style={{ filter: "blur(7px)" }}
            >
              {BLIND_SPOT}
            </p>
          </div>

          <div className="mt-8">
            <Label>The first move</Label>
            <p
              className="mt-3 text-white text-[15px] leading-[1.8] select-none"
              style={{ filter: "blur(7px)" }}
            >
              {FIRST_MOVE}
            </p>
          </div>

          <div className="mt-12 flex flex-col items-center text-center">
            <LockIcon />
            <p className="mt-4 text-white text-[16px]">This is a partial read.</p>
            <p className="mt-1 text-[13px] text-[#888]">
              Mirror only shows the full picture to the person it's reading.
            </p>

            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="mt-6 inline-block rounded-lg bg-[#1A1A1A] border border-[#C9A84C] text-[#C9A84C] px-8 py-3.5 text-[15px] tracking-wide transition-colors duration-200 hover:bg-[rgba(201,168,76,0.08)]"
            >
              Unlock your full read
            </Link>

            <p className="mt-4 text-[11px] text-[#555]">
              Free. No card required. 3 scans included.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-8 sm:gap-12 flex-wrap">
        {[
          { n: "41,000+", l: "reads completed" },
          { n: "94%", l: "said it felt accurate" },
          { n: "3.2x", l: "daily return rate" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-white text-[15px] font-medium">{s.n}</div>
            <div className="mt-1 text-[12px] text-white/40">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] tracking-[0.42em] uppercase text-[#C9A84C]">{children}</p>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
