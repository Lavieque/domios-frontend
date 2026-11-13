import { beforeEach } from "vitest";
import { clearApiCache } from "../api/cache";

// Cada teste começa sem respostas em cache de um teste anterior.
beforeEach(() => clearApiCache());
