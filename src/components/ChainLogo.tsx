import { useState } from "react";

/**
 * Logótipos das cadeias acompanhadas, guardados em public/chains (Wikimedia Commons, a partir do
 * Wikidata de cada cadeia). Uma cadeia sem logótipo, ou cuja imagem falhe, fica com um selo com as
 * iniciais na cor da marca.
 */
const logos: Record<string, string> = {
  auchan: "/chains/auchan.svg",
  continente: "/chains/continente.svg",
  lidl: "/chains/lidl.svg",
  "pingo doce": "/chains/pingo-doce.svg",
};

const brandColors: Record<string, string> = {
  auchan: "#e2001a",
  continente: "#e31e24",
  lidl: "#0050aa",
  "pingo doce": "#5aa127",
  mercadona: "#00a650",
  intermarché: "#e2001a",
  minipreço: "#e30613",
};

function key(chainName: string): string {
  return chainName.trim().toLowerCase();
}

function initials(chainName: string): string {
  const words = chainName.trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : chainName.slice(0, 2)).toUpperCase();
}

export function ChainLogo({ chainName, size = "md" }: { chainName: string; size?: "sm" | "md" }) {
  const [failed, setFailed] = useState(false);
  const src = logos[key(chainName)];
  const className = `chain-logo chain-logo-${size}`;

  if (src && !failed) {
    return (
      <span className={className}>
        <img src={src} alt="" onError={() => setFailed(true)} />
      </span>
    );
  }
  return (
    <span className={`${className} is-initials`} style={{ background: brandColors[key(chainName)] ?? "#3d5a48" }} aria-hidden="true">
      {initials(chainName)}
    </span>
  );
}
