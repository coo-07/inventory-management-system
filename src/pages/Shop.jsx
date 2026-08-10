import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../hooks/useShop";
import { useToast } from "../context/ToastContext";
import Button from "../components/Button";

const emptyForm = { name: "", address: "", phone: "" };

function Shop() {
  const { shop, loading, updateShop } = useShop();
  const navigate = useNavigate();
  const showToast = useToast();
  const [form, setForm] = useState(shop || emptyForm);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (shop) setForm(shop);
  }, [shop]);

  const fieldClass = "box-border w-full rounded-[var(--r-md)] border-2 px-4 py-3.5 text-[17px]";
  const fieldStyle = { borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" };

  if (loading || !shop) {
    return (
      <div className="mx-auto max-w-[520px] px-6 py-5">
        <p style={{ color: "var(--ink-soft)" }}>読み込み中...</p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (saveLoading) return;
    setSaveLoading(true);
    setTimeout(async () => {
      const result = await updateShop({ ...form, name: form.name.trim() || shop.name });
      setSaveLoading(false);
      if (!result.ok) {
        showToast("❌ " + result.message);
        return;
      }
      showToast("✅ 保存しました");
      navigate("/");
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-[520px] px-6 py-5">
      <h1 className="mb-6 text-[26px] font-bold">店舗情報</h1>
      <div
        className="flex flex-col gap-5.5 rounded-[var(--r-xl)] border-2 p-7"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div>
          <label className="mb-2 block text-[15px] font-bold">店舗名</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="例：田中商店"
            className={fieldClass}
            style={fieldStyle}
          />
        </div>
        <div>
          <label className="mb-2 block text-[15px] font-bold">住所（任意）</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="例：東京都〇〇区〇〇1-2-3"
            className={fieldClass}
            style={fieldStyle}
          />
        </div>
        <div>
          <label className="mb-2 block text-[15px] font-bold">電話番号（任意）</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="例：03-1234-5678"
            className={fieldClass}
            style={fieldStyle}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <Button variant="primary" loading={saveLoading} onClick={handleSubmit}>
            {saveLoading ? "保存しています..." : "保存する"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Shop;
