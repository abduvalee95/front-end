'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Sparkles, Copy, Check, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Lead } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface AILeadResponseProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AILeadResponse({ lead, isOpen, onClose }: AILeadResponseProps) {
  const [copied, setCopied] = useState(false);
  const { messages, status, sendMessage, setMessages } = useChat({});

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleGenerate = async () => {
    if (!lead) return;
    
    // Clear previous messages
    setMessages([]);

    const prompt = `Mijoz (Lead) uchun professional taklif matni tuzib ber. 
Ismi: ${lead.full_name}
Manba: ${lead.source}
Holati: ${lead.status}
Maqsad: Uni kursga yozilishga qiziqtirish. 
Matn juda uzun bo'lmasin, samimiy va professional bo'lsin. O'zbek tilida yoz.`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sendMessage as any)({ role: 'user', content: prompt });
    } catch (error) {
      logger.error('AI Generation Error:', error);
    }
  };

  const aiMessage = messages.find(m => m.role === 'assistant');
  const responseText = aiMessage
    ? (aiMessage.parts
        ?.filter(p => p.type === 'text')
        .map(p => ('text' in p ? (p as { type: 'text'; text: string }).text : ''))
        .join('') ?? '')
    : '';

  const copyToClipboard = () => {
    if (!responseText) return;
    navigator.clipboard.writeText(responseText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] border-border bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="size-5 text-primary-emphasis" />
            AI Lead Assistant
          </DialogTitle>
          <DialogDescription>
            Generate a personalized response for <strong>{lead?.full_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {!responseText && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Send className="size-8 text-primary-emphasis" />
              </div>
              <p className="text-sm text-muted-foreground max-w-[300px]">
                Click the button below to generate a professional marketing message for this lead.
              </p>
              <Button 
                onClick={handleGenerate} 
                className="edu-gradient-primary text-background"
              >
                <Sparkles className="mr-2 size-4" />
                Generate Message
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative min-h-[150px] rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {isLoading && !responseText ? (
                  <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Fikrlayapman...
                  </div>
                ) : (
                  responseText
                )}
                {isLoading && responseText && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={copyToClipboard}
                  disabled={!responseText || isLoading}
                  className={cn(
                    "transition-all",
                    copied ? "bg-success hover:bg-success text-white" : "edu-gradient-primary text-white"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 size-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 size-4" />
                      Copy Message
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
