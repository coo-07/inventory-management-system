import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useItems } from "../hooks/useItems";
import { useToast } from "../context/ToastContext";
import { generateTestItems } from "../utils/generateTestData";
import { getStockStatus } from "../utils/stockStatus";
import ItemList from "../components/ItemList";
import Button from "../components/Button";

function Home() {
  const { items, loading, loadTestData, deleteTestData } = useItems();
  const navigate = useNavigate();
  const showToast = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const [addLoading, setAddLoading] = useState(false);
  const [testDataLoading, setTestDataLoading] = useState(false);
  const [deleteTestDataLoading, setDeleteTestDataLoading] = useState(false);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))],
    [items]
  );

  const testDataCount = useMemo(
    () => items.filter((item) => /^テスト\d+$/.test(item.name)).length,
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const status = getStockStatus(item.stock, item.threshold);
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || item.category === category;
      const matchesFilter =
        filter === "all" ? true :
        filter === "low" ? status.isLow :
        filter === "out" ? status.isOut :
        filter === "available" ? (!status.isOut && !status.isLow) : true;
      return matchesSearch && matchesCategory && matchesFilter;
    });
  }, [items, search, category, filter]);

  const handleAddNew = () => {
    if (addLoading) return;
    setAddLoading(true);
    setTimeout(() => {
      setAddLoading(false);
      navigate("/items/new");
    }, 500);
  };

  const handleLoadTestData = async () => {
    if (testDataLoading) return;
    const confirmed = window.confirm("テストデータを20件追加します。よろしいですか？");
    if (!confirmed) return;
    const maxNumber = items.reduce((max, item) => {
      const match = /^テスト(\d+)$/.exec(item.name);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    setTestDataLoading(true);
    try {
      const result = await loadTestData(generateTestItems(maxNumber));
      if (!result.ok) {
        showToast("❌ " + result.message);
        return;
      }
      showToast("テストデータを読み込みました");
    } catch (error) {
      console.error(error);
      showToast("❌ 予期しないエラーが発生しました");
    } finally {
      setTestDataLoading(false);
    }
  };

  const handleDeleteTestData = async () => {
    if (deleteTestDataLoading) return;
    if (testDataCount === 0) {
      showToast("削除対象のテストデータがありません");
      return;
    }
    const confirmed = window.confirm(`テストデータ（${testDataCount}件）を削除します。よろしいですか？`);
    if (!confirmed) return;
    setDeleteTestDataLoading(true);
    try {
      const result = await deleteTestData();
      if (!result.ok) {
        showToast("❌ " + result.message);
        return;
      }
      showToast("テストデータを削除しました");
    } catch (error) {
      console.error(error);
      showToast("❌ 予期しないエラーが発生しました");
    } finally {
      setDeleteTestDataLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[2400px] px-6 py-5 pb-36 md:px-12">
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
              className="box-border min-h-12 w-full rounded-[var(--r-lg)] border-2 py-3 pr-4 pl-[46px] text-[17px] transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-l pl-5" style={{ borderColor: "var(--border)" }}>
          <label className="text-[13px] font-bold" style={{ color: "var(--ink-soft)" }}>
            商品の種類
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="box-border min-h-12 cursor-pointer rounded-[var(--r-lg)] border-2 px-4.5 text-base transition-colors hover:border-[var(--ink-soft)]!"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          >
            <option value="">すべて</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={handleLoadTestData}
              disabled={testDataLoading}
              title="開発用: テストデータ20件をSupabaseに追加します"
              className="box-border inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-md border px-3 text-[13px] font-bold whitespace-nowrap transition-colors hover:bg-[var(--bg)]! disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink-soft)" }}
            >
              {testDataLoading ? "読み込んでいます..." : "🧪 テストデータを読み込む"}
            </button>
          )}
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={handleDeleteTestData}
              disabled={deleteTestDataLoading}
              title="開発用: テスト名（テストN）の商品と履歴をSupabaseから削除します"
              className="box-border inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-md border px-3 text-[13px] font-bold whitespace-nowrap transition-colors hover:bg-[var(--bg)]! disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink-soft)" }}
            >
              {deleteTestDataLoading ? "削除しています..." : "🗑️ テストデータを削除する"}
            </button>
          )}
          <Button variant="secondary" onClick={() => navigate("/items/import")} className="whitespace-nowrap">
            📄 Excelから取り込む
          </Button>
          <Button variant="primary" loading={addLoading} onClick={handleAddNew} className="whitespace-nowrap">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="10" y1="4" x2="10" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="4" y1="10" x2="16" y2="10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            {addLoading ? "登録しています..." : "新しい商品を登録"}
          </Button>
        </div>
      </div>

      <ItemList
        items={filteredItems}
        onSelect={(id) => navigate(`/items/${id}`)}
        hasAnyItems={items.length > 0}
        loading={loading}
      />
    </div>
  );
}

export default Home;
