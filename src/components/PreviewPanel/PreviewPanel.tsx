import { useEditorStore } from '@/state/store';
import { selectAssetDisplay, type AssetDisplayStatus } from '@/state/selectors';
import styles from './PreviewPanel.module.css';

export function PreviewPanel() {
  const scene = useEditorStore((s) => s.scenesById[s.selectedSceneId]);
  const job = useEditorStore((s) => s.jobsBySceneId[s.selectedSceneId]);

  if (!scene) return null;

  const [displayStatus] = selectAssetDisplay(scene, job);
  const isApproved = displayStatus === 'ok';
  const canvasClass = scene.id === 's1' ? styles.sceneOne : styles.sceneTwo;

  return (
    <div className={styles.previewPanel}>
      <div className={styles.toolbar}>
        <h2 className={styles.toolbarTitle}>Canvas preview</h2>
        <span className={styles.frameInfo}>9:16 · Draft resolution</span>
      </div>

      <div className={styles.stage}>
        <div key={scene.id} className={`${styles.videoCanvas} ${canvasClass}`}>
          <div className={styles.sun} />
          <div className={`${styles.ridge} ${scene.id === 's1' ? styles.sceneOne : ''}`} />
          <div className={`${styles.ridge} ${styles.ridgeSecondary} ${scene.id === 's1' ? styles.sceneOne : ''}`} />
          <div className={styles.caption}>
            <small className={styles.captionLabel}>BRIQEN ORIGINAL</small>
            {scene.title}
          </div>
        </div>
        <div className={styles.previewShade} />

        {!isApproved && <Overlay status={displayStatus} mediaType={scene.mediaType} />}
      </div>

      <div className={styles.stageBottom}>
        <span>◉ &nbsp; Preview is representative · not a rendered video</span>
        <span>
          <span className={styles.durationDot} />
          {scene.durationSec.toFixed(1)}s scene
        </span>
      </div>
    </div>
  );
}

function Overlay({ status, mediaType }: { status: AssetDisplayStatus; mediaType: string }) {
  if (status === 'run') {
    return (
      <div className={styles.stageOverlay}>
        <div className={styles.spinner} />
        <b className={styles.overlayTitle}>Generating {mediaType}</b>
        <p className={styles.overlayDesc}>Your edits stay available while generation runs.</p>
      </div>
    );
  }

  if (status === 'fail') {
    return (
      <div className={styles.stageOverlay}>
        <span className={styles.stateIcon}>⚠</span>
        <b className={styles.overlayTitle}>Generation failed</b>
        <p className={styles.overlayDesc}>
          Nothing you edited was lost. Retry this scene or replace its asset.
        </p>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className={styles.stageOverlay}>
        <span className={styles.stateIcon}>✦</span>
        <b className={styles.overlayTitle}>Ready to review</b>
        <p className={styles.overlayDesc}>Approve the generated asset to unlock export.</p>
      </div>
    );
  }

  if (status === 'stale') {
    return (
      <div className={styles.stageOverlay}>
        <span className={styles.stateIcon}>↻</span>
        <b className={styles.overlayTitle}>Script changed</b>
        <p className={styles.overlayDesc}>This result is outdated. Generate from the latest version.</p>
      </div>
    );
  }

  return (
    <div className={styles.stageOverlay}>
      <span className={styles.stateIcon}>◌</span>
      <b className={styles.overlayTitle}>Awaiting media</b>
      <p className={styles.overlayDesc}>Choose a ready asset or generate one.</p>
    </div>
  );
}
