import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { askMirror } from "@/lib/ai.functions";
import { toast } from "sonner";
import { ArrowUp } from "lucide-react";

export const Route = createFileRoute("/_app/advisor")({ component: Advisor });

const PROMPTS = [
  "How am I coming across here?",
  "What am I not seeing?",
  "Should I send this?",
  "What did they likely felt?",
  "What is the strongest move?",
  "Am I reacting or reading this correctly?",
];

function Advisor() {
  const { user } = useAuth();
  const ask = useServerFn(askMirror);
  const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("advisor_messages").select("role, content").eq("user_id", user.id).order("created_at", { ascending: false }).limit(40)
      .then(({ data }) => {
        const reversed = ((data as any) ?? []).reverse();
        setMsgs(reversed);
        if ((data?.length ?? 0) === 40) setHasMore(true);
      });
  }, [user]);

  const loadMore = async () => {
    if (!user || loadingMore) return;
    setLoadingMore(true);
    const newOffset = offset + 40;
    const { data } = await supabase
      .from("advisor_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(newOffset, newOffset + 39);
    const older = ((data as any) ?? []).reverse();
    setMsgs(m => [...older, ...m]);
    setOffset(newOffset);
    if ((data?.length ?? 0) < 40) setHasMore(false);
    setLoadingMore(false);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput("");
    setMsgs(m => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const r = await ask({ data: { message } });
      setMsgs(m => [...m, { role: "assistant", content: r.reply }]);
    } catch (e: any) {
      toast.error(e.message ?? "Mirror is silent.");
    } finally { setBusy(false); }
  };

  return (
    <main className="flex flex-col min-h-[100dvh] pb-28">
      <header className="px-5 pt-12 pb-3">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Private session</p>
        <h1 className="font-display text-3xl text-gradient mt-1">Ask Mirror.</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3 scrollbar-none">
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full py-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors"
          >
            {loadingMore ? "Loading…" : "Load earlier messages"}
          </button>
        )}
        {msgs.length === 0 && (
          <div className="bg-glass ring-hairline rounded-2xl p-5">
            <p className="font-display text-lg text-gradient">No filler. No disclaimers.</p>
            <p className="mt-2 text-sm text-muted-foreground">Just the read Mirror sees from your patterns.</p>
            <div className="mt-4 space-y-1.5">
              {PROMPTS.map(p => (
                <button key={p} onClick={() => send(p)} className="block w-full text-left text-xs text-foreground/80 bg-secondary/40 rounded-full px-4 py-2.5 hover:bg-secondary/70">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user" ? "bg-foreground text-background" : "bg-glass ring-hairline text-foreground/95"
            }`}>{m.content}</div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-glass ring-hairline rounded-2xl px-4 py-3 text-sm text-muted-foreground animate-pulse-soft">Mirror is reading…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-3 pb-2 pointer-events-none">
        <div className="mx-auto max-w-md pointer-events-auto">
          <form onSubmit={e => { e.preventDefault(); send(); }}
            className="bg-glass ring-hairline rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-2 shadow-glass">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="What do you want Mirror to read?"
              className="flex-1 bg-transparent text-sm focus:outline-none py-2" />
            <button type="submit" disabled={!input.trim() || busy}
              className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-40 active:scale-95">
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
