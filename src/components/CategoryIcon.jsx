const CATEGORY_META = {
  文房具: { bg: "oklch(0.94 0.04 235)", color: "oklch(0.48 0.13 235)", key: "stationery" },
  雑貨: { bg: "oklch(0.94 0.035 300)", color: "oklch(0.48 0.13 300)", key: "zakka" },
  食品: { bg: "oklch(0.94 0.05 55)", color: "oklch(0.52 0.15 55)", key: "food" },
};
const DEFAULT_META = { bg: "oklch(0.94 0.01 260)", color: "oklch(0.5 0.02 260)", key: "other" };

export function getCategoryMeta(category) {
  return CATEGORY_META[category] || DEFAULT_META;
}

/**
 * カテゴリごとに異なるアイコンを描き分ける（文房具・雑貨・食品・その他）
 */
function CategoryIcon({ category, size = 24 }) {
  const meta = getCategoryMeta(category);
  const color = meta.color;

  if (meta.key === "stationery") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 20l1-4L15 6l3 3L8 19l-4 1z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M18 3l3 3" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (meta.key === "zakka") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="10" width="16" height="10" rx="1.5" stroke={color} strokeWidth="1.6" />
        <path d="M4 14h16" stroke={color} strokeWidth="1.6" />
        <path d="M12 10v10" stroke={color} strokeWidth="1.6" />
        <path d="M12 10c-1.5-3-5-3-5 0M12 10c1.5-3 5-3 5 0" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (meta.key === "food") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 4L4 20h16L12 4z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7 15h10" stroke={color} strokeWidth="1.4" strokeDasharray="2 2" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="9" width="16" height="11" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M4 9L12 4L20 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default CategoryIcon;
