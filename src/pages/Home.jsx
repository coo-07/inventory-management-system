import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useItems } from "../context/ItemsContext";
import { useCategoryIcons } from "../hooks/useCategoryIcons";
import { useToast } from "../context/ToastContext";
import { generateTestItems } from "../utils/generateTestData";
import { getStockStatus } from "../utils/stockStatus";
import ItemList from "../components/ItemList";
import Button from "../components/Button";

function readSkippedFromStorage(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

// rawの値は「マッピングされていない列」がnull、「マッピングされているが空欄」が""として渡ってくるため、
// それぞれ「－」「（空欄）」として表示し分ける
function formatRawCell(value) {
  if (value === null) return "－";
  if (value === "") return "（空欄）";
  return value;
}

function Home() {
  const { items, loading, loadTestData, deleteTestData, deleteAllItems } = useItems();
  const { customIcons } = useCategoryIcons();
  const navigate = useNavigate();
  const showToast = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const [addLoading, setAddLoading] = useState(false);
  const [testDataLoading, setTestDataLoading] = useState(false);
  const [deleteTestDataLoading, setDeleteTestDataLoading] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  // Excel取り込み（ItemImport.jsx）でスキップされた行・重複商品の処理結果。sessionStorage経由で受け取ることで、
  // 商品詳細画面などを経由して一覧に戻ってきても「確認しました」を押すまで表示し続ける
  const [duplicateResults, setDuplicateResults] = useState(() => readSkippedFromStorage("importDuplicateResults"));
  const [skippedReasons, setSkippedReasons] = useState(() => readSkippedFromStorage("importSkippedReasons"));

  const dismissSkippedReasons = () => {
    setSkippedReasons([]);
    sessionStorage.removeItem("importSkippedReasons");
  };

  const dismissDuplicateResults = () => {
    setDuplicateResults([]);
    sessionStorage.removeItem("importDuplicateResults");
  };

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

  const handleDeleteAllItems = async () => {
    if (deleteAllLoading) return;
    if (items.length === 0) {
      showToast("削除対象の商品がありません");
      return;
    }
    const confirmed = window.confirm(`全商品（${items.length}件）を削除します。よろしいですか？`);
    if (!confirmed) return;
    setDeleteAllLoading(true);
    try {
      const result = await deleteAllItems();
      if (!result.ok) {
        showToast("❌ " + result.message);
        return;
      }
      showToast("全商品を削除しました");
    } catch (error) {
      console.error(error);
      showToast("❌ 予期しないエラーが発生しました");
    } finally {
      setDeleteAllLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[2400px] px-6 py-5 pb-36 md:px-12">
      {skippedReasons.length > 0 && (
        <div
          className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-[var(--r-md)] border-2 px-4.5 py-3.5"
          style={{ borderColor: "var(--orange)", background: "var(--orange-light)" }}
        >
          <div className="min-w-0 flex-1">
            <p className="m-0 mb-2 text-[14px] font-bold" style={{ color: "var(--orange-dark)" }}>
              ⚠️ 取り込みでスキップされた行があります（{skippedReasons.length}件）
            </p>
            <div className="overflow-x-auto rounded-[var(--r-md)] border" style={{ borderColor: "var(--orange)" }}>
              <table className="w-full border-collapse text-left text-[13px]" style={{ color: "var(--orange-dark)" }}>
                <thead>
                  <tr style={{ background: "var(--orange-light)" }}>
                    {["行番号", "商品名", "カテゴリ", "在庫数", "発注点", "単位", "スキップ理由"].map((h) => (
                      <th key={h} className="border px-3 py-2 font-bold whitespace-nowrap" style={{ borderColor: "var(--orange)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {skippedReasons.map((r, i) => (
                    <tr key={i} style={{ background: "var(--surface)" }}>
                      <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--orange)" }}>
                        {r.rowNumber}
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--orange)" }}>
                        {formatRawCell(r.raw?.name ?? null)}
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--orange)" }}>
                        {formatRawCell(r.raw?.category ?? null)}
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--orange)" }}>
                        {formatRawCell(r.raw?.stock ?? null)}
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--orange)" }}>
                        {formatRawCell(r.raw?.threshold ?? null)}
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--orange)" }}>
                        {formatRawCell(r.raw?.unit ?? null)}
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--orange)" }}>
                        {r.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Button variant="secondarySoft" onClick={dismissSkippedReasons} className="shrink-0">
            確認しました
          </Button>
        </div>
      )}

      {duplicateResults.length > 0 && (
        <div
          className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-[var(--r-md)] border-2 px-4.5 py-3.5"
          style={{ borderColor: "var(--orange)", background: "var(--orange-light)" }}
        >
          <div>
            <p className="m-0 mb-1.5 text-[14px] font-bold" style={{ color: "var(--orange-dark)" }}>
              ⚠️ 重複商品の処理結果（{duplicateResults.length}件）
            </p>
            <ul className="m-0 list-disc pl-5 text-[13px]" style={{ color: "var(--orange-dark)" }}>
              {duplicateResults.map((r, i) => (
                <li key={i}>
                  {r.action === "skip" ? (
                    <>
                      {r.name}：変更しませんでした（スキップ）
                    </>
                  ) : r.action === "add" ? (
                    <>
                      {r.name}：{r.beforeStock}個 → {r.afterStock}個に加算しました（{r.beforeStock}個＋{r.afterStock - r.beforeStock}個）
                    </>
                  ) : (
                    <>
                      {r.name}：{r.beforeStock}個 → {r.afterStock}個に置き換えました
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <Button variant="secondarySoft" onClick={dismissDuplicateResults} className="shrink-0">
            確認しました
          </Button>
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
          <button
            type="button"
            onClick={() => navigate("/settings/categories")}
            title="カテゴリアイコン設定"
            className="box-border inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border text-base transition-colors hover:bg-[var(--bg)]!"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink-soft)" }}
          >
            ⚙️
          </button>
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
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={handleDeleteAllItems}
              disabled={deleteAllLoading}
              title="開発用: 全商品と履歴をSupabaseから削除します"
              className="box-border inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-md border px-3 text-[13px] font-bold whitespace-nowrap transition-colors hover:bg-[var(--bg)]! disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink-soft)" }}
            >
              {deleteAllLoading ? "削除しています..." : "🗑️ 全商品を削除する"}
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
        customIcons={customIcons}
      />
    </div>
  );
}

export default Home;
