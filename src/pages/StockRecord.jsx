import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useItems } from "../hooks/useItems";
import { useToast } from "../context/ToastContext";
import Button from "../components/Button";

function toHalfWidthDigits(str) {
  return str.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}
function sanitizeDigits(str) {
  return toHalfWidthDigits(str).replace(/[^0-9]/g, "");
}

function StockRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { loading, getItemById, recordStock } = useItems();
  const item = getItemById(id);

  const [type, setType] = useState("in");
  const [qty, setQty] = useState(1);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [recordLoading, setRecordLoading] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto max-w-[520px] px-6 py-5">
        <p style={{ color: "var(--ink-soft)" }}>読み込み中...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-[520px] px-6 py-5">
        <p style={{ color: "var(--ink-soft)" }}>商品が見つかりません</p>
      </div>
    );
  }

  const blurOnEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
  };

  const commitQty = () => {
    const n = parseInt(sanitizeDigits(String(qty)), 10);
    setQty(Number.isNaN(n) || n < 1 ? 1 : n);
  };

  const handleSubmit = () => {
    if (recordLoading) return;
    setRecordLoading(true);
    setTimeout(async () => {
      const result = await recordStock(id, type, Number(qty) || 0, memo);
      setRecordLoading(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setError("");
      showToast("✅ 在庫を更新しました");
      navigate(`/items/${id}`);
    }, 1000);
  };

  const typeBase =
    "flex-1 box-border flex min-h-12 items-center justify-center gap-2.5 rounded-[var(--r-lg)] border-[3px] text-[17px] font-bold cursor-pointer";

  return (
    <div className="mx-auto max-w-[520px] px-6 py-5">
      <p className="m-0 text-sm" style={{ color: "var(--ink-soft)" }}>
        対象商品
      </p>
      <p className="m-0 mb-6 text-2xl font-black">{item.name}</p>

      <div
        className="flex flex-col gap-6.5 rounded-[var(--r-xl)] border-2 p-7"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setType("in");
              setError("");
            }}
            className={`${typeBase} transition-colors ${type === "in" ? "hover:border-[var(--green-dark)]!" : "hover:border-[var(--ink-soft)]!"}`}
            style={
              type === "in"
                ? { background: "var(--green-light)", borderColor: "var(--green)", color: "var(--green-dark)" }
                : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink-soft)" }
            }
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 15V5M5 10l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            入荷（増やす）
          </button>
          <button
            type="button"
            onClick={() => {
              setType("out");
              setError("");
            }}
            className={`${typeBase} transition-colors ${type === "out" ? "hover:border-[var(--blue-dark)]!" : "hover:border-[var(--ink-soft)]!"}`}
            style={
              type === "out"
                ? { background: "var(--blue-light)", borderColor: "var(--blue)", color: "var(--blue-dark)" }
                : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink-soft)" }
            }
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 5v10M5 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            出荷（減らす）
          </button>
        </div>

        <div>
          <p className="m-0 mb-3.5 text-center text-[15px]" style={{ color: "var(--ink-soft)" }}>
            現在の在庫：{item.stock}{item.unit}
          </p>
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => setQty((prev) => Math.max(1, (Number(prev) || 0) - 1))}
              className="h-[60px] w-[60px] shrink-0 cursor-pointer rounded-full border-2 text-[26px] font-bold transition-colors hover:border-[var(--ink-soft)]! hover:bg-[var(--border)]!"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            >
              −
            </button>
            <input
              type="text"
              value={qty}
              onChange={(e) => setQty(sanitizeDigits(e.target.value))}
              onBlur={commitQty}
              onKeyDown={blurOnEnter}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              className="box-border w-[220px] rounded-[var(--r-md)] border-2 p-1.5 text-center text-[44px] font-black transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            />
            <button
              type="button"
              onClick={() => setQty((prev) => (Number(prev) || 0) + 1)}
              className="h-[60px] w-[60px] shrink-0 cursor-pointer rounded-full border-2 text-[26px] font-bold transition-colors hover:border-[var(--ink-soft)]! hover:bg-[var(--border)]!"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            >
              ＋
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[15px] font-bold">メモ（任意）</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="例：発注分の入荷"
            className="box-border w-full rounded-[var(--r-md)] border-2 px-4 py-3.5 text-[17px] transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          />
        </div>

        {error && (
          <div
            className="flex items-center gap-2.5 rounded-[var(--r-md)] px-4 py-3.5 text-[15px] font-bold"
            style={{ background: "var(--red-light)", color: "var(--red)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M12 4L22 20H2L12 4Z" stroke="var(--red)" strokeWidth="2" strokeLinejoin="round" />
              <line x1="12" y1="10" x2="12" y2="14" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="17" r="1.2" fill="var(--red)" />
            </svg>
            {error}
          </div>
        )}

        <Button variant="primary" className="justify-center text-[19px]" loading={recordLoading} onClick={handleSubmit}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <path d="M4 10l4 4 8-8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {recordLoading ? "記録しています..." : "記録する"}
        </Button>
      </div>
    </div>
  );
}

export default StockRecord;
