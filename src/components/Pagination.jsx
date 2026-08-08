function buildPageList(current, total) {
  const pages = [];
  if (total <= 9) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }
  const set = new Set([1, total]);
  for (let d = -2; d <= 2; d++) {
    const p = current + d;
    if (p >= 1 && p <= total) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  let prev = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) pages.push("...");
    pages.push(p);
    prev = p;
  }
  return pages;
}

const edgeBase =
  "box-border min-h-[44px] px-4 text-[15px] font-bold rounded-[var(--r-md)] border-2 whitespace-nowrap transition-colors";
const numBase =
  "box-border min-h-[44px] min-w-[44px] px-3 text-[15px] font-bold rounded-[var(--r-md)] border-2 whitespace-nowrap transition-colors";

/**
 * 一覧のページ送り・商品詳細の前後送りに共通で使うページャー
 */
function Pagination({ current, total, onGo, prevLabel = "‹ 前へ", nextLabel = "次へ ›" }) {
  if (total <= 1) return null;

  const isFirst = current === 1;
  const isLast = current === total;
  const pages = buildPageList(current, total);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center gap-5 overflow-x-auto border-t-2 px-6 py-3 md:px-12"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <button
        type="button"
        disabled={isFirst}
        onClick={() => onGo(current - 1)}
        className={`${edgeBase} ${isFirst ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:border-[var(--blue)]! hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"}`}
        style={{ background: "var(--surface)", color: "var(--ink)", borderColor: "var(--border)" }}
      >
        {prevLabel}
      </button>
      <div className="flex items-center gap-1.5">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-1.5 text-[15px]" style={{ color: "var(--ink-soft)" }}>
              …
            </span>
          ) : (
            <button
              key={`p${p}`}
              type="button"
              onClick={() => onGo(p)}
              className={`${numBase} cursor-pointer ${p === current ? "" : "hover:border-[var(--blue)]! hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"}`}
              style={
                p === current
                  ? { background: "var(--blue)", color: "white", borderColor: "var(--blue)" }
                  : { background: "var(--surface)", color: "var(--ink-soft)", borderColor: "var(--border)" }
              }
            >
              {p}
            </button>
          )
        )}
      </div>
      <button
        type="button"
        disabled={isLast}
        onClick={() => onGo(current + 1)}
        className={`${edgeBase} ${isLast ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:border-[var(--blue)]! hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"}`}
        style={{ background: "var(--surface)", color: "var(--ink)", borderColor: "var(--border)" }}
      >
        {nextLabel}
      </button>
    </div>
  );
}

export default Pagination;
