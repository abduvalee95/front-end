'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, GraduationCap, Users, UserPlus, X, ArrowRight, Loader2, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useStudents } from '@/hooks/useStudents';
import { useLeads } from '@/hooks/useLeads';
import { useTeachers } from '@/hooks/useTeachers';
import { useTranslations } from '@/i18n/index';

interface ResultItem {
  id: string;
  label: string;
  subtitle?: string;
  href: string;
}

interface ResultGroup {
  type: string;
  icon: React.ReactNode;
  color: string;
  items: ResultItem[];
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('header');

  const { value, debouncedValue, handleChange, clearSearch, isPending } = useDebounceSearch({ delay: 300 });

  const isEnabled = open && debouncedValue.length >= 2;

  const { data: studentsData, isLoading: studentsLoading } = useStudents(
    { search: debouncedValue, limit: 4 },
    isEnabled,
  );

  const { data: leadsData, isLoading: leadsLoading } = useLeads(
    { search: debouncedValue, limit: 4 },
    isEnabled,
  );

  const { data: teachersData, isLoading: teachersLoading } = useTeachers(
    { search: debouncedValue, limit: 4 },
    isEnabled,
  );

  const isLoading = isPending || studentsLoading || leadsLoading || teachersLoading;

  const openSearch = useCallback(() => {
    setOpen(true);
    setActiveIndex(-1);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    clearSearch();
  }, [clearSearch]);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSearch]);

  // Auto-focus on open
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Build result groups
  const groups: ResultGroup[] = [];

  if (studentsData?.items?.length) {
    groups.push({
      type: t('search_students'),
      icon: <GraduationCap className="size-3" />,
      color: 'text-primary-emphasis bg-primary/10',
      items: studentsData.items.slice(0, 4).map((s) => ({
        id: s.id,
        label: s.name,
        subtitle: s.phone,
        href: '/students',
      })),
    });
  }

  if (leadsData?.items?.length) {
    groups.push({
      type: t('search_leads'),
      icon: <Users className="size-3" />,
      color: 'text-success-emphasis bg-success/10',
      items: leadsData.items.slice(0, 4).map((l) => ({
        id: l.id,
        label: l.full_name,
        subtitle: l.phone,
        href: '/leads',
      })),
    });
  }

  if (teachersData?.items?.length) {
    groups.push({
      type: t('search_teachers'),
      icon: <UserPlus className="size-3" />,
      color: 'text-primary-emphasis bg-primary/10',
      items: teachersData.items.slice(0, 4).map((tc) => ({
        id: tc.id,
        label: tc.full_name,
        subtitle: tc.subjects?.join(', ') || tc.phone,
        href: '/teachers',
      })),
    });
  }

  // Flat list for keyboard navigation
  const flatItems = groups.flatMap((g) => g.items);
  const hasQuery = debouncedValue.length >= 2;
  const hasResults = flatItems.length > 0;

  const handleSelect = useCallback(
    (href: string) => {
      router.push(href);
      closeSearch();
    },
    [router, closeSearch],
  );

  // Keyboard navigation inside palette
  const handleKeyDownPalette = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeSearch();
      return;
    }
    if (!hasResults) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i < flatItems.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      handleSelect(flatItems[activeIndex].href);
    }
  };

  return (
    <>
      {/* Search Trigger.
          `min-w-0` is required alongside `w-full`: as an implicit flex item of
          its parent header row, this div's default flex-basis would otherwise
          be computed from `width: 100%` *before* shrinking, letting it request
          more room than the row actually has and visually overlap the action
          icons on a narrow viewport instead of shrinking to fit. */}
      <div
        className="relative w-full min-w-0 group cursor-text"
        onClick={openSearch}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && openSearch()}
        aria-label="Open search"
      >
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="size-4 text-muted-foreground group-hover:text-primary-emphasis transition-colors" />
        </div>
        <div className="w-full h-10 pl-11 pr-4 sm:pr-16 flex items-center bg-muted/30 hover:bg-muted/50 border border-transparent rounded-full text-sm text-muted-foreground/60 font-medium transition-all select-none truncate">
          {t('search_placeholder')}
        </div>
        <div className="absolute inset-y-0 right-2 hidden sm:flex items-center pointer-events-none">
          <kbd className="flex items-center gap-1 px-2 py-0.5 text-caption font-bold text-muted-foreground bg-background/80 border border-border/50 rounded-full shadow-sm">
            <Command className="size-3" /> K
          </kbd>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh]"
          onClick={closeSearch}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-overlay/50 backdrop-blur-sm" />

          {/* Palette */}
          <div
            className="relative w-full max-w-xl mx-4 bg-background/98 backdrop-blur-2xl rounded-2xl border border-border/50 shadow-card overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDownPalette}
            role="dialog"
            aria-label="Global search"
          >
            {/* Input Row */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-border/30">
              {isLoading ? (
                <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />
              ) : (
                <Search className="size-4 text-muted-foreground shrink-0" />
              )}
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => {
                  handleChange(e.target.value);
                  setActiveIndex(-1);
                }}
                placeholder={t('search_placeholder')}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 font-medium text-foreground"
              />
              {value && (
                <button
                  onClick={() => { clearSearch(); setActiveIndex(-1); }}
                  className="size-5 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <X className="size-3" />
                </button>
              )}
              <kbd className="hidden sm:flex items-center text-caption font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md border border-border/50 shrink-0">
                ESC
              </kbd>
            </div>

            {/* Body */}
            <div ref={listRef} className="max-h-[420px] overflow-y-auto overscroll-contain">
              {/* Empty / hint state */}
              {!hasQuery && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Search className="size-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground/50 font-medium">{t('search_hint')}</p>
                </div>
              )}

              {/* No results */}
              {hasQuery && !isLoading && !hasResults && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <p className="text-sm text-muted-foreground/60 font-medium">{t('search_no_results')}</p>
                  <p className="text-xs text-muted-foreground/40">&ldquo;{debouncedValue}&rdquo;</p>
                </div>
              )}

              {/* Results */}
              {groups.map((group) => {
                let groupOffset = 0;
                for (const g of groups) {
                  if (g === group) break;
                  groupOffset += g.items.length;
                }

                return (
                  <div key={group.type} className="py-2">
                    {/* Group header */}
                    <div className="px-4 py-1.5 flex items-center gap-2">
                      <span className={cn('p-1 rounded-md text-caption', group.color)}>
                        {group.icon}
                      </span>
                      <span className="text-caption font-bold uppercase tracking-widest text-muted-foreground/50">
                        {group.type}
                      </span>
                    </div>

                    {/* Items */}
                    {group.items.map((item, idx) => {
                      const flatIdx = groupOffset + idx;
                      const isActive = activeIndex === flatIdx;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.href)}
                          onMouseEnter={() => setActiveIndex(flatIdx)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left',
                            isActive ? 'bg-muted/60' : 'hover:bg-muted/40',
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-body-sm font-semibold text-foreground truncate leading-snug">
                              {item.label}
                            </p>
                            {item.subtitle && (
                              <p className="text-caption text-muted-foreground truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                          <ArrowRight className={cn('size-3.5 shrink-0 transition-opacity', isActive ? 'opacity-60' : 'opacity-20')} />
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Footer hint */}
              {hasResults && (
                <div className="px-4 py-2.5 border-t border-border/20 flex items-center gap-4 text-caption text-muted-foreground/40 font-medium">
                  <span>↑↓ {t('search_navigate')}</span>
                  <span>↵ {t('search_open')}</span>
                  <span>ESC {t('search_close')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
