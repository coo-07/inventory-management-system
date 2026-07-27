import StockLogItem from "./StockLogItem";

function StockLogList({ logs }) {
  if (logs.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400">まだ記録がありません</p>;
  }

  return (
    <div className="mt-2">
      {logs.map((log) => (
        <StockLogItem key={log.id} log={log} />
      ))}
    </div>
  );
}

export default StockLogList;
