import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useCategoryIcons } from "../hooks/useCategoryIcons";
import { useItems } from "../hooks/useItems";
import { useToast } from "../context/ToastContext";
import { FIXED_CATEGORIES } from "../components/CategoryIcon";
import CategoryIconPicker, { matchPresetIcon } from "../components/CategoryIconPicker";
import Button from "../components/Button";

const EMPTY_MAPPING = { name: null, category: null, stock: null, threshold: null, unit: null };

const MAPPING_FIELDS = [
  { key: "name", label: "商品名", required: true },
  { key: "category", label: "カテゴリ", required: false },
  { key: "stock", label: "在庫数", required: true },
  { key: "threshold", label: "発注点", required: false },
  { key: "unit", label: "単位", required: false },
];

function toTrimmedString(value) {
  return (value === undefined || value === null ? "" : String(value)).trim();
}

// Number("")は0になってしまうため、空欄と非数値を別途チェックする
function isBlankOrNonNumeric(value) {
  const str = toTrimmedString(value);
  if (str === "") return true;
  return Number.isNaN(Number(str));
}

function getColumnCount(rows) {
  return rows.reduce((max, row) => Math.max(max, row.length), 0);
}

function buildColumnOptions(rows) {
  const headerRow = rows[0] || [];
  const columnCount = getColumnCount(rows);
  return Array.from({ length: columnCount }, (_, i) => {
    const headerLabel = toTrimmedString(headerRow[i]) || "空欄";
    return { value: i, label: `列${i + 1}（${headerLabel}）` };
  });
}

// スキップ対象なら { skip: true, reason }、有効な行ならマッピング済みの値を { skip: false, item } で返す
function evaluateRow(row, columnMapping) {
  const nameStr = toTrimmedString(row[columnMapping.name]);
  if (nameStr === "") return { skip: true, reason: "商品名が空欄" };

  if (isBlankOrNonNumeric(row[columnMapping.stock])) return { skip: true, reason: "在庫数が数値ではない" };
  const stock = Number(row[columnMapping.stock]);

  let threshold = 0;
  if (columnMapping.threshold !== null) {
    if (isBlankOrNonNumeric(row[columnMapping.threshold])) return { skip: true, reason: "発注点が数値ではない" };
    threshold = Number(row[columnMapping.threshold]);
  }

  const category = columnMapping.category !== null ? toTrimmedString(row[columnMapping.category]) || "その他" : "その他";
  const unit = columnMapping.unit !== null ? toTrimmedString(row[columnMapping.unit]) || "個" : "個";

  return { skip: false, item: { name: nameStr, category, stock, threshold, unit } };
}

/**
 * Excel/CSVから在庫データを取り込むページ。
 * ファイルを選んで中身を表示 → 列マッピング・プレビュー → 重複チェック → Supabaseへの一括登録まで。
 */
function ItemImport() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("idle");
  const [columnMapping, setColumnMapping] = useState(EMPTY_MAPPING);
  const [isDragging, setIsDragging] = useState(false);
  const { customIcons, addOrUpdateCategoryIcon } = useCategoryIcons();
  const { items: existingItems, importItems } = useItems();
  const showToast = useToast();
  const [savingCategories, setSavingCategories] = useState(() => new Set());
  const autoMatchedRef = useRef(new Set());
  const [importing, setImporting] = useState(false);

  const handleFile = (file) => {
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isCsv = lowerName.endsWith(".csv");
    const isXlsx = lowerName.endsWith(".xlsx");

    setFileName(file.name);
    setRows(null);
    setColumnMapping(EMPTY_MAPPING);

    if (!isCsv && !isXlsx) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // CSVは文字コード判定のためテキストとして読み込む（配列バッファのままだとUTF-8の日本語が文字化けする）
        const workbook = XLSX.read(event.target.result, { type: isCsv ? "string" : "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setRows(data);
        setStatus("done");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    };
    reader.onerror = () => setStatus("error");
    if (isCsv) {
      reader.readAsText(file, "UTF-8");
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const columnOptions = useMemo(() => (rows ? buildColumnOptions(rows) : []), [rows]);
  const dataRows = useMemo(() => (rows ? rows.slice(1) : []), [rows]);

  const canPreview = columnMapping.name !== null && columnMapping.stock !== null;

  const { validItems, skippedCount, skippedReasons } = useMemo(() => {
    if (!canPreview) return { validItems: [], skippedCount: 0, skippedReasons: [] };
    const items = [];
    const reasons = [];
    let skipped = 0;
    dataRows.forEach((row, i) => {
      const result = evaluateRow(row, columnMapping);
      if (result.skip) {
        skipped += 1;
        // dataRowsは1行目（項目名行）を除いた配列のため、元ファイルでの行番号は+2
        reasons.push({ rowNumber: i + 2, reason: result.reason });
      } else {
        items.push(result.item);
      }
    });
    return { validItems: items, skippedCount: skipped, skippedReasons: reasons };
  }, [dataRows, columnMapping, canPreview]);

  const newCategories = useMemo(() => {
    if (!canPreview) return [];
    const set = new Set(validItems.map((item) => item.category).filter((cat) => cat && !FIXED_CATEGORIES.includes(cat)));
    return [...set].sort((a, b) => a.localeCompare(b, "ja"));
  }, [validItems, canPreview]);

  const existingNameSet = useMemo(() => new Set(existingItems.map((item) => item.name)), [existingItems]);

  // 重複名の一覧（ファイル内の重複・既存登録済みとの重複の両方をまとめて対象にする）と、
  // 実際の取り込み対象を算出する。重複はスキップする動作に固定する（既存登録済みと同名の行はすべて除外し、
  // ファイル内で同名が複数ある場合は最初の1件のみを残す）
  const { duplicateNames, importTargets } = useMemo(() => {
    if (!canPreview) return { duplicateNames: [], importTargets: [] };

    const nameCounts = new Map();
    for (const item of validItems) {
      nameCounts.set(item.name, (nameCounts.get(item.name) || 0) + 1);
    }

    const dupNames = [];
    const seenDup = new Set();
    const seenInFile = new Set();
    const targets = [];
    for (const item of validItems) {
      const isDuplicate = nameCounts.get(item.name) > 1 || existingNameSet.has(item.name);
      if (isDuplicate && !seenDup.has(item.name)) {
        seenDup.add(item.name);
        dupNames.push(item.name);
      }

      if (existingNameSet.has(item.name)) continue;
      if (seenInFile.has(item.name)) continue;
      seenInFile.add(item.name);
      targets.push(item);
    }

    return { duplicateNames: dupNames, importTargets: targets };
  }, [validItems, existingNameSet, canPreview]);

  const handleImport = async () => {
    if (importing || importTargets.length === 0) return;
    setImporting(true);
    const result = await importItems(importTargets);
    setImporting(false);
    if (!result.ok) {
      showToast("❌ " + result.message);
      return;
    }
    showToast(`✅ ${result.items.length}件の商品を取り込みました`);
    navigate("/items", { state: { skippedDuplicates: duplicateNames, skippedReasons } });
  };

  const saveCategoryIcon = async (category, icon) => {
    setSavingCategories((prev) => new Set(prev).add(category));
    const result = await addOrUpdateCategoryIcon(category, icon);
    setSavingCategories((prev) => {
      const next = new Set(prev);
      next.delete(category);
      return next;
    });
    if (!result.ok) {
      showToast("❌ " + result.message);
    }
  };

  // 新しいカテゴリが見つかった際、キーワードに一致するプリセットアイコンがあれば自動で保存する（80-2番）
  useEffect(() => {
    for (const category of newCategories) {
      if (autoMatchedRef.current.has(category)) continue;
      autoMatchedRef.current.add(category);
      if (customIcons[category]) continue; // 既にアイコンが設定済みのカテゴリは自動選択で上書きしない
      const matchedIcon = matchPresetIcon(category);
      if (matchedIcon) {
        saveCategoryIcon(category, matchedIcon);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newCategories]);

  const updateMapping = (key, value) => {
    setColumnMapping((prev) => ({ ...prev, [key]: value === "" ? null : Number(value) }));
  };

  const selectClass =
    "box-border w-full cursor-pointer rounded-[var(--r-md)] border-2 px-4 py-3.5 text-[15px] transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!";

  const dropZone = (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="rounded-[var(--r-md)] border-2 border-dashed p-5 transition-colors"
      style={{ borderColor: isDragging ? "var(--blue)" : "var(--border)", background: "var(--surface)" }}
    >
      <p className="mb-3 text-[15px]" style={{ color: "var(--ink-soft)" }}>
        ここにファイルをドラッグ&ドロップ、またはファイルを選択
      </p>
      <label className="mb-2 block text-[15px] font-bold">ファイルを選択（.xlsx / .csv）</label>
      <input
        type="file"
        accept=".xlsx,.csv"
        onChange={handleFileChange}
        className="box-border w-full max-w-[420px] cursor-pointer rounded-[var(--r-md)] border-2 px-4 py-3.5 text-[15px] transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-[960px] px-6 py-5 xl:max-w-[1800px]">
      <h1 className="mb-6 text-[26px] font-bold">Excelから取り込む</h1>

      <div
        className="rounded-[var(--r-xl)] border-2 p-7"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {status !== "done" && dropZone}

        <div className={status === "done" ? "" : "mt-6"}>
          {status === "idle" && (
            <p style={{ color: "var(--ink-soft)" }}>ファイルを選択してください</p>
          )}
          {status === "loading" && (
            <p style={{ color: "var(--ink-soft)" }}>読み込んでいます...</p>
          )}
          {status === "error" && (
            <p className="font-bold" style={{ color: "var(--red)" }}>
              読み込みに失敗しました
            </p>
          )}
          {status === "done" && rows && (
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[3fr_2fr] xl:items-start">
              <div className="xl:col-start-1">
                <div className="mb-6">{dropZone}</div>
                <p className="mb-3 text-[15px]" style={{ color: "var(--ink-soft)" }}>
                  {fileName}（{rows.length}行）
                </p>
                <div className="overflow-x-auto rounded-[var(--r-md)] border-2" style={{ borderColor: "var(--border)" }}>
                  <table className="w-full border-collapse text-left text-[14px]" style={{ color: "var(--ink)" }}>
                    <tbody>
                      {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} style={{ background: rowIndex === 0 ? "var(--bg)" : "transparent" }}>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className={`border px-3 py-2 whitespace-nowrap ${rowIndex === 0 ? "font-bold" : ""}`}
                              style={{ borderColor: "var(--border)" }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8">
                  <h2 className="mb-3 text-[19px] font-bold">プレビュー</h2>
                  {!canPreview ? (
                    <p style={{ color: "var(--ink-soft)" }}>商品名と在庫数の列を選択してください</p>
                  ) : (
                    <div>
                      <p
                        className="mb-3 text-[15px] font-bold"
                        style={{ color: skippedCount > 0 ? "var(--orange-dark)" : "var(--ink-soft)" }}
                      >
                        有効な行：{validItems.length}件／スキップされる行：{skippedCount}件
                      </p>
                      {skippedReasons.length > 0 && (
                        <ul className="mb-3 list-disc pl-5 text-[13px]" style={{ color: "var(--ink-soft)" }}>
                          {skippedReasons.slice(0, 5).map((r, i) => (
                            <li key={i}>
                              {r.rowNumber}行目：{r.reason}のためスキップ
                            </li>
                          ))}
                        </ul>
                      )}
                      {duplicateNames.length > 0 && (
                        <div
                          className="mb-3 rounded-[var(--r-md)] border-2 px-4 py-3"
                          style={{ borderColor: "var(--orange)", background: "var(--orange-light)" }}
                        >
                          <p className="mb-1 text-[13px] font-bold" style={{ color: "var(--orange-dark)" }}>
                            ⚠️ 重複の可能性がある商品（{duplicateNames.length}件）
                          </p>
                          <p className="text-[13px]" style={{ color: "var(--orange-dark)" }}>
                            {duplicateNames.join("、")}
                          </p>
                        </div>
                      )}
                      <div className="overflow-x-auto rounded-[var(--r-md)] border-2" style={{ borderColor: "var(--border)" }}>
                        <table className="w-full border-collapse text-left text-[14px]" style={{ color: "var(--ink)" }}>
                          <thead>
                            <tr style={{ background: "var(--bg)" }}>
                              {["商品名", "カテゴリ", "在庫数", "発注点", "単位"].map((h) => (
                                <th key={h} className="border px-3 py-2 font-bold" style={{ borderColor: "var(--border)" }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {validItems.slice(0, 5).map((item, i) => (
                              <tr key={i}>
                                <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--border)" }}>
                                  {item.name}
                                </td>
                                <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--border)" }}>
                                  {item.category}
                                </td>
                                <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--border)" }}>
                                  {item.stock}
                                </td>
                                <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--border)" }}>
                                  {item.threshold}
                                </td>
                                <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--border)" }}>
                                  {item.unit}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <Button
                        variant="primary"
                        loading={importing}
                        disabled={importTargets.length === 0}
                        onClick={handleImport}
                        className="mt-4"
                      >
                        {importing ? "取り込んでいます..." : "この内容で取り込む"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="xl:col-start-2">
                <h2 className="mb-2 text-[19px] font-bold">列の対応付け</h2>
                <p className="mb-4 text-[13px]" style={{ color: "var(--ink-soft)" }}>
                  ※1行目には商品名・カテゴリなどの項目名が入っている必要があります。1行目にメモやタイトル行がある場合は、Excel側で先に削除してからアップロードしてください
                </p>

                <div className="flex flex-wrap gap-4">
                  {MAPPING_FIELDS.map((field) => (
                    <div key={field.key} className="min-w-[220px] flex-auto">
                      <label className="mb-2 block text-[15px] font-bold">
                        {field.label}
                        {field.required ? "（必須）" : "（任意）"}
                      </label>
                      <select
                        value={columnMapping[field.key] === null ? "" : String(columnMapping[field.key])}
                        onChange={(e) => updateMapping(field.key, e.target.value)}
                        className={selectClass}
                        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                      >
                        <option value="">{field.required ? "選択してください" : "（マッピングしない）"}</option>
                        {columnOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {newCategories.length > 0 && (
                  <div className="mt-8">
                    <h2 className="mb-2 text-[19px] font-bold">新しいカテゴリが見つかりました</h2>
                    <p className="mb-4 text-[13px]" style={{ color: "var(--ink-soft)" }}>
                      固定8分類にないカテゴリです。アイコンを選ぶと一覧画面などにそのまま表示されます（あとから「⚙️」の設定画面でも変更できます）
                    </p>
                    <div className="relative">
                      <div
                        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 2xl:block"
                        style={{ background: "var(--border)" }}
                        aria-hidden="true"
                      />
                      <div className="grid grid-cols-1 2xl:grid-cols-2 2xl:gap-x-8">
                        {newCategories.map((category, index) => {
                          const isSaving = savingCategories.has(category);
                          // 2xl未満は1列＝1件ごとに新しい行なのでindex>0で区切り線。2xl以上は2列グリッドの行単位（index>=2）で区切るため、
                          // 1行目の右側（index===1）だけは2xl以上で区切り線を打ち消す
                          const borderClass = index === 0 ? "" : index === 1 ? "border-t pt-4 2xl:border-t-0 2xl:pt-0" : "border-t pt-4";
                          return (
                            <div
                              key={category}
                              className={`pb-4 ${borderClass}`}
                              style={{ borderColor: "var(--border)" }}
                            >
                              <p className="mb-2 text-[15px] font-bold">{category}</p>
                              <CategoryIconPicker
                                category={category}
                                selectedIcon={customIcons[category]}
                                onSelect={(icon) => saveCategoryIcon(category, icon)}
                              />
                              {isSaving && (
                                <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-soft)" }}>
                                  保存中...
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemImport;
