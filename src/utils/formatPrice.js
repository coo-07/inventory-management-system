/**
 * 単価をカンマ区切り＋「円」の表示用文字列に変換する（例：1280 → "1,280円"）
 * 未設定（null/undefined）の場合は空文字を返す
 */
export function formatPrice(unitPrice) {
  if (unitPrice === null || unitPrice === undefined) return "";
  return `${unitPrice.toLocaleString("ja-JP")}円`;
}
