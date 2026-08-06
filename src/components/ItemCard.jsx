import CategoryIcon, { getCategoryMeta } from "./CategoryIcon";
import { getStockStatus } from "../utils/stockStatus";

/**
 * 商品1件分のカード。カテゴリアイコン・在庫状況アイコン・在庫数を表示する。
 */
function ItemCard({ item, onClick }) {
  const status = getStockStatus(item.stock, item.threshold);
  const meta = getCategoryMeta(item.category);
  const cardBg = status.isOut ? "#FEE2E2" : "var(--surface)";
  const cardBorder = status.isOut ? "#EF4444" : "var(--border)";
  const showStatusBadge = status.isOut || status.isLow;

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group box-border flex w-full cursor-pointer flex-col items-stretch gap-2 rounded-[var(--r-xl)] border-2 p-3 text-left no-underline"
      style={{ background: cardBg, borderColor: cardBorder, color: "inherit" }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--r-md)]"
          style={{ background: meta.bg }}
        >
          <CategoryIcon category={item.category} />
        </div>
        <p
          title={item.category}
          className="m-0 min-w-0 flex-1 overflow-hidden text-[15px] font-semibold text-ellipsis whitespace-nowrap"
          style={{ color: "var(--ink)" }}
        >
          {item.category}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p
          title={item.name}
          className="m-0 min-w-0 overflow-hidden text-[21px] font-bold text-ellipsis whitespace-nowrap"
          style={{ color: "var(--ink)" }}
        >
          {item.name}
        </p>
        {showStatusBadge && (
          <span className="relative inline-flex shrink-0">
            <span className="inline-flex items-center justify-center text-2xl leading-none" style={{ color: status.color }}>
              {status.icon}
            </span>
            <span
              className="pointer-events-none absolute top-[calc(100%+12px)] right-0 z-50 rounded-[10px] border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-[#333] opacity-0 shadow-md transition-opacity group-hover:opacity-100"
              style={{ background: status.isOut ? "#FEF2F2" : "#FFF7ED", borderColor: status.isOut ? "#FECACA" : "#FED7AA" }}
            >
              {status.isOut ? "在庫切れ" : "残りわずか"}
            </span>
          </span>
        )}
      </div>

      <p className="m-0 flex items-baseline gap-1.5">
        <span className="text-[11px] font-medium" style={{ color: "var(--ink-soft)" }}>
          在庫
        </span>
        <span className="text-[32px] font-black" style={{ color: status.isOut ? "var(--red)" : status.isLow ? "var(--orange-dark)" : "var(--ink)" }}>
          {item.stock}
        </span>
        <span className="text-sm font-semibold" style={{ color: status.isOut ? "var(--red)" : status.isLow ? "var(--orange-dark)" : "var(--ink)" }}>
          {item.unit}
        </span>
      </p>

      <span
        aria-hidden="true"
        className="box-border flex min-h-[48px] items-center justify-center rounded-[var(--r-md)] border-2 text-xl font-bold"
        style={{ background: "var(--surface)", color: "var(--ink)", borderColor: "var(--border)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}

export default ItemCard;
