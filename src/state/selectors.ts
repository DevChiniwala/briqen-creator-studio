import type { EditorState, Scene, GenerationAttempt, JobStatus } from '../types';

export function selectSelectedScene(state: EditorState): Scene {
  return state.scenesById[state.selectedSceneId];
}

export function selectActiveJob(state: EditorState, sceneId: string): GenerationAttempt | undefined {
  return state.jobsBySceneId[sceneId];
}

export function selectExportReady(state: EditorState): boolean {
  return state.sceneOrder.every((id) => state.scenesById[id]?.approvedAssetId !== null);
}

export function selectApprovedCount(state: EditorState): number {
  return Object.values(state.scenesById).filter((s) => s.approvedAssetId !== null).length;
}

export function selectTotalDuration(state: EditorState): number {
  return state.sceneOrder.reduce((sum, id) => sum + (state.scenesById[id]?.durationSec ?? 0), 0);
}

export function selectExportBlockReason(state: EditorState): string | null {
  const missing = state.sceneOrder.filter((id) => !state.scenesById[id]?.approvedAssetId);
  if (missing.length === 0) return null;
  const names = missing.map((id) => {
    const idx = state.sceneOrder.indexOf(id) + 1;
    return `Scene ${idx}`;
  });
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
    failed: ['fail', '⚠ Generation failed', 'The video was not created. Retry this scene or replace its asset. Your edits are safe.'],
    succeeded: ['ready', '✦ Ready for review', 'Generation completed. Approve the asset to include it in export.'],
    outdated: ['stale', '↻ Outdated generation', 'This asset was made for an older script. Regenerate using the latest script.'],
  };
  return statusMap[job.status];
}
