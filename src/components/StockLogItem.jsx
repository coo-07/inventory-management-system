import { formatDate } from "../utils/formatDate";

function StockLogItem({ log }) {
  const isIn = log.type === "in";
  return (
    <div
      className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 border-b py-3.5 pr-14 pl-1 text-[15px] sm:grid-cols-[160px_100px_1fr_80px] sm:gap-4 lg:pr-1"
      style={{ borderColor: "var(--border)" }}
    >
      <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
        {formatDate(log.createdAt)}
      </span>
      {isIn ? (
        <span
          className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold"
          style={{ background: "var(--green-light)", color: "var(--green-dark)" }}
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 15V5M5 10l5-5 5 5"
              stroke="var(--green-dark)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          入荷
        </span>
      ) : (
        <span
          className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold"
          style={{ background: "var(--blue-light)", color: "var(--blue-dark)" }}
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 5v10M5 10l5 5 5-5"
              stroke="var(--blue-dark)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          出荷
        </span>
      )}
      <span className="min-w-0 truncate text-[13px]" style={{ color: "var(--ink-soft)" }}>
        {log.memo}
      </span>
      <span
        className="text-right text-base font-bold"
        style={{ color: isIn ? "var(--green-dark)" : "var(--red)" }}
      >
        {isIn ? "+" : "−"}
        {log.quantity}
      </span>
    </div>
  );
}

export default StockLogItem;
