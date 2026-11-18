import type { EditorState, Scene, GenerationAttempt, JobStatus } from '../types';
import { sceneDisplayLabel } from '../utils/sceneLabels';

export function selectSelectedScene(state: EditorState): Scene | undefined {
  return state.scenesById[state.selectedSceneId];
}

export function selectActiveJob(state: EditorState, sceneId: string): GenerationAttempt | undefined {
  return state.jobsBySceneId[sceneId];
}

export function selectExportReady(state: EditorState): boolean {
  return state.sceneOrder.length > 0 &&
    state.sceneOrder.every((id) => Boolean(state.scenesById[id]?.approvedAssetId));
}

export function selectApprovedCount(state: EditorState): number {
  return Object.values(state.scenesById).filter((s) => Boolean(s.approvedAssetId)).length;
}

export function selectTotalDuration(state: EditorState): number {
  return state.sceneOrder.reduce((sum, id) => sum + (state.scenesById[id]?.durationSec ?? 0), 0);
}

export function selectExportBlockReason(state: EditorState): string | null {
  const missing = state.sceneOrder.filter((id) => !state.scenesById[id]?.approvedAssetId);
  if (missing.length === 0) return null;
  const names = missing.map((id) => `Scene ${sceneDisplayLabel(id)}`);
  return `${names.join(', ')} need${missing.length > 1 ? '' : 's'} an approved asset.`;
}

export type AssetDisplayStatus = 'ok' | 'fail' | 'run' | 'ready' | 'stale' | 'empty';

export function selectAssetDisplay(
  scene: Scene,
  job: GenerationAttempt | undefined
): [AssetDisplayStatus, string, string] {
  if (scene.approvedAssetId) {
    return ['ok', '✓ Approved asset', scene.approvedAssetName || 'Ready to export'];
  }
  if (!job) return ['empty', '✦ Media not ready', 'Generate or replace the asset to continue.'];

  const statusMap: Record<JobStatus, [AssetDisplayStatus, string, string]> = {
    idle: ['empty', '✦ Media not ready', 'Generate or replace the asset to continue.'],
    queued: ['run', '✦ Queued for generation', 'Your scene is in the queue.'],
    running: ['run', `✦ Generating ${scene.mediaType}`, 'Processing in the background. Your edits remain available.'],
    failed: ['fail', '⚠ Generation failed', `The ${scene.mediaType} was not created. Retry this scene or replace its asset. Your edits are safe.`],
    succeeded: ['ready', '✦ Ready for review', 'Generation completed. Approve the asset to include it in export.'],
    outdated: ['stale', '↻ Outdated generation', 'This asset was made for an older script. Regenerate using the latest script.'],
  };
  return statusMap[job.status];
}
