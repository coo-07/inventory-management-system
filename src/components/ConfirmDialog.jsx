import Button from "./Button";

/**
 * 削除確認モーダル
 */
function ConfirmDialog({ open, title, message, onCancel, onConfirm, loading = false, confirmLabel = "削除する" }) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "oklch(0.2 0.02 260 / 0.45)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] rounded-[var(--r-xl)] p-8 text-center"
        style={{ background: "var(--surface)" }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--red-light)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 4L22 20H2L12 4Z" stroke="var(--red)" strokeWidth="2" strokeLinejoin="round" />
            <line x1="12" y1="10" x2="12" y2="14" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="17" r="1.2" fill="var(--red)" />
          </svg>
        </div>
        <p className="mb-2 text-[19px] font-bold">{title}</p>
        <p className="mb-6 text-[15px]" style={{ color: "var(--ink-soft)" }}>
          {message}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 justify-center" disabled={loading} onClick={onCancel}>
            キャンセル
          </Button>
          <Button variant="dangerSolid" className="flex-1 justify-center" loading={loading} onClick={onConfirm}>
            {loading ? "削除しています..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
