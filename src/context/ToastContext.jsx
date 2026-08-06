import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const showToast = useCallback((text) => {
    clearTimeout(timerRef.current);
    setMessage(text);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 2500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {visible && (
        <div
          className="animate-toast-in fixed top-5 right-5 z-[60] rounded-[var(--r-lg)] border-2 px-5 py-3.5 text-sm font-bold shadow-lg"
          style={{
            background: "var(--surface)",
            borderColor: "var(--green)",
            color: "var(--green-dark)",
            boxShadow: "0 4px 16px oklch(0.2 0.02 260 / 0.15)",
          }}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
