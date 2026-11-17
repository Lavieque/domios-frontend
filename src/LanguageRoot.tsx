import App from "./App.tsx";
import { useLanguage } from "./i18n";

/**
 * Quando a língua muda, a app remonta: os textos lidos fora dos componentes
 * (rótulos, formatadores) voltam a ser lidos na língua nova.
 */
export function LanguageRoot() {
  const lang = useLanguage();
  return <App key={lang} />;
}
