import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useItems } from "../context/ItemsContext";
import { useCategoryIcons } from "../hooks/useCategoryIcons";
import { useToast } from "../context/ToastContext";
import { generateTestItems } from "../utils/generateTestData";
import { filterItems } from "../utils/filterItems";
import { sortItems } from "../utils/sortItems";
import { downloadItemsAsExcel, downloadItemsAsCsv } from "../utils/itemExport";
import { updateListParams } from "../utils/listSearchParams";
import ItemList from "../components/ItemList";
import Button from "../components/Button";

// ステータスタブの値（Header.jsxのsetFilterが使う"all"|"out"|"low"|"available"）に対応する表示名。
// Header.jsxのタブ文言（「すべて」「在庫切れ」「在庫少」「在庫あり」）と統一し、
// ダウンロードメニューのラベルに「（状態名 件数）」として表示するために使う
const FILTER_LABELS = { all: "すべて", out: "在庫切れ", low: "在庫少", available: "在庫あり" };

// 並び替えセレクトの選択肢（表示順のまま）
const SORT_OPTIONS = [
  { value: "stockAsc", label: "在庫が少ない順" },
  { value: "stockDesc", label: "在庫が多い順" },
  { value: "nameAsc", label: "名前順（あ→わ）" },
  { value: "nameDesc", label: "名前順（わ→あ）" },
  { value: "priceAsc", label: "単価が安い順" },
  { value: "priceDesc", label: "単価が高い順" },
];

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
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const manufacturer = searchParams.get("manufacturer") || "";
  const sort = searchParams.get("sort") || "stockAsc";
  const filter = searchParams.get("filter") || "all";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  // 検索ワード・カテゴリ・メーカー・ステータスタブのいずれかがURLに存在する（＝既定値でない）場合、
  // 絞り込み中と判定する。ダウンロードのファイル名を「在庫データ_絞り込み_...」にするかどうかに使う
  const hasFilterParams =
    searchParams.has("search") ||
    searchParams.has("category") ||
    searchParams.has("manufacturer") ||
    searchParams.has("filter");

  // 検索ワード・カテゴリ・ステータスタブ・ページ番号をURLクエリパラメータとして保持することで、
  // 商品詳細画面などを経由して一覧に戻ってきても絞り込み状態が失われないようにする。
  // 検索欄への入力など連続した変更で履歴を積みすぎないよう、常にreplaceで現在のURLを置き換える
  const updateParam = (key, value) => {
    setSearchParams(updateListParams(searchParams, { [key]: value }), { replace: true });
  };

  // 検索欄は表示用にローカルstateを持つ。value={searchParams.get("search")}のように直接URL値を
  // バインドすると、setSearchParams（URL更新）が1レンダー分遅れて反映されるため、素早く連続して
  // 入力した際に古いURL値で入力欄の表示が巻き戻り、文字が欠落してしまう。ローカルstateなら
  // 入力のたびに即座に表示が更新され、URLへの反映（永続化用）は裏で追従させるだけで済む
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || "");
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    updateParam("search", value);
  };

  const [testDataLoading, setTestDataLoading] = useState(false);
  const [deleteTestDataLoading, setDeleteTestDataLoading] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  // Excel取り込み（ItemImport.jsx）でスキップされた行・重複商品の処理結果。sessionStorage経由で受け取ることで、
  // 商品詳細画面などを経由して一覧に戻ってきても「確認しました」を押すまで表示し続ける
  const [duplicateResults, setDuplicateResults] = useState(() => readSkippedFromStorage("importDuplicateResults"));
  const [skippedReasons, setSkippedReasons] = useState(() => readSkippedFromStorage("importSkippedReasons"));
  // 2つのバナーは初期状態を必ず折りたたみにし、開閉状態はそれぞれ独立して持たせる
  const [isSkipDetailExpanded, setIsSkipDetailExpanded] = useState(false);
  const [isDuplicateDetailExpanded, setIsDuplicateDetailExpanded] = useState(false);

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

  const manufacturers = useMemo(
    () =>
      [...new Set(items.map((item) => item.manufacturer).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "ja")
      ),
    [items]
  );

  const testDataCount = useMemo(
    () => items.filter((item) => /^テスト\d+$/.test(item.name)).length,
    [items]
  );

  const filteredItems = useMemo(
    () => sortItems(filterItems(items, { search: searchInput, category, manufacturer, filter }), sort),
    [items, searchInput, category, manufacturer, filter, sort]
  );

  const todayStr = new Date().toISOString().slice(0, 10);

  // 「📥 ダウンロード」ボタンのメニュー開閉状態。外側クリック・Escキーで閉じる（下のuseEffect参照）
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef(null);

  useEffect(() => {
    if (!isDownloadMenuOpen) return;
    const handlePointerDown = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setIsDownloadMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsDownloadMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDownloadMenuOpen]);

  // ダウンロード対象は常に「今画面に表示されている商品」（filteredItems）に連動させる。
  // 絞り込みなし時はfilterItems()が全件を返すため、結果的に全商品がダウンロードされる
  const downloadFilenameSuffix = hasFilterParams ? "_絞り込み" : "";
  // ラベルの「（状態名 件数）」部分。状態名はステータスタブ（filter）の表示名のみを見る
  // （検索・カテゴリでの絞り込みは件数には反映されるが、状態名としては区別しない）
  const downloadCountLabel = `${FILTER_LABELS[filter] || "すべて"} ${filteredItems.length}件`;
  const downloadMenuItems = [
    {
      key: "excel",
      label: `Excelでダウンロード（${downloadCountLabel}）`,
      disabled: filteredItems.length === 0,
      onClick: () => downloadItemsAsExcel(filteredItems, `在庫データ${downloadFilenameSuffix}_${todayStr}.xlsx`),
    },
    {
      key: "csv",
      label: `CSVでダウンロード（${downloadCountLabel}・外部システム連携用）`,
      disabled: filteredItems.length === 0,
      onClick: () => downloadItemsAsCsv(filteredItems, `在庫データ${downloadFilenameSuffix}_${todayStr}.csv`),
    },
  ];

  const handleDownloadMenuItemClick = (item) => {
    if (item.disabled) return;
    item.onClick();
    setIsDownloadMenuOpen(false);
  };

  const handleAddNew = () => {
    navigate("/items/new");
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
          className="mb-5 rounded-[var(--r-md)] border-2 px-4.5 py-3.5"
          style={{ borderColor: "var(--orange)", background: "var(--orange-light)" }}
        >
          <button
            type="button"
            onClick={() => setIsSkipDetailExpanded((prev) => !prev)}
            aria-expanded={isSkipDetailExpanded}
            className="flex w-full cursor-pointer items-center justify-between gap-3 border-none bg-transparent p-0 text-left text-[14px] font-bold"
            style={{ color: "var(--orange-dark)" }}
          >
            <span>⚠️ 取り込みでスキップされた行があります（{skippedReasons.length}件）</span>
            <span aria-hidden="true">{isSkipDetailExpanded ? "▼" : "▶"}</span>
          </button>

          {isSkipDetailExpanded && (
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 overflow-x-auto rounded-[var(--r-md)] border" style={{ borderColor: "var(--orange)" }}>
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
              <Button variant="secondarySoft" onClick={dismissSkippedReasons} className="shrink-0">
                確認しました
              </Button>
            </div>
          )}
        </div>
      )}

      {duplicateResults.length > 0 && (
        <div
          className="mb-5 rounded-[var(--r-md)] border-2 px-4.5 py-3.5"
          style={{ borderColor: "var(--orange)", background: "var(--orange-light)" }}
        >
          <button
            type="button"
            onClick={() => setIsDuplicateDetailExpanded((prev) => !prev)}
            aria-expanded={isDuplicateDetailExpanded}
            className="flex w-full cursor-pointer items-center justify-between gap-3 border-none bg-transparent p-0 text-left text-[14px] font-bold"
            style={{ color: "var(--orange-dark)" }}
          >
            <span>⚠️ 重複商品の処理結果（{duplicateResults.length}件）</span>
            <span aria-hidden="true">{isDuplicateDetailExpanded ? "▼" : "▶"}</span>
          </button>

          {isDuplicateDetailExpanded && (
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
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
              <Button variant="secondarySoft" onClick={dismissDuplicateResults} className="shrink-0">
                確認しました
              </Button>
            </div>
          )}
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
              value={searchInput}
              onChange={handleSearchChange}
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
            onChange={(e) => updateParam("category", e.target.value)}
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

        <div className="flex flex-col gap-1.5 border-l pl-5" style={{ borderColor: "var(--border)" }}>
          <label className="text-[13px] font-bold" style={{ color: "var(--ink-soft)" }}>
            メーカー
          </label>
          <select
            value={manufacturer}
            onChange={(e) => updateParam("manufacturer", e.target.value)}
            className="box-border min-h-12 cursor-pointer rounded-[var(--r-lg)] border-2 px-4.5 text-base transition-colors hover:border-[var(--ink-soft)]!"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          >
            <option value="">メーカー：すべて</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 border-l pl-5" style={{ borderColor: "var(--border)" }}>
          <label className="text-[13px] font-bold" style={{ color: "var(--ink-soft)" }}>
            並び替え
          </label>
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="box-border min-h-12 cursor-pointer rounded-[var(--r-lg)] border-2 px-4.5 text-base transition-colors hover:border-[var(--ink-soft)]!"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
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
          <div className="relative" ref={downloadMenuRef}>
            <Button
              variant="secondary"
              onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
              className="whitespace-nowrap"
            >
              📥 ダウンロード
            </Button>
            {isDownloadMenuOpen && (
              <ul
                role="menu"
                aria-label="ダウンロード"
                className="absolute right-0 z-30 mt-1 w-max min-w-[300px] overflow-hidden rounded-[var(--r-md)] border-2 py-1 shadow-lg"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                {downloadMenuItems.map((item) => (
                  <li key={item.key} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      onClick={() => handleDownloadMenuItemClick(item)}
                      className={`block w-full border-none bg-transparent px-4 py-2 text-left text-[15px] transition-colors ${
                        item.disabled
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"
                      }`}
                      style={{ color: item.disabled ? "var(--ink-soft)" : "var(--ink)" }}
                    >
                      {item.label}
                      {item.disabled && (
                        <span className="mt-0.5 block text-[12px]" style={{ color: "var(--ink-soft)" }}>
                          対象の商品がありません
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button variant="primary" onClick={handleAddNew} className="whitespace-nowrap">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="10" y1="4" x2="10" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="4" y1="10" x2="16" y2="10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            新しい商品を登録
          </Button>
        </div>
      </div>

      <ItemList
        items={filteredItems}
        onSelect={(id) => {
          // 詳細画面の「次へ／前へ」を絞り込み結果と連動させるため、絞り込み条件を
          // クエリパラメータとして引き継ぐ（pageは詳細画面では使わないため付けない）
          const params = new URLSearchParams(searchParams);
          params.delete("page");
          const query = params.toString();
          navigate(`/items/${id}${query ? `?${query}` : ""}`);
        }}
        hasAnyItems={items.length > 0}
        loading={loading}
        customIcons={customIcons}
        page={page}
        onPageChange={(nextPage) => updateParam("page", nextPage)}
      />
    </div>
  );
}

export default Home;
