import { useEffect, useState } from "react";
import { Link, useLocation, useMatch, useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setItems(loadItems());
    setLogs(loadLogs());
  }, [location.pathname]);

  const outCount = items.filter((i) => getStockStatus(i.stock, i.threshold).isOut).length;
  const lowCount = items.filter((i) => getStockStatus(i.stock, i.threshold).isLow).length;
  const availableCount = items.length - outCount - lowCount;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = logs.filter((l) => l.createdAt.slice(0, 10) === todayStr).length;

  const activeFilter = searchParams.get("filter") || "all";
  const setFilter = (value) => setSearchParams(value === "all" ? {} : { filter: value });

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
              onClick={() => setFilter("all")}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === "all" ? "hover:border-[var(--blue-dark)]!" : "hover:border-[var(--ink-soft)]! hover:bg-[var(--bg)]!"}`}
              style={
                activeFilter === "all"
                  ? { background: "var(--blue)", color: "white", borderColor: "var(--blue)" }
                  : { background: "transparent", color: "var(--ink-soft)", borderColor: "transparent" }
              }
            >
              すべて {items.length}件
            </button>
            <button
              type="button"
              onClick={() => setFilter("out")}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === "out" ? "hover:border-[#DC2626]!" : "hover:border-[#DC2626]! hover:bg-[#FECACA]!"}`}
              style={
                activeFilter === "out"
                  ? { background: "var(--red)", color: "white", borderColor: "var(--red)" }
                  : { background: "var(--red-light)", color: "var(--red)", borderColor: "transparent" }
              }
            >
              <span aria-hidden="true">✕</span>
              在庫切れ {outCount}件
            </button>
            <button
              type="button"
              onClick={() => setFilter("low")}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === "low" ? "hover:border-[var(--orange-dark)]!" : "hover:border-[var(--orange-dark)]! hover:bg-[#FED7AA]!"}`}
              style={
                activeFilter === "low"
                  ? { background: "var(--orange)", color: "white", borderColor: "var(--orange)" }
                  : { background: "var(--orange-light)", color: "var(--orange-dark)", borderColor: "transparent" }
              }
            >
              <span aria-hidden="true">⚠</span>
              在庫少 {lowCount}件
            </button>
            <button
              type="button"
              onClick={() => setFilter("available")}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === "available" ? "hover:border-[var(--ink)]!" : "hover:border-[var(--ink-soft)]! hover:bg-[var(--border)]!"}`}
              style={
                activeFilter === "available"
                  ? { background: "var(--ink-soft)", color: "white", borderColor: "var(--ink-soft)" }
                  : { background: "var(--bg)", color: "var(--ink-soft)", borderColor: "transparent" }
              }
            >
              在庫あり {availableCount}件
            </button>
            <span className="mx-1 h-4 w-px" style={{ background: "var(--border)" }} aria-hidden="true" />
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
            className="-mx-2 -my-1 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-[17px] font-bold transition-colors hover:bg-[var(--border)]!"
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
