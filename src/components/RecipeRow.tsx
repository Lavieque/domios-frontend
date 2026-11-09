import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  /** Sem destino (receita que já não se pode ler), o nome fica em texto. */
  to?: string;
  imageUrl: string | null;
  /** Coluna fixa à esquerda, como o número de um dia (ex.: quantas vezes se fez). */
  lead?: ReactNode;
  /** Linhas por baixo do nome: meta, prontidão, notas. */
  children?: ReactNode;
  action?: ReactNode;
}

/**
 * Uma receita numa linha: o nome do prato é a interface, sem cartão. A foto, quando
 * existe e carrega, fica à direita; sem foto o nome alinha na mesma coluna das outras.
 */
export function RecipeRow({ title, to, imageUrl, lead, children, action }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // O campo da foto guarda o lugar, mas só se vê quando a imagem chega: nunca uma caixa cinzenta vazia.
  const photoState = loaded ? "loaded" : undefined;
  const showPhoto = imageUrl !== null && !failed;
  const classes = ["recipe-row", lead !== undefined && "has-lead"].filter(Boolean).join(" ");

  return (
    <li className={classes}>
      {lead !== undefined && <span className="recipe-row-lead">{lead}</span>}
      <div className="recipe-row-text">
        {to ? (
          <Link to={to} className="recipe-row-name">
            {title}
          </Link>
        ) : (
          <span className="recipe-row-name">{title}</span>
        )}
        {children}
        {action && <div className="recipe-row-action">{action}</div>}
      </div>
      {showPhoto &&
        (to ? (
          <Link to={to} className="recipe-row-photo" data-state={photoState} tabIndex={-1} aria-hidden="true">
            <img src={imageUrl} alt="" loading="lazy" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
          </Link>
        ) : (
          <span className="recipe-row-photo" data-state={photoState}>
            <img src={imageUrl} alt="" loading="lazy" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
          </span>
        ))}
    </li>
  );
}
