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

/**
 * 動作確認用の入出荷履歴を生成する（開発用ボタンから使用、ページネーション確認用）。
 * 入荷・出荷はランダム、数量は1〜10のランダム、日時は1件ごとに1時間ずつ過去にずらす。
 */
export function generateTestStockLogs(itemId, currentStock, count = 20) {
  const logs = [];
  let stock = currentStock;
  for (let i = 0; i < count; i++) {
    const type = Math.random() > 0.5 ? "in" : "out";
    const quantity = Math.floor(Math.random() * 10) + 1;
    stock = type === "in" ? stock + quantity : Math.max(0, stock - quantity);
    logs.push({
      id: crypto.randomUUID(),
      itemId,
      type,
      quantity,
      memo: type === "in" ? "テスト入荷" : "テスト出荷",
      afterStock: stock,
      createdAt: new Date(Date.now() - i * 3600 * 1000).toISOString(),
    });
  }
  return { logs, finalStock: stock };
}
