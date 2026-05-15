"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { aiService } from "@/lib/api/ai.service";
import { extractApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Namaste! I'm your Nepal travel guide. Tell me what you're after — duration, budget, season, group size — and I'll suggest tours from our catalog.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedSlugs, setSuggestedSlugs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, pending]);

  const send = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const text = draft.trim();
      if (!text || pending) return;
      const next: ChatMessage[] = [...messages, { role: "user", content: text }];
      setMessages(next);
      setDraft("");
      setPending(true);
      setError(null);
      try {
        const res = await aiService.chat(next);
        setMessages([...next, { role: "assistant", content: res.reply }]);
        setSuggestedSlugs(res.suggestedSlugs);
      } catch (err) {
        setError(extractApiError(err, "Chat is unavailable right now"));
      } finally {
        setPending(false);
      }
    },
    [draft, messages, pending]
  );

  const goToPackage = useCallback(
    (slug: string) => {
      setOpen(false);
      router.push(`/destinations?slug=${encodeURIComponent(slug)}`);
    },
    [router]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open AI travel chat"}
        className={cn(
          "fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-105",
          open ? "bg-ink" : "bg-brand hover:bg-brand-dark"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <header className="flex items-center gap-2 border-b border-black/5 bg-gradient-to-r from-brand to-brand-dark px-4 py-3 text-white">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-bold leading-tight">
                Travel Assistant
              </h3>
              <p className="text-[11px] opacity-80">Ask for tour ideas</p>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-soft/60 px-4 py-4"
            style={{ maxHeight: "55vh", minHeight: "260px" }}
          >
            {messages.map((m, idx) => (
              <Bubble key={idx} message={m} />
            ))}
            {pending && (
              <div className="flex items-center gap-1 text-xs text-muted">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand [animation-delay:240ms]" />
                <span className="ml-1">Thinking…</span>
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                {error}
              </div>
            )}
          </div>

          {suggestedSlugs.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-black/5 bg-white px-4 py-2">
              {suggestedSlugs.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => goToPackage(slug)}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-light px-3 py-1 text-[11px] font-semibold text-brand-dark transition hover:bg-brand hover:text-white"
                >
                  View {slug}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={send} className="flex items-center gap-2 border-t border-black/5 bg-white px-3 py-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              placeholder="Ask about tours…"
              className="flex-1 rounded-full border border-black/10 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
              disabled={pending}
              aria-label="Chat message"
            />
            <button
              type="submit"
              disabled={pending || draft.trim().length === 0}
              aria-label="Send"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-brand text-white"
            : "rounded-bl-sm bg-white text-ink ring-1 ring-black/5"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
