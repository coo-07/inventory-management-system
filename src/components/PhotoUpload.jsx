import { useRef, useState } from "react";

/**
 * 商品写真のアップロード欄。ドラッグ＆ドロップ／クリックで選択でき、
 * 選んだ画像は data URL として保持する（バックエンドがないため）。
 */
function PhotoUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const readFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        readFile(e.dataTransfer.files?.[0]);
      }}
      className="relative flex h-[150px] w-full max-w-[220px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed"
      style={{
        borderColor: dragOver ? "var(--blue)" : "var(--border)",
        background: dragOver ? "var(--blue-light)" : "var(--bg)",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => readFile(e.target.files?.[0])}
      />
      {value ? (
        <img src={value} alt="商品写真" className="h-full w-full object-cover" />
      ) : (
        <p className="px-4 text-center text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>
          写真をドラッグ＆ドロップ
          <br />
          またはクリックして選択
        </p>
      )}
    </div>
  );
}

export default PhotoUpload;
