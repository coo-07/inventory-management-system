import { Link } from "react-router-dom";

/**
 * 利用者向けの棚卸し画面。今回は仮実装で、本実装（商品を1件ずつ表示して
 * 数を入力する機能）は次回以降のタスクとする。
 */
function Tanaoroshi() {
  return (
    <div className="mx-auto flex max-w-[520px] flex-col items-center gap-3 px-6 py-24 text-center">
      <p className="text-2xl font-bold">棚卸し機能は準備中です</p>
      <p style={{ color: "var(--ink-soft)" }}>もうしばらくお待ちください。</p>
      <Link to="/" className="mt-2 text-sm underline" style={{ color: "var(--ink)" }}>
        トップへ戻る
      </Link>
    </div>
  );
}

export default Tanaoroshi;
