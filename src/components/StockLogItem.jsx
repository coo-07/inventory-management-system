import { formatDate } from "../utils/formatDate";

function StockLogItem({ log }) {
  const isIn = log.type === "in";
  return (
    <div
      className="flex items-center justify-between border-b py-3.5 px-1 text-[15px]"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
          {formatDate(log.createdAt)}
        </span>
        {isIn ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold"
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
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold"
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
      </div>
      <div className="flex items-center gap-3">
        {log.memo && (
          <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
            {log.memo}
          </span>
        )}
        <span className="text-base font-bold" style={{ color: isIn ? "var(--green-dark)" : "var(--red)" }}>
          {isIn ? "+" : "−"}
          {log.quantity}
        </span>
      </div>
    </div>
  );
}

export default StockLogItem;
