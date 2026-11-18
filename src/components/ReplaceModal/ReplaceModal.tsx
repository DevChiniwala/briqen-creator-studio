import { useCallback, useEffect } from 'react';
import { useEditorStore } from '@/state/store';
import styles from './ReplaceModal.module.css';

interface ReplaceModalProps {
  open: boolean;
  sceneId: string;
  onClose: () => void;
}

const ASSETS = [
  { id: 'library_coast', name: 'Coastal morning', meta: 'Ready · video sample', iconClass: styles.assetIconGreen },
  { id: 'library_studio', name: 'Lavender studio', meta: 'Ready · video sample', iconClass: styles.assetIconPurple },
] as const;

export function ReplaceModal({ open, sceneId, onClose }: ReplaceModalProps) {
  const replaceAsset = useEditorStore((s) => s.replaceAsset);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleSelect = useCallback(
    (assetId: string, assetName: string) => {
      replaceAsset(sceneId, assetId, assetName);
      onClose();
    },
    [replaceAsset, sceneId, onClose],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <div
      className={`${styles.backdrop} ${open ? '' : styles.backdropHidden}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Replace scene asset"
    >
      <div className={styles.modal}>
        <div className={styles.eyebrow}>ASSET LIBRARY · SIMULATION</div>
        <h3 className={styles.modalTitle}>Replace scene media</h3>
        <p className={styles.modalDescription}>
          Choose an already-ready example asset. Only the selected scene changes; other assets and
          edits remain intact.
        </p>
        <div className={styles.assetList}>
          {ASSETS.map((asset) => (
            <button
              key={asset.id}
              className={styles.assetOption}
              onClick={() => handleSelect(asset.id, asset.name)}
            >
              <span className={`${styles.assetIcon} ${asset.iconClass}`} />
              <strong className={styles.assetOptionName}>{asset.name}</strong>
              <small className={styles.assetOptionMeta}>{asset.meta}</small>
            </button>
          ))}
        </div>
        <div className={styles.modalActions}>
          <button className={styles.button} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
