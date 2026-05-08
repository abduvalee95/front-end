'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useChat } from '@ai-sdk/react';
import { Bot, Send, X, Sparkles, User, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { logger } from '@/lib/logger';

export function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const authUser = useAuthStore((s) => s.user);

  const {
    messages,
    status,
    error,
    sendMessage,
  } = useChat({
    onError: (err) => {
      logger.error('[AICopilot] Error:', err);
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    try {
      await sendMessage({
        role: 'user',
        parts: [{ type: 'text' as const, text }],
      });
    } catch (err) {
      logger.error('[AICopilot] sendMessage error:', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract text content from message parts
  const getMessageText = (msg: (typeof messages)[number]): string => {
    if (msg.parts && msg.parts.length > 0) {
      return msg.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('');
    }
    return (msg as any).content || '';
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full shadow-2xl transition-all duration-500 hover:scale-110 hover:shadow-indigo-500/50 edu-gradient-primary cursor-pointer',
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100',
        )}
      >
        <Sparkles className="size-6 text-white" />
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-[600px] w-[380px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-background/95 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:w-[400px]',
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between edu-gradient-primary px-4 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Bot className="size-5" />
            </div>
            <div>
              <h3 className="font-bold leading-none tracking-tight">AI Copilot</h3>
              <p className="text-[10px] text-white/80">Powered by Groq</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex size-8 items-center justify-center rounded-lg text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center space-y-3 opacity-70">
              <div className="flex size-16 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                <Sparkles className="size-8" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  Salom, {authUser?.full_name?.split(' ')[0] || 'User'}! 👋
                </p>
                <p className="text-xs text-muted-foreground max-w-[250px] mx-auto mt-1">
                  Men sizning AI yordamchingizman. Talabalar, lidlar yoki moliya haqida so'rang.
                </p>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const text = getMessageText(m);
              if (!text) return null; // skip empty messages

              return (
                <div
                  key={m.id}
                  className={cn(
                    'flex w-max max-w-[85%] flex-col gap-1 rounded-2xl px-4 py-2.5 text-sm',
                    m.role === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none',
                  )}
                >
                  <div className="flex items-center gap-1.5 opacity-70">
                    {m.role === 'user' ? <User className="size-3" /> : <Bot className="size-3" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {m.role === 'user' ? 'Siz' : 'Copilot'}
                    </span>
                  </div>
                  <div className="leading-relaxed whitespace-pre-wrap">{text}</div>
                </div>
              );
            })
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex w-max max-w-[85%] items-center gap-2 rounded-2xl px-4 py-2.5 text-sm bg-muted text-foreground rounded-bl-none">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Javob yozilmoqda…</span>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              <span>Xatolik: {error.message}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-border/50 bg-card p-3">
          <div className="relative flex items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Savol yozing…"
              className="pr-12 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/50"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="absolute right-1 size-8 rounded-lg edu-gradient-btn"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
