import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);
const DEFAULT_DURATION = 2500;

/**
 * showToast(text, options?) の第2引数（省略可）：
 * - options.action: { label, onClick } を渡すと、トースト内にボタンを表示する（削除のUndoなど用途）
 * - options.duration: 表示時間（ms）。省略時は2500ms
 * 第2引数を省略した従来通りの呼び出し（showToast("メッセージ")）はそのまま動作する
 */
export function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const [action, setAction] = useState(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const showToast = useCallback((text, options = {}) => {
    clearTimeout(timerRef.current);
    setMessage(text);
    setAction(options.action ?? null);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), options.duration ?? DEFAULT_DURATION);
  }, []);

  const handleActionClick = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
    action?.onClick();
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {visible && (
        <div
          className="animate-toast-in fixed top-5 right-5 z-[60] flex items-center gap-3 rounded-[var(--r-lg)] border-2 px-5 py-3.5 text-sm font-bold shadow-lg"
          style={{
            background: "var(--surface)",
            borderColor: "var(--green)",
            color: "var(--green-dark)",
            boxShadow: "0 4px 16px oklch(0.2 0.02 260 / 0.15)",
          }}
        >
          <span>{message}</span>
          {action && (
            <button
              type="button"
              onClick={handleActionClick}
              className="cursor-pointer border-none bg-transparent p-0 text-sm font-bold underline"
              style={{ color: "var(--green-dark)" }}
            >
              {action.label}
            </button>
          )}
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
