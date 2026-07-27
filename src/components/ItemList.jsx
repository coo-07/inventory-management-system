import { useNavigate } from "react-router-dom";
import ItemCard from "./ItemCard";

/**
 * 商品一覧の表示管理。ItemCardを並べる。
 * @param {object[]} items
 */
function ItemList({ items }) {
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-500">
        該当する商品がありません
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onClick={() => navigate(`/items/${item.id}`)} />
      ))}
    </div>
  );
}

export default ItemList;
