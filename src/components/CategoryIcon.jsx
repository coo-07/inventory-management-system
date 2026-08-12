// design-tokens 6番で確定した8分類の絵文字マッピング（34-3でCATEGORY_OPTIONSも同じ8種類に統一済み）
const CATEGORY_META = {
  文房具: { bg: "oklch(0.94 0.04 235)", icon: "✏️" },
  雑貨: { bg: "oklch(0.94 0.035 300)", icon: "🎁" },
  食品: { bg: "oklch(0.94 0.05 55)", icon: "🍙" },
  飲み物: { bg: "oklch(0.94 0.04 200)", icon: "☕" },
  ペット用品: { bg: "oklch(0.94 0.04 140)", icon: "🐾" },
  衣類: { bg: "oklch(0.94 0.04 20)", icon: "👕" },
  "美容・コスメ": { bg: "oklch(0.94 0.04 350)", icon: "🧴" },
};
const DEFAULT_META = { bg: "oklch(0.94 0.01 260)", icon: "📦" };

// 固定8分類（登録フォームのCATEGORY_OPTIONSと対応。「その他」はここでは独自アイコンを持たずdefault扱い）
export const FIXED_CATEGORIES = [...Object.keys(CATEGORY_META), "その他"];

/**
 * カテゴリ名からアイコン・背景色を判定する。
 * 判定順序：①固定8分類 → ②customIcons（80番、利用者が割り当てた任意カテゴリのアイコン） → ③default
 */
export function getCategoryMeta(category, customIcons = {}) {
  if (CATEGORY_META[category]) return CATEGORY_META[category];
  if (customIcons[category]) return { bg: DEFAULT_META.bg, icon: customIcons[category] };
  return DEFAULT_META;
}

/**
 * カテゴリごとの絵文字アイコンを表示する（2番・6番）。
 * customIconsを渡すと、固定8分類にないカテゴリでも80番で割り当てたアイコンを表示する。
 */
function CategoryIcon({ category, size = 24, customIcons }) {
  const meta = getCategoryMeta(category, customIcons);

  return (
    <span role="img" aria-label={category || "その他"} style={{ fontSize: size, lineHeight: 1 }}>
      {meta.icon}
    </span>
  );
}

export default CategoryIcon;
