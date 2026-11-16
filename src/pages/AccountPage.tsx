import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { memberRoleLabels } from "../api/households";
import { signOut, signOutEverywhere } from "../auth/actions";
import { describeError } from "../auth/errors";
import { useSession } from "../auth/useSession";
import { AvatarPicker } from "../components/AvatarPicker";
import { EmailVerificationNotice } from "../components/EmailVerificationNotice";
import { useHouseholds } from "../household/useHouseholds";
import { LANGS, useLanguage, useT, type Lang } from "../i18n";
import { saveAccountLanguage } from "../i18n/accountLanguage";

export function AccountPage() {
  // Rota dentro de <RequireAuth>: há sempre sessão ao renderizar.
  const session = useSession()!;
  const t = useT();
  const language = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice;
  const households = useHouseholds();

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [languageBusy, setLanguageBusy] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);

  async function handleLanguage(lang: Lang) {
    if (lang === language) return;
    setLanguageError(null);
    setLanguageBusy(true);
    try {
      // Grava na conta; a app remonta na língua nova quando a gravação acaba.
      await saveAccountLanguage(lang);
    } catch (err) {
      setLanguageError(describeError(err));
      setLanguageBusy(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/entrar", {
      replace: true,
      state: { notice: t.shell.signedOut },
    });
  }

  async function handleSignOutEverywhere() {
    setError(null);
    setBusy(true);
    try {
      await signOutEverywhere();
      navigate("/entrar", {
        replace: true,
        state: { notice: t.account.signedOutEverywhere },
      });
    } catch (err) {
      setError(describeError(err));
      setBusy(false);
    }
  }

  return (
    <div className="page settings-page">
      <header className="page-head">
        <div>
          <h1>{t.account.title}</h1>
          <p className="page-head-sub">{t.account.subtitle}</p>
        </div>
      </header>
      {notice && <p className="notice">{notice}</p>}

      <section className="panel profile-card">
        <AvatarPicker userId={session.userId} email={session.email} />
        <div>
          <h2>{session.email}</h2>
          <p className="muted">
            {households.current
              ? `${households.current.name} · ${memberRoleLabels[households.current.role]}`
              : t.account.noHouseholdYet}
          </p>
        </div>
        <Link to="/casa" className="button-primary">
          {t.account.manageMyHousehold}
        </Link>
      </section>

      <section className="panel" aria-labelledby="account-access">
        <h2 id="account-access">{t.account.access}</h2>
        <dl className="settings-list">
          <div className="settings-row">
            <dt>{t.common.email}</dt>
            <dd>
              <span className="settings-value">{session.email}</span>
              {session.emailVerified ? (
                <span className="settings-flag">{t.account.confirmed}</span>
              ) : (
                <span className="settings-flag is-pending">{t.account.pendingConfirmation}</span>
              )}
            </dd>
          </div>
          <div className="settings-row">
            <dt>{t.common.password}</dt>
            <dd>
              <span className="muted">{t.account.passwordHint}</span>
              <Link to="/esqueci-password" className="settings-action">
                {t.account.requestLink}
              </Link>
            </dd>
          </div>
        </dl>
        {!session.emailVerified && <EmailVerificationNotice />}
      </section>

      <section className="panel" aria-labelledby="account-language">
        <h2 id="account-language">{t.account.language}</h2>
        <p className="muted">{t.account.languageHint}</p>
        <div className="chip-row" role="group" aria-labelledby="account-language">
          {LANGS.map((lang) => (
            <button
              key={lang}
              type="button"
              className="chip"
              lang={lang}
              aria-pressed={lang === language}
              disabled={languageBusy}
              onClick={() => handleLanguage(lang)}
            >
              {t.account.languageNames[lang]}
            </button>
          ))}
        </div>
        {languageError && (
          <p className="form-error" role="alert">
            {languageError}
          </p>
        )}
      </section>

      <section className="panel" aria-labelledby="account-households">
        <div className="side-head">
          <h2 id="account-households">{t.account.yourHouseholds}</h2>
          <Link to="/casa/nova">{t.account.createHousehold}</Link>
        </div>
        {households.loading ? (
          <p className="muted loading">{t.common.loading}</p>
        ) : households.error ? (
          <p className="form-error" role="alert">
            {households.error}
          </p>
        ) : households.households.length === 0 ? (
          <p className="empty-state">
            {t.account.noHouseholdsBefore} <Link to="/casa/nova">{t.account.createYours}</Link>.
          </p>
        ) : (
          <ul className="settings-list">
            {households.households.map((h) => {
              const isCurrent = h.householdId === households.current?.householdId;
              return (
                <li key={h.householdId} className="settings-row">
                  <span className="settings-row-title">
                    {h.name}
                    {isCurrent && <span className="settings-flag">{t.account.inThisBrowser}</span>}
                  </span>
                  <span className="settings-row-end">
                    <span className="muted">{memberRoleLabels[h.role]}</span>
                    {isCurrent ? (
                      <Link to="/casa" className="settings-action">
                        {t.common.manage}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="row-action"
                        onClick={() => {
                          households.select(h.householdId);
                          navigate("/casa");
                        }}
                      >
                        {t.account.useThisHousehold}
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel" aria-labelledby="account-session">
        <h2 id="account-session">{t.account.session}</h2>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <ul className="settings-list">
          <li className="settings-row">
            <span className="settings-row-title">
              {t.account.thisBrowser}
              <small className="muted">{t.account.thisBrowserHint}</small>
            </span>
            <button type="button" className="button-secondary" onClick={handleSignOut} disabled={busy}>
              {t.shell.signOut}
            </button>
          </li>
          <li className="settings-row">
            <span className="settings-row-title">
              {t.account.allDevices}
              <small className="muted">{t.account.allDevicesHint}</small>
            </span>
            <button type="button" className="button-danger" onClick={handleSignOutEverywhere} disabled={busy}>
              {busy ? t.account.signingOut : t.account.signOutEverywhere}
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
}
