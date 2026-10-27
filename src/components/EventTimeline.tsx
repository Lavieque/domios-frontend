import { useEffect, useState } from "react";
import { getEvents } from "../api/client";
import type { DomainEventLogEntryDto } from "../api/types";

interface EventTimelineProps {
  aggregateType: string;
  aggregateId: string;
}

const eventLabels: Record<string, string> = {
  ProductCreated: "Produto criado",
  ProductUpdated: "Produto atualizado",
  ProductDiscontinued: "Produto descontinuado",
  ProductSubstituted: "Substituído por outro produto",
  ProductIngredientLinked: "Ligado a um ingrediente",
  ProductIngredientUnlinked: "Desligado do ingrediente",
};

export function EventTimeline({ aggregateType, aggregateId }: EventTimelineProps) {
  const [events, setEvents] = useState<DomainEventLogEntryDto[] | null>(null);

  useEffect(() => {
    setEvents(null);
    getEvents(aggregateType, aggregateId).then(setEvents);
  }, [aggregateType, aggregateId]);

  if (events === null) {
    return <p className="muted loading">A carregar histórico…</p>;
  }

  if (events.length === 0) {
    return <p className="empty-state">Sem eventos registados.</p>;
  }

  return (
    <ul className="event-timeline">
      {events.map((event) => (
        <li key={event.eventId}>
          <details>
            <summary>
              <strong>{eventLabels[event.eventType] ?? event.eventType}</strong>
              <span className="muted">{new Date(event.occurredOn).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" })}</span>
            </summary>
            <pre>{JSON.stringify(JSON.parse(event.payload), null, 2)}</pre>
          </details>
        </li>
      ))}
    </ul>
  );
}
