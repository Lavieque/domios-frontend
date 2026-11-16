import type { FeatureKey } from "./i18n";

/**
 * Where each note sits on the desktop capture (1440 × 900), in percent of its width and
 * height, in the same order as `shotNotes.notes` in the dictionaries. The captures are taken
 * on a Thursday (site/scripts/capture-shots.mjs), so "today" is always the fourth column of
 * the plan. Re-check these when the captures are retaken.
 */
export const HOTSPOTS: Partial<Record<FeatureKey, [x: number, y: number][]>> = {
  today: [
    [72.5, 34],
    [50, 74.7],
    [96.6, 58.6],
  ],
  plan: [
    [60.5, 34],
    [59.5, 62.8],
    [85, 25.3],
  ],
  pantry: [
    [34.5, 70.3],
    [55.3, 64.7],
    [76, 74.8],
    [76, 24],
  ],
  promotions: [
    [47.5, 38],
    [30, 82.7],
    [53.3, 76.3],
  ],
};
