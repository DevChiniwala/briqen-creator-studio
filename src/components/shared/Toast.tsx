import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext<(msg: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const [counter, setCounter] = useState(0);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    setCounter((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(timer);
  }, [visible, counter]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 20,
          background: '#292436',
          color: '#fff',
          fontSize: 12,
          padding: '14px 19px',
          borderRadius: 15,
          boxShadow: '0 10px 45px rgba(35, 30, 55, 0.25)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: '0.25s ease',
          pointerEvents: 'none',
        }}
      >
        {message}
      </div>
    </ToastContext.Provider>
  );
}
