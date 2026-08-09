import { useEffect, useState } from "react";
import ItemCard from "./ItemCard";
import Pagination from "./Pagination";

// カード1枚の高さ（49番で171.5pxに圧縮済み）とグリッドのgap-4（16px）
const CARD_HEIGHT = 171.5;
const GRID_GAP = 16;
const ROW_HEIGHT = CARD_HEIGHT + GRID_GAP;
// 固定ページネーションバーの実測高さ（py-3 24px + min-h-[44px] + border-t-2 2px = 70px）＋ gap-4ぶんの余白
const BOTTOM_RESERVE = 70 + GRID_GAP;

/**
 * 商品一覧のグリッド表示。列数・行数に応じてページサイズを決め、ページ送りする。
 */
function ItemList({ items, onSelect, hasAnyItems }) {
  const [gridEl, setGridEl] = useState(null);
  const [columns, setColumns] = useState(4);
  const [rows, setRows] = useState(3);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // items が空の間はグリッド自体が存在しないため、その後グリッドが
    // マウントされたタイミングでこの effect が再実行される必要がある。
    // useRef ではマウント有無に関わらず effect が初回しか走らないため、
    // ここではコールバックref（state化したDOMノード）を依存値にする。
    if (!gridEl) return;
    const measure = () => {
      const tracks = getComputedStyle(gridEl).gridTemplateColumns.split(" ").filter(Boolean);
      const nextColumns = Math.max(1, tracks.length);
      setColumns((prev) => (prev === nextColumns ? prev : nextColumns));

      const availableHeight = window.innerHeight - gridEl.getBoundingClientRect().top - BOTTOM_RESERVE;
      const rawRows = Math.floor(availableHeight / ROW_HEIGHT);
      const nextRows = Math.max(3, Math.min(4, rawRows));
      setRows((prev) => (prev === nextRows ? prev : nextRows));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(gridEl);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [gridEl]);

  useEffect(() => {
    setPage(1);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="px-5 py-24 text-center">
        <p className="text-[20px] font-bold" style={{ color: "var(--ink)" }}>
          {hasAnyItems ? "該当する商品が見つかりませんでした" : "商品がまだ登録されていません"}
        </p>
        <p className="text-[15px]" style={{ color: "var(--ink-soft)" }}>
          {hasAnyItems ? "検索条件やフィルターを変更してみてください" : "「＋新しい商品を登録」から商品を追加しましょう"}
        </p>
      </div>
    );
  }

  const pageSize = Math.max(1, columns * rows);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <div
        ref={setGridEl}
        className="grid justify-center gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 170px))" }}
      >
        {pagedItems.map((item) => (
          <ItemCard key={item.id} item={item} onClick={() => onSelect(item.id)} />
        ))}
      </div>
      <Pagination current={currentPage} total={totalPages} onGo={setPage} />
    </>
  );
}

export default ItemList;
