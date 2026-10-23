import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { verifyEmail } from "../api/auth";
import { ApiError } from "../api/http";
import { describeError } from "../auth/errors";
import { tokenFromHash } from "../auth/links";
import { sessionStore } from "../auth/sessionStore";
import { useSession } from "../auth/useSession";

type Status = "verifying" | "verified" | "invalid" | "error";

/** Destino do link do email `{Frontend:BaseUrl}/verify-email#token=...` (caminho fixado pela Api). */
export function VerifyEmailPage() {
  const session = useSession();
  const navigate = useNavigate();
  const hashToken = tokenFromHash(useLocation().hash);
  const [status, setStatus] = useState<Status>(hashToken ? "verifying" : "invalid");
  const [error, setError] = useState<string | null>(null);
  // O link é de uso único: o StrictMode corre o efeito duas vezes em
  // desenvolvimento, e o segundo pedido daria invalid-token.
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!hashToken || lastSent.current === hashToken) return;
    lastSent.current = hashToken;
    setStatus("verifying");
    // Tira o token da barra de endereço (não fica no histórico).
    navigate({ hash: "" }, { replace: true });

    verifyEmail(hashToken)
      .then(async () => {
        setStatus("verified");
        // Com sessão aberta neste browser, o refresh traz o emailVerified atual.
        await sessionStore.refreshNow().catch(() => undefined);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.type === "invalid-token") {
          setStatus("invalid");
        } else {
          setError(describeError(err));
          setStatus("error");
        }
      });
  }, [hashToken, navigate]);

  return (
    <div className="page auth-page">
      <p className="eyebrow">Conta</p>
      <h1>Confirmar email</h1>

      {status === "verifying" && <p className="muted loading">A confirmar…</p>}
      {status === "verified" && <p className="notice">Email confirmado. Obrigado!</p>}
      {status === "invalid" && (
        <p className="form-error" role="alert">
          Link já usado ou expirado — se já confirmaste o email, não precisas de fazer nada.
          {session && !session.emailVerified && " Podes pedir um link novo na tua conta."}
        </p>
      )}
      {status === "error" && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <p className="form-links">
        {session ? <Link to="/conta">Ir para a conta</Link> : <Link to="/entrar">Entrar</Link>}
      </p>
    </div>
  );
}
