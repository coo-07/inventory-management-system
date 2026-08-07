import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useItems } from "../hooks/useItems";
import { useToast } from "../context/ToastContext";
import { generateTestItems } from "../utils/generateTestData";
import ItemList from "../components/ItemList";
import Button from "../components/Button";

const FILTERS = [
  { value: "all", label: "すべて" },
  { value: "low", label: "在庫少" },
  { value: "available", label: "在庫あり" },
];

function Home() {
  const { items, logs, loadTestData } = useItems();
  const navigate = useNavigate();
  const showToast = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState("all");
  const [addLoading, setAddLoading] = useState(false);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))],
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || item.category === category;
      const matchesFilter =
        filter === "all" ||
        (filter === "low" && item.stock < item.threshold) ||
        (filter === "available" && item.stock >= item.threshold);
      return matchesSearch && matchesCategory && matchesFilter;
    });
  }, [items, search, category, filter]);

  const outCount = items.filter((i) => i.stock === 0).length;
  const lowCount = items.filter((i) => i.stock > 0 && i.stock < i.threshold).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = logs.filter((l) => l.createdAt.slice(0, 10) === todayStr).length;

  const actionItems = [];
  if (outCount > 0) actionItems.push({ icon: "✕", text: `在庫切れ ${outCount}件`, color: "var(--red)", bg: "var(--red-light)" });
  if (lowCount > 0) actionItems.push({ icon: "⚠", text: `在庫少 ${lowCount}件`, color: "var(--red)", bg: "var(--red-light)" });
  actionItems.push({ icon: "📦", text: `入出荷 ${todayCount}件`, color: "var(--ink)", bg: "var(--bg)" });

  const handleAddNew = () => {
    if (addLoading) return;
    setAddLoading(true);
    setTimeout(() => {
      setAddLoading(false);
      navigate("/items/new");
    }, 500);
  };

  const handleLoadTestData = () => {
    const confirmed = window.confirm("テストデータを20件追加します。よろしいですか？");
    if (!confirmed) return;
    const maxNumber = items.reduce((max, item) => {
      const match = /^テスト(\d+)$/.exec(item.name);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    loadTestData(generateTestItems(maxNumber));
    showToast("テストデータを読み込みました");
  };

  return (
    <div className="mx-auto max-w-[2400px] px-6 py-5 pb-36 md:px-12">
      {items.length > 0 && (
        <div
          aria-label="今日のお知らせ"
          className="mb-6 flex flex-wrap items-center gap-2.5 rounded-[var(--r-lg)] border px-4 py-2.5"
          style={{ background: "var(--bg)", borderColor: "var(--border)" }}
        >
          <p className="m-0 text-[13px] font-bold whitespace-nowrap" style={{ color: "var(--ink-soft)" }}>
            現在の状況
          </p>
          {actionItems.map((act, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-bold whitespace-nowrap"
              style={{ background: act.bg, color: act.color }}
            >
              <span>{act.icon}</span>
              {act.text}
            </span>
          ))}
        </div>
      )}

      <div className="mb-7 flex flex-wrap items-end gap-4">
        <div className="flex min-w-[260px] max-w-96 flex-1 flex-col gap-1.5">
          <label className="text-[13px] font-bold" style={{ color: "var(--ink-soft)" }}>
            商品を探す
          </label>
          <div className="relative">
            <svg
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <circle cx="9" cy="9" r="6" stroke="var(--ink-soft)" strokeWidth="2" />
              <line x1="13.5" y1="13.5" x2="18" y2="18" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="商品名で検索"
              className="box-border min-h-12 w-full rounded-[var(--r-lg)] border-2 py-3 pr-4 pl-[46px] text-[17px]"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-l pl-5" style={{ borderColor: "var(--border)" }}>
          <label className="text-[13px] font-bold" style={{ color: "var(--ink-soft)" }}>
            絞り込み
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="box-border min-h-12 cursor-pointer rounded-[var(--r-lg)] border-2 px-4.5 text-base"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            >
              <option value="">商品の種類</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div
              className="flex w-fit gap-1.5 rounded-[var(--r-lg)] border-2 p-1.5"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className="box-border inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-none px-5.5 text-sm font-bold transition-colors"
                  style={
                    filter === f.value
                      ? { background: "var(--blue)", color: "white" }
                      : { background: "transparent", color: "var(--ink-soft)" }
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={handleLoadTestData}
              title="開発用: テストデータ20件をLocalStorageに読み込みます"
              className="box-border inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-md border px-3 text-[13px] font-bold whitespace-nowrap transition-colors hover:bg-[var(--bg)]!"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink-soft)" }}
            >
              🧪 テストデータを読み込む
            </button>
          )}
          <Button variant="primary" loading={addLoading} onClick={handleAddNew} className="whitespace-nowrap">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="10" y1="4" x2="10" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="4" y1="10" x2="16" y2="10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            {addLoading ? "登録しています..." : "新しい商品を登録"}
          </Button>
        </div>
      </div>

      <ItemList items={filteredItems} onSelect={(id) => navigate(`/items/${id}`)} hasAnyItems={items.length > 0} />
    </div>
  );
}

export default Home;
