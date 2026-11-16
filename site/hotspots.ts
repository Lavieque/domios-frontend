import type { FeatureKey } from "./i18n";

/**
 * Where each note sits on the desktop capture (1440 × 900), in percent of its width and
 * height, in the same order as `shotNotes.notes` in the dictionaries. Re-check these when
 * the captures are retaken.
 */
export const HOTSPOTS: Partial<Record<FeatureKey, [x: number, y: number][]>> = {
  today: [
    [59, 39],
    [42, 74.5],
    [94.6, 58.5],
  ],
  plan: [
    [68.9, 34],
    [66, 85.7],
    [92, 25.2],
  ],
  pantry: [
    [20.8, 70.3],
    [45, 64.8],
    [51.4, 74.8],
    [81, 24],
  ],
  promotions: [
    [34.7, 37.9],
    [23, 82.7],
    [47.6, 78.6],
    [67.7, 78.6],
  ],
};
