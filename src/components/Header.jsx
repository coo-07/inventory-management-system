import { useEffect, useState } from "react";
import { Link, useLocation, useMatch, useNavigate } from "react-router-dom";
import { useShop } from "../hooks/useShop";
import { loadItems, loadLogs } from "../services/localStorage";
import { getStockStatus } from "../utils/stockStatus";

function useBackLink() {
  const isDetail = useMatch("/items/:id");
  const isNew = useMatch("/items/new");
  const isEdit = useMatch("/items/:id/edit");
  const isRecord = useMatch("/items/:id/record");
  const isShop = useMatch("/shop");

  if (isDetail) return { label: "一覧へ戻る", to: "/" };
  if (isNew) return { label: "戻る", to: "/" };
  if (isEdit) return { label: "戻る", to: `/items/${isEdit.params.id}` };
  if (isRecord) return { label: "商品詳細へ戻る", to: `/items/${isRecord.params.id}` };
  if (isShop) return { label: "一覧へ戻る", to: "/" };
  return null;
}

/**
 * 全画面共通のヘッダー。ロゴ・店舗名リンク・画面に応じた戻るリンクを表示する。
 */
function Header() {
  const { shop } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const backLink = useBackLink();
  const isHome = useMatch("/");

  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setItems(loadItems());
    setLogs(loadLogs());
  }, [location.pathname]);

  const outCount = items.filter((i) => getStockStatus(i.stock, i.threshold).isOut).length;
  const lowCount = items.filter((i) => getStockStatus(i.stock, i.threshold).isLow).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = logs.filter((l) => l.createdAt.slice(0, 10) === todayStr).length;

  const goToFilter = (value) => navigate(`/?filter=${value}`);

  return (
    <header
      className="sticky top-0 z-20 border-b-2"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="mx-auto flex max-w-[2400px] flex-wrap items-center justify-between gap-x-3.5 gap-y-2 px-8 py-3.5 md:py-5">
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[var(--r-md)]"
            style={{ background: "var(--blue)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="9" width="16" height="11" rx="2" stroke="white" strokeWidth="2" />
              <path d="M4 9L12 4L20 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex items-baseline gap-3">
            <Link to="/" className="text-[22px] leading-tight font-bold">
              やさしい在庫管理
            </Link>
            <button
              type="button"
              onClick={() => navigate("/shop")}
              className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border-none bg-transparent px-2.5 py-1 text-[15px] font-semibold hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"
              style={{ color: "var(--ink-soft)" }}
            >
              <span>🏪</span>
              {shop.name}
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>

        {isHome && items.length > 0 && (
          <section aria-label="現在の状況" className="flex flex-wrap items-center gap-2.5">
            <span className="text-[13px] font-bold whitespace-nowrap" style={{ color: "var(--ink-soft)" }}>
              現在の状況
            </span>
            <button
              type="button"
              onClick={() => goToFilter("out")}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors hover:border-[var(--red)]!"
              style={{ background: "var(--red-light)", color: "var(--red)", borderColor: "transparent" }}
            >
              <span aria-hidden="true">✕</span>
              在庫切れ {outCount}件
            </button>
            <button
              type="button"
              onClick={() => goToFilter("low")}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors hover:border-[var(--orange-dark)]!"
              style={{ background: "var(--orange-light)", color: "var(--orange-dark)", borderColor: "transparent" }}
            >
              <span aria-hidden="true">⚠</span>
              在庫少 {lowCount}件
            </button>
            <span
              className="inline-flex items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap"
              style={{ background: "var(--bg)", color: "var(--ink)", borderColor: "transparent" }}
            >
              <span aria-hidden="true">📦</span>
              入出荷 {todayCount}件
            </span>
          </section>
        )}
      </div>

      {backLink && (
        <div className="mx-auto max-w-[2400px] px-8 pb-3.5">
          <Link
            to={backLink.to}
            className="inline-flex items-center gap-2 text-[17px] font-bold"
            style={{ color: "var(--ink)" }}
          >
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <path
                d="M12 4L6 10L12 16"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {backLink.label}
          </Link>
        </div>
      )}
    </header>
  );
}

export default Header;
