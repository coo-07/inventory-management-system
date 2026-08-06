/**
 * 在庫状況（在庫切れ・残りわずか・在庫あり）を判定し、表示用の色やラベルをまとめて返す
 */
export function getStockStatus(stock, threshold) {
  const isOut = stock === 0;
  const isLow = !isOut && stock < threshold;

  if (isOut) {
    return {
      isOut,
      isLow,
      label: "在庫切れ",
      icon: "✕",
      color: "var(--red)",
      bg: "var(--red-light)",
    };
  }
  if (isLow) {
    return {
      isOut,
      isLow,
      label: "残りわずか",
      icon: "⚠️",
      color: "var(--orange-dark)",
      bg: "var(--orange-light)",
    };
  }
  return {
    isOut,
    isLow,
    label: "在庫あり",
    icon: "",
    color: "var(--green-dark)",
    bg: "var(--green-light)",
  };
}
