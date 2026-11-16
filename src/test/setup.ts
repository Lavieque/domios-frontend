import { beforeEach } from "vitest";
import { clearApiCache } from "../api/cache";
import { setLanguage } from "../i18n/language";

// Cada teste começa sem respostas em cache de um teste anterior.
beforeEach(() => clearApiCache());

// Os testes leem os textos em português, seja qual for a língua do ambiente.
beforeEach(() => setLanguage("pt"));
