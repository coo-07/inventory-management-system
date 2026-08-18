import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useItems } from "../context/ItemsContext";
import { useCategoryIcons } from "../hooks/useCategoryIcons";
import { useToast } from "../context/ToastContext";
import { useGoBack } from "../hooks/useGoBack";
import CategoryIcon, { getCategoryMeta } from "../components/CategoryIcon";
import { getStockStatus } from "../utils/stockStatus";
import { filterItems } from "../utils/filterItems";
import { sortItems } from "../utils/sortItems";
import { formatDate } from "../utils/formatDate";
import { formatPrice } from "../utils/formatPrice";
import { generateTestStockLogs } from "../utils/generateTestData";
import StockLogList from "../components/StockLogList";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import Button from "../components/Button";

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const { items, loading, getItemById, getLogsByItemId, deleteItem, seedTestLogs } = useItems();
  const { customIcons } = useCategoryIcons();
  const goBack = useGoBack();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const stockBoxRef = useRef(null);

  const item = getItemById(id);

  useEffect(() => {
    const handleScroll = () => {
      if (!stockBoxRef.current) return;
      const rect = stockBoxRef.current.getBoundingClientRect();
      setShowBackToTop(rect.bottom < 0);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [item?.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-5">
        <p style={{ color: "var(--ink-soft)" }}>読み込み中...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-5">
        <p style={{ color: "var(--ink-soft)" }}>商品が見つかりません</p>
        <button
          type="button"
          onClick={() => goBack("/items")}
          className="mt-2 inline-block cursor-pointer border-none bg-transparent p-0 text-sm underline"
          style={{ color: "var(--ink)" }}
        >
          一覧へ戻る
        </button>
      </div>
    );
  }

  const logs = getLogsByItemId(id);
  const status = getStockStatus(item.stock, item.threshold);
  const meta = getCategoryMeta(item.category, customIcons);
  // 一覧画面での絞り込み条件（search・category・manufacturer・filter）をクエリパラメータ経由で
  // 引き継いでいる場合は、その絞り込み結果を「次へ／前へ」の対象にする。パラメータが
  // 一つも無い場合（詳細ページを直接開いた等）は従来通り全商品を対象にする。
  // 並び替え（sort）は絞り込みパラメータの有無にかかわらず、一覧画面と同じ並び順にするため常に適用する
  const hasFilterParams =
    searchParams.has("search") ||
    searchParams.has("category") ||
    searchParams.has("manufacturer") ||
    searchParams.has("filter");
  const navItems = sortItems(
    hasFilterParams
      ? filterItems(items, {
          search: searchParams.get("search") || "",
          category: searchParams.get("category") || "",
          manufacturer: searchParams.get("manufacturer") || "",
          filter: searchParams.get("filter") || "all",
        })
      : items,
    searchParams.get("sort") || "stockAsc"
  );
  const idx = navItems.findIndex((i) => i.id === id);
  const showNav = idx > 0 || (idx >= 0 && idx < navItems.length - 1);

  const handleSeedTestData = async () => {
    if (seedLoading) return;
    setSeedLoading(true);
    try {
      const { logs: newLogs, finalStock } = generateTestStockLogs(id, item.stock, 20);
      const result = await seedTestLogs(id, newLogs, finalStock);
      if (!result.ok) {
        showToast("❌ " + result.message);
        return;
      }
      showToast("テスト履歴を追加しました");
    } catch (error) {
      console.error(error);
      showToast("❌ 予期しないエラーが発生しました");
    } finally {
      setSeedLoading(false);
    }
  };

  // deleteItemは即座に完了する（実際のSupabaseへの削除リクエストは5秒後、Undoされなければ
  // ItemsContext側で送られる）。「削除しました　元に戻す」のトーストもItemsContext側が表示するため、
  // ここではダイアログを閉じて一覧へ戻るだけでよい
  const handleConfirmDelete = () => {
    if (deleteLoading) return;
    setDeleteLoading(true);
    setTimeout(() => {
      deleteItem(id);
      setDeleteLoading(false);
      setDeleteOpen(false);
      navigate("/items");
    }, 1000);
  };

  return (
    <div
      className="mx-auto max-w-[720px] px-6 py-5 md:max-w-[760px] lg:max-w-[960px]"
      style={{ paddingBottom: showNav ? "140px" : "40px" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] lg:items-start lg:gap-5">
        {/* lg:contents unwraps this row so image/info become independent grid columns at lg, while mobile keeps the original side-by-side hero row untouched */}
        <div className="mb-7 flex flex-wrap gap-6 lg:contents">
          <div
            className="flex h-[200px] w-[200px] shrink-0 items-center justify-center rounded-[var(--r-xl)] lg:sticky lg:order-2 lg:w-full"
            style={{ background: meta.bg, top: "131px" }}
          >
            <CategoryIcon category={item.category} size={56} customIcons={customIcons} />
          </div>
          <div className="min-w-[260px] flex-1 lg:order-1 lg:w-full lg:min-w-0">
            <h1 className="m-0 mb-1.5 text-[28px] font-black">{item.name}</h1>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                title={item.category}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold"
                style={{ background: "var(--border)", color: "var(--ink)" }}
              >
                <CategoryIcon category={item.category} size={15} customIcons={customIcons} />
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{item.category}</span>
              </span>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
                style={{ background: "var(--border)", color: "var(--ink)" }}
              >
                単位：{item.unit}
              </span>
              {item.manufacturer && (
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
                  style={{ background: "var(--border)", color: "var(--ink)" }}
                >
                  メーカー：{item.manufacturer}
                </span>
              )}
              {(item.unitPrice !== null && item.unitPrice !== undefined) && (
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
                  style={{ background: "var(--border)", color: "var(--ink)" }}
                >
                  単価：{formatPrice(item.unitPrice)}
                </span>
              )}
            </div>

            <div
              ref={stockBoxRef}
              className="flex flex-col gap-2 rounded-[var(--r-lg)] p-5 sm:flex-row sm:items-center sm:justify-between"
              style={{ background: status.bg }}
            >
              <p className="m-0 text-sm font-bold" style={{ color: "var(--ink-soft)" }}>
                現在の在庫
              </p>
              <div className="text-right">
                <p className="m-0 text-[40px] font-black" style={{ color: status.isOut ? "var(--red)" : status.isLow ? "var(--orange-dark)" : "var(--green-dark)" }}>
                  {item.stock}
                  <span className="text-[18px] font-bold"> {item.unit}</span>
                </p>
                <p className="m-0 mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
                  発注目安：{item.threshold}{item.unit}
                </p>
              </div>
            </div>

            <p className="m-0 mt-3 text-sm" style={{ color: "var(--ink-soft)" }}>
              更新日時：{formatDate(item.updatedAt).split(" ")[0]}
            </p>
          </div>
        </div>

        <div className="mb-9 flex flex-wrap gap-3 lg:sticky lg:order-4 lg:w-full lg:flex-col" style={{ top: "351px" }}>
          <Button variant="secondarySoft" onClick={() => navigate(`/items/${id}/record`)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 3v14M4 9l6-6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            入出荷を記録
          </Button>
          <Button variant="secondarySoft" onClick={() => navigate(`/items/${id}/edit`)}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M4 16l1-4L13 4l3 3-8 8-4 1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            編集する
          </Button>
          <Button variant="dangerOutline" onClick={() => setDeleteOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="5" y="7" width="10" height="9" rx="1.5" stroke="var(--red)" strokeWidth="1.6" />
              <line x1="3" y1="5" x2="17" y2="5" stroke="var(--red)" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="8" y1="2.5" x2="12" y2="2.5" stroke="var(--red)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            削除する
          </Button>
          {import.meta.env.DEV && (
            <Button variant="secondary" loading={seedLoading} onClick={handleSeedTestData}>
              {seedLoading ? "追加しています..." : "🎲 テスト履歴を追加（20件）"}
            </Button>
          )}
        </div>

        <div className="lg:order-3 lg:w-full">
          <h2 className="mb-3 text-[19px] font-bold">入出荷履歴</h2>
          <StockLogList logs={logs} />
        </div>
      </div>

      {showNav && (
        <Pagination
          current={idx + 1}
          total={navItems.length}
          onGo={(n) => {
            // 履歴をpushすると「一覧へ戻る」（navigate(-1)）が1つ前の商品詳細に
            // 戻ってしまうため、replaceで現在の履歴エントリを置き換える。絞り込み
            // 条件のクエリパラメータもそのまま引き継ぐ
            const query = searchParams.toString();
            navigate(`/items/${navItems[n - 1].id}${query ? `?${query}` : ""}`, { replace: true });
          }}
        />
      )}

      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="ページの先頭へ戻る"
          className="fixed right-6 z-30 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 text-xl font-bold shadow-md transition-colors hover:border-[var(--blue)]! hover:text-[var(--blue-dark)]!"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink-soft)", bottom: showNav ? "94px" : "24px" }}
        >
          <span aria-hidden="true">↑</span>
        </button>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="本当に削除しますか？"
        message={
          <>
            「{item.name}」を削除します。
            <br />
            この操作は取り消せません。
          </>
        }
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
}

export default ItemDetail;
