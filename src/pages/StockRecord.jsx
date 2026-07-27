import { useParams, useNavigate, Link } from "react-router-dom";
import { useItems } from "../hooks/useItems";
import StockForm from "../components/StockForm";

function StockRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getItemById, recordStock } = useItems();
  const item = getItemById(id);

  if (!item) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <p className="text-sm text-gray-500">商品が見つかりません</p>
      </div>
    );
  }

  const handleSubmit = (type, quantity, memo) => {
    const result = recordStock(id, type, quantity, memo);
    if (result.ok) {
      navigate(`/items/${id}`);
    }
    return result;
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link to={`/items/${id}`} className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-900">
        ← 戻る
      </Link>
      <p className="mb-4 text-sm text-gray-500">対象商品：{item.name}</p>
      <StockForm currentStock={item.stock} onSubmit={handleSubmit} />
    </div>
  );
}

export default StockRecord;
