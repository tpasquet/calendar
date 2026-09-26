"use client";

import { useCallback, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type NavigateAction, type SlotInfo } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";
import { EventModal, type CalendarEvent } from "@/components/event-modal";
import { useCalendarPreferences } from "@/components/calendar-preferences";

const locales = { fr, en: enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: fr }),
  getDay,
  locales,
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const shortWeekday = (value: Date) => {
  const weekday = format(value, "EEEEEE", { locale: fr });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}.`;
};

const calendarFormats = {
  dateFormat: "d",
  dayFormat: (date: Date) => `${shortWeekday(date)} ${format(date, "d", { locale: fr })}`,
  monthHeaderFormat: "MMMM yyyy",
  dayHeaderFormat: "EEEE dd/MM",
  weekdayFormat: (date: Date) => shortWeekday(date),
  agendaDateFormat: "dd/MM/yyyy",
  agendaTimeFormat: "HH:mm",
  timeGutterFormat: "HH:mm",
};

type CalendarToolbarProps = {
  label: string;
  onNavigate: (action: NavigateAction) => void;
  onNewEvent: () => void;
};

function CalendarToolbar({ label, onNavigate, onNewEvent }: CalendarToolbarProps) {
  const t = useTranslations("calendar");

  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex gap-1">
        <button
          type="button"
          aria-label={t("previous")}
          title={t("previous")}
          onClick={() => onNavigate("PREV")}
          className="rbc-btn-group rounded-md border px-3 py-1 text-lg leading-none"
        >
          ←
        </button>
        <button type="button" onClick={() => onNavigate("TODAY")} className="rbc-btn-group rounded-md border px-3 py-1 text-sm">
          {t("today")}
        </button>
        <button
          type="button"
          aria-label={t("next")}
          title={t("next")}
          onClick={() => onNavigate("NEXT")}
          className="rbc-btn-group rounded-md border px-3 py-1 text-lg leading-none"
        >
          →
        </button>
      </div>
      <div className="flex items-center gap-3">
        <strong className="text-sm font-semibold">{label}</strong>
        <button
          type="button"
          aria-label={t("newEvent")}
          title={t("newEvent")}
          onClick={onNewEvent}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-2xl font-light leading-none text-white hover:bg-indigo-700"
        >
          +
        </button>
      </div>
    </div>
  );
}

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

export function CalendarView() {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const { view, setView, selectedMemberIds } = useCalendarPreferences();
  const [range, setRange] = useState(() => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth() + 2, 0),
    };
  });
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, mutate } = useSWR<{ occurrences: Occurrence[] }>(
    `/api/events?from=${range.from.toISOString()}&to=${range.to.toISOString()}`,
    fetcher,
  );

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
        views={["day", "month", "week", "agenda"]}
        formats={calendarFormats}
        onRangeChange={handleRangeChange}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        components={{
          toolbar: (toolbarProps) => (
            <CalendarToolbar
              label={toolbarProps.label}
              onNavigate={toolbarProps.onNavigate}
              onNewEvent={() =>
                handleSelectSlot({ start: new Date(), end: new Date(), slots: [], action: "click" })
              }
            />
          ),
        }}
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
