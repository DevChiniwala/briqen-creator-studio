import type { EditorState } from '../types';

export function createInitialState(): EditorState {
  return {
    sceneOrder: ['s2', 's1'],
    selectedSceneId: 's2',
    scenesById: {
      s1: {
        id: 's1',
        title: 'A moment to pause.',
        script: 'Make room for ideas that feel different. A slower, more thoughtful beginning.',
        contentRevision: 1,
        mediaType: 'image',
        durationSec: 5,
        approvedAssetId: 'asset_approved_01',
        approvedAssetName: 'Approved coastal image',
      },
      s2: {
        id: 's2',
        title: 'The next chapter.',
        script: 'The next chapter starts with a quieter kind of ambition. Built for the moments that matter.',
        contentRevision: 2,
        mediaType: 'video',
        durationSec: 3,
        approvedAssetId: null,
        approvedAssetName: null,
      },
    },
    jobsBySceneId: {
      s1: {
        jobId: 'job_img_1',
        sceneId: 's1',
        idempotencyKey: 'key_img_1',
        inputSnapshot: {
          script: 'Make room for ideas that feel different. A slower, more thoughtful beginning.',
          mediaType: 'image',
        },
        inputRevision: 1,
        status: 'succeeded',
        candidateAssetId: 'asset_approved_01',
      },
      s2: {
        jobId: 'job_v2_1',
        sceneId: 's2',
        idempotencyKey: 'key_v2_1',
        inputSnapshot: {
          script: 'The next chapter starts with a quieter kind of ambition. Built for the moments that matter.',
          mediaType: 'video',
        },
        inputRevision: 2,
        status: 'running',
      },
    },
  };
}
