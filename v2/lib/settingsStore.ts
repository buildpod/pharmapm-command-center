"use client";

import { useState, useEffect, useCallback } from "react";

export type UserIdentity = {
  name: string;                 // display name of the operator
  initials: string;             // ownership key used across the app ("Mine", new-record owner)
};

export type AppSettings = {
  workingDays: number[];        // 0=Sun … 6=Sat; default Mon-Fri
  holidays: string[];           // ISO date strings, sorted
  // G1 — single source of truth for "who am I". "Mine" filters, new-record
  // owner defaults, and decision/audit authorship all read from here instead
  // of a hardcoded "VP".
  identity: UserIdentity;
  ragThresholds: {
    redDelayDays: number;       // default 5
    amberDelayDays: number;     // default 0
  };
  budgetBands: {
    redPct: number;             // default 85
    amberPct: number;           // default 60
  };
};

const STORAGE_KEY = "aivello_settings_v1";

export const DEFAULT_IDENTITY: UserIdentity = { name: "Vineet Pathak", initials: "VP" };

export const DEFAULT_SETTINGS: AppSettings = {
  workingDays: [1, 2, 3, 4, 5],
  holidays: [],
  identity: DEFAULT_IDENTITY,
  ragThresholds: { redDelayDays: 5, amberDelayDays: 0 },
  budgetBands: { redPct: 85, amberPct: 60 },
};

// Non-reactive accessor for the current operator's initials — for code paths
// outside React render (event handlers building records, audit notes). Reads
// the same persisted settings the hook uses.
export function getCurrentUserInitials(): string {
  if (typeof window === "undefined") return DEFAULT_IDENTITY.initials;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_IDENTITY.initials;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return parsed.identity?.initials?.trim() || DEFAULT_IDENTITY.initials;
  } catch {
    return DEFAULT_IDENTITY.initials;
  }
}

function load(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function save(s: AppSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setSettingsState(load());
  }, []);

  const setSettings = useCallback((updater: (prev: AppSettings) => AppSettings) => {
    setSettingsState((prev) => {
      const next = updater(prev);
      save(next);
      return next;
    });
  }, []);

  function setWorkingDays(days: number[]) {
    const unique = Array.from(new Set(days)).sort((a, b) => a - b);
    setSettings((s) => ({ ...s, workingDays: unique }));
  }

  function addHoliday(iso: string): "added" | "duplicate" | "invalid" {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "invalid";
    let result: "added" | "duplicate" = "duplicate";
    setSettings((s) => {
      if (s.holidays.includes(iso)) return s;
      result = "added";
      return { ...s, holidays: [...s.holidays, iso].sort() };
    });
    return result;
  }

  function removeHoliday(iso: string) {
    setSettings((s) => ({ ...s, holidays: s.holidays.filter((h) => h !== iso) }));
  }

  function bulkAddHolidays(isos: string[]): number {
    let added = 0;
    setSettings((s) => {
      const existing = new Set(s.holidays);
      const valid = isos.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !existing.has(d));
      added = valid.length;
      return { ...s, holidays: [...s.holidays, ...valid].sort() };
    });
    return added;
  }

  function setRagThresholds(t: Partial<AppSettings["ragThresholds"]>) {
    setSettings((s) => ({ ...s, ragThresholds: { ...s.ragThresholds, ...t } }));
  }

  function setBudgetBands(b: Partial<AppSettings["budgetBands"]>) {
    setSettings((s) => ({ ...s, budgetBands: { ...s.budgetBands, ...b } }));
  }

  function setIdentity(identity: Partial<UserIdentity>) {
    setSettings((s) => ({ ...s, identity: { ...s.identity, ...identity } }));
  }

  function resetToDefaults() {
    setSettings(() => DEFAULT_SETTINGS);
  }

  return {
    settings,
    setWorkingDays,
    addHoliday,
    removeHoliday,
    bulkAddHolidays,
    setRagThresholds,
    setBudgetBands,
    setIdentity,
    resetToDefaults,
  };
}

// Convenience hook for components that only need the current operator's
// identity (name + initials), reactive to Settings changes.
export function useCurrentUser(): UserIdentity {
  const { settings } = useSettings();
  return settings.identity;
}
