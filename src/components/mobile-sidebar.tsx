"use client";

import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import type { View } from "react-big-calendar";
import { useCalendarPreferences } from "@/components/calendar-preferences";
import { UserSummary } from "@/components/user-summary";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
};

const views: View[] = ["day", "week", "month"];

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const calendarT = useTranslations("calendar");
  const navT = useTranslations("nav");
  const { view, setView, members, selectedMemberIds, toggleMember } = useCalendarPreferences();

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label={navT("closeMenu")}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 md:hidden"
      />
      <aside
        aria-label={navT("menu")}
        className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-xl dark:bg-zinc-950 md:hidden"
      >
        <div className="mb-6 border-b border-black/10 pb-5 dark:border-white/10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Calendrier</h2>
            <button
              type="button"
              aria-label={navT("closeMenu")}
              onClick={onClose}
              className="rounded-md border border-black/20 px-2 py-1 text-lg dark:border-white/20"
            >
              ×
            </button>
          </div>
          <UserSummary />
        </div>

        <section className="border-b border-black/10 pb-5 dark:border-white/10">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {calendarT("viewModes")}
          </h3>
          <div className="grid gap-1">
            {views.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => {
                  setView(option);
                  onClose();
                }}
                className={`rounded-md px-3 py-2 text-left text-sm ${
                  view === option
                    ? "bg-indigo-600 font-medium text-white"
                    : "hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                {calendarT(option)}
              </button>
            ))}
          </div>
        </section>

        <section className="border-b border-black/10 py-5 dark:border-white/10">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {calendarT("calendars")}
          </h3>
          <div className="grid gap-3">
            {members.map((member) => (
              <label key={member.id} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={selectedMemberIds.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                  className="h-4 w-4"
                />
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: member.color }} />
                <span>{member.name}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="pt-5">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            {navT("logout")}
          </button>
        </div>
      </aside>
    </>
  );
}
