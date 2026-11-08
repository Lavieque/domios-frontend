import { useState } from "react";

/**
 * Campo da foto de um cartão de receita (como em /receitas). Fica vazio, com a
 * mesma altura, quando a receita não tem foto ou ela não carrega, para os
 * cartões vizinhos ficarem alinhados.
 */
export function RecipePhoto({ imageUrl }: { imageUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="recipe-photo">
      {imageUrl && !failed && <img src={imageUrl} alt="" loading="lazy" onError={() => setFailed(true)} />}
    </div>
  );
}
