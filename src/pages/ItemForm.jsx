import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useItems } from "../context/ItemsContext";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";
import PhotoUpload from "../components/PhotoUpload";
import Button from "../components/Button";

const CATEGORY_OPTIONS = ["文房具", "雑貨", "食品", "飲み物", "ペット用品", "衣類", "美容・コスメ", "その他"];

const emptyForm = {
  name: "",
  categorySelect: "文房具",
  categoryOther: "",
  stock: 0,
  threshold: 0,
  unit: "個",
  manufacturer: "",
  unitPrice: "",
  imageUrl: "",
};

function toHalfWidthDigits(str) {
  return str.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}
function sanitizeDigits(str) {
  return toHalfWidthDigits(str).replace(/[^0-9]/g, "");
}
function validateName(v) {
  return v.trim() === "" ? "商品名を入力してください" : "";
}
function validateNumber(v) {
  return Number(v) < 0 ? "0以上の数値を入力してください" : "";
}

/**
 * 商品の登録・編集ページ。:id があれば編集モード。
 */
function ItemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { items, loading, getItemById, addItem, updateItem } = useItems();
  const { role } = useAuth();
  const isEdit = Boolean(id);
  const existing = isEdit ? getItemById(id) : null;

  // メーカー入力欄のdatalist候補。既存商品のmanufacturerをユニーク抽出し、五十音順に並べる
  // （Home.jsxのメーカー絞り込み用のmanufacturers抽出と同じ考え方）
  const manufacturers = useMemo(
    () =>
      [...new Set(items.map((item) => item.manufacturer).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "ja")
      ),
    [items]
  );

  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({ name: "", stock: "", threshold: "" });
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const nameInputRef = useRef(null);
  const stockBoxRef = useRef(null);
  const thresholdBoxRef = useRef(null);

  useEffect(() => {
    if (isEdit && existing) {
      const known = CATEGORY_OPTIONS.slice(0, -1).includes(existing.category);
      setForm({
        name: existing.name,
        categorySelect: known ? existing.category : "その他",
        categoryOther: known ? "" : existing.category,
        stock: existing.stock,
        threshold: existing.threshold,
        unit: existing.unit,
        manufacturer: existing.manufacturer || "",
        unitPrice: existing.unitPrice ?? "",
        imageUrl: existing.imageUrl || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing?.id]);

  if (isEdit && loading) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-5">
        <p style={{ color: "var(--ink-soft)" }}>読み込み中...</p>
      </div>
    );
  }

  if (isEdit && !existing) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-5">
        <p style={{ color: "var(--ink-soft)" }}>商品が見つかりません</p>
      </div>
    );
  }

  const scrollToField = (ref) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
    if (el.focus) el.focus();
  };

  const blurOnEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
  };

  const handleStockText = (e) => setForm((prev) => ({ ...prev, stock: sanitizeDigits(e.target.value) }));
  const handleThresholdText = (e) => setForm((prev) => ({ ...prev, threshold: sanitizeDigits(e.target.value) }));
  // 全角数字は半角に自動変換したうえで受け付ける。カンマ等それ以外の非数字文字は引き続き無視する（空欄は許可）
  const handleUnitPriceText = (e) => {
    const converted = toHalfWidthDigits(e.target.value);
    if (/^[0-9]*$/.test(converted)) {
      setForm((prev) => ({ ...prev, unitPrice: converted }));
    }
  };
  const commitStock = () => {
    const n = parseInt(sanitizeDigits(String(form.stock)), 10);
    const v = Number.isNaN(n) ? 0 : n;
    setForm((prev) => ({ ...prev, stock: v }));
    setFieldErrors((prev) => ({ ...prev, stock: validateNumber(v) }));
  };
  const commitThreshold = () => {
    const n = parseInt(sanitizeDigits(String(form.threshold)), 10);
    const v = Number.isNaN(n) ? 0 : n;
    setForm((prev) => ({ ...prev, threshold: v }));
    setFieldErrors((prev) => ({ ...prev, threshold: validateNumber(v) }));
  };
  const incStock = () => setForm((prev) => ({ ...prev, stock: (Number(prev.stock) || 0) + 1 }));
  const decStock = () => setForm((prev) => ({ ...prev, stock: Math.max(0, (Number(prev.stock) || 0) - 1) }));
  const incThreshold = () => setForm((prev) => ({ ...prev, threshold: (Number(prev.threshold) || 0) + 1 }));
  const decThreshold = () => setForm((prev) => ({ ...prev, threshold: Math.max(0, (Number(prev.threshold) || 0) - 1) }));

  const errorSummaryItems = [];
  if (fieldErrors.name) errorSummaryItems.push({ key: "name", label: `商品名：${fieldErrors.name}`, ref: nameInputRef });
  if (fieldErrors.stock) errorSummaryItems.push({ key: "stock", label: `在庫数：${fieldErrors.stock}`, ref: stockBoxRef });
  if (fieldErrors.threshold)
    errorSummaryItems.push({ key: "threshold", label: `発注点：${fieldErrors.threshold}`, ref: thresholdBoxRef });

  const handleCancel = () => navigate(isEdit ? `/items/${id}` : "/items");

  const handleSubmit = () => {
    if (saveLoading) return;
    const errors = {
      name: validateName(form.name),
      stock: validateNumber(form.stock),
      threshold: validateNumber(form.threshold),
    };
    const hasErrors = Boolean(errors.name || errors.stock || errors.threshold);
    setFieldErrors(errors);
    setShowErrorSummary(hasErrors);
    if (hasErrors) {
      scrollToField(errors.name ? nameInputRef : errors.stock ? stockBoxRef : thresholdBoxRef);
      return;
    }
    setSaveLoading(true);
    setTimeout(async () => {
      const finalCategory =
        form.categorySelect === "その他" ? form.categoryOther.trim() || "その他" : form.categorySelect;
      const saved = {
        name: form.name,
        category: finalCategory,
        stock: Number(form.stock) || 0,
        threshold: Number(form.threshold) || 0,
        unit: form.unit,
        manufacturer: form.manufacturer,
        unitPrice: form.unitPrice === "" ? "" : Number(form.unitPrice),
        imageUrl: form.imageUrl,
      };
      if (isEdit) {
        const result = await updateItem(id, saved);
        setSaveLoading(false);
        if (!result.ok) {
          showToast("❌ " + result.message);
          return;
        }
        showToast("✅ 保存しました");
        navigate(`/items/${id}`);
      } else {
        const result = await addItem(saved);
        setSaveLoading(false);
        if (!result.ok) {
          showToast("❌ " + result.message);
          return;
        }
        showToast("✅ 保存しました");
        navigate("/items");
      }
    }, 1000);
  };

  const fieldBase =
    "box-border w-full rounded-[var(--r-md)] px-4 py-3.5 text-[17px]";

  return (
    <form
      autoComplete="off"
      onSubmit={(e) => e.preventDefault()}
      className="mx-auto max-w-[640px] px-6 py-5 md:px-8 md:max-w-[760px] lg:px-10 lg:max-w-[900px] xl:max-w-[1500px] xl:px-10 2xl:max-w-[1700px] 2xl:px-12"
    >
      <h1 className="mb-6 text-[26px] font-bold">{isEdit ? "商品を編集" : "商品を登録"}</h1>

      {showErrorSummary && errorSummaryItems.length > 0 && (
        <div
          className="mb-4.5 rounded-[var(--r-md)] border-2 px-4.5 py-4"
          style={{ background: "var(--red-light)", borderColor: "var(--red)" }}
        >
          <p className="m-0 mb-2 text-[15px] font-bold" style={{ color: "var(--red)" }}>
            入力内容を確認してください
          </p>
          <div className="flex flex-col gap-1">
            {errorSummaryItems.map((err) => (
              <a
                key={err.key}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToField(err.ref);
                }}
                className="w-fit text-sm underline"
                style={{ color: "var(--red)" }}
              >
                {err.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <div
        className="rounded-[var(--r-xl)] border-2 p-7 lg:p-8 xl:p-10 2xl:p-12"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="grid grid-cols-1 gap-5.5 xl:grid-cols-[7fr_3fr] xl:items-start xl:gap-7 2xl:gap-8">
          <div className="order-1 xl:order-1 xl:col-start-1">
            <label className="mb-2 block text-[15px] font-bold">商品名（必須）</label>
            <input
              ref={nameInputRef}
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              onBlur={() => setFieldErrors((prev) => ({ ...prev, name: validateName(form.name) }))}
              placeholder="例：ボールペン"
              className={`${fieldBase} transition-colors hover:border-[var(--ink-soft)]! ${fieldErrors.name ? "" : "focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!"}`}
              style={{
                border: fieldErrors.name ? "2px solid var(--red)" : "2px solid var(--border)",
                background: fieldErrors.name ? "var(--red-light)" : "var(--surface)",
                color: "var(--ink)",
              }}
            />
            {fieldErrors.name && (
              <p className="mt-1.5 text-[13px] font-bold" style={{ color: "var(--red)" }}>
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="order-2 flex flex-wrap gap-4 xl:order-2 xl:col-start-1">
            <div className="min-w-[220px] flex-auto">
              <label className="mb-2 block text-[15px] font-bold">カテゴリ</label>
              <select
                value={form.categorySelect}
                onChange={(e) => setForm((prev) => ({ ...prev, categorySelect: e.target.value }))}
                className="box-border w-full max-w-[280px] cursor-pointer rounded-[var(--r-md)] border-2 px-4 py-3.5 text-[17px] transition-colors hover:border-[var(--ink-soft)]!"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {form.categorySelect === "その他" && (
                <input
                  type="text"
                  value={form.categoryOther}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoryOther: e.target.value }))}
                  placeholder="カテゴリ名を入力"
                  className={`${fieldBase} mt-2.5 max-w-[280px] transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!`}
                  style={{ border: "2px solid var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                />
              )}
            </div>

            <div className="min-w-[160px] flex-auto">
              <label className="mb-2 block text-[15px] font-bold">単位</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="個・本・冊 など"
                className={`${fieldBase} max-w-[160px] transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!`}
                style={{ border: "2px solid var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              />
            </div>

            <div className="min-w-[220px] flex-auto">
              <label className="mb-2 block text-[15px] font-bold">メーカー（任意）</label>
              <input
                type="text"
                name="manufacturer_field"
                list="manufacturer-options"
                value={form.manufacturer}
                onChange={(e) => setForm((prev) => ({ ...prev, manufacturer: e.target.value }))}
                autoComplete="organization"
                placeholder="例：コクヨ"
                className={`${fieldBase} transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!`}
                style={{ border: "2px solid var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              />
              <datalist id="manufacturer-options">
                {manufacturers.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            {role !== "staff" && (
              <div className="min-w-[160px] flex-auto">
                <label className="mb-2 block text-[15px] font-bold">単価（任意）</label>
                <input
                  type="text"
                  name="unit_price_field"
                  value={form.unitPrice}
                  onChange={handleUnitPriceText}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="例：150"
                  className={`${fieldBase} max-w-[160px] transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!`}
                  style={{ border: "2px solid var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                />
              </div>
            )}
          </div>

          <div className="order-3 flex flex-wrap gap-5 xl:order-3 xl:col-span-2">
            <div
              ref={stockBoxRef}
              tabIndex={-1}
              className="box-border min-w-[220px] w-fit flex-none rounded-[var(--r-md)] p-2.5"
              style={{ border: fieldErrors.stock ? "2px solid var(--red)" : "2px solid transparent", background: fieldErrors.stock ? "var(--red-light)" : "transparent" }}
            >
              <label className="mb-2 block text-[15px] font-bold">在庫数</label>
              <div className="flex items-center justify-center gap-6 xl:gap-7 2xl:gap-8">
                <button
                  type="button"
                  onClick={decStock}
                  className="h-[52px] w-[52px] shrink-0 cursor-pointer rounded-[var(--r-md)] border-2 text-2xl font-bold transition-colors hover:border-[var(--ink-soft)]! hover:bg-[var(--border)]!"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                >
                  −
                </button>
                <input
                  type="text"
                  value={form.stock}
                  onChange={handleStockText}
                  onBlur={commitStock}
                  onKeyDown={blurOnEnter}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  className={`h-[59px] w-[160px] rounded-[var(--r-md)] border-2 p-2.5 text-center text-2xl font-bold transition-colors hover:border-[var(--ink-soft)]! ${fieldErrors.stock ? "" : "focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!"}`}
                  style={{ borderColor: fieldErrors.stock ? "var(--red)" : "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                />
                <button
                  type="button"
                  onClick={incStock}
                  className="h-[52px] w-[52px] shrink-0 cursor-pointer rounded-[var(--r-md)] border-2 text-2xl font-bold transition-colors hover:border-[var(--ink-soft)]! hover:bg-[var(--border)]!"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                >
                  ＋
                </button>
              </div>
              <div className="mt-6 flex justify-center gap-7">
                <div className="flex gap-6 xl:gap-7 2xl:gap-8">
                  <Button
                    variant="secondary"
                    disabled={(Number(form.stock) || 0) - 10 < 0}
                    onClick={() => setForm((prev) => ({ ...prev, stock: Math.max(0, (Number(prev.stock) || 0) - 10) }))}
                    className="px-4 text-[15px]"
                  >
                    −10
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={(Number(form.stock) || 0) - 5 < 0}
                    onClick={() => setForm((prev) => ({ ...prev, stock: Math.max(0, (Number(prev.stock) || 0) - 5) }))}
                    className="px-4 text-[15px]"
                  >
                    −5
                  </Button>
                </div>
                <div className="flex gap-6 xl:gap-7 2xl:gap-8">
                  <Button
                    variant="secondary"
                    onClick={() => setForm((prev) => ({ ...prev, stock: (Number(prev.stock) || 0) + 5 }))}
                    className="px-4 text-[15px]"
                  >
                    +5
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setForm((prev) => ({ ...prev, stock: (Number(prev.stock) || 0) + 10 }))}
                    className="px-4 text-[15px]"
                  >
                    +10
                  </Button>
                </div>
              </div>
              {fieldErrors.stock && (
                <p className="mt-1.5 text-[13px] font-bold" style={{ color: "var(--red)" }}>
                  {fieldErrors.stock}
                </p>
              )}
            </div>

            <div
              ref={thresholdBoxRef}
              tabIndex={-1}
              className="box-border min-w-[220px] w-fit flex-none rounded-[var(--r-md)] p-2.5"
              style={{ border: fieldErrors.threshold ? "2px solid var(--red)" : "2px solid transparent", background: fieldErrors.threshold ? "var(--red-light)" : "transparent" }}
            >
              <label className="mb-2 block text-[15px] font-bold">発注点（ここ以下になったら知らせます）</label>
              <div className="flex items-center justify-center gap-6 xl:gap-7 2xl:gap-8">
                <button
                  type="button"
                  onClick={decThreshold}
                  className="h-[52px] w-[52px] shrink-0 cursor-pointer rounded-[var(--r-md)] border-2 text-2xl font-bold transition-colors hover:border-[var(--ink-soft)]! hover:bg-[var(--border)]!"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                >
                  −
                </button>
                <input
                  type="text"
                  value={form.threshold}
                  onChange={handleThresholdText}
                  onBlur={commitThreshold}
                  onKeyDown={blurOnEnter}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  className={`h-[59px] w-[160px] rounded-[var(--r-md)] border-2 p-2.5 text-center text-2xl font-bold transition-colors hover:border-[var(--ink-soft)]! ${fieldErrors.threshold ? "" : "focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!"}`}
                  style={{ borderColor: fieldErrors.threshold ? "var(--red)" : "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                />
                <button
                  type="button"
                  onClick={incThreshold}
                  className="h-[52px] w-[52px] shrink-0 cursor-pointer rounded-[var(--r-md)] border-2 text-2xl font-bold transition-colors hover:border-[var(--ink-soft)]! hover:bg-[var(--border)]!"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                >
                  ＋
                </button>
              </div>
              <div className="mt-6 flex justify-center gap-7">
                <div className="flex gap-6 xl:gap-7 2xl:gap-8">
                  <Button
                    variant="secondary"
                    disabled={(Number(form.threshold) || 0) - 10 < 0}
                    onClick={() => setForm((prev) => ({ ...prev, threshold: Math.max(0, (Number(prev.threshold) || 0) - 10) }))}
                    className="px-4 text-[15px]"
                  >
                    −10
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={(Number(form.threshold) || 0) - 5 < 0}
                    onClick={() => setForm((prev) => ({ ...prev, threshold: Math.max(0, (Number(prev.threshold) || 0) - 5) }))}
                    className="px-4 text-[15px]"
                  >
                    −5
                  </Button>
                </div>
                <div className="flex gap-6 xl:gap-7 2xl:gap-8">
                  <Button
                    variant="secondary"
                    onClick={() => setForm((prev) => ({ ...prev, threshold: (Number(prev.threshold) || 0) + 5 }))}
                    className="px-4 text-[15px]"
                  >
                    +5
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setForm((prev) => ({ ...prev, threshold: (Number(prev.threshold) || 0) + 10 }))}
                    className="px-4 text-[15px]"
                  >
                    +10
                  </Button>
                </div>
              </div>
              {fieldErrors.threshold && (
                <p className="mt-1.5 text-[13px] font-bold" style={{ color: "var(--red)" }}>
                  {fieldErrors.threshold}
                </p>
              )}
            </div>
          </div>

          <div className="order-4 xl:order-1 xl:col-start-2 xl:row-span-2 xl:self-center">
            <label className="mb-2 block text-[15px] font-bold">商品の写真（任意）</label>
            <PhotoUpload value={form.imageUrl} onChange={(imageUrl) => setForm((prev) => ({ ...prev, imageUrl }))} />
          </div>

          <div className="order-5 mt-4 xl:order-4 xl:col-span-2">
            <div className="flex gap-4 xl:justify-end">
              <Button
                variant="secondary"
                disabled={saveLoading}
                onClick={handleCancel}
                className="min-w-0 flex-1 xl:flex-none xl:min-w-[180px]"
              >
                キャンセル
              </Button>
              <Button
                variant="primary"
                loading={saveLoading}
                onClick={handleSubmit}
                className="min-w-0 flex-1 xl:flex-none xl:min-w-[180px]"
              >
                {saveLoading ? (isEdit ? "保存しています..." : "登録しています...") : isEdit ? "保存する" : "商品を登録する"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default ItemForm;
