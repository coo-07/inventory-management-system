const now = new Date().toISOString();

function item(id, name, category, stock, threshold, unit) {
  return { id, name, category, stock, threshold, unit, imageUrl: "", createdAt: now, updatedAt: now };
}

export const sampleItems = [
  item("1", "ボールペン", "文房具", 24, 10, "本"),
  item("2", "ノート", "文房具", 2, 5, "冊"),
  item("3", "マグカップ", "雑貨", 15, 3, "個"),
  item("4", "付箋", "文房具", 40, 15, "個"),
  item("5", "アロマキャンドル", "雑貨", 4, 5, "個"),
  item("6", "トートバッグ", "雑貨", 8, 4, "枚"),
  item("7", "メモ帳", "文房具", 0, 5, "冊"),
  item("8", "カッターナイフ大型セット", "文房具", 6, 8, "本"),
  item("9", "クリアファイル", "文房具", 32, 10, "枚"),
  item("10", "観葉植物用の陶器製プランター", "雑貨", 3, 4, "個"),
  item("11", "写真立て", "雑貨", 12, 4, "個"),
  item("12", "レトルトカレー中辛", "食品", 0, 10, "個"),
  item("13", "緑茶ティーバッグ", "食品", 18, 6, "箱"),
  item("14", "インスタントコーヒー詰め合わせセット", "食品", 5, 8, "袋"),
  item("15", "延長コード", "その他", 9, 3, "本"),
  item("16", "段ボール箱（大）", "その他", 1, 5, "個"),
  item("17", "ガムテープ", "その他", 27, 10, "巻"),
];

export const sampleLogs = [
  { id: "l1", itemId: "1", type: "in", quantity: 20, memo: "定期発注分", createdAt: "2026-07-20T09:30:00" },
  { id: "l2", itemId: "1", type: "out", quantity: 6, memo: "", createdAt: "2026-07-24T14:10:00" },
  { id: "l3", itemId: "3", type: "in", quantity: 10, memo: "新商品入荷", createdAt: "2026-07-22T11:00:00" },
];
