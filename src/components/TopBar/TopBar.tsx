import { useEditorStore } from '@/state/store';
import { selectExportReady, selectApprovedCount } from '@/state/selectors';
import styles from './TopBar.module.css';

export function TopBar() {
  const exportReady = useEditorStore(selectExportReady);
  const approvedCount = useEditorStore(selectApprovedCount);
  const sceneCount = useEditorStore((s) => s.sceneOrder.length);
  const reset = useEditorStore((s) => s.reset);

  const handleExport = () => {
    if (!exportReady) return;
    alert('Prototype: export eligibility confirmed. No video file is rendered in this simulation.');
  };

  return (
    <nav className={styles.topbar}>
      <div className={styles.brand}>
        <div className={styles.brandmark}>
          <span className={styles.brandmarkInner}>b.</span>
        </div>
        <div>
          Briqen{' '}
          <small className={styles.brandLabel}>CREATOR STUDIO / PROTOTYPE</small>
        </div>
      </div>
      <div className={styles.actions}>
        <span className={styles.status}>All changes saved</span>
        <button className={styles.button} onClick={reset} title="Reset the simulation">
          Reset demo
        </button>
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={!exportReady}
          onClick={handleExport}
          aria-label={exportReady ? 'Export draft' : `Export unavailable: ${approvedCount} of ${sceneCount} assets approved`}
        >
          ↗ &nbsp; Export draft
        </button>
      </div>
    </nav>
  );
}
