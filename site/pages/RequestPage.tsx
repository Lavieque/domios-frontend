import { useState, type FormEvent } from "react";
import { APP_LOGIN_URL } from "../config";
import { AccessRequestError, submitAccessRequest } from "../api";
import { useSite } from "../context";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

export function RequestPage() {
  const { lang, t } = useSite();
  const r = t.request;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "sending" });
    try {
      await submitAccessRequest({ name, email, message, language: lang, website });
      setStatus({ kind: "sent" });
    } catch (err) {
      const code = err instanceof AccessRequestError ? err.status : null;
      const text = code === 400 ? r.errorInvalid : code === 429 ? r.errorTooMany : r.errorGeneric;
      setStatus({ kind: "error", message: text });
    }
  }

  function reset() {
    setName("");
    setEmail("");
    setMessage("");
    setWebsite("");
    setStatus({ kind: "idle" });
  }

  return (
    <div className="request-layout">
      <div>
        <header className="page-head">
          <h1>{r.title}</h1>
          <p className="lede">{r.lede}</p>
        </header>

        {status.kind === "sent" ? (
          <section className="notice request-done" role="status">
            <h2>{r.successTitle}</h2>
            <p>{r.successText}</p>
            <button type="button" className="button-secondary" onClick={reset}>
              {r.again}
            </button>
          </section>
        ) : (
          <form className="request-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>{r.name}</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                required
                maxLength={120}
                placeholder={r.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="form-field">
              <span>{r.email}</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={256}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="form-field">
              <span>{r.message}</span>
              <textarea
                name="message"
                rows={3}
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                aria-describedby="message-hint"
              />
              <small id="message-hint" className="muted">
                {r.messageHint}
              </small>
            </label>
            {/* Honeypot: off-screen, out of the tab order, hidden from assistive tech. */}
            <div className="hp" aria-hidden="true">
              <label>
                Website
                <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>
            {status.kind === "error" && (
              <p className="form-error" role="alert">
                {status.message}
              </p>
            )}
            <button type="submit" className="button-primary" disabled={status.kind === "sending"}>
              {status.kind === "sending" ? r.sending : r.submit}
            </button>
          </form>
        )}

        <p className="form-links">
          {r.haveAccount} <a href={APP_LOGIN_URL}>{r.enter}</a>
        </p>
      </div>

      <aside className="after" aria-labelledby="after-title">
        <h2 id="after-title">{r.afterTitle}</h2>
        <ol className="step-list">
          {r.after.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
