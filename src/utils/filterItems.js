import { getStockStatus } from "./stockStatus";

// Home.jsx（商品一覧）の検索・カテゴリ・ステータスタブによる絞り込みロジック。
// ItemDetail.jsxの「次へ／前へ」で絞り込み後の商品を対象にする際にも同じロジックを使うため、
// 共通関数として切り出している
export function filterItems(items, { search = "", category = "", filter = "all" } = {}) {
  return items.filter((item) => {
    const status = getStockStatus(item.stock, item.threshold);
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || item.category === category;
    const matchesFilter =
      filter === "all" ? true :
      filter === "low" ? status.isLow :
      filter === "out" ? status.isOut :
      filter === "available" ? (!status.isOut && !status.isLow) : true;
    return matchesSearch && matchesCategory && matchesFilter;
  });
}
