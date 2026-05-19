'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useChat } from '@ai-sdk/react';
import { Bot, Send, X, Sparkles, User, Loader2, AlertCircle, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/index';
import { useAuthStore } from '@/store/auth.store';
import { logger } from '@/lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProposalResult = {
  kind: 'proposal';
  action: string;
  summary: string;
  confirmUrl: string;
  confirmMethod: string;
  confirmBody: Record<string, unknown>;
};

type StudentResult = {
  id?: string | number;
  name?: string;
  phone?: string;
  status?: string;
  enrollments?: Array<{ group?: string; course?: string }>;
};

// AI SDK v6 tool part: type = 'tool-{toolName}', flat structure
type DynamicToolOutputPart = {
  type: `tool-${string}`;
  toolCallId: string;
  state: string;
  input: unknown;
  output: unknown;
};


// ─── ProposalCard ─────────────────────────────────────────────────────────────

function ProposalCard({
  proposal,
  onConfirm,
}: {
  proposal: ProposalResult;
  onConfirm: (p: ProposalResult) => Promise<void>;
}) {
  const t = useTranslations('copilot');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleConfirmClick = async () => {
    setState('loading');
    try {
      await onConfirm(proposal);
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 my-1 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">{t('needs_confirm')}</p>
      <p className="text-xs font-semibold text-slate-800">{proposal.summary}</p>
      {state === 'done' ? (
        <p className="text-xs text-emerald-600 font-bold">✓ {t('done')}</p>
      ) : state === 'error' ? (
        <p className="text-xs text-red-500">{t('action_error')}</p>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleConfirmClick}
            disabled={state === 'loading'}
            className="flex-1 rounded-lg bg-violet-600 py-1.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {state === 'loading' ? t('typing') : t('confirm')}
          </button>
          <button
            onClick={() => setState('idle')}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ToolResultCard ───────────────────────────────────────────────────────────

function ToolResultCard({
  part,
  onConfirm,
}: {
  part: DynamicToolOutputPart;
  onConfirm: (p: ProposalResult) => Promise<void>;
}) {
  const t = useTranslations('copilot');
  const result = part.output as Record<string, unknown>;
  // type is 'tool-find_student' → toolName is 'find_student'
  const toolName = (part.type as string).replace(/^tool-/, '');

  // PROPOSAL card (propose_enroll_student, propose_record_payment)
  if (result?.kind === 'proposal') {
    return <ProposalCard proposal={result as ProposalResult} onConfirm={onConfirm} />;
  }

  // STUDENT card
  if (toolName === 'find_student' && result?.found === true) {
    const s = result.student as StudentResult;
    return (
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs space-y-1.5 my-1">
        <div className="flex items-center gap-2">
          <span className="size-7 rounded-lg bg-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-sm">
            {s?.name?.charAt(0) ?? '?'}
          </span>
          <div>
            <p className="font-bold text-slate-800 text-sm">{s?.name}</p>
            <p className="text-slate-500">{s?.phone}</p>
          </div>
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
              s?.status === 'ACTIVE'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {s?.status}
          </span>
        </div>
        {(s?.enrollments?.length ?? 0) > 0 && (
          <div className="pt-1 border-t border-indigo-100">
            {s?.enrollments?.map((e, i) => (
              <p key={i} className="text-slate-500">
                📚 {e.group} {e.course ? `— ${e.course}` : ''}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // UNPAID list
  if (toolName === 'list_unpaid_students') {
    const students =
      (result?.students as Array<{ name: string; phone: string; debt: string | number }>) ?? [];
    if (!students.length)
      return (
        <div className="text-xs text-slate-400 italic my-1">{t('no_debtors')}</div>
      );
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 my-1 space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
          {t('debtors')} ({students.length})
        </p>
        {students.slice(0, 8).map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">{s.name}</span>
            <span className="text-red-600 font-bold">{Number(s.debt).toLocaleString()} KGS</span>
          </div>
        ))}
      </div>
    );
  }

  // SCHEDULE card
  if (toolName === 'get_today_schedule') {
    const groups =
      (result?.groups as Array<{ name: string; course?: string; teacher?: string }>) ?? [];
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 my-1 space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {t('today_lessons')}
        </p>
        {groups.slice(0, 6).map((g, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="size-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span className="font-medium text-slate-700">{g.name}</span>
            {g.teacher && <span className="text-slate-400 ml-auto">{g.teacher}</span>}
          </div>
        ))}
        {!groups.length && <p className="text-xs text-slate-400">{t('no_lessons')}</p>}
      </div>
    );
  }

  // FINANCE card
  if (toolName === 'get_financial_summary') {
    if (result?.error === 'forbidden') return null; // model will explain
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 my-1 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-slate-400">{t('revenue')}</p>
          <p className="font-bold text-emerald-700 text-sm">
            {Number(result?.revenue || 0).toLocaleString()} KGS
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">{t('payments')}</p>
          <p className="font-bold text-slate-700 text-sm">{String(result?.paymentsCount || 0)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">{t('students')}</p>
          <p className="font-bold text-slate-700 text-sm">{String(result?.studentsTotal || 0)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">{t('attendance')}</p>
          <p className="font-bold text-slate-700 text-sm">
            {String(result?.attendanceRate || 0)}%
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AICopilot() {
  const t = useTranslations('copilot');
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const authUser = useAuthStore((s) => s.user);

  const SUGGESTIONS = [
    t('suggestion_1'),
    t('suggestion_2'),
    t('suggestion_3'),
    t('suggestion_4'),
  ];

  const { messages, status, error, sendMessage } = useChat({
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

  const ALLOWED_CONFIRM_PATHS = ['/api/proxy/enrollment', '/api/proxy/payment'];

  const handleConfirm = async (proposal: ProposalResult): Promise<void> => {
    if (!ALLOWED_CONFIRM_PATHS.includes(proposal.confirmUrl)) {
      throw new Error('Invalid confirm URL');
    }
    const res = await fetch(proposal.confirmUrl, {
      method: proposal.confirmMethod,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposal.confirmBody),
    });
    if (!res.ok) throw new Error('Failed');
    // notify model of success
    await sendMessage({
      role: 'user',
      parts: [{ type: 'text' as const, text: `✓ ${proposal.summary} — muvaffaqiyatli bajarildi` }],
    });
  };

  const handleMic = () => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SR = win.webkitSpeechRecognition || win.SpeechRecognition;
    if (!SR) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognition.lang = 'uz-UZ';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript: string = e.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract plain text from message parts
  const getMessageText = (msg: (typeof messages)[number]): string => {
    if (msg.parts && msg.parts.length > 0) {
      return msg.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('');
    }
    return ((msg as unknown) as Record<string, unknown>).content as string || '';
  };

  // Extract tool result parts from a message
  const getDynamicToolParts = (msg: (typeof messages)[number]): DynamicToolOutputPart[] => {
    if (!msg.parts) return [];
    return (msg.parts as unknown as DynamicToolOutputPart[]).filter(
      (p) => p.type.startsWith('tool-') && p.state === 'output-available',
    );
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
                  {t('greeting')} {authUser?.full_name?.split(' ')[0] || 'User'}! 👋
                </p>
                <p className="text-xs text-muted-foreground max-w-[250px] mx-auto mt-1">
                  {t('intro')}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const text = getMessageText(m);
              const toolParts = getDynamicToolParts(m);
              const hasContent = text || toolParts.length > 0;

              if (!hasContent) return null;

              return (
                <div key={m.id} className="space-y-1">
                  {text && (
                    <div
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
                          {m.role === 'user' ? t('you') : 'Copilot'}
                        </span>
                      </div>
                      <div className="leading-relaxed whitespace-pre-wrap">{text}</div>
                    </div>
                  )}
                  {toolParts.map((part, pi) => (
                    <ToolResultCard key={pi} part={part} onConfirm={handleConfirm} />
                  ))}
                </div>
              );
            })
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex w-max max-w-[85%] items-center gap-2 rounded-2xl px-4 py-2.5 text-sm bg-muted text-foreground rounded-bl-none">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('typing')}</span>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              <span>{t('error_prefix')} {error.message}</span>
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
              placeholder={t('placeholder')}
              className="pr-20 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/50"
              disabled={isLoading}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleMic}
              className={`absolute right-10 size-8 rounded-lg ${isListening ? 'text-red-500' : 'text-slate-400'}`}
            >
              <Mic className="size-4" />
            </Button>
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
