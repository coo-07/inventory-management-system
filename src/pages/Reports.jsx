import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useItems } from "../context/ItemsContext";
import { buildItemTrend, buildTotalTrend } from "../utils/stockTrend";

const MODES = [
  { value: "total", label: "全体の在庫推移" },
  { value: "item", label: "商品ごとの推移" },
];

const PERIODS = [
  { value: 7, label: "7日間" },
  { value: 30, label: "30日間" },
];

/**
 * 在庫推移のレポート画面。既存のstock_logs・itemsのみを使い、新しいテーブルやAPIを増やさずに
 * 計算する（データの組み立てはsrc/utils/stockTrend.jsに集約し、このファイルには書かない）。
 */
function Reports() {
  const { items, logs, loading } = useItems();
  const [mode, setMode] = useState("total");
  const [periodDays, setPeriodDays] = useState(7);
  const [selectedItemId, setSelectedItemId] = useState("");

  const selectedItem = items.find((item) => item.id === selectedItemId) || null;

  const trendData = useMemo(() => {
    if (mode === "total") return buildTotalTrend(items, logs, periodDays);
    if (!selectedItem) return null;
    return buildItemTrend(selectedItem, logs, periodDays);
  }, [mode, items, logs, periodDays, selectedItem]);

  const tabButtonClass = (isActive) =>
    `inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors ${
      isActive ? "hover:bg-[var(--blue-dark)]! hover:border-[var(--blue-dark)]!" : "hover:border-[var(--ink-soft)]! hover:bg-[var(--bg)]!"
    }`;
  const tabButtonStyle = (isActive) =>
    isActive
      ? { background: "var(--blue)", color: "white", borderColor: "var(--blue)" }
      : { background: "transparent", color: "var(--ink-soft)", borderColor: "var(--border)" };

  if (loading) {
    return (
      <div className="mx-auto max-w-[960px] px-6 py-5">
        <p style={{ color: "var(--ink-soft)" }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px] px-6 py-5">
      <h1 className="mb-6 text-[26px] font-bold">在庫レポート</h1>

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            className={tabButtonClass(mode === m.value)}
            style={tabButtonStyle(mode === m.value)}
          >
            {m.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px" style={{ background: "var(--border)" }} aria-hidden="true" />
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriodDays(p.value)}
            className={tabButtonClass(periodDays === p.value)}
            style={tabButtonStyle(periodDays === p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {mode === "item" && (
        <div className="mb-5 flex flex-col gap-1.5">
          <label className="text-[13px] font-bold" style={{ color: "var(--ink-soft)" }}>
            商品を選ぶ
          </label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            disabled={items.length === 0}
            className="box-border min-h-12 max-w-96 cursor-pointer rounded-[var(--r-lg)] border-2 px-4.5 text-base transition-colors hover:border-[var(--ink-soft)]! disabled:cursor-not-allowed disabled:opacity-60"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          >
            <option value="">商品を選択してください</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {items.length === 0 && (
            <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
              登録されている商品がありません
            </p>
          )}
        </div>
      )}

      {mode === "item" && !selectedItem ? (
        <p className="py-10 text-center text-[15px]" style={{ color: "var(--ink-soft)" }}>
          商品を選択すると、在庫数の推移が表示されます
        </p>
      ) : (
        <div
          className="rounded-[var(--r-xl)] border-2 p-5"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={trendData}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--ink-soft)" fontSize={13} />
              <YAxis stroke="var(--ink-soft)" fontSize={13} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: "var(--r-md)", borderColor: "var(--border)" }} />
              <Line type="monotone" dataKey="stock" stroke="var(--blue)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default Reports;
