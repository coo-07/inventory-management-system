import * as XLSX from "xlsx";

const EXPORT_HEADERS = ["商品名", "カテゴリ", "在庫数", "発注点", "単位", "登録日", "更新日"];
const BOM = "﻿";

// ISO形式の日時文字列を「YYYY-MM-DD HH:mm」形式に変換する。xlsx・CSV両方の出力で共通利用する
export function formatDateForExport(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// items配列を、出力用の列名をキーに持つオブジェクトの配列に変換する
export function buildExportRows(items) {
  return items.map((item) => ({
    商品名: item.name,
    カテゴリ: item.category,
    在庫数: item.stock,
    発注点: item.threshold,
    単位: item.unit,
    登録日: formatDateForExport(item.createdAt),
    更新日: formatDateForExport(item.updatedAt),
  }));
}

// itemsをExcel(.xlsx)ファイルとしてダウンロードする。ItemImport.jsxの取り込み処理と同じ
// xlsxライブラリを使う。列幅を最初から広めに指定し、登録日・更新日が「####」表示にならないようにする
export function downloadItemsAsExcel(items, filename) {
  const rows = buildExportRows(items);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 24 }, // 商品名
    { wch: 12 }, // カテゴリ
    { wch: 10 }, // 在庫数
    { wch: 10 }, // 発注点
    { wch: 8 }, // 単位
    { wch: 18 }, // 登録日
    { wch: 18 }, // 更新日
  ];

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
export function downloadItemsAsCsv(items, filename) {
  const rows = buildExportRows(items).map((row) =>
    EXPORT_HEADERS.map((header) => escapeCsvField(row[header])).join(",")
  );
  const csvContent = [EXPORT_HEADERS.join(","), ...rows].join("\r\n");

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
