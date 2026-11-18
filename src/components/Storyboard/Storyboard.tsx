import { useState, useCallback } from 'react';
import { useEditorStore } from '@/state/store';
import { selectExportReady, selectExportBlockReason, selectAssetDisplay } from '@/state/selectors';
import styles from './Storyboard.module.css';

const SCENE_LABELS: Record<string, string> = { s1: '01', s2: '02' };

function sceneDisplayNum(id: string): string {
  return SCENE_LABELS[id] ?? id;
}

export function Storyboard({ onToast }: { onToast: (msg: string) => void }) {
  const sceneOrder = useEditorStore((s) => s.sceneOrder);
  const scenesById = useEditorStore((s) => s.scenesById);
  const jobsBySceneId = useEditorStore((s) => s.jobsBySceneId);
  const selectedSceneId = useEditorStore((s) => s.selectedSceneId);
  const selectScene = useEditorStore((s) => s.selectScene);
  const reorder = useEditorStore((s) => s.reorder);
  const reorderDrop = useEditorStore((s) => s.reorderDrop);
  const generationFailed = useEditorStore((s) => s.generationFailed);
  const generationSucceeded = useEditorStore((s) => s.generationSucceeded);
  const reset = useEditorStore((s) => s.reset);

  const exportReady = useEditorStore(selectExportReady);
  const blockReason = useEditorStore(selectExportBlockReason);

  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, sceneId: string) => {
    e.dataTransfer.setData('text/plain', sceneId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, sceneId: string) => {
    e.preventDefault();
    setDragOverId(sceneId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetId) {
      reorderDrop(sourceId, targetId);
      onToast('Scene order saved; jobs unaffected');
    }
  }, [reorderDrop, onToast]);

  const handleMove = useCallback((e: React.MouseEvent, sceneId: string, direction: -1 | 1) => {
    e.stopPropagation();
    reorder(sceneId, direction);
    onToast('Scene order saved; generation was not restarted');
  }, [reorder, onToast]);

  const handleSelect = useCallback((sceneId: string) => {
    selectScene(sceneId);
  }, [selectScene]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, sceneId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectScene(sceneId);
    }
  }, [selectScene]);

  const handleFail = useCallback(() => {
    const s2Job = jobsBySceneId['s2'];
    if (s2Job) {
      generationFailed('s2', s2Job.jobId, 'Simulated generation failure');
      selectScene('s2');
      onToast('Simulated failure. Your 3.0s trim and scene order are preserved.');
    }
  }, [jobsBySceneId, generationFailed, selectScene, onToast]);

  const handleSuccess = useCallback(() => {
    const s2Job = jobsBySceneId['s2'];
    const s2Scene = scenesById['s2'];
    if (s2Job && s2Scene) {
      generationSucceeded('s2', s2Job.jobId, `generated_${Date.now()}`);
      selectScene('s2');
      onToast('Example job completed. Approve to export.');
    }
  }, [jobsBySceneId, scenesById, generationSucceeded, selectScene, onToast]);

  const handleReset = useCallback(() => {
    reset();
    onToast('Demo reset to reordered + trimmed example');
  }, [reset, onToast]);

  const sequenceLabel = sceneOrder.map((id) => sceneDisplayNum(id)).join(' → ');

  return (
    <section className={styles.storyboard}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.headerTitle}>
            Storyboard <span className={styles.headerTitleMuted}>/ arrange scenes</span>
          </h2>
          <p className={styles.headerSubtitle}>
            Drag cards to reorder, or use the arrow buttons. Select a scene to edit it.
          </p>
        </div>
        <span className={styles.pill}>Sequence · {sequenceLabel}</span>
      </div>

      <div className={styles.items}>
        {sceneOrder.map((id) => {
          const scene = scenesById[id];
          const job = jobsBySceneId[id];
          if (!scene) return null;
          const [statusKey] = selectAssetDisplay(scene, job);
          const isSelected = id === selectedSceneId;
          const isDragOver = id === dragOverId;

          const badgeLabel =
            statusKey === 'ok' ? 'Approved'
            : statusKey === 'fail' ? 'Failed'
            : statusKey === 'stale' ? 'Outdated'
            : statusKey === 'run' ? 'Generating'
            : statusKey === 'ready' ? 'Review'
            : 'Missing';

          const badgeClass =
            statusKey === 'ok' ? styles.miniBadgeGreen
            : statusKey === 'fail' || statusKey === 'stale' ? styles.miniBadgeRed
            : '';

          return (
            <div
              key={id}
              className={`${styles.sceneCard} ${isSelected ? styles.sceneCardSelected : ''} ${isDragOver ? styles.sceneCardDragover : ''}`}
              onClick={() => handleSelect(id)}
              onKeyDown={(e) => handleKeyDown(e, id)}
              draggable
              onDragStart={(e) => handleDragStart(e, id)}
              onDragOver={(e) => handleDragOver(e, id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, id)}
              role="button"
              tabIndex={0}
              aria-label={`Select Scene ${sceneDisplayNum(id)}`}
            >
              <div className={`${styles.thumb} ${id === 's1' ? styles.thumbOne : styles.thumbTwo}`} />
              <div className={styles.cardContent}>
                <div className={styles.cardTop}>
                  <span className={styles.cardIndex}>SCENE {sceneDisplayNum(id)}</span>
                  <span className={styles.dragHandle}>⠿</span>
                </div>
                <div className={styles.cardTitle}>{scene.title}</div>
                <div className={styles.cardFooter}>
                  <span>{scene.durationSec.toFixed(1)}s</span>
                  <span className={`${styles.miniBadge} ${badgeClass}`}>{badgeLabel}</span>
                </div>
                <div className={styles.moveActions}>
                  <button
                    className={styles.moveBtn}
                    onClick={(e) => handleMove(e, id, -1)}
                    aria-label={`Move Scene ${sceneDisplayNum(id)} earlier`}
                  >
                    ←
                  </button>
                  <button
                    className={styles.moveBtn}
                    onClick={(e) => handleMove(e, id, 1)}
                    aria-label={`Move Scene ${sceneDisplayNum(id)} later`}
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.readiness}>
          {exportReady ? (
            <>
              <span className={styles.readinessStrong}>Export ready</span> · Every scene has approved media.
            </>
          ) : (
            <>
              <span className={styles.readinessStrong}>Export unavailable</span> · {blockReason}
            </>
          )}
        </div>
        <div className={styles.demoControls}>
          <span>✧ Walk through the assignment</span>
          <button className={styles.demoBtn} onClick={handleFail}>1. Fail generation</button>
          <button className={styles.demoBtn} onClick={handleSuccess}>2. Complete retry</button>
          <button className={styles.demoBtn} onClick={handleReset}>Reset demo</button>
        </div>
      </div>
    </section>
  );
}
