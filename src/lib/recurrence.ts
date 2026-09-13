import { RRule } from "rrule";

export type OccurrenceInput = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  rrule: string | null;
};

export type Occurrence = {
  eventId: string;
  startsAt: Date;
  endsAt: Date;
};

// Expands a (possibly recurring) event into its occurrences within [rangeStart, rangeEnd].
export function expandOccurrences(
  event: OccurrenceInput,
  rangeStart: Date,
  rangeEnd: Date,
): Occurrence[] {
  if (!event.rrule) {
    if (event.endsAt < rangeStart || event.startsAt > rangeEnd) return [];
    return [{ eventId: event.id, startsAt: event.startsAt, endsAt: event.endsAt }];
  }

  const durationMs = event.endsAt.getTime() - event.startsAt.getTime();
  const rule = RRule.fromString(event.rrule);
  // rrule needs a dtstart; use the event's own start if not embedded in the string
  const ruleWithStart =
    rule.options.dtstart != null
      ? rule
      : new RRule({ ...rule.origOptions, dtstart: event.startsAt });

  const starts = ruleWithStart.between(
    new Date(rangeStart.getTime() - durationMs),
    rangeEnd,
    true,
  );

  return starts.map((startsAt) => ({
    eventId: event.id,
    startsAt,
    endsAt: new Date(startsAt.getTime() + durationMs),
  }));
}
