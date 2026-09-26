"use client";

import { useMemo, useState } from "react";
import { RRule } from "rrule";
import { useTranslations } from "next-intl";
import useSWR from "swr";

export type CalendarEvent = {
  id: string | null;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  categoryId: string | null;
  rrule: string | null;
};

type Category = { id: string; name: string; color: string };

type RepeatOption = "none" | "daily" | "weekly" | "monthly" | "yearly";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function repeatOptionFromRRule(rrule: string | null): RepeatOption {
  if (!rrule) return "none";
  if (rrule.includes("FREQ=DAILY")) return "daily";
  if (rrule.includes("FREQ=WEEKLY")) return "weekly";
  if (rrule.includes("FREQ=MONTHLY")) return "monthly";
  if (rrule.includes("FREQ=YEARLY")) return "yearly";
  return "none";
}

function rruleFromRepeatOption(option: RepeatOption, dtstart: Date): string | null {
  const freqMap: Record<Exclude<RepeatOption, "none">, number> = {
    daily: RRule.DAILY,
    weekly: RRule.WEEKLY,
    monthly: RRule.MONTHLY,
    yearly: RRule.YEARLY,
  };
  if (option === "none") return null;
  return new RRule({ freq: freqMap[option], dtstart }).toString();
}

export function EventModal({
  event,
  onClose,
  onSaved,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("event");
  const { data: categoriesData } = useSWR<{ categories: Category[] }>("/api/categories", fetcher);
  const categories = useMemo(() => {
    const uniqueCategories = new Map<string, Category>();
    for (const category of categoriesData?.categories ?? []) {
      const existing = uniqueCategories.get(category.name);
      if (!existing || category.id === event.categoryId) {
        uniqueCategories.set(category.name, category);
      }
    }
    return [...uniqueCategories.values()];
  }, [categoriesData, event.categoryId]);

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(event.startsAt));
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(event.endsAt));
  const [allDay, setAllDay] = useState(event.allDay);
  const [categoryId, setCategoryId] = useState(event.categoryId ?? "");
  const [repeat, setRepeat] = useState<RepeatOption>(repeatOptionFromRRule(event.rrule));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const start = new Date(startsAt);
    const payload = {
      title,
      description: description || null,
      startsAt: start.toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      allDay,
      categoryId: categoryId || null,
      rrule: rruleFromRepeatOption(repeat, start),
    };

    const url = event.id ? `/api/events/${event.id}` : "/api/events";
    const method = event.id ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      setError("Erreur lors de l'enregistrement");
      return;
    }
    onSaved();
  }

  async function handleDelete() {
    if (!event.id) return;
    setSaving(true);
    await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-xl">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("title")}
          className="w-full rounded-md border border-black/20 dark:border-white/20 bg-transparent px-3 py-2 text-lg font-medium"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("description")}
          rows={3}
          className="w-full rounded-md border border-black/20 dark:border-white/20 bg-transparent px-3 py-2"
        />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
          {t("allDay")}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm">{t("start")}</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-md border border-black/20 dark:border-white/20 bg-transparent px-2 py-1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm">{t("end")}</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-md border border-black/20 dark:border-white/20 bg-transparent px-2 py-1"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm">{t("category")}</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-black/20 dark:border-white/20 bg-transparent px-2 py-1"
          >
            <option value="">—</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">{t("repeat")}</label>
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as RepeatOption)}
            className="w-full rounded-md border border-black/20 dark:border-white/20 bg-transparent px-2 py-1"
          >
            <option value="none">{t("repeatNone")}</option>
            <option value="daily">{t("repeatDaily")}</option>
            <option value="weekly">{t("repeatWeekly")}</option>
            <option value="monthly">{t("repeatMonthly")}</option>
            <option value="yearly">{t("repeatYearly")}</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <div>
            {event.id && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="text-sm text-red-500 hover:underline"
              >
                {t("delete")}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-black/20 dark:border-white/20 px-3 py-2 text-sm"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !title}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t("save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
