import { useEffect, useState } from "react";
import { getEvents } from "../api/client";
import type { DomainEventLogEntryDto } from "../api/types";

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
    return <p className="muted">A carregar histórico…</p>;
  }

  if (events.length === 0) {
    return <p className="muted">Sem eventos registados.</p>;
  }

  return (
    <ul className="event-timeline">
      {events.map((event) => (
        <li key={event.eventId}>
          <details>
            <summary>
              <strong>{event.eventType}</strong> — {new Date(event.occurredOn).toLocaleString("pt-PT")}
            </summary>
            <pre>{JSON.stringify(JSON.parse(event.payload), null, 2)}</pre>
          </details>
        </li>
      ))}
    </ul>
  );
}
