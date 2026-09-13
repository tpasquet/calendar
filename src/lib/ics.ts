import type { Event, Category } from "@/generated/prisma";

type IcsEvent = Event & { category: Category | null };

function formatIcsDate(date: Date, allDay: boolean): string {
  if (allDay) {
    return date.toISOString().slice(0, 10).replace(/-/g, "");
  }
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// Builds a standard iCalendar (RFC 5545) feed from the shared events.
export function buildIcsCalendar(events: IcsEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//atcalendar//atcalendar//FR",
    "CALSCALE:GREGORIAN",
  ];

  for (const event of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@atcalendar.fr`);
    lines.push(`DTSTAMP:${formatIcsDate(event.createdAt, false)}`);
    lines.push(
      `DTSTART${event.allDay ? ";VALUE=DATE" : ""}:${formatIcsDate(event.startsAt, event.allDay)}`,
    );
    lines.push(
      `DTEND${event.allDay ? ";VALUE=DATE" : ""}:${formatIcsDate(event.endsAt, event.allDay)}`,
    );
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }
    if (event.category) {
      lines.push(`CATEGORIES:${escapeIcsText(event.category.name)}`);
    }
    if (event.rrule) {
      // rrule.js RRule.toString() outputs "DTSTART:...\nRRULE:...", keep only the RRULE part.
      const ruleLine = event.rrule
        .split("\n")
        .find((line) => line.startsWith("RRULE:"));
      if (ruleLine) lines.push(ruleLine);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
