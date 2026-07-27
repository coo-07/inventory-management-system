import Badge from "./Badge";
import { formatDate } from "../utils/formatDate";

function StockLogItem({ log }) {
  const sign = log.type === "in" ? "+" : "-";
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{formatDate(log.createdAt)}</span>
        <Badge type={log.type} />
      </div>
      <div className="flex items-center gap-3">
        {log.memo && <span className="text-xs text-gray-400">{log.memo}</span>}
        <span className={log.type === "in" ? "text-green-700" : "text-red-600"}>
          {sign}
          {log.quantity}
        </span>
      </div>
    </div>
  );
}

export default StockLogItem;
