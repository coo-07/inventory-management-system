import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useCategoryIcons } from "../hooks/useCategoryIcons";
import { useItems } from "../context/ItemsContext";
import { useToast } from "../context/ToastContext";
import { FIXED_CATEGORIES } from "../components/CategoryIcon";
import CategoryIconPicker, { matchPresetIcon } from "../components/CategoryIconPicker";
import Button from "../components/Button";
import Dropdown from "../components/Dropdown";

const EMPTY_MAPPING = {
  name: null,
  category: null,
  stock: null,
  threshold: null,
  unit: null,
  manufacturer: null,
  unitPrice: null,
};

const MAPPING_FIELDS = [
  { key: "name", label: "商品名", required: true },
  { key: "category", label: "カテゴリ", required: false },
  { key: "stock", label: "在庫数", required: true },
  { key: "threshold", label: "発注点", required: false },
  { key: "unit", label: "単位", required: false },
  { key: "manufacturer", label: "メーカー", required: false },
  { key: "unitPrice", label: "単価", required: false },
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

// マッピングされた列の生の値をそのまま保持する（無効な値でも文字列として保持する）。
// 列がマッピングされていない項目はnullを返し、マッピングされているが空欄の項目は""を返す
// （呼び出し側でnullは「－」、""は「（空欄）」として表示し分けられるようにするため）
function buildRawRow(row, columnMapping) {
  const get = (key) => (columnMapping[key] === null ? null : toTrimmedString(row[columnMapping[key]]));
  return {
    name: get("name"),
    category: get("category"),
    stock: get("stock"),
    threshold: get("threshold"),
    unit: get("unit"),
    manufacturer: get("manufacturer"),
    unitPrice: get("unitPrice"),
  };
}

// スキップ対象なら { skip: true, reason }、有効な行ならマッピング済みの値を { skip: false, item } で返す
function evaluateRow(row, columnMapping) {
  const nameStr = toTrimmedString(row[columnMapping.name]);
  if (nameStr === "") return { skip: true, reason: "商品名が空欄のため" };

  if (isBlankOrNonNumeric(row[columnMapping.stock])) return { skip: true, reason: "在庫数が数値ではないため" };
  const stock = Number(row[columnMapping.stock]);

  let threshold = 0;
  if (columnMapping.threshold !== null) {
    if (isBlankOrNonNumeric(row[columnMapping.threshold])) return { skip: true, reason: "発注点が数値ではないため" };
    threshold = Number(row[columnMapping.threshold]);
  }

  const category = columnMapping.category !== null ? toTrimmedString(row[columnMapping.category]) || "その他" : "その他";
  const unit = columnMapping.unit !== null ? toTrimmedString(row[columnMapping.unit]) || "個" : "個";

  const manufacturer =
    columnMapping.manufacturer !== null ? toTrimmedString(row[columnMapping.manufacturer]) || null : null;

  // メーカーと異なり数値項目のため、値が入力されている場合のみ数値かどうかをチェックする。
  // 空欄（マッピングなし、またはマッピングありで未入力）は単価未設定（null）として扱い、スキップ対象にはしない
  let unitPrice = null;
  if (columnMapping.unitPrice !== null) {
    const unitPriceStr = toTrimmedString(row[columnMapping.unitPrice]);
    if (unitPriceStr !== "") {
      if (Number.isNaN(Number(unitPriceStr))) return { skip: true, reason: "単価が数値ではないため" };
      unitPrice = Number(unitPriceStr);
    }
  }

  return { skip: false, item: { name: nameStr, category, stock, threshold, unit, manufacturer, unitPrice } };
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
  const { customIcons, loading: categoryIconsLoading, addOrUpdateCategoryIcon } = useCategoryIcons();
  const { items: existingItems, importItems, recordStock } = useItems();
  const showToast = useToast();
  const [savingCategories, setSavingCategories] = useState(() => new Set());
  const autoMatchedRef = useRef(new Set());
  const [importing, setImporting] = useState(false);
  // 既存商品との重複行について、商品名をキーに選択中の処理方法（"replace" | "add" | "skip"）を保持する。
  // 未選択（キーが存在しない）の場合は安全側に倒して"skip"扱いにする
  const [duplicateActions, setDuplicateActions] = useState({});

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
        reasons.push({ rowNumber: i + 2, reason: result.reason, raw: buildRawRow(row, columnMapping) });
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

  // ファイル内でのみ重複している商品名（先頭の1件だけが取り込み対象になる）。参考表示用
  const fileDuplicateNames = useMemo(() => {
    if (!canPreview) return [];
    const nameCounts = new Map();
    for (const item of validItems) {
      nameCounts.set(item.name, (nameCounts.get(item.name) || 0) + 1);
    }
    return [...nameCounts.entries()].filter(([, count]) => count > 1).map(([name]) => name);
  }, [validItems, canPreview]);

  // 「ファイル内での重複」と「既存登録済みとの重複」は扱いが異なるため区別する。
  // ファイル内重複：従来通り最初の1件のみを取り込み対象に残し、2件目以降は無視する。
  // 既存登録済みとの重複：importTargets（自動で新規登録される商品）からは除外し、
  // duplicateMatches（ユーザーが置き換え・加算・スキップを選ぶ対象）としてまとめる
  const { importTargets, duplicateMatches } = useMemo(() => {
    if (!canPreview) return { importTargets: [], duplicateMatches: [] };

    const seenInFile = new Set();
    const dedupedItems = [];
    for (const item of validItems) {
      if (seenInFile.has(item.name)) continue;
      seenInFile.add(item.name);
      dedupedItems.push(item);
    }

    const targets = [];
    const matches = [];
    for (const item of dedupedItems) {
      const existingItem = existingItems.find((e) => e.name === item.name);
      if (existingItem) {
        matches.push({ importedItem: item, existingItem });
      } else {
        targets.push(item);
      }
    }

    return { importTargets: targets, duplicateMatches: matches };
  }, [validItems, existingItems, canPreview]);

  const getDuplicateAction = (name) => duplicateActions[name] || "skip";

  const setDuplicateAction = (name, action) => {
    setDuplicateActions((prev) => ({ ...prev, [name]: action }));
  };

  const setAllDuplicateActions = (action) => {
    const next = {};
    for (const match of duplicateMatches) {
      next[match.importedItem.name] = action;
    }
    setDuplicateActions(next);
  };

  const handleImport = async () => {
    if (importing) return;
    if (importTargets.length === 0 && duplicateMatches.length === 0) return;
    setImporting(true);

    let registeredCount = 0;
    if (importTargets.length > 0) {
      const result = await importItems(importTargets);
      if (!result.ok) {
        setImporting(false);
        showToast("❌ " + result.message);
        return;
      }
      registeredCount = result.items.length;
    }

    const duplicateResults = [];
    let hadError = false;
    for (const match of duplicateMatches) {
      const { importedItem, existingItem } = match;
      const action = getDuplicateAction(importedItem.name);
      const beforeStock = existingItem.stock;

      if (action === "skip") {
        duplicateResults.push({ name: importedItem.name, action: "skip", beforeStock, afterStock: beforeStock });
        continue;
      }

      if (action === "replace") {
        const diff = importedItem.stock - beforeStock;
        if (diff > 0) {
          const result = await recordStock(existingItem.id, "in", diff, "Excel取込み：在庫を置き換え");
          if (!result.ok) {
            hadError = true;
            continue;
          }
        } else if (diff < 0) {
          const result = await recordStock(existingItem.id, "out", Math.abs(diff), "Excel取込み：在庫を置き換え");
          if (!result.ok) {
            hadError = true;
            continue;
          }
        }
        duplicateResults.push({ name: importedItem.name, action: "replace", beforeStock, afterStock: importedItem.stock });
        continue;
      }

      if (action === "add") {
        if (importedItem.stock > 0) {
          const result = await recordStock(existingItem.id, "in", importedItem.stock, "Excel取込み：在庫に加算");
          if (!result.ok) {
            hadError = true;
            continue;
          }
        }
        duplicateResults.push({
          name: importedItem.name,
          action: "add",
          beforeStock,
          afterStock: beforeStock + importedItem.stock,
        });
      }
    }

    setImporting(false);

    const updatedCount = duplicateResults.filter((r) => r.action !== "skip").length;
    const messageParts = [];
    if (registeredCount > 0) messageParts.push(`${registeredCount}件を新規登録`);
    if (updatedCount > 0) messageParts.push(`${updatedCount}件の在庫を更新`);

    if (hadError) {
      showToast("❌ 一部の在庫更新に失敗しました" + (messageParts.length > 0 ? `（${messageParts.join("、")}は完了）` : ""));
    } else if (messageParts.length > 0) {
      showToast(`✅ ${messageParts.join("、")}しました`);
    } else {
      showToast("変更はありませんでした");
    }

    // 商品一覧画面への遷移後、他画面を経由して一覧に戻ってきても注意喚起を表示し続けられるよう、
    // navigateのstateではなくsessionStorageに保存する（ユーザーが「確認しました」を押すまで保持）
    sessionStorage.setItem("importSkippedReasons", JSON.stringify(skippedReasons));
    sessionStorage.setItem("importDuplicateResults", JSON.stringify(duplicateResults));
    navigate("/items");
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

  // 新しいカテゴリが見つかった際、キーワードに一致するプリセットアイコンがあれば自動で保存する（80-2番）。
  // customIconsはSupabaseからの非同期取得のため、取得完了前（categoryIconsLoading中）にnewCategoriesが
  // 確定すると「既に設定済みかどうか」を空のcustomIconsで誤判定してしまう競合状態があった（97-1番）。
  // 取得完了を待ってから判定することで、実行タイミングによらず常に同じ結果になるようにする
  useEffect(() => {
    if (categoryIconsLoading) return;
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
  }, [newCategories, customIcons, categoryIconsLoading]);

  const updateMapping = (key, value) => {
    setColumnMapping((prev) => ({ ...prev, [key]: value }));
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
    <div className="mx-auto max-w-[960px] px-6 py-5 xl:max-w-[2400px]">
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
            // 1カラム表示（xl未満）ではJSXの記述順どおり「生データ表→列の対応付け→プレビュー→
            // 重複確認→新しいカテゴリ→取り込むボタン」という自然な操作フローで上から並ぶ。
            // xl以上のときだけ、各項目にxl:col-start-{1|2}とxl:order-*を指定して、従来通りの
            // 2カラムの見た目（左：生データ表＋プレビュー＋重複確認＋取り込むボタン／
            // 右：列の対応付け＋新しいカテゴリ）に組み替える。col-startだけで強制配置していた
            // 従来の実装（左右2つの大きなdivをJSX順に並べる方式）だと、1カラムに戻ったときに
            // 取り込むボタンが列の対応付けより前に表示されてしまっていたため、この方式に変更した
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,4fr)_minmax(0,2fr)] xl:items-start">
              <div className="xl:order-1 xl:col-start-1">
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
              </div>

              <div className="xl:order-1 xl:col-start-2">
                <h2 className="mb-2 text-[19px] font-bold">列の対応付け</h2>
                <p className="mb-4 text-[13px]" style={{ color: "var(--ink-soft)" }}>
                  ※1行目には商品名・カテゴリなどの項目名が入っている必要があります。1行目にメモやタイトル行がある場合は、Excel側で先に削除してからアップロードしてください
                </p>

                <div className="flex flex-wrap gap-4">
                  {MAPPING_FIELDS.map((field) => (
                    <div key={field.key} className="min-w-[220px] flex-auto">
                      <label htmlFor={`mapping-${field.key}`} className="mb-2 block text-[15px] font-bold">
                        {field.label}
                        {field.required ? "（必須）" : "（任意）"}
                      </label>
                      <Dropdown
                        id={`mapping-${field.key}`}
                        value={columnMapping[field.key]}
                        onChange={(value) => updateMapping(field.key, value)}
                        placeholder={field.required ? "選択してください" : "（マッピングしない）"}
                        label={`${field.label}${field.required ? "（必須）" : "（任意）"}`}
                        options={[
                          { value: null, label: field.required ? "選択してください" : "（マッピングしない）" },
                          ...columnOptions,
                        ]}
                        className={selectClass}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="xl:order-2 xl:col-start-1">
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
                            {r.rowNumber}行目：{r.reason}スキップ
                          </li>
                        ))}
                      </ul>
                    )}
                    {fileDuplicateNames.length > 0 && (
                      <div
                        className="mb-3 rounded-[var(--r-md)] border-2 px-4 py-3"
                        style={{ borderColor: "var(--orange)", background: "var(--orange-light)" }}
                      >
                        <p className="mb-1 text-[13px] font-bold" style={{ color: "var(--orange-dark)" }}>
                          ⚠️ ファイル内で重複している商品名（最初の1件のみ取り込みます・{fileDuplicateNames.length}件）
                        </p>
                        <p className="text-[13px]" style={{ color: "var(--orange-dark)" }}>
                          {fileDuplicateNames.join("、")}
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
                  </div>
                )}
              </div>

              {canPreview && duplicateMatches.length > 0 && (
                <div className="xl:order-3 xl:col-start-1">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-[17px] font-bold">重複商品の確認（{duplicateMatches.length}件）</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setAllDuplicateActions("replace")}
                        className="text-[13px]"
                      >
                        すべて置き換える
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setAllDuplicateActions("skip")}
                        className="text-[13px]"
                      >
                        すべてスキップする
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    {duplicateMatches.map(({ importedItem, existingItem }) => {
                      const action = getDuplicateAction(importedItem.name);
                      const sum = existingItem.stock + importedItem.stock;
                      const radioName = `duplicate-${importedItem.name}`;
                      return (
                        <div
                          key={importedItem.name}
                          className="rounded-[var(--r-md)] border-2 p-4"
                          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                        >
                          <p className="mb-3 text-[15px] font-bold">商品名：{importedItem.name}</p>
                          <div
                            className="mb-4 overflow-x-auto rounded-[var(--r-md)] border"
                            style={{ borderColor: "var(--border)" }}
                          >
                            <table className="w-full border-collapse text-left text-[14px]" style={{ color: "var(--ink)" }}>
                              <thead>
                                <tr style={{ background: "var(--bg)" }}>
                                  <th className="border px-3 py-2" style={{ borderColor: "var(--border)" }} />
                                  <th className="border px-3 py-2 font-bold" style={{ borderColor: "var(--border)" }}>
                                    現在の登録内容
                                  </th>
                                  <th className="border px-3 py-2 font-bold" style={{ borderColor: "var(--border)" }}>
                                    取り込みデータ
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border px-3 py-2 font-bold whitespace-nowrap" style={{ borderColor: "var(--border)" }}>
                                    在庫数
                                  </td>
                                  <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--border)" }}>
                                    {existingItem.stock}{existingItem.unit}
                                  </td>
                                  <td className="border px-3 py-2 whitespace-nowrap" style={{ borderColor: "var(--border)" }}>
                                    {importedItem.stock}{importedItem.unit}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <p className="mb-2 text-[14px] font-bold">この商品はどうしますか？</p>
                          <div className="flex flex-col gap-3">
                            <label className="flex cursor-pointer items-start gap-2">
                              <input
                                type="radio"
                                name={radioName}
                                checked={action === "replace"}
                                onChange={() => setDuplicateAction(importedItem.name, "replace")}
                                className="mt-1 shrink-0"
                              />
                              <span>
                                <span className="block text-[14px] font-bold">
                                  {importedItem.stock}{importedItem.unit}に置き換える
                                </span>
                                <span className="block text-[13px]" style={{ color: "var(--ink-soft)" }}>
                                  今の在庫（{existingItem.stock}{existingItem.unit}）を、取り込んだ数（{importedItem.stock}{importedItem.unit}）に置き換えます。棚卸しなどで実際の在庫数に合わせたいときに選んでください。
                                </span>
                              </span>
                            </label>
                            <label className="flex cursor-pointer items-start gap-2">
                              <input
                                type="radio"
                                name={radioName}
                                checked={action === "add"}
                                onChange={() => setDuplicateAction(importedItem.name, "add")}
                                className="mt-1 shrink-0"
                              />
                              <span>
                                <span className="block text-[14px] font-bold">
                                  {existingItem.stock}{existingItem.unit}に{importedItem.stock}{importedItem.unit}を加算する（{sum}{existingItem.unit}になります）
                                </span>
                                <span className="block text-[13px]" style={{ color: "var(--ink-soft)" }}>
                                  今の在庫（{existingItem.stock}{existingItem.unit}）に、取り込んだ数（{importedItem.stock}{importedItem.unit}）を追加します。新しく仕入れた分を追加登録したいときに選んでください。
                                </span>
                              </span>
                            </label>
                            <label className="flex cursor-pointer items-start gap-2">
                              <input
                                type="radio"
                                name={radioName}
                                checked={action === "skip"}
                                onChange={() => setDuplicateAction(importedItem.name, "skip")}
                                className="mt-1 shrink-0"
                              />
                              <span>
                                <span className="block text-[14px] font-bold">スキップする（今の内容のまま変更しない）</span>
                                <span className="block text-[13px]" style={{ color: "var(--ink-soft)" }}>
                                  取り込みデータは反映せず、今の登録内容をそのまま残します。
                                </span>
                              </span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {newCategories.length > 0 && (
                <div className="xl:order-2 xl:col-start-2">
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

              {canPreview && (
                <div className="xl:order-4 xl:col-start-1">
                  <Button
                    variant="primary"
                    loading={importing}
                    disabled={importTargets.length === 0 && duplicateMatches.length === 0}
                    onClick={handleImport}
                  >
                    {importing ? "取り込んでいます..." : "この内容で取り込む"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemImport;
