import { Busy } from "./Busy";
import { useState } from "react";
import { requestEmailVerification } from "../api/account";
import { describeError } from "../auth/errors";
import { useT } from "../i18n";

/** Aviso de email por verificar, com reenvio do link (válido 48 horas). */
export function EmailVerificationNotice() {
  const t = useT();
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setError(null);
    setState("sending");
    try {
      await requestEmailVerification();
      setState("sent");
    } catch (err) {
      setError(describeError(err));
      setState("idle");
    }
  }

  return (
    <div className="notice notice-warning" role="status">
      {state === "sent" ? (
        <span>{t.auth.verificationSent}</span>
      ) : (
        <>
          <span>{t.auth.emailNotConfirmed}</span>
          <button type="button" className="link-button" onClick={resend} disabled={state === "sending"}>
            {state === "sending" ? <Busy>{t.common.sending}</Busy> : t.auth.resendConfirmation}
          </button>
        </>
      )}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
