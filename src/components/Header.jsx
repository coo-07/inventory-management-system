import { useEffect, useState } from "react";
import { Link, useLocation, useMatch, useNavigate, useSearchParams } from "react-router-dom";
import { loadItems, loadLogs, loadShop } from "../services/localStorage";
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
  const navigate = useNavigate();
  const location = useLocation();
  const backLink = useBackLink();
  const isHome = useMatch("/");
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [shop, setShop] = useState(loadShop());

  useEffect(() => {
    setItems(loadItems());
    setLogs(loadLogs());
    setShop(loadShop());
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
            style={{ background: "linear-gradient(180deg, var(--blue), var(--blue-dark))" }}
          >
            <svg width="39" height="35" viewBox="0 0 236.5 211" fill="none">
              <path
                fill="white"
                d="M1235 2188 c-29 -17 -1099 -873 -1116 -894 l-14 -17 0 -43 0 -44 27
-27 28 -27 95 -4 95 -4 0 -480 0 -479 15 -29 c8 -16 24 -34 34 -40 l20 -10
293 0 294 0 27 28 27 28 2 329 3 330 222 3 222 2 3 -334 3 -334 24 -26 24 -26
301 0 300 0 28 27 28 27 0 492 0 492 96 4 97 4 28 32 29 32 0 29 c0 16 -3 37
-6 46 -4 9 -82 79 -175 156 l-168 140 -3 255 -3 256 -28 24 -28 24 -148 0
-148 0 -27 -25 -26 -24 0 -91 c0 -49 -4 -90 -8 -90 -5 0 -78 57 -163 127 -85
70 -169 137 -188 150 l-34 23 -31 0 c-17 0 -40 -6 -51 -12z m269 -258 c114
-93 215 -171 224 -171 33 -3 47 2 65 23 l17 20 0 119 0 120 103 -3 102 -3 5
-255 c3 -140 7 -256 8 -257 7 -6 202 -168 261 -216 39 -32 71 -62 71 -68 l0
-9 -89 0 -88 0 -27 -21 -26 -20 0 -493 0 -492 -12 -12 -12 -12 -243 0 -242 0
-11 19 -10 20 0 321 0 321 -25 24 -24 25 -260 0 -260 0 -28 -24 -28 -24 -5
-339 -5 -338 -255 0 -255 0 -5 497 -5 496 -24 26 -24 26 -94 0 -93 0 0 9 c0
15 1057 861 1076 861 6 0 105 -76 218 -170z"
                transform="translate(-10.5,220) scale(0.1,-0.1)"
              />
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
