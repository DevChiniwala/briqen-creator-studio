import { describe, it, expect } from 'vitest';
import {
  selectExportReady,
  selectApprovedCount,
  selectTotalDuration,
  selectExportBlockReason,
  selectAssetDisplay,
  selectSelectedScene,
  selectActiveJob,
} from '../src/state/selectors';
import type { EditorState, Scene, GenerationAttempt } from '../src/types';

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'test',
    title: 'Test scene',
    script: 'Test script.',
    contentRevision: 1,
    mediaType: 'video',
    durationSec: 5,
    approvedAssetId: null,
    approvedAssetName: null,
    ...overrides,
  };
}

function makeJob(overrides: Partial<GenerationAttempt> = {}): GenerationAttempt {
  return {
    jobId: 'job_1',
    sceneId: 'test',
    idempotencyKey: 'key_1',
    inputSnapshot: { script: 'Test script.', mediaType: 'video' },
    inputRevision: 1,
    status: 'running',
    ...overrides,
  };
}

function makeState(overrides: Partial<EditorState> = {}): EditorState {
  return {
    sceneOrder: ['s1', 's2'],
    selectedSceneId: 's1',
    scenesById: {
      s1: makeScene({ id: 's1', approvedAssetId: 'asset_1', approvedAssetName: 'Approved' }),
      s2: makeScene({ id: 's2', durationSec: 3 }),
    },
    jobsBySceneId: {
      s1: makeJob({ sceneId: 's1', status: 'succeeded', candidateAssetId: 'asset_1' }),
      s2: makeJob({ sceneId: 's2' }),
    },
    ...overrides,
  };
}

describe('selectExportReady', () => {
  it('returns false when any scene lacks approvedAssetId', () => {
    const state = makeState();
    expect(selectExportReady(state)).toBe(false);
  });

  it('returns true when all scenes have approvedAssetId', () => {
    const state = makeState({
      scenesById: {
        s1: makeScene({ id: 's1', approvedAssetId: 'a1' }),
        s2: makeScene({ id: 's2', approvedAssetId: 'a2' }),
      },
    });
    expect(selectExportReady(state)).toBe(true);
  });
});

describe('selectApprovedCount', () => {
  it('returns correct count', () => {
    const state = makeState();
    expect(selectApprovedCount(state)).toBe(1);
  });

  it('returns 0 when none approved', () => {
    const state = makeState({
      scenesById: {
        s1: makeScene({ id: 's1' }),
        s2: makeScene({ id: 's2' }),
      },
    });
    expect(selectApprovedCount(state)).toBe(0);
  });

  it('returns 2 when all approved', () => {
    const state = makeState({
      scenesById: {
        s1: makeScene({ id: 's1', approvedAssetId: 'a1' }),
        s2: makeScene({ id: 's2', approvedAssetId: 'a2' }),
      },
    });
    expect(selectApprovedCount(state)).toBe(2);
  });
});

describe('selectTotalDuration', () => {
  it('returns sum of all scene durations in order', () => {
    const state = makeState();
    // s1: 5s, s2: 3s
    expect(selectTotalDuration(state)).toBe(8);
  });
});

describe('selectExportBlockReason', () => {
  it('returns null when all approved', () => {
    const state = makeState({
      scenesById: {
        s1: makeScene({ id: 's1', approvedAssetId: 'a1' }),
        s2: makeScene({ id: 's2', approvedAssetId: 'a2' }),
      },
    });
    expect(selectExportBlockReason(state)).toBeNull();
  });

  it('returns descriptive string when scenes need assets', () => {
    const state = makeState();
    const reason = selectExportBlockReason(state);
    expect(reason).not.toBeNull();
    expect(reason).toContain('Scene');
    expect(reason).toContain('approved asset');
  });
});

describe('selectAssetDisplay', () => {
  it('returns ok for scene with approved asset', () => {
    const scene = makeScene({ approvedAssetId: 'a1', approvedAssetName: 'Coastal' });
    const [status] = selectAssetDisplay(scene, undefined);
    expect(status).toBe('ok');
  });

  it('returns run for running job', () => {
    const scene = makeScene();
    const job = makeJob({ status: 'running' });
    const [status] = selectAssetDisplay(scene, job);
    expect(status).toBe('run');
  });

  it('returns fail for failed job', () => {
    const scene = makeScene();
    const job = makeJob({ status: 'failed' });
    const [status] = selectAssetDisplay(scene, job);
    expect(status).toBe('fail');
  });

  it('returns ready for succeeded job', () => {
    const scene = makeScene();
    const job = makeJob({ status: 'succeeded' });
    const [status] = selectAssetDisplay(scene, job);
    expect(status).toBe('ready');
  });

  it('returns stale for outdated job', () => {
    const scene = makeScene();
    const job = makeJob({ status: 'outdated' });
    const [status] = selectAssetDisplay(scene, job);
    expect(status).toBe('stale');
  });

  it('returns empty for no job', () => {
    const scene = makeScene();
    const [status] = selectAssetDisplay(scene, undefined);
    expect(status).toBe('empty');
  });

  it('returns empty for idle job', () => {
    const scene = makeScene();
    const job = makeJob({ status: 'idle' });
    const [status] = selectAssetDisplay(scene, job);
    expect(status).toBe('empty');
  });
});

describe('selectSelectedScene', () => {
  it('returns the scene matching selectedSceneId', () => {
    const state = makeState({ selectedSceneId: 's1' });
    const scene = selectSelectedScene(state);
    expect(scene).toBeDefined();
    expect(scene!.id).toBe('s1');
  });

  it('returns undefined when selectedSceneId points to missing scene', () => {
    const state = makeState({ selectedSceneId: 'nonexistent' });
    const scene = selectSelectedScene(state);
    expect(scene).toBeUndefined();
  });

  it('returns correct scene after changing selectedSceneId', () => {
    const state1 = makeState({ selectedSceneId: 's1' });
    expect(selectSelectedScene(state1)!.id).toBe('s1');

    const state2 = makeState({ selectedSceneId: 's2' });
    expect(selectSelectedScene(state2)!.id).toBe('s2');
  });
});

describe('selectActiveJob', () => {
  it('returns the job for an existing scene', () => {
    const state = makeState();
    const job = selectActiveJob(state, 's2');
    expect(job).toBeDefined();
    expect(job!.sceneId).toBe('s2');
    expect(job!.status).toBe('running');
  });

  it('returns undefined when no job exists for sceneId', () => {
    const state = makeState({
      jobsBySceneId: {
        s1: makeJob({ sceneId: 's1', status: 'succeeded' }),
      },
    });
    const job = selectActiveJob(state, 's2');
    expect(job).toBeUndefined();
  });

  it('returns correct status for different job states', () => {
    const state = makeState({
      jobsBySceneId: {
        s1: makeJob({ sceneId: 's1', status: 'succeeded' }),
        s2: makeJob({ sceneId: 's2', status: 'failed' }),
      },
    });
    expect(selectActiveJob(state, 's1')!.status).toBe('succeeded');
    expect(selectActiveJob(state, 's2')!.status).toBe('failed');
  });
});
