import StockLogItem from "./StockLogItem";

function StockLogList({ logs }) {
  if (logs.length === 0) {
    return (
      <p className="py-10 text-center text-[15px]" style={{ color: "var(--ink-soft)" }}>
        まだ記録がありません
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {logs.map((log) => (
        <StockLogItem key={log.id} log={log} />
      ))}
    </div>
  );
}

export default StockLogList;
