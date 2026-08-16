// 在庫推移グラフ（Reports.jsx）用のデータ計算ロジック。stock_logs・itemsをそのまま使い、
// 新しいテーブルやAPIを増やさずに「過去の任意時点の在庫数」を逆算する。

function formatDateLabel(date) {
  return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

function endOfDay(date) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

// ログ1件が表す在庫の増減量（符号付き）を返す
// type: "in" → +quantity、"out" → -quantity、"count" → quantity（すでに差分として保存されている）
export function getLogDelta(log) {
  if (log.type === "in") return log.quantity;
  if (log.type === "out") return -log.quantity;
  return log.quantity;
}

// 指定した商品の、指定した日付「時点」（その日の23:59:59時点）の在庫数を返す
// itemLogsAsc: その商品の履歴のみを抽出し、createdAt昇順に並べた配列
export function getItemStockAsOfDate(item, itemLogsAsc, targetDate) {
  const boundary = endOfDay(targetDate).getTime();

  let latestWithinRange = null;
  for (const log of itemLogsAsc) {
    if (new Date(log.createdAt).getTime() <= boundary) {
      latestWithinRange = log;
    } else {
      break;
    }
  }

  if (latestWithinRange) return latestWithinRange.afterStock;

  if (itemLogsAsc.length > 0) {
    const firstLog = itemLogsAsc[0];
    return firstLog.afterStock - getLogDelta(firstLog);
  }

  return item.stock;
}

// 期間（日数）から、今日を含む過去N日分のDateオブジェクト配列を古い順に返す
export function getDateRangeDays(periodDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = periodDays - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    days.push(day);
  }
  return days;
}

// 商品ごとの推移データを作る。戻り値は [{ date: "8/10", stock: 42 }, ...] の配列
export function buildItemTrend(item, allLogs, periodDays) {
  const itemLogsAsc = allLogs
    .filter((log) => log.itemId === item.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return getDateRangeDays(periodDays).map((date) => ({
    date: formatDateLabel(date),
    stock: getItemStockAsOfDate(item, itemLogsAsc, date),
  }));
}

// 全商品合計の推移データを作る。各日について、その日時点でまだ登録されていなかった商品
// （item.createdAtが対象日より後）は合計に含めない
export function buildTotalTrend(items, allLogs, periodDays) {
  const itemLogsAscById = new Map(
    items.map((item) => [
      item.id,
      allLogs
        .filter((log) => log.itemId === item.id)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    ])
  );

  return getDateRangeDays(periodDays).map((date) => {
    const boundary = endOfDay(date).getTime();
    const total = items.reduce((sum, item) => {
      if (new Date(item.createdAt).getTime() > boundary) return sum;
      return sum + getItemStockAsOfDate(item, itemLogsAscById.get(item.id), date);
    }, 0);
    return { date: formatDateLabel(date), stock: total };
  });
}
