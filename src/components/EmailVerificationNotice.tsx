import { useState } from "react";
import { requestEmailVerification } from "../api/account";
import { describeError } from "../auth/errors";

/** Aviso de email por verificar, com reenvio do link (válido 48 horas). */
export function EmailVerificationNotice() {
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
        <span>Enviámos um link novo. Vê a tua caixa de correio — o link é válido durante 48 horas.</span>
      ) : (
        <>
          <span>O teu email ainda não está confirmado.</span>
          <button type="button" className="link-button" onClick={resend} disabled={state === "sending"}>
            {state === "sending" ? "A enviar…" : "Reenviar email de confirmação"}
          </button>
        </>
      )}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
