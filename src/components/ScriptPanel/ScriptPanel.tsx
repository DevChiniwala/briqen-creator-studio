import { useRef, useCallback } from 'react';
import { useEditorStore } from '@/state/store';
import { useToast } from '@/components/shared/Toast';
import { sceneDisplayLabel } from '@/utils/sceneLabels';
import styles from './ScriptPanel.module.css';

export function ScriptPanel() {
  const selectedId = useEditorStore((s) => s.selectedSceneId);
  const scene = useEditorStore((s) => s.scenesById[s.selectedSceneId]);
  const sceneOrder = useEditorStore((s) => s.sceneOrder);
  const updateScript = useEditorStore((s) => s.updateScript);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();

  const sceneLabel = sceneDisplayLabel(selectedId);
  const totalScenes = sceneOrder.length;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateScript(selectedId, e.target.value);
    },
    [selectedId, updateScript]
  );

  if (!scene) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <h2 className={styles.headingTitle}>Script editor</h2>
        <span className={styles.sceneNum}>
          SCENE {sceneLabel} / {String(totalScenes).padStart(2, '0')}
        </span>
      </div>

      <button
        className={styles.splitBtn}
        onClick={() => toast('Script splitting is simulated in this prototype.')}
      >
        ✂ Split into scenes
      </button>

      <span className={styles.label}>SCENE TITLE</span>
      <div className={styles.sceneTitle}>{scene.title}</div>
      <p className={styles.description}>
        Edit the words. The selected scene updates without changing its position or playback trim.
      </p>

      <textarea
        ref={textareaRef}
        className={styles.scriptBox}
        value={scene.script}
        onChange={handleChange}
        aria-label="Scene script"
      />

      <div className={styles.saveHint}>
        {scene.contentRevision > 1
          ? `Saved · latest script revision ${scene.contentRevision}`
          : 'Changes sync as you type.'}
      </div>

      <div className={styles.divider} />

      <div className={styles.inlineRow}>
        <strong className={styles.inlineLabel}>Scene-specific edits</strong>
        <span className={styles.pill}>Independent from AI job</span>
      </div>
      <p className={styles.description}>
        Script, scene order and playback length are saved independently of generation attempts.
      </p>

      <div className={styles.infoBox}>
        <span className={styles.infoIcon}>i</span>
        <b>Non-destructive by default.</b> A failed video job never rolls back your latest
        script, sequence or approved media.
      </div>
    </div>
  );
}
