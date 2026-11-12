import { describe, expect, it } from "vitest";
import { centerSquare } from "./avatarImage";

describe("centerSquare", () => {
  it("corta as laterais de uma fotografia ao alto", () => {
    expect(centerSquare(3000, 4000)).toEqual({ x: 0, y: 500, size: 3000 });
  });

  it("corta em cima e em baixo de uma fotografia deitada", () => {
    expect(centerSquare(1920, 1080)).toEqual({ x: 420, y: 0, size: 1080 });
  });

  it("deixa um quadrado como está", () => {
    expect(centerSquare(512, 512)).toEqual({ x: 0, y: 0, size: 512 });
  });
});
