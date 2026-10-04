import { TREE_STAGE_LEVEL_THRESHOLDS, TREE_STAGE_NAMES } from "@/core/balance";

export function treeStageIndexForLevel(level: number): number {
  let stage = 0;
  for (let i = 0; i < TREE_STAGE_LEVEL_THRESHOLDS.length; i++) {
    if (level >= TREE_STAGE_LEVEL_THRESHOLDS[i]) stage = i;
  }
  return stage;
}

export function treeStageNameForLevel(level: number): string {
  return TREE_STAGE_NAMES[treeStageIndexForLevel(level)];
}

/** Visual size only. XP and level calculation remains in the game engine. */
export function treeScaleForLevel(level: number): number {
  return .32 + .68 * Math.pow(Math.min(Math.max(level, 0), 30) / 30, .55);
}
