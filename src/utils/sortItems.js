// 単価による並び替え（priceAsc/priceDesc）で、単価未設定（null/undefined）の商品を
// 並び順にかかわらず常に末尾にまとめるための比較関数
function comparePrice(a, b, direction) {
  const aUnset = a.unitPrice === null || a.unitPrice === undefined;
  const bUnset = b.unitPrice === null || b.unitPrice === undefined;
  if (aUnset && bUnset) return 0;
  if (aUnset) return 1;
  if (bUnset) return -1;
  return direction === "asc" ? a.unitPrice - b.unitPrice : b.unitPrice - a.unitPrice;
}

/**
 * 商品一覧（Home.jsx）・商品詳細の「次へ／前へ」（ItemDetail.jsx）で共有する並び替えロジック。
 * 元のitems配列は変更せず、新しい配列を返す。
 */
export function sortItems(items, sortKey) {
  const sorted = [...items];
  switch (sortKey) {
    case "stockAsc":
      return sorted.sort((a, b) => a.stock - b.stock);
    case "stockDesc":
      return sorted.sort((a, b) => b.stock - a.stock);
    case "nameAsc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "ja"));
    case "nameDesc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name, "ja"));
    case "priceAsc":
      return sorted.sort((a, b) => comparePrice(a, b, "asc"));
    case "priceDesc":
      return sorted.sort((a, b) => comparePrice(a, b, "desc"));
    default:
      return sorted;
  }
}
