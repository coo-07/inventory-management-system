import * as XLSX from "xlsx";

const EXPORT_COLUMNS = [
  { key: "商品名", width: 24 },
  { key: "カテゴリ", width: 12 },
  { key: "在庫数", width: 10 },
  { key: "発注点", width: 10 },
  { key: "単位", width: 8 },
  { key: "メーカー", width: 24 },
  { key: "単価", width: 10 },
  { key: "登録日", width: 18 },
  { key: "更新日", width: 18 },
];

const BOM = "﻿";

// 出力する列定義を返す。excludePriceがtrueの場合は「単価」列を除く
// （スタッフには単価を見せない権限制御のため、122-1番）
function getExportColumns(excludePrice) {
  return excludePrice ? EXPORT_COLUMNS.filter((col) => col.key !== "単価") : EXPORT_COLUMNS;
}

// ISO形式の日時文字列を「YYYY-MM-DD HH:mm」形式に変換する。xlsx・CSV両方の出力で共通利用する
export function formatDateForExport(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// items配列を、出力用の列名をキーに持つオブジェクトの配列に変換する。
// excludePriceがtrueの場合、返すオブジェクトに「単価」キー自体を含めない
export function buildExportRows(items, { excludePrice = false } = {}) {
  return items.map((item) => {
    const row = {
      商品名: item.name,
      カテゴリ: item.category,
      在庫数: item.stock,
      発注点: item.threshold,
      単位: item.unit,
      メーカー: item.manufacturer,
      登録日: formatDateForExport(item.createdAt),
      更新日: formatDateForExport(item.updatedAt),
    };
    if (!excludePrice) row.単価 = item.unitPrice;
    return row;
  });
}

// itemsをExcel(.xlsx)ファイルとしてダウンロードする。ItemImport.jsxの取り込み処理と同じ
// xlsxライブラリを使う。列幅を最初から広めに指定し、登録日・更新日が「####」表示にならないようにする
export function downloadItemsAsExcel(items, filename, { excludePrice = false } = {}) {
  const columns = getExportColumns(excludePrice);
  const rows = buildExportRows(items, { excludePrice });
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: columns.map((c) => c.key) });
  worksheet["!cols"] = columns.map((c) => ({ wch: c.width }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "在庫データ");
  XLSX.writeFile(workbook, filename);
}

// CSVのフィールドをエスケープする。カンマ・改行・ダブルクォートを含む場合のみダブルクォートで囲む
function escapeCsvField(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// itemsをCSVファイルとしてダウンロードする。外部システムへの取り込み用が主目的のため、
// xlsx出力と異なり日付をExcel向けにテキスト化する特別な処理は行わず、素直な日付文字列のまま出力する
export function downloadItemsAsCsv(items, filename, { excludePrice = false } = {}) {
  const columns = getExportColumns(excludePrice);
  const headers = columns.map((c) => c.key);
  const rows = buildExportRows(items, { excludePrice }).map((row) =>
    headers.map((header) => escapeCsvField(row[header])).join(",")
  );
  const csvContent = [headers.join(","), ...rows].join("\r\n");

  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
