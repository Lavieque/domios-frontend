import { useState } from "react";

/**
 * A foto da embalagem numa linha: inteira (sem cortar), num campo de papel. Só aparece
 * quando a imagem chega; uma foto partida não deixa caixa vazia.
 */
export function ProductThumb({ src }: { src: string }) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
  if (state === "failed") return null;
  return (
    <span className="product-thumb" data-state={state}>
      <img src={src} alt="" loading="lazy" onLoad={() => setState("loaded")} onError={() => setState("failed")} />
    </span>
  );
}
