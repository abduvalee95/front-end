import { create } from 'zustand';
import { format, subDays, subMonths, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export type DateRangePreset = 'week' | 'month' | 'year' | 'custom';

interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

interface DashboardState {
  preset: DateRangePreset;
  dateRange: DateRange;
  setPreset: (preset: DateRangePreset) => void;
  setDateRange: (from: string, to: string) => void;
}

const getPresetDates = (preset: DateRangePreset): DateRange => {
  const today = new Date();
  switch (preset) {
    case 'week':
      return {
        from: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        to: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      };
    case 'month':
      return {
        from: format(startOfMonth(today), 'yyyy-MM-dd'),
        to: format(endOfMonth(today), 'yyyy-MM-dd'),
      };
    case 'year':
      return {
        from: format(startOfYear(today), 'yyyy-MM-dd'),
        to: format(endOfYear(today), 'yyyy-MM-dd'),
      };
    case 'custom':
    default:
      return {
        from: format(subDays(today, 30), 'yyyy-MM-dd'),
        to: format(today, 'yyyy-MM-dd'),
      };
  }
};

export const useDashboardStore = create<DashboardState>((set) => ({
  preset: 'month',
  dateRange: getPresetDates('month'),
  setPreset: (preset) => set({ preset, dateRange: getPresetDates(preset) }),
  setDateRange: (from, to) => set({ preset: 'custom', dateRange: { from, to } }),
}));
