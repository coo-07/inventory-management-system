import StockBadge from "./StockBadge";

function StockStatus({ stock, threshold }) {
  const isLow = stock < threshold;
  return (
    <div className="mt-3 flex items-center gap-2">
      <p className={`text-sm ${isLow ? "font-medium text-red-600" : "text-gray-700"}`}>
        在庫: {stock} 個（発注点: {threshold}）
      </p>
      <StockBadge stock={stock} threshold={threshold} />
    </div>
  );
}

export default StockStatus;
