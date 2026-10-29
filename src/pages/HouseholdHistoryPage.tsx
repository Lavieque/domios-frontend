import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHouseholdTimeline } from "../api/households";
import type { DomainEventLogEntryDto, PagedResult } from "../api/types";
import { describeError } from "../auth/errors";
import { Pagination } from "../components/Pagination";
import { eventDetail, eventLabel, eventLink, timelineAreas } from "../history/events";
import { useEventNames } from "../history/useEventNames";
import { HouseholdGate } from "../household/HouseholdGate";

const NO_EVENTS: DomainEventLogEntryDto[] = [];
const when = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" });

export function HouseholdHistoryPage() {
  return <HouseholdGate>{(household) => <HouseholdHistory householdId={household.householdId} name={household.name} />}</HouseholdGate>;
}

function HouseholdHistory({ householdId, name }: { householdId: string; name: string }) {
  const [area, setArea] = useState(timelineAreas[0].label);
  const areaOption = timelineAreas.find((option) => option.label === area) ?? timelineAreas[0];
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PagedResult<DomainEventLogEntryDto> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setError(null);
    getHouseholdTimeline(householdId, areaOption.aggregateType, areaOption.excludeAggregateType, page)
      .then((loaded) => !cancelled && setResult(loaded))
      .catch((err: unknown) => !cancelled && setError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, [householdId, areaOption, page]);

  const names = useEventNames(householdId, result?.items ?? NO_EVENTS);

  return (
    <div className="page">
      <p className="muted">
        <Link to="/casa">{name}</Link>
      </p>
      <h1>Histórico</h1>

      <select
        className="category-select"
        aria-label="Área do histórico"
        value={area}
        onChange={(e) => {
          setArea(e.target.value);
          setPage(1);
        }}
      >
        {timelineAreas.map((option) => (
          <option key={option.label} value={option.label}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!error && result === null && <p className="muted loading">A carregar…</p>}
      {result !== null && result.items.length === 0 && <p className="empty-state">Nada registado aqui ainda.</p>}
      {result !== null && result.items.length > 0 && (
        <>
          <ul className="today-list history-list">
            {result.items.map((event) => {
              const link = eventLink(event);
              const detail = eventDetail(event.payload) ?? names.get(event.eventId);
              const label = detail ? `${eventLabel(event.eventType)}: ${detail}` : eventLabel(event.eventType);
              return (
                <li key={event.eventId}>
                  <span className="meal-meta muted">{when.format(new Date(event.occurredOn))}</span>
                  {link ? (
                    <Link to={link} className="meal-title">
                      {label}
                    </Link>
                  ) : (
                    <span className="meal-title">{label}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
