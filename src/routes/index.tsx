import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight } from "lucide-react";
import { DemoScan } from "@/components/DemoScan";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && user) nav({ to: "/home" }); }, [user, loading, nav]);

  return (
    <main className="relative min-h-screen bg-black">
      <section className="relative min-h-screen flex flex-col px-6 pt-16 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full ring-hairline bg-glass flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-foreground animate-pulse-soft" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.32em]">Mirror</span>
          </div>
          <Link to="/auth" className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Sign in</Link>
        </div>

        <div className="flex-1 flex flex-col justify-center -mt-6 animate-fade-up">
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Private intelligence</p>
          <h1 className="mt-4 font-display text-[44px] leading-[1.02] tracking-tight text-gradient">
            See yourself<br/>the way<br/>the world sees you.
          </h1>
          <p className="mt-6 text-sm text-muted-foreground leading-relaxed max-w-[28ch]">
            Most people never know how they actually come across. Mirror studies the signals people feel — but rarely say out loud.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="group relative overflow-hidden rounded-full px-6 py-4 bg-foreground text-background flex items-center justify-between glow-gold"
            >
              <span className="text-xs uppercase tracking-[0.24em] font-medium">Get your first read — free</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="space-y-3">
              {[
                "You are not invisible. You are unread.",
                "Your blind spots cost you attraction, trust, and influence.",
                "Mirror does not tell you who you are. It shows you how you are received.",
              ].map((line, i) => (
                <div key={i} className="bg-glass ring-hairline rounded-2xl px-4 py-3 text-[13px] text-foreground/85 leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 space-y-10">
        <div className="text-center space-y-2">
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">How it works</p>
          <h2 className="font-display text-3xl text-gradient">Three steps. One truth.</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              step: "01",
              title: "Feed Mirror something real.",
              body: "A conversation. A selfie. A voice note. A post you're about to publish. A situation you can't stop thinking about.",
            },
            {
              step: "02",
              title: "Mirror reads the signals.",
              body: "Not what you said — what it meant. The pattern beneath the pattern. What the other person actually felt. What you're projecting without knowing.",
            },
            {
              step: "03",
              title: "You get one truth and one move.",
              body: "Sharp. Specific. Yours. Not a personality type. Not generic advice. A read on exactly how you're coming across — and what to do about it today.",
            },
          ].map((item) => (
            <div key={item.step} className="bg-glass ring-hairline rounded-2xl p-5 flex gap-4">
              <span className="font-display text-[32px] leading-none text-[#C9A84C]/30 shrink-0">{item.step}</span>
              <div>
                <p className="font-display text-[18px] leading-snug text-gradient">{item.title}</p>
                <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <DemoScan />

      <section className="px-6 py-12 space-y-4">
        <p className="text-center text-[10px] uppercase tracking-[0.32em] text-muted-foreground">What people say</p>
        <div className="space-y-3">
          {[
            { quote: "I showed it to my therapist. She said it was more accurate than six months of sessions.", meta: "Mirror Plus user" },
            { quote: "I finally understand why people keep pulling away. I've been editing myself out of every room.", meta: "Mirror Elite user" },
            { quote: "I used the dating scan before a difficult conversation. Completely changed how it went.", meta: "Mirror user" },
          ].map((t, i) => (
            <div key={i} className="bg-glass ring-hairline rounded-2xl px-5 py-4">
              <p className="text-[13px] text-white/85 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{t.meta}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-10 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">What Mirror reads</p>
          <h2 className="font-display text-2xl text-gradient">Eight ways to see yourself.</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Text Conversation", desc: "What they actually felt" },
            { label: "Selfie & Presence", desc: "First impression read" },
            { label: "Voice & Energy", desc: "How you sound to others" },
            { label: "Dating Dynamic", desc: "Leverage. Attraction. Next move." },
            { label: "Post Analysis", desc: "Will this help or expose you?" },
            { label: "Emotional Pattern", desc: "The fear beneath the feeling" },
            { label: "Social Profile", desc: "How strangers read you" },
            { label: "Decision Perception", desc: "How this choice lands" },
          ].map((item) => (
            <div key={item.label} className="bg-glass ring-hairline rounded-2xl p-3">
              <p className="text-[12px] font-medium text-white leading-snug">{item.label}</p>
              <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-10 pt-4">
        <Link to="/auth" search={{ mode: "signup" }} className="group relative overflow-hidden rounded-full px-6 py-4 bg-foreground text-background flex items-center justify-between glow-gold max-w-[680px] mx-auto">
          <span className="text-xs uppercase tracking-[0.24em] font-medium">Enter Mirror</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Private. Encrypted. Dark by design.</p>
      </section>

      <footer className="px-6 py-10 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full ring-hairline bg-glass flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Mirror</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Privacy</Link>
            <Link to="/auth" className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Sign in</Link>
          </div>
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-muted-foreground/40">
          &copy; {new Date().getFullYear()} Mirror. Private by design.
        </p>
      </footer>
    </main>
  );
}
