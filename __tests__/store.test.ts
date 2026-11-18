/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

// Zustand persist middleware needs localStorage at import time.
// In a pure node environment, globalThis.localStorage doesn't exist, so we provide one.
const storage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
  clear: () => { storage.clear(); },
  get length() { return storage.size; },
  key: (i: number) => [...storage.keys()][i] ?? null,
};

import { useEditorStore } from '../src/state/store';

function store() {
  return useEditorStore.getState();
}

beforeEach(() => {
  storage.clear();
  store().reset();
});

describe('reorder', () => {
  it('does not change jobsBySceneId', () => {
    const before = structuredClone(store().jobsBySceneId);
    store().reorder('s1', -1);
    expect(store().jobsBySceneId).toEqual(before);
  });

  it('does not change scene.durationSec', () => {
    const s1Dur = store().scenesById.s1.durationSec;
    const s2Dur = store().scenesById.s2.durationSec;
    store().reorder('s1', -1);
    expect(store().scenesById.s1.durationSec).toBe(s1Dur);
    expect(store().scenesById.s2.durationSec).toBe(s2Dur);
  });

  it('updates sceneOrder correctly', () => {
    expect(store().sceneOrder).toEqual(['s2', 's1']);
    store().reorder('s1', -1);
    expect(store().sceneOrder).toEqual(['s1', 's2']);
  });

  it('is no-op when moving first item left', () => {
    const before = [...store().sceneOrder];
    store().reorder('s2', -1);
    expect(store().sceneOrder).toEqual(before);
  });

  it('is no-op when moving last item right', () => {
    const before = [...store().sceneOrder];
    store().reorder('s1', 1);
    expect(store().sceneOrder).toEqual(before);
  });
});

describe('adjustDuration', () => {
  it('changes only durationSec', () => {
    const before = structuredClone(store().scenesById.s2);
    store().adjustDuration('s2', 0.5);
    const after = store().scenesById.s2;
    expect(after.durationSec).toBe(3.5);
    expect(after.script).toBe(before.script);
    expect(after.contentRevision).toBe(before.contentRevision);
    expect(after.mediaType).toBe(before.mediaType);
  });

  it('does not affect job status', () => {
    const beforeJob = structuredClone(store().jobsBySceneId.s2);
    store().adjustDuration('s2', 1);
    expect(store().jobsBySceneId.s2).toEqual(beforeJob);
  });

  it('clamps to min 0.5', () => {
    store().adjustDuration('s2', -10);
    expect(store().scenesById.s2.durationSec).toBe(0.5);
  });

  it('clamps to max 30', () => {
    store().adjustDuration('s2', 100);
    expect(store().scenesById.s2.durationSec).toBe(30);
  });

  it('rounds to 0.5 increments', () => {
    store().adjustDuration('s2', 0.5);
    expect(store().scenesById.s2.durationSec).toBe(3.5);
    store().adjustDuration('s2', 0.5);
    expect(store().scenesById.s2.durationSec).toBe(4);
  });
});

describe('updateScript', () => {
  it('changes script text', () => {
    store().updateScript('s2', 'Brand new script.');
    expect(store().scenesById.s2.script).toBe('Brand new script.');
  });

  it('increments contentRevision', () => {
    const revBefore = store().scenesById.s2.contentRevision;
    store().updateScript('s2', 'Changed text.');
    expect(store().scenesById.s2.contentRevision).toBe(revBefore + 1);
  });

  it('does not change job status or sceneOrder', () => {
    const orderBefore = [...store().sceneOrder];
    const jobBefore = structuredClone(store().jobsBySceneId.s2);
    store().updateScript('s2', 'New text here.');
    expect(store().sceneOrder).toEqual(orderBefore);
    expect(store().jobsBySceneId.s2).toEqual(jobBefore);
  });
});

describe('retryGeneration', () => {
  it('on failed job creates new attempt with current script snapshot', () => {
    // First fail the s2 job
    store().generationFailed('s2', 'job_v2_1', 'Test failure');
    expect(store().jobsBySceneId.s2.status).toBe('failed');

    store().retryGeneration('s2');
    const job = store().jobsBySceneId.s2;
    expect(job.status).toBe('running');
    expect(job.jobId).not.toBe('job_v2_1');
    expect(job.inputSnapshot.script).toBe(store().scenesById.s2.script);
    expect(job.inputSnapshot.mediaType).toBe(store().scenesById.s2.mediaType);
    expect(job.inputRevision).toBe(store().scenesById.s2.contentRevision);
  });

  it('does not change scene.script, durationSec, or sceneOrder', () => {
    store().generationFailed('s2', 'job_v2_1', 'Test failure');
    const scriptBefore = store().scenesById.s2.script;
    const durBefore = store().scenesById.s2.durationSec;
    const orderBefore = [...store().sceneOrder];

    store().retryGeneration('s2');

    expect(store().scenesById.s2.script).toBe(scriptBefore);
    expect(store().scenesById.s2.durationSec).toBe(durBefore);
    expect(store().sceneOrder).toEqual(orderBefore);
  });

  it('does not change other scene approvedAssetId', () => {
    store().generationFailed('s2', 'job_v2_1', 'Test failure');
    store().retryGeneration('s2');
    expect(store().scenesById.s1.approvedAssetId).toBe('asset_approved_01');
  });

  it('on running job is no-op', () => {
    const jobBefore = structuredClone(store().jobsBySceneId.s2);
    expect(jobBefore.status).toBe('running');
    store().retryGeneration('s2');
    expect(store().jobsBySceneId.s2).toEqual(jobBefore);
  });

  it('on scene with approved asset is no-op', () => {
    const jobBefore = structuredClone(store().jobsBySceneId.s1);
    store().retryGeneration('s1');
    expect(store().jobsBySceneId.s1).toEqual(jobBefore);
  });
});

describe('generationSucceeded', () => {
  it('with matching revision sets status to succeeded', () => {
    store().generationSucceeded('s2', 'job_v2_1', 'candidate_1');
    const job = store().jobsBySceneId.s2;
    expect(job.status).toBe('succeeded');
  });

  it('with stale revision sets outdated', () => {
    // Edit script so contentRevision > job inputRevision
    store().updateScript('s2', 'Edited while generating.');
    store().generationSucceeded('s2', 'job_v2_1', 'candidate_stale');
    expect(store().jobsBySceneId.s2.status).toBe('outdated');
  });

  it('with wrong jobId is silently dropped', () => {
    const jobBefore = structuredClone(store().jobsBySceneId.s2);
    store().generationSucceeded('s2', 'wrong_job_id', 'candidate_x');
    expect(store().jobsBySceneId.s2).toEqual(jobBefore);
  });

  it('sets candidateAssetId', () => {
    store().generationSucceeded('s2', 'job_v2_1', 'candidate_abc');
    expect(store().jobsBySceneId.s2.candidateAssetId).toBe('candidate_abc');
  });
});

describe('generationFailed', () => {
  it('sets status to failed and preserves error message', () => {
    store().generationFailed('s2', 'job_v2_1', 'GPU timeout');
    const job = store().jobsBySceneId.s2;
    expect(job.status).toBe('failed');
    expect(job.error).toBe('GPU timeout');
  });

  it('preserves all scene edits', () => {
    const sceneBefore = structuredClone(store().scenesById.s2);
    const orderBefore = [...store().sceneOrder];
    store().generationFailed('s2', 'job_v2_1', 'Error');
    expect(store().scenesById.s2.script).toBe(sceneBefore.script);
    expect(store().scenesById.s2.durationSec).toBe(sceneBefore.durationSec);
    expect(store().sceneOrder).toEqual(orderBefore);
  });

  it('preserves Scene 1 approvedAssetId', () => {
    store().generationFailed('s2', 'job_v2_1', 'Error');
    expect(store().scenesById.s1.approvedAssetId).toBe('asset_approved_01');
  });

  it('with wrong jobId is dropped', () => {
    const jobBefore = structuredClone(store().jobsBySceneId.s2);
    store().generationFailed('s2', 'wrong_id', 'Error');
    expect(store().jobsBySceneId.s2).toEqual(jobBefore);
  });
});

describe('approveCandidate', () => {
  it('sets approvedAssetId from candidateAssetId', () => {
    store().generationSucceeded('s2', 'job_v2_1', 'candidate_99');
    store().approveCandidate('s2');
    expect(store().scenesById.s2.approvedAssetId).toBe('candidate_99');
  });

  it('only works when status is succeeded', () => {
    // s2 is still running, no candidate
    store().approveCandidate('s2');
    expect(store().scenesById.s2.approvedAssetId).toBeNull();
  });

  it('is rejected when inputRevision does not match contentRevision', () => {
    store().generationSucceeded('s2', 'job_v2_1', 'candidate_99');
    // Now edit script so contentRevision advances
    store().updateScript('s2', 'Changed after success.');
    store().approveCandidate('s2');
    // The job inputRevision (2) no longer matches contentRevision (3)
    expect(store().scenesById.s2.approvedAssetId).toBeNull();
  });

  it('is rejected when no candidateAssetId', () => {
    // Manually set succeeded without a candidate
    const job = store().jobsBySceneId.s2;
    useEditorStore.setState({
      jobsBySceneId: {
        ...store().jobsBySceneId,
        s2: { ...job, status: 'succeeded', candidateAssetId: undefined },
      },
    });
    store().approveCandidate('s2');
    expect(store().scenesById.s2.approvedAssetId).toBeNull();
  });
});

describe('setMediaType', () => {
  it('changing media type clears approved asset', () => {
    expect(store().scenesById.s1.approvedAssetId).toBe('asset_approved_01');
    store().setMediaType('s1', 'video');
    expect(store().scenesById.s1.approvedAssetId).toBeNull();
  });

  it('changing media type increments contentRevision', () => {
    const revBefore = store().scenesById.s1.contentRevision;
    store().setMediaType('s1', 'video');
    expect(store().scenesById.s1.contentRevision).toBe(revBefore + 1);
  });

  it('changing to same type is no-op', () => {
    const before = structuredClone(store().scenesById.s2);
    store().setMediaType('s2', 'video');
    expect(store().scenesById.s2).toEqual(before);
  });
});

describe('full scenario', () => {
  it('fail preserves all edits: order, trim, script, and Scene 1 approved image', () => {
    // Initial state already has: order [s2, s1], s2 duration 3s, s2 running
    expect(store().sceneOrder).toEqual(['s2', 's1']);
    expect(store().scenesById.s2.durationSec).toBe(3);

    // Fail s2 generation
    store().generationFailed('s2', 'job_v2_1', 'Simulated failure');

    // All edits preserved
    expect(store().sceneOrder).toEqual(['s2', 's1']);
    expect(store().scenesById.s2.durationSec).toBe(3);
    expect(store().scenesById.s2.script).toContain('next chapter');
    expect((store().scenesById.s2 as any).jobsBySceneId).toBeUndefined();
    expect(store().jobsBySceneId.s2.status).toBe('failed');

    // Scene 1 untouched
    expect(store().scenesById.s1.approvedAssetId).toBe('asset_approved_01');
    expect(store().scenesById.s1.durationSec).toBe(5);
  });

  it('retry, succeed, approve unlocks export', () => {
    // Fail first
    store().generationFailed('s2', 'job_v2_1', 'Error');
    store().retryGeneration('s2');

    const retryJobId = store().jobsBySceneId.s2.jobId;
    store().generationSucceeded('s2', retryJobId, 'new_asset_id');
    expect(store().jobsBySceneId.s2.status).toBe('succeeded');

    store().approveCandidate('s2');
    expect(store().scenesById.s2.approvedAssetId).toBe('new_asset_id');

    // Both scenes now have approved assets
    const allApproved = store().sceneOrder.every(
      (id) => store().scenesById[id].approvedAssetId !== null
    );
    expect(allApproved).toBe(true);
  });

  it('edit script during running job marks completion as outdated', () => {
    // s2 job is running at inputRevision 2
    store().updateScript('s2', 'Edited while job runs.');
    expect(store().scenesById.s2.contentRevision).toBe(3);

    // Job completes — but its inputRevision is 2, contentRevision is now 3
    store().generationSucceeded('s2', 'job_v2_1', 'stale_asset');
    expect(store().jobsBySceneId.s2.status).toBe('outdated');

    // Cannot approve an outdated result
    store().approveCandidate('s2');
    expect(store().scenesById.s2.approvedAssetId).toBeNull();
  });
});
