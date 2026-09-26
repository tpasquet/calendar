"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { View } from "react-big-calendar";
import useSWR from "swr";

type CalendarMember = {
  id: string;
  email: string;
  name: string;
  color: string;
};

type CalendarPreferencesValue = {
  view: View;
  setView: (view: View) => void;
  members: CalendarMember[];
  selectedMemberIds: string[];
  toggleMember: (memberId: string) => void;
};

const CalendarPreferencesContext = createContext<CalendarPreferencesValue | null>(null);
const fetcher = (url: string) => fetch(url).then((response) => response.json());
const storageKey = "atcalendrier-visible-members";

function getStoredMemberIds(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as string[]) : null;
  } catch {
    return null;
  }
}

export function CalendarPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<View>("month");
  const [visibleMemberIds, setVisibleMemberIds] = useState<string[] | null>(getStoredMemberIds);
  const { data } = useSWR<{ members: CalendarMember[] }>("/api/calendar-members", fetcher);
  const members = useMemo(() => data?.members ?? [], [data]);
  const selectedMemberIds = visibleMemberIds ?? members.map((member) => member.id);

  const toggleMember = useCallback(
    (memberId: string) => {
      setVisibleMemberIds((current) => {
        const selected = current ?? members.map((member) => member.id);
        const next = selected.includes(memberId)
          ? selected.filter((id) => id !== memberId)
          : [...selected, memberId];
        window.localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [members],
  );

  return (
    <CalendarPreferencesContext.Provider
      value={{ view, setView, members, selectedMemberIds, toggleMember }}
    >
      {children}
    </CalendarPreferencesContext.Provider>
  );
}

export function useCalendarPreferences() {
  const context = useContext(CalendarPreferencesContext);
  if (!context) {
    throw new Error("useCalendarPreferences must be used within CalendarPreferencesProvider");
  }
  return context;
}
