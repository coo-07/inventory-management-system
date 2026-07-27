import { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";

const EMPTY_FORM = {
  name: "",
  category: "",
  stock: 0,
  threshold: 0,
  unit: "個",
  imageUrl: "",
};

/**
 * 商品登録・編集モーダル。新規登録・編集の両方をこの1つで兼用する。
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {object|null} initialValues - 編集時のみ渡す。nullなら新規登録。
 * @param {(data: object) => void} onSubmit
 */
function ItemModal({ isOpen, onClose, initialValues = null, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm(initialValues ?? EMPTY_FORM);
      setError("");
    }
  }, [isOpen, initialValues]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("商品名は必須です");
      return;
    }
    if (form.stock < 0 || form.threshold < 0) {
      setError("在庫数・発注点は0以上で入力してください");
      return;
    }
    onSubmit(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-base font-medium text-gray-900">
        {initialValues ? "商品編集" : "商品登録"}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">商品名（必須）</label>
          <input
            value={form.name}
            onChange={handleChange("name")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">カテゴリ</label>
          <input
            value={form.category}
            onChange={handleChange("category")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">初期在庫数</label>
            <input
              type="number"
              value={form.stock}
              onChange={handleChange("stock")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">発注点</label>
            <input
              type="number"
              value={form.threshold}
              onChange={handleChange("threshold")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">単位</label>
          <input
            value={form.unit}
            onChange={handleChange("unit")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">商品画像URL（任意）</label>
          <input
            value={form.imageUrl}
            onChange={handleChange("imageUrl")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" variant="primary">
            保存
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ItemModal;
