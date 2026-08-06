import { useEffect, useRef, useState } from "react";
import ItemCard from "./ItemCard";
import Pagination from "./Pagination";

/**
 * 商品一覧のグリッド表示。列数に応じてページサイズを決め、ページ送りする。
 */
function ItemList({ items, onSelect, hasAnyItems }) {
  const gridRef = useRef(null);
  const [columns, setColumns] = useState(4);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => {
      const tracks = getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean);
      const next = Math.max(1, tracks.length);
      setColumns((prev) => (prev === next ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const pageSize = Math.max(1, columns * 3);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <div
        ref={gridRef}
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
