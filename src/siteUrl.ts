/**
 * O site público (domios.pt) é outro deploy do mesmo repo. É lá que se pede
 * acesso; a app só aponta para lá. Gravado no bundle em build-time, como a Api.
 */
const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || "https://domios.pt").replace(/\/+$/, "");

export const REQUEST_ACCESS_URL = `${SITE_URL}/pedir-acesso`;
