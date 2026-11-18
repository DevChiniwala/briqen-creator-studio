import { useState, useEffect } from 'react';
import { TopBar } from '@/components/TopBar/TopBar';
import { ProjectHeader } from '@/components/ProjectHeader/ProjectHeader';
import { ScriptPanel } from '@/components/ScriptPanel/ScriptPanel';
import { PreviewPanel } from '@/components/PreviewPanel/PreviewPanel';
import { InspectorPanel } from '@/components/InspectorPanel/InspectorPanel';
import { Storyboard } from '@/components/Storyboard/Storyboard';
import { ReplaceModal } from '@/components/ReplaceModal/ReplaceModal';
import { ToastProvider, useToast } from '@/components/shared/Toast';
import { useEditorStore } from '@/state/store';
import styles from './App.module.css';

declare global {
  interface Window {
    __briqenDemo?: {
      getState: () => Pick<ReturnType<typeof useEditorStore.getState>, 'sceneOrder' | 'scenesById' | 'jobsBySceneId' | 'selectedSceneId'>;
      fail: () => void;
      retry: () => void;
      success: () => void;
      reset: () => void;
    };
  }
}

function EditorApp() {
  const [modalOpen, setModalOpen] = useState(false);
  const selectedSceneId = useEditorStore((s) => s.selectedSceneId);
  const toast = useToast();

  useEffect(() => {
    const store = useEditorStore;
    window.__briqenDemo = {
      getState: () => {
        const { sceneOrder, scenesById, jobsBySceneId, selectedSceneId } = store.getState();
        return structuredClone({ sceneOrder, scenesById, jobsBySceneId, selectedSceneId });
      },
      fail: () => {
        const state = store.getState();
        const job = state.jobsBySceneId['s2'];
        if (job) {
          state.generationFailed('s2', job.jobId, 'Simulated failure');
          state.selectScene('s2');
        }
      },
      retry: () => {
        const state = store.getState();
        state.retryGeneration('s2');
      },
      success: () => {
        const state = store.getState();
        const scene = state.scenesById['s2'];
        const job = state.jobsBySceneId['s2'];
        if (job && scene) {
          state.generationSucceeded('s2', job.jobId, `generated_${Date.now()}`);
          state.selectScene('s2');
        }
      },
      reset: () => store.getState().reset(),
    };
  }, []);

  return (
    <>
      <TopBar />
      <main className={styles.page}>
        <ProjectHeader />
        <section className={styles.workspace}>
          <ScriptPanel />
          <PreviewPanel />
          <InspectorPanel onOpenModal={() => setModalOpen(true)} />
        </section>
        <Storyboard onToast={toast} />
      </main>
      <ReplaceModal
        open={modalOpen}
        sceneId={selectedSceneId}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <EditorApp />
    </ToastProvider>
  );
}
