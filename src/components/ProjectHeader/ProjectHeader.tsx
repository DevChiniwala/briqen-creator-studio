import { useEditorStore } from '@/state/store';
import { selectApprovedCount, selectTotalDuration } from '@/state/selectors';
import styles from './ProjectHeader.module.css';

export function ProjectHeader() {
  const sceneCount = useEditorStore((s) => s.sceneOrder.length);
  const approvedCount = useEditorStore(selectApprovedCount);
  const totalDuration = useEditorStore(selectTotalDuration);

  return (
    <div className={styles.header}>
      <div>
        <div className={styles.eyebrow}>CAMPAIGN / SOCIAL VIDEO</div>
        <h1 className={styles.title}>
          The quiet launch <span className={styles.titleArrow}>↗</span>
        </h1>
        <div className={styles.meta}>
          <span>Vertical reel <b className={styles.metaBold}>9:16</b></span>
          <span>·</span>
          <span>{totalDuration}-second draft</span>
          <span>·</span>
          <span>{sceneCount} scenes</span>
        </div>
      </div>
      <div className={styles.summary}>
        <span className={styles.pill}>✧ Script → storyboard → video</span>
        <span className={styles.pill}>{approvedCount} of {sceneCount} assets approved</span>
      </div>
    </div>
  );
}
