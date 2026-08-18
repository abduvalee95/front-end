'use client';

import { useId, useState } from 'react';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSubjects } from '@/hooks/useSubjects';
import type { Subject } from '@/types/subject';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/index';

interface SubjectComboboxProps {
  /** Currently selected subject names */
  value: string[];
  onChange: (subjects: string[]) => void;
  /** Subjects that will be created on save (new, not yet in DB) */
  onPendingChange?: (pending: string[]) => void;
}

export function SubjectCombobox({ value, onChange, onPendingChange }: SubjectComboboxProps) {
  const t = useTranslations('subjects');
  const { data: orgSubjects = [] } = useSubjects();
  const [open, setOpen] = useState(false);
  /** Ties the trigger's aria-controls to the popup it actually opens. */
  const listboxId = useId();
  const [query, setQuery] = useState('');

  const existingNames = orgSubjects.map((s: Subject) => s.name.toLowerCase());

  const filtered = orgSubjects.filter((s: Subject) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const queryTrimmed = query.trim();
  const canCreate =
    queryTrimmed.length > 0 &&
    !existingNames.includes(queryTrimmed.toLowerCase()) &&
    !value.map(v => v.toLowerCase()).includes(queryTrimmed.toLowerCase());

  const handleSelect = (name: string) => {
    if (!value.includes(name)) {
      const next = [...value, name];
      onChange(next);

      // Track which are new (not in DB)
      if (onPendingChange) {
        const inDb = orgSubjects.some((s: Subject) => s.name === name);
        if (!inDb) {
          // caller tracks pending separately
        }
      }
    }
    setQuery('');
    setOpen(false);
  };

  const handleCreate = () => {
    if (!queryTrimmed) return;
    handleSelect(queryTrimmed);
  };

  const handleRemove = (name: string) => {
    onChange(value.filter(v => v !== name));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          {/* role="combobox" promises a screen reader that this control owns a
              popup and can report its state. It carried aria-expanded but no
              aria-controls, so the popup it expanded was never identified.
              The visible text is only ever the placeholder — selections render
              as badges below — so the accessible name has to say what is
              chosen, or the control announces "empty" with three subjects
              picked. */}
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-haspopup="listbox"
            aria-label={
              value.length > 0
                ? `${t('placeholder')}: ${value.join(', ')}`
                : t('placeholder')
            }
            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-body shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <span className="text-muted-foreground">
              {t('placeholder')}
            </span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent id={listboxId} className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('search_placeholder')}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {filtered.length === 0 && !canCreate && (
                <CommandEmpty>{t('not_found')}</CommandEmpty>
              )}
              {filtered.length > 0 && (
                <CommandGroup heading={t('existing_subjects')}>
                  {filtered.map((subject: Subject) => (
                    <CommandItem
                      key={subject.id}
                      value={subject.name}
                      onSelect={() => handleSelect(subject.name)}
                      disabled={value.includes(subject.name)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-3.5 w-3.5',
                          value.includes(subject.name) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {subject.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {canCreate && (
                <CommandGroup heading={t('new_subject')}>
                  <CommandItem onSelect={handleCreate} className="gap-2 text-primary">
                    <Plus className="h-3.5 w-3.5" />
                    <span>
                      {t('add_subject_name', { name: queryTrimmed })}
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((name) => {
            const isNew = !orgSubjects.some((s: Subject) => s.name === name);
            return (
              <Badge
                key={name}
                variant={isNew ? 'default' : 'secondary'}
                className="gap-1 text-caption"
              >
                {isNew && <Plus className="size-2.5" />}
                {name}
                <button
                  type="button"
                  onClick={() => handleRemove(name)}
                  className="ml-0.5 hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
