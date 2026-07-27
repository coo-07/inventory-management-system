import Button from "./Button";

/**
 * 確認ダイアログの共通枠
 * @param {boolean} isOpen
 * @param {string} title
 * @param {string} message
 * @param {() => void} onCancel
 * @param {() => void} onConfirm
 */
function Dialog({ isOpen, title, message, onCancel, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 text-base font-medium text-gray-900">{title}</h2>
        <p className="mb-4 text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            キャンセル
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            削除
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Dialog;
