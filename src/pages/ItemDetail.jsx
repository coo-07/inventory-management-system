import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useItems } from "../hooks/useItems";
import { useToast } from "../context/ToastContext";
import CategoryIcon, { getCategoryMeta } from "../components/CategoryIcon";
import { getStockStatus } from "../utils/stockStatus";
import { formatDate } from "../utils/formatDate";
import { generateTestStockLogs } from "../utils/generateTestData";
import StockLogList from "../components/StockLogList";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import Button from "../components/Button";

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { items, getItemById, getLogsByItemId, deleteItem, seedTestLogs } = useItems();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const item = getItemById(id);

  if (!item) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-5">
        <p style={{ color: "var(--ink-soft)" }}>商品が見つかりません</p>
        <Link to="/" className="mt-2 inline-block text-sm underline" style={{ color: "var(--ink)" }}>
          一覧へ戻る
        </Link>
      </div>
    );
  }

  const logs = getLogsByItemId(id);
  const status = getStockStatus(item.stock, item.threshold);
  const meta = getCategoryMeta(item.category);
  const idx = items.findIndex((i) => i.id === id);
  const showNav = idx > 0 || (idx >= 0 && idx < items.length - 1);

  const handleSeedTestData = () => {
    const { logs: newLogs, finalStock } = generateTestStockLogs(id, item.stock, 20);
    seedTestLogs(id, newLogs, finalStock);
    showToast("テスト履歴を追加しました");
  };

  const handleConfirmDelete = () => {
    if (deleteLoading) return;
    setDeleteLoading(true);
    setTimeout(() => {
      deleteItem(id);
      setDeleteLoading(false);
      setDeleteOpen(false);
      showToast("✅ 削除しました");
      navigate("/");
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
            <CategoryIcon category={item.category} size={56} />
          </div>
          <div className="min-w-[260px] flex-1 lg:order-1 lg:w-full lg:min-w-0">
            <p className="m-0 mb-1.5 text-[28px] font-black">{item.name}</p>
            <div className="mb-1 flex items-center gap-1.5">
              <CategoryIcon category={item.category} size={17} />
              <p
                title={item.category}
                className="m-0 min-w-0 overflow-hidden text-[17px] font-bold text-ellipsis whitespace-nowrap"
              >
                {item.category}
              </p>
            </div>
            <p className="m-0 mb-4 text-[15px]" style={{ color: "var(--ink-soft)" }}>
              単位：{item.unit}
            </p>

            <div className="rounded-[var(--r-lg)] p-5" style={{ background: status.bg }}>
              <p className="m-0 mb-1 text-sm" style={{ color: "var(--ink-soft)" }}>
                現在の在庫
              </p>
              <p className="m-0 text-[40px] font-black" style={{ color: status.isOut ? "var(--red)" : status.isLow ? "var(--orange-dark)" : "var(--green-dark)" }}>
                {item.stock}
                <span className="text-[18px] font-bold"> {item.unit}</span>
              </p>
              <p className="m-0 mt-1.5 text-sm" style={{ color: "var(--ink-soft)" }}>
                発注目安：{item.threshold}{item.unit}
              </p>
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
            <Button variant="secondary" onClick={handleSeedTestData}>
              🎲 テスト履歴を追加（20件）
            </Button>
          )}

          <hr className="my-1 w-full" style={{ border: "none", borderTop: "1px solid var(--border)" }} />
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="box-border flex w-full cursor-pointer items-center justify-center gap-1 rounded-[var(--r-lg)] border-2 border-transparent py-2 text-sm font-bold transition-colors hover:border-[var(--blue)]! hover:text-[var(--blue-dark)]!"
            style={{ color: "var(--ink-soft)" }}
          >
            <span aria-hidden="true">↑</span>
            ページの先頭へ
          </button>
        </div>

        <div className="lg:order-3 lg:w-full">
          <h2 className="mb-3 text-[19px] font-bold">入出荷履歴</h2>
          <StockLogList logs={logs} />
        </div>
      </div>

      {showNav && (
        <Pagination
          current={idx + 1}
          total={items.length}
          onGo={(n) => navigate(`/items/${items[n - 1].id}`)}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="本当に削除しますか？"
        message={`「${item.name}」を削除します。この操作は取り消せません。`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
}

export default ItemDetail;
