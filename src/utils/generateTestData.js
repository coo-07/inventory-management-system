const CATEGORIES = ["文房具", "雑貨", "食品", "その他"];
const UNITS = { 文房具: "本", 雑貨: "個", 食品: "箱", その他: "個" };

function buildItem(number, index, stock, threshold) {
  const now = new Date().toISOString();
  const category = CATEGORIES[index % CATEGORIES.length];
  return {
    id: crypto.randomUUID(),
    name: `テスト${number}`,
    category,
    stock,
    threshold,
    unit: UNITS[category],
    imageUrl: "",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 動作確認用のテスト商品20件を生成する。
 * 在庫切れ・在庫少・在庫ありのパターンを混在させる（開発用ボタンから使用）。
 * startNumber を渡すと「テスト(startNumber+1)」から連番を続ける（既存データへの追加用）。
 */
export function generateTestItems(startNumber = 0) {
  const items = [];
  let index = 0;

  // 在庫切れ（3件）: stock === 0
  for (let i = 0; i < 3; i++) {
    items.push(buildItem(startNumber + index + 1, index, 0, 10));
    index++;
  }

  // 在庫少（5件）: 0 < stock < threshold
  for (let i = 0; i < 5; i++) {
    const threshold = 10;
    items.push(buildItem(startNumber + index + 1, index, 1 + (i % (threshold - 1)), threshold));
    index++;
  }

  // 在庫あり（12件）: stock >= threshold
  for (let i = 0; i < 12; i++) {
    const threshold = 5 + (i % 10);
    items.push(buildItem(startNumber + index + 1, index, threshold + 5 + (i % 20), threshold));
    index++;
  }

  return items;
}
