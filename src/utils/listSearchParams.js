// 商品一覧（Home.jsx）の検索ワード・カテゴリ・メーカー・並び替え・ステータスタブ・ページ番号の初期値（未指定状態）。
// これと同じ値が指定された場合はURLにクエリパラメータを付けない
const LIST_PARAM_DEFAULTS = { search: "", category: "", manufacturer: "", sort: "stockAsc", filter: "all", page: 1 };

/**
 * 商品一覧のURLクエリパラメータ（search・category・manufacturer・sort・filter・page）を更新した
 * 新しいURLSearchParamsを返す。値が初期値の場合はパラメータ自体を削除し、URLをできるだけ
 * シンプルに保つ。search・category・manufacturer・sort・filterのいずれかを更新した場合は、表示順・
 * 絞り込み結果のページ数が変わりうるためpageを1（＝パラメータなし）にリセットする。
 * Header.jsx（ステータスタブ）とHome.jsx（検索欄・カテゴリ・メーカー・並び替え・ページ送り）の両方から使う。
 */
export function updateListParams(currentParams, updates) {
  const next = new URLSearchParams(currentParams);

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null || value === LIST_PARAM_DEFAULTS[key]) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  }

  if (Object.keys(updates).some((key) => key !== "page")) {
    next.delete("page");
  }

  return next;
}
