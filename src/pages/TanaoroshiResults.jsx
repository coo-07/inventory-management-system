import { useNavigate } from "react-router-dom";
import { useItems } from "../context/ItemsContext";
import { useCategoryIcons } from "../hooks/useCategoryIcons";
import { formatDate } from "../utils/formatDate";
import CategoryIcon from "../components/CategoryIcon";
import Button from "../components/Button";

/**
 * 棚卸し結果（stock_logsのtype: "count"ログ）の一覧画面。管理者・スタッフのみ閲覧可。
 * 差分がある行は目立たせ、各行から該当商品の単品棚卸し（再入力）に遷移できる。
 */
function TanaoroshiResults() {
  const navigate = useNavigate();
  const { logs, getItemById, loading } = useItems();
  const { customIcons } = useCategoryIcons();

  if (loading) {
    return (
      <div className="mx-auto max-w-[960px] px-6 py-5">
        <p style={{ color: "var(--ink-soft)" }}>読み込み中...</p>
      </div>
    );
  }

  const countLogs = logs
    .filter((log) => log.type === "count")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="mx-auto max-w-[960px] px-6 py-5">
      <h1 className="mb-6 text-[26px] font-bold">棚卸し結果</h1>

      {countLogs.length === 0 ? (
        <p className="py-10 text-center text-[15px]" style={{ color: "var(--ink-soft)" }}>
          まだ棚卸しの記録がありません
        </p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {countLogs.map((log) => {
            const item = getItemById(log.itemId);
            const diff = log.quantity;
            const isMismatch = diff !== 0;
            const registeredStock = log.afterStock - log.quantity;

            return (
              <div
                key={log.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[var(--r-md)] border-b px-3 py-3.5"
                style={{
                  borderColor: "var(--border)",
                  background: isMismatch ? "var(--orange-light)" : "transparent",
                }}
              >
                <span className="w-[140px] shrink-0 text-sm" style={{ color: "var(--ink-soft)" }}>
                  {formatDate(log.createdAt)}
                </span>

                <div className="flex min-w-[160px] flex-1 items-center gap-2">
                  {item ? (
                    <>
                      <CategoryIcon category={item.category} size={20} customIcons={customIcons} />
                      <span className="font-bold">{item.name}</span>
                    </>
                  ) : (
                    <span style={{ color: "var(--ink-soft)" }}>（削除された商品）</span>
                  )}
                </div>

                <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
                  登録：{registeredStock}{item?.unit ?? ""}
                </span>
                <span className="text-sm font-bold">
                  実数：{log.afterStock}{item?.unit ?? ""}
                </span>

                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
                  style={{
                    background: isMismatch ? "var(--orange)" : "var(--border)",
                    color: isMismatch ? "white" : "var(--ink)",
                  }}
                >
                  {diff === 0 ? "一致 ✓" : diff > 0 ? `+${diff}` : `−${Math.abs(diff)}`}
                </span>

                {item && (
                  <Button
                    variant="secondarySoft"
                    onClick={() => navigate(`/tanaoroshi?item=${log.itemId}`)}
                    className="ml-auto"
                  >
                    もう一度棚卸しする
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TanaoroshiResults;
