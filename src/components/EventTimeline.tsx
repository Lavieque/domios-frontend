import { useEffect, useState } from "react";
import { getEvents } from "../api/client";
import type { DomainEventLogEntryDto } from "../api/types";
import { eventDetail, eventLabel } from "../history/events";
import { localeOf } from "../i18n/format";
import { tr } from "../i18n";

interface EventTimelineProps {
  aggregateType: string;
  aggregateId: string;
}

export function EventTimeline({ aggregateType, aggregateId }: EventTimelineProps) {
  const [events, setEvents] = useState<DomainEventLogEntryDto[] | null>(null);

  useEffect(() => {
    setEvents(null);
    getEvents(aggregateType, aggregateId).then(setEvents);
  }, [aggregateType, aggregateId]);

  if (events === null) {
    return <p className="muted loading">{tr().ui.timeline.loading}</p>;
  }

  if (events.length === 0) {
    return <p className="empty-state">{tr().ui.timeline.empty}</p>;
  }

  return (
    <ul className="event-timeline">
      {events.map((event) => {
        const detail = eventDetail(event.payload);
        return (
          <li key={event.eventId}>
            <strong>{detail ? `${eventLabel(event.eventType)}: ${detail}` : eventLabel(event.eventType)}</strong>
            <span className="muted">{new Date(event.occurredOn).toLocaleString(localeOf(), { dateStyle: "medium", timeStyle: "short" })}</span>
          </li>
        );
      })}
    </ul>
  );
}
