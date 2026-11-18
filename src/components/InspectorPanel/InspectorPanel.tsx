import { useEditorStore } from '@/state/store';
import { selectAssetDisplay, type AssetDisplayStatus } from '@/state/selectors';
import type { JobStatus } from '@/types';
import styles from './InspectorPanel.module.css';

interface InspectorPanelProps {
  onOpenModal: () => void;
}

export function InspectorPanel({ onOpenModal }: InspectorPanelProps) {
  const scene = useEditorStore((s) => s.scenesById[s.selectedSceneId]);
  const job = useEditorStore((s) => s.jobsBySceneId[s.selectedSceneId]);
  const setMediaType = useEditorStore((s) => s.setMediaType);
  const adjustDuration = useEditorStore((s) => s.adjustDuration);
  const retryGeneration = useEditorStore((s) => s.retryGeneration);
  const approveCandidate = useEditorStore((s) => s.approveCandidate);

  if (!scene) return null;

  const [displayStatus, statusTitle, statusDesc] = selectAssetDisplay(scene, job);
  const jobStatus: JobStatus = job?.status ?? 'idle';

  const retryDisabled =
    !['failed', 'outdated', 'idle'].includes(jobStatus) || !!scene.approvedAssetId;
  const retryLabel =
    jobStatus === 'idle' ? '✦  Generate' : jobStatus === 'outdated' ? '↻  Regenerate' : '↻  Retry';

  const isReadyForReview = jobStatus === 'succeeded' && !scene.approvedAssetId;

  const assetStatusClass = [
    styles.assetStatus,
    displayStatus === 'fail' ? styles.assetStatusFail : '',
    displayStatus === 'ok' ? styles.assetStatusOk : '',
  ]
    .filter(Boolean)
    .join(' ');

  const descClass = [
    styles.assetDescription,
    displayStatus === 'fail' ? styles.assetDescriptionFail : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.inspector}>
      <div className={styles.heading}>
        <h2 className={styles.headingTitle}>Scene controls</h2>
        <span className={styles.pill}>Inspector</span>
      </div>

      <div className={styles.fields}>
        {/* Media type */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>GENERATE AS</label>
          <div className={styles.modeOptions}>
            <button
              className={`${styles.modeBtn} ${scene.mediaType === 'image' ? styles.modeBtnActive : ''}`}
              onClick={() => setMediaType(scene.id, 'image')}
            >
              ▧ &nbsp; Image
            </button>
            <button
              className={`${styles.modeBtn} ${scene.mediaType === 'video' ? styles.modeBtnActive : ''}`}
              onClick={() => setMediaType(scene.id, 'video')}
            >
              ▣ &nbsp; Video
            </button>
          </div>
        </div>

        {/* Duration */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>PLAYBACK DURATION</label>
          <div className={styles.durationInput}>
            <button
              className={styles.durationBtn}
              onClick={() => adjustDuration(scene.id, -0.5)}
              aria-label="Decrease duration"
            >
              −
            </button>
            <strong className={styles.durationValue}>
              {scene.durationSec.toFixed(1)} <span className={styles.durationUnit}>seconds</span>
            </strong>
            <button
              className={styles.durationBtn}
              onClick={() => adjustDuration(scene.id, 0.5)}
              aria-label="Increase duration"
            >
              +
            </button>
          </div>
          <div className={styles.durationNote}>
            Playback trim is separate from generation input.
          </div>
        </div>

        {/* Asset status + actions */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>GENERATION & ASSET</label>
          <div className={assetStatusClass}>
            <div className={styles.assetTitle}>{statusTitle}</div>
            <p className={descClass}>{statusDesc}</p>
            {displayStatus === 'run' && (
              <div className={styles.progressBar}>
                <i className={styles.progressBarFill} />
              </div>
            )}
          </div>
          <div className={styles.actionGrid}>
            <button
              className={`${styles.button} ${!retryDisabled ? styles.buttonDanger : ''}`}
              disabled={retryDisabled}
              onClick={() => retryGeneration(scene.id)}
            >
              {retryLabel}
            </button>
            <button
              className={`${styles.button} ${isReadyForReview ? styles.buttonPrimary : ''}`}
              onClick={() => {
                if (isReadyForReview) {
                  approveCandidate(scene.id);
                } else {
                  onOpenModal();
                }
              }}
            >
              {isReadyForReview ? '✓  Approve' : '⇄  Replace'}
            </button>
          </div>
          <div className={styles.note}>
            New assets are reviewed before being used. Previously approved assets stay untouched.
          </div>
        </div>
      </div>
    </div>
  );
}
