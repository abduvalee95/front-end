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

/**
 * Header search.
 *
 * Types in place: the header field *is* the input, and results drop down
 * anchored beneath it. It used to be a fake input that opened a full-screen
 * dimmed dialog with a second, real input floating in the middle of the
 * viewport — so clicking a search box moved you somewhere else and put two
 * search boxes on screen at once.
 */
export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('header');

  const { value, debouncedValue, handleChange, clearSearch, isPending } = useDebounceSearch({ delay: 300 });

  const isEnabled = isOpen && debouncedValue.length >= 2;

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

  const closeResults = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const resetSearch = useCallback(() => {
    clearSearch();
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, [clearSearch]);

  // Cmd+K / Ctrl+K focuses the field rather than opening a separate surface.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dismiss the dropdown on an outside click, the way any inline popover does.
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) closeResults();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, closeResults]);

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
  const showDropdown = isOpen && (hasQuery || value.length > 0);

  const handleSelect = useCallback(
    (href: string) => {
      router.push(href);
      closeResults();
      clearSearch();
      inputRef.current?.blur();
    },
    [router, closeResults, clearSearch],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeResults();
      inputRef.current?.blur();
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
      e.preventDefault();
      handleSelect(flatItems[activeIndex].href);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      {/* Input row.
          Clicking anywhere on the pill focuses the field. That matters on a phone,
          where the collapsed pill is only wide enough for the magnifier and the
          input itself computes to zero width — without this the control would look
          tappable but do nothing. Focus then triggers the header's expand rule. */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex h-10 w-full min-w-11 cursor-text items-center gap-2 rounded-full border px-3 transition-colors',
          isOpen
            ? 'border-border bg-card shadow-card'
            : 'border-transparent bg-muted/40 hover:bg-muted/60',
        )}
      >
        {isLoading && isOpen ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Search className="size-4 shrink-0 text-muted-foreground" />
        )}

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            handleChange(e.target.value);
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('search_placeholder')}
          aria-label={t('search_placeholder')}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          className="min-w-0 flex-1 truncate bg-transparent text-body-sm text-foreground outline-none placeholder:text-muted-foreground"
        />

        {value ? (
          <button
            type="button"
            onClick={resetSearch}
            aria-label={t('search_close')}
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        ) : (
          <kbd className="hidden shrink-0 items-center gap-1 rounded-full border border-border/50 bg-background/80 px-2 py-0.5 text-caption text-muted-foreground sm:flex">
            <Command className="size-3" /> K
          </kbd>
        )}
      </div>

      {/* Results — anchored under the field, no overlay, no second input */}
      {showDropdown && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto overscroll-contain rounded-card border border-border bg-popover shadow-card-hover"
        >
          {!hasQuery && (
            <p className="px-4 py-6 text-center text-body-sm text-muted-foreground">
              {t('search_hint')}
            </p>
          )}

          {hasQuery && !isLoading && !hasResults && (
            <div className="flex flex-col items-center gap-1 px-4 py-6">
              <p className="text-body-sm text-muted-foreground">{t('search_no_results')}</p>
              <p className="text-caption text-muted-foreground">&ldquo;{debouncedValue}&rdquo;</p>
            </div>
          )}

          {groups.map((group) => {
            let groupOffset = 0;
            for (const g of groups) {
              if (g === group) break;
              groupOffset += g.items.length;
            }

            return (
              <div key={group.type} className="py-1.5">
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <span className={cn('rounded-control p-1', group.color)}>{group.icon}</span>
                  <span className="text-caption text-muted-foreground">{group.type}</span>
                </div>

                {group.items.map((item, idx) => {
                  const flatIdx = groupOffset + idx;
                  const isActive = activeIndex === flatIdx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setActiveIndex(flatIdx)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                        isActive ? 'bg-muted' : 'hover:bg-muted/60',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-h4 text-foreground">{item.label}</p>
                        {item.subtitle && (
                          <p className="mt-0.5 truncate text-caption font-normal text-muted-foreground">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                      <ArrowRight
                        className={cn(
                          'size-3.5 shrink-0 transition-opacity',
                          isActive ? 'opacity-60' : 'opacity-20',
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            );
          })}

          {hasResults && (
            <div className="flex items-center gap-4 border-t border-border px-3 py-2 text-caption font-normal text-muted-foreground">
              <span>↑↓ {t('search_navigate')}</span>
              <span>↵ {t('search_open')}</span>
              <span>ESC {t('search_close')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
