import { create } from "zustand";
import type { SeriesInterval } from "@/lib/types/api";

export type ReportDays = 7 | 30 | 90;

interface ReportFilters {
  days: ReportDays;
  /** "all" or a branch id. */
  branch: string;
  interval: SeriesInterval;
  setDays: (days: ReportDays) => void;
  setBranch: (branch: string) => void;
  setInterval: (interval: SeriesInterval) => void;
}

/** Filters of the reports page, kept out of the component tree. */
export const useReportFilters = create<ReportFilters>((set) => ({
  days: 30,
  branch: "all",
  interval: "day",
  setDays: (days) => set({ days }),
  setBranch: (branch) => set({ branch }),
  setInterval: (interval) => set({ interval }),
}));
