"use client";

import { useCallback, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type SlotInfo, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";
import { EventModal, type CalendarEvent } from "@/components/event-modal";

const locales = { fr, en: enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: fr }),
  getDay,
  locales,
});

type Occurrence = {
  eventId: string;
  startsAt: string;
  endsAt: string;
  event: {
    id: string;
    title: string;
    description: string | null;
    allDay: boolean;
    rrule: string | null;
    categoryId: string | null;
    category: { id: string; name: string; color: string } | null;
    owner: { id: string; name: string; color: string };
  };
};

type CalendarMember = {
  id: string;
  email: string;
  name: string;
  color: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CalendarView() {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const [range, setRange] = useState(() => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth() + 2, 0),
    };
  });
  const [view, setView] = useState<View>("month");
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [visibleMemberIds, setVisibleMemberIds] = useState<string[] | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem("atcalendrier-visible-members");
    return stored ? (JSON.parse(stored) as string[]) : null;
  });
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, mutate } = useSWR<{ occurrences: Occurrence[] }>(
    `/api/events?from=${range.from.toISOString()}&to=${range.to.toISOString()}`,
    fetcher,
  );
  const { data: membersData } = useSWR<{ members: CalendarMember[] }>("/api/calendar-members", fetcher);
  const members = useMemo(() => membersData?.members ?? [], [membersData]);
  const selectedMemberIds = visibleMemberIds ?? members.map((member) => member.id);

  const events = useMemo(
    () =>
      (data?.occurrences ?? [])
        .filter((occ) => selectedMemberIds.includes(occ.event.owner.id))
        .map((occ) => ({
        id: occ.eventId,
        title: occ.event.title,
        start: new Date(occ.startsAt),
        end: new Date(occ.endsAt),
        allDay: occ.event.allDay,
        resource: occ.event,
        })),
    [data, selectedMemberIds],
  );

  const toggleMember = useCallback((memberId: string) => {
    setVisibleMemberIds((current) => {
      const next = (current ?? members.map((member) => member.id)).includes(memberId)
        ? (current ?? members.map((member) => member.id)).filter((id) => id !== memberId)
        : [...(current ?? members.map((member) => member.id)), memberId];
      window.localStorage.setItem("atcalendrier-visible-members", JSON.stringify(next));
      return next;
    });
  }, [members]);

  type CalendarViewEvent = (typeof events)[number];

  const handleRangeChange = useCallback((newRange: Date[] | { start: Date; end: Date }) => {
    if (Array.isArray(newRange)) {
      setRange({ from: newRange[0], to: newRange[newRange.length - 1] });
    } else {
      setRange({ from: newRange.start, to: newRange.end });
    }
  }, []);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelected({
      id: null,
      title: "",
      description: "",
      startsAt: slotInfo.start,
      endsAt: slotInfo.end,
      allDay: slotInfo.action === "select" && slotInfo.slots.length > 1,
      categoryId: null,
      rrule: null,
    });
    setModalOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarViewEvent) => {
    setSelected({
      id: event.resource.id,
      title: event.resource.title,
      description: event.resource.description ?? "",
      startsAt: event.start,
      endsAt: event.end,
      allDay: event.resource.allDay,
      categoryId: event.resource.categoryId,
      rrule: event.resource.rrule,
    });
    setModalOpen(true);
  }, []);

  return (
    <div className="h-[80vh]">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => handleSelectSlot({ start: new Date(), end: new Date(), slots: [], action: "click" })}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + {t("newEvent")}
        </button>
        <fieldset className="flex flex-wrap items-center gap-3" aria-label={t("calendars")}>
          <legend className="sr-only">{t("calendars")}</legend>
          {members.map((member) => (
            <label key={member.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedMemberIds.includes(member.id)}
                onChange={() => toggleMember(member.id)}
              />
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: member.color }} />
              {member.name}
            </label>
          ))}
        </fieldset>
      </div>

      <Calendar
        localizer={localizer}
        culture={locale}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={calendarDate}
        onNavigate={setCalendarDate}
        view={view}
        onView={setView}
        views={["month", "week", "agenda"]}
        onRangeChange={handleRangeChange}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={(event: CalendarViewEvent) => ({
          style: {
            backgroundColor: event.resource.category?.color ?? event.resource.owner.color,
          },
        })}
        style={{ height: "100%" }}
        messages={{
          month: t("month"),
          week: t("week"),
          agenda: t("agenda"),
          today: t("today"),
          previous: t("previous"),
          next: t("next"),
        }}
      />

      {modalOpen && selected && (
        <EventModal
          event={selected}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            mutate();
          }}
        />
      )}
    </div>
  );
}
