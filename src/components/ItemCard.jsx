import StockBadge from "./StockBadge";

/**
 * 商品1件分のカード
 * @param {object} item
 * @param {() => void} onClick
 */
function ItemCard({ item, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-gray-400"
    >
      <div className="mb-2 flex h-20 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full rounded object-cover" />
        ) : (
          "画像なし"
        )}
      </div>
      <p className="text-sm font-medium text-gray-900">{item.name}</p>
      <p className="text-xs text-gray-500">{item.category}</p>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-sm text-gray-700">
          {item.stock} {item.unit}
        </p>
        <StockBadge stock={item.stock} threshold={item.threshold} />
      </div>
    </button>
  );
}

export default ItemCard;
