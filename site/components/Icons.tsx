/** The site's few icons: one stroke weight, round caps, drawn at the size of the text beside them. */

export function ArrowIcon({ down = false }: { down?: boolean }) {
  return (
    <svg className={down ? "icon icon-down" : "icon"} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {down ? (
        <path d="M10 4v12m0 0-4.5-4.5M10 16l4.5-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M4 10h12m0 0-4.5-4.5M16 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg className="icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m4.5 10.5 3.5 3.5 7.5-8" pathLength={1} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg className="icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {open ? (
        <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      ) : (
        <path d="M3.5 6h13M3.5 10h13M3.5 14h13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      )}
    </svg>
  );
}
