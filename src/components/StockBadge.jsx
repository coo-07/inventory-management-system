/**
 * 在庫不足の警告表示。stock が threshold 未満のときだけ表示する。
 * @param {number} stock
 * @param {number} threshold
 */
function StockBadge({ stock, threshold }) {
  if (stock >= threshold) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
      在庫少
    </span>
  );
}

export default StockBadge;
