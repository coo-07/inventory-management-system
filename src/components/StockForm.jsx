import { useState } from "react";
import Button from "./Button";

/**
 * @param {number} currentStock
 * @param {(type: "in"|"out", quantity: number, memo: string) => {ok: boolean, message?: string}} onSubmit
 */
function StockForm({ currentStock, onSubmit }) {
  const [type, setType] = useState("in");
  const [quantity, setQuantity] = useState(1);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (quantity < 1) {
      setError("数量は1以上を入力してください");
      return;
    }
    const result = onSubmit(type, quantity, memo);
    if (!result.ok) {
      setError(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("in")}
          className={`flex-1 rounded-md border py-2 text-sm ${
            type === "in" ? "border-green-600 bg-green-50 text-green-700" : "border-gray-300 text-gray-600"
          }`}
        >
          入荷
        </button>
        <button
          type="button"
          onClick={() => setType("out")}
          className={`flex-1 rounded-md border py-2 text-sm ${
            type === "out" ? "border-gray-900 bg-gray-100 text-gray-900" : "border-gray-300 text-gray-600"
          }`}
        >
          出荷
        </button>
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">数量（現在庫: {currentStock}）</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">メモ（任意）</label>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button type="submit" variant="primary">
        記録する
      </Button>
    </form>
  );
}

export default StockForm;
