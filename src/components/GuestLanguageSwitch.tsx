import { LANGS, setLanguage, useLanguage, useT } from "../i18n";

/**
 * Sem sessão ainda não há conta de onde ler a língua: escolhe-se aqui, fica neste
 * browser e vai no registo. Depois de entrar, manda a língua guardada na conta.
 */
export function GuestLanguageSwitch() {
  const t = useT();
  const language = useLanguage();
  return (
    <div className="guest-language" role="group" aria-label={t.account.language}>
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          aria-label={t.account.languageNames[lang]}
          aria-pressed={lang === language}
          onClick={() => setLanguage(lang)}
        >
          {t.account.languageShort[lang]}
        </button>
      ))}
    </div>
  );
}
