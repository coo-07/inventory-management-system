/**
 * 数量±ボタン（丸型）。StockRecord.jsx・Tanaoroshi.jsxで共用。
 * クリック時の増減ロジックは呼び出し側のonClickに委ねる（下限0/1など画面ごとに異なるため）。
 */
function StepperButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[60px] w-[60px] shrink-0 cursor-pointer rounded-full border-2 text-[26px] font-bold transition-colors hover:border-[var(--ink-soft)]! hover:bg-[var(--border)]!"
      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
    >
      {children}
    </button>
  );
}

export default StepperButton;
