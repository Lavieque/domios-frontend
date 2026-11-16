import type { ReactNode } from "react";

/** Anel pequeno que roda na cor do texto: diz "está a acontecer" ao lado de uma frase. */
export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

/**
 * Texto de algo em curso ("A guardar…", "A procurar…") com o anel à frente, para nunca
 * parecer parado. Serve dentro de botões e em linhas de estado.
 */
export function Busy({ children }: { children: ReactNode }) {
  return (
    <span className="busy">
      <Spinner />
      {children}
    </span>
  );
}
