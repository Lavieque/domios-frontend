import type { ReactNode } from "react";

/**
 * The opening band of every page but the home: the page's kitchen scene under the green veil,
 * with the title set over it. The site header sits on top of this band.
 */
export function PageHead({ title, lede, photo, children }: { title: string; lede?: string; photo: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <img className="page-head-photo" src={photo} alt="" decoding="async" />
      <div className="page-head-inner">
        {children}
        <h1>{title}</h1>
        {lede && <p className="page-head-lede">{lede}</p>}
      </div>
    </header>
  );
}
