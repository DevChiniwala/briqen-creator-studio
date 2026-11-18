import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EditorStore, GenerationAttempt } from '../types';
import { createInitialState } from './initial';

const STORAGE_KEY = 'briqen-editor-v1';

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      selectScene: (sceneId) => {
        if (get().scenesById[sceneId]) {
          set({ selectedSceneId: sceneId });
        }
      },

      updateScript: (sceneId, script) => {
        set((state) => {
          const scene = state.scenesById[sceneId];
          if (!scene) return state;
          return {
            scenesById: {
              ...state.scenesById,
              [sceneId]: {
                ...scene,
                script,
                contentRevision: scene.contentRevision + 1,
              },
            },
          };
        });
      },

      updateTitle: (sceneId, title) => {
        set((state) => {
          const scene = state.scenesById[sceneId];
          if (!scene) return state;
          return {
            scenesById: {
              ...state.scenesById,
              [sceneId]: { ...scene, title },
            },
          };
        });
      },

      setMediaType: (sceneId, mediaType) => {
        set((state) => {
          const scene = state.scenesById[sceneId];
          if (!scene || scene.mediaType === mediaType) return state;
          const newRevision = scene.contentRevision + 1;
          const newScenes = {
            ...state.scenesById,
            [sceneId]: {
              ...scene,
              mediaType,
              contentRevision: newRevision,
              approvedAssetId: null,
              approvedAssetName: null,
            },
          };
          const newJob: GenerationAttempt = {
            jobId: 'not_started',
            sceneId,
            idempotencyKey: '',
            inputSnapshot: { script: scene.script, mediaType },
            inputRevision: newRevision,
            status: 'idle',
          };
          return {
            scenesById: newScenes,
            jobsBySceneId: { ...state.jobsBySceneId, [sceneId]: newJob },
          };
        });
      },

      adjustDuration: (sceneId, delta) => {
        set((state) => {
          const scene = state.scenesById[sceneId];
          if (!scene) return state;
          const newDuration = Math.max(0.5, Math.min(30, Math.round((scene.durationSec + delta) * 2) / 2));
          if (newDuration === scene.durationSec) return state;
          return {
            scenesById: {
              ...state.scenesById,
              [sceneId]: { ...scene, durationSec: newDuration },
            },
          };
        });
      },

      reorder: (sceneId, direction) => {
        set((state) => {
          const idx = state.sceneOrder.indexOf(sceneId);
          const newIdx = idx + direction;
          if (idx < 0 || newIdx < 0 || newIdx >= state.sceneOrder.length) return state;
          const newOrder = [...state.sceneOrder];
          newOrder.splice(idx, 1);
          newOrder.splice(newIdx, 0, sceneId);
          return { sceneOrder: newOrder };
        });
      },

      reorderDrop: (sourceId, targetId) => {
        set((state) => {
          if (sourceId === targetId) return state;
          if (!state.scenesById[sourceId] || !state.scenesById[targetId]) return state;
          const newOrder = state.sceneOrder.filter((id) => id !== sourceId);
          const targetIdx = newOrder.indexOf(targetId);
          newOrder.splice(targetIdx, 0, sourceId);
          return { sceneOrder: newOrder };
        });
      },

      retryGeneration: (sceneId) => {
        set((state) => {
          const scene = state.scenesById[sceneId];
          const currentJob = state.jobsBySceneId[sceneId];
          if (!scene) return state;
          if (currentJob && !['failed', 'outdated', 'idle'].includes(currentJob.status)) return state;
          if (scene.approvedAssetId) return state;

          const idempotencyKey = crypto.randomUUID();
          const newJob: GenerationAttempt = {
            jobId: `retry_${Date.now()}`,
            sceneId,
            idempotencyKey,
            inputSnapshot: {
              script: scene.script,
              mediaType: scene.mediaType,
            },
            inputRevision: scene.contentRevision,
            status: 'running',
          };
          return {
            jobsBySceneId: { ...state.jobsBySceneId, [sceneId]: newJob },
          };
        });
      },

      replaceAsset: (sceneId, assetId, assetName) => {
        set((state) => {
          const scene = state.scenesById[sceneId];
          if (!scene) return state;
          const currentJob = state.jobsBySceneId[sceneId];
          return {
            scenesById: {
              ...state.scenesById,
              [sceneId]: { ...scene, approvedAssetId: assetId, approvedAssetName: assetName },
            },
            jobsBySceneId: {
              ...state.jobsBySceneId,
              [sceneId]: currentJob
                ? { ...currentJob, status: 'succeeded' as const }
                : {
                    jobId: `replaced_${Date.now()}`,
                    sceneId,
                    idempotencyKey: '',
                    inputSnapshot: { script: scene.script, mediaType: scene.mediaType },
                    inputRevision: scene.contentRevision,
                    status: 'succeeded' as const,
                    candidateAssetId: assetId,
                  },
            },
          };
        });
      },

      approveCandidate: (sceneId) => {
        set((state) => {
          const scene = state.scenesById[sceneId];
          const job = state.jobsBySceneId[sceneId];
          if (!scene || !job) return state;
          if (job.status !== 'succeeded') return state;
          if (job.inputRevision !== scene.contentRevision) return state;
          if (!job.candidateAssetId) return state;

          return {
            scenesById: {
              ...state.scenesById,
              [sceneId]: {
                ...scene,
                approvedAssetId: job.candidateAssetId,
                approvedAssetName: `Generated ${scene.mediaType} · approved`,
              },
            },
          };
        });
      },

      generationSucceeded: (sceneId, jobId, candidateAssetId) => {
        set((state) => {
          const job = state.jobsBySceneId[sceneId];
          if (!job || job.jobId !== jobId) return state;

          const scene = state.scenesById[sceneId];
          const isStale = scene && job.inputRevision !== scene.contentRevision;

          return {
            jobsBySceneId: {
              ...state.jobsBySceneId,
              [sceneId]: {
                ...job,
                status: isStale ? 'outdated' : 'succeeded',
                candidateAssetId,
              },
            },
          };
        });
      },

      generationFailed: (sceneId, jobId, error) => {
        set((state) => {
          const job = state.jobsBySceneId[sceneId];
          if (!job || job.jobId !== jobId) return state;
          return {
            jobsBySceneId: {
              ...state.jobsBySceneId,
              [sceneId]: { ...job, status: 'failed', error },
            },
          };
        });
      },

      reset: () => set(createInitialState()),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        sceneOrder: state.sceneOrder,
        scenesById: state.scenesById,
        jobsBySceneId: state.jobsBySceneId,
        selectedSceneId: state.selectedSceneId,
      }),
    }
  )
);
