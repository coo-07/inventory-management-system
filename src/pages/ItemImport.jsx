import { useState } from "react";
import * as XLSX from "xlsx";

/**
 * Excel/CSVから在庫データを取り込むページ（ステップ①：中身をそのまま表示するところまで）。
 * Supabaseへの保存・列のマッピングは未実装。
 */
function ItemImport() {
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("idle");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isCsv = file.name.toLowerCase().endsWith(".csv");

    setFileName(file.name);
    setStatus("loading");
    setRows(null);

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

  return (
    <div className="mx-auto max-w-[960px] px-6 py-5">
      <h1 className="mb-6 text-[26px] font-bold">Excelから取り込む</h1>

      <div
        className="rounded-[var(--r-xl)] border-2 p-7"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <label className="mb-2 block text-[15px] font-bold">ファイルを選択（.xlsx / .csv）</label>
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFileChange}
          className="box-border w-full max-w-[420px] cursor-pointer rounded-[var(--r-md)] border-2 px-4 py-3.5 text-[15px] transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
        />

        <div className="mt-6">
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
            <div>
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
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemImport;
