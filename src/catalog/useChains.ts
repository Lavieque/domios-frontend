import { useEffect, useState } from "react";
import { getChains } from "../api/client";
import { ChainStatus, type ChainDto } from "../api/types";

// As cadeias lêem-se uma vez por sessão de página, como as categorias; um erro deixa a próxima
// chamada tentar outra vez.
let pending: Promise<ChainDto[] | null> | null = null;

function load(): Promise<ChainDto[] | null> {
  pending ??= getChains().catch(() => {
    pending = null;
    return null;
  });
  return pending;
}

/**
 * Cadeias abertas, por nome; `null` enquanto não chegam ou se falharem. `GET /chains` traz também
 * as cadeias de teste fechadas, que a Api recusa como loja de uma compra (404).
 */
export function useActiveChains(): ChainDto[] | null {
  const [chains, setChains] = useState<ChainDto[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    load().then((loaded) => {
      if (!cancelled && loaded) {
        setChains(loaded.filter((c) => c.status === ChainStatus.Active).sort((a, b) => a.name.localeCompare(b.name, "pt")));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return chains;
}
