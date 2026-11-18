/**
 * Stable scene ID-to-label mapping.
 * These labels are independent of scene order in the storyboard.
 */
export const SCENE_LABELS: Record<string, string> = {
  s1: '01',
  s2: '02',
};

/**
 * Returns the display label for a scene ID.
 * Falls back to the ID itself if no label is mapped.
 */
export function sceneDisplayLabel(id: string): string {
  return SCENE_LABELS[id] ?? id;
}
