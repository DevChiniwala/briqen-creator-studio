export type MediaType = 'image' | 'video';

export type JobStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'failed'
  | 'succeeded'
  | 'outdated';

export interface Scene {
  id: string;
  title: string;
  script: string;
  contentRevision: number;
  mediaType: MediaType;
  durationSec: number;
  approvedAssetId: string | null;
  approvedAssetName: string | null;
}

export interface GenerationAttempt {
  jobId: string;
  sceneId: string;
  idempotencyKey: string;
  inputSnapshot: {
    script: string;
    mediaType: MediaType;
  };
  inputRevision: number;
  status: JobStatus;
  candidateAssetId?: string;
  error?: string;
}

export interface EditorState {
  sceneOrder: string[];
  scenesById: Record<string, Scene>;
  jobsBySceneId: Record<string, GenerationAttempt>;
  selectedSceneId: string;
}

export interface EditorActions {
  selectScene: (sceneId: string) => void;
  updateScript: (sceneId: string, script: string) => void;
  updateTitle: (sceneId: string, title: string) => void;
  setMediaType: (sceneId: string, mediaType: MediaType) => void;
  adjustDuration: (sceneId: string, delta: number) => void;
  reorder: (sceneId: string, direction: -1 | 1) => void;
  reorderDrop: (sourceId: string, targetId: string) => void;
  retryGeneration: (sceneId: string) => void;
  replaceAsset: (sceneId: string, assetId: string, assetName: string) => void;
  approveCandidate: (sceneId: string) => void;
  generationSucceeded: (sceneId: string, jobId: string, candidateAssetId: string) => void;
  generationFailed: (sceneId: string, jobId: string, error: string) => void;
  reset: () => void;
}

export type EditorStore = EditorState & EditorActions;
