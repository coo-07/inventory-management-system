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

export function getCategoryMeta(category) {
  return CATEGORY_META[category] || DEFAULT_META;
}

/**
 * カテゴリごとの絵文字アイコンを表示する（2番・6番）
 */
function CategoryIcon({ category, size = 24 }) {
  const meta = getCategoryMeta(category);

  return (
    <span role="img" aria-label={category || "その他"} style={{ fontSize: size, lineHeight: 1 }}>
      {meta.icon}
    </span>
  );
}

export default CategoryIcon;
