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
const time = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "Europe/Lisbon",
  hour: "2-digit",
  minute: "2-digit",
});
// en-CA dá yyyy-mm-dd: a chave do dia em Lisboa.
const dayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Lisbon",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const weekday = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "Europe/Lisbon",
  weekday: "short",
});
const month = new Intl.DateTimeFormat("pt-PT", { timeZone: "Europe/Lisbon", month: "long" });
const year = new Intl.DateTimeFormat("pt-PT", { timeZone: "Europe/Lisbon", year: "numeric" });
const thisYear = year.format(new Date());
const weekdayIndex = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Lisbon", weekday: "short" });

/** Os eventos por dia, pela ordem em que chegam (do mais recente para o mais antigo). */
function byDay(events: DomainEventLogEntryDto[]): { day: string; date: Date; events: DomainEventLogEntryDto[] }[] {
  const days: { day: string; date: Date; events: DomainEventLogEntryDto[] }[] = [];
  for (const event of events) {
    const date = new Date(event.occurredOn);
    const day = dayKey.format(date);
    const last = days[days.length - 1];
    if (last && last.day === day) last.events.push(event);
    else days.push({ day, date, events: [event] });
  }
  return days;
}

export function HouseholdHistoryPage() {
  return (
    <HouseholdGate>
      {(household) => <HouseholdHistory householdId={household.householdId} name={household.name} />}
    </HouseholdGate>
  );
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
      <nav className="crumb" aria-label="Caminho">
        <Link to="/casa" className="back-link">
          {name}
        </Link>
      </nav>
      <header className="page-head">
        <div>
          <h1>Histórico</h1>
          <p className="page-head-sub">O que mudou na casa, do mais recente para o mais antigo.</p>
        </div>
      </header>

      <div className="chip-row" role="group" aria-label="Área do histórico">
        {timelineAreas.map((option) => (
          <button
            key={option.label}
            type="button"
            className="chip"
            aria-pressed={area === option.label}
            onClick={() => {
              setArea(option.label);
              setPage(1);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!error && result === null && <p className="muted loading">A carregar…</p>}
      {result !== null && result.items.length === 0 && <p className="empty-state">Nada registado aqui ainda.</p>}
      {result !== null && result.items.length > 0 && (
        <>
          {/* Os dias em linhas, o número numa coluna fixa, como em Semana. */}
          <ol className="week-days history-days">
            {byDay(result.items).map(({ day, date, events }) => (
              <li key={day} className="week-day">
                <div className="week-day-date">
                  <span
                    className={
                      day === dayKey.format(new Date()) || weekdayIndex.format(date) === "Sun"
                        ? "week-day-number is-red"
                        : "week-day-number"
                    }
                  >
                    {Number(day.slice(8, 10))}
                  </span>
                  <span className="week-day-weekday">
                    {weekday.format(date).replace(".", "")}
                    <br />
                    {month.format(date)}
                    {year.format(date) !== thisYear && ` ${year.format(date)}`}
                  </span>
                </div>
                <ul className="history-events">
                  {events.map((event) => {
                    const link = eventLink(event);
                    const detail = eventDetail(event.payload) ?? names.get(event.eventId);
                    const label = detail ? `${eventLabel(event.eventType)}: ${detail}` : eventLabel(event.eventType);
                    return (
                      <li key={event.eventId} className="history-event">
                        <time className="history-time" dateTime={event.occurredOn}>
                          {time.format(new Date(event.occurredOn))}
                        </time>
                        {link ? (
                          <Link to={link} className="history-label">
                            {label}
                          </Link>
                        ) : (
                          <span className="history-label">{label}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
