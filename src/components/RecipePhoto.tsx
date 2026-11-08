import { useState } from "react";
import { Link } from "react-router-dom";

interface Props {
  recipeId: string;
  imageUrl: string | null;
  /** Sem link quando a casa já não pode ler a receita. */
  linked?: boolean;
}

/** Foto pequena de uma receita numa lista; caixa vazia quando não há foto ou ela não carrega. */
export function RecipeThumb({ recipeId, imageUrl, linked = true }: Props) {
  const [failed, setFailed] = useState(false);
  const image = imageUrl && !failed ? <img src={imageUrl} alt="" loading="lazy" onError={() => setFailed(true)} /> : null;

  if (!linked) {
    return <span className="recipe-thumb">{image}</span>;
  }

  return (
    <Link to={`/receitas/${recipeId}`} className="recipe-thumb" tabIndex={-1} aria-hidden="true">
      {image}
    </Link>
  );
}
