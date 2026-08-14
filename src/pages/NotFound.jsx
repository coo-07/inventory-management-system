import { useGoBack } from "../hooks/useGoBack";

function NotFound() {
  const goBack = useGoBack();

  return (
    <div className="mx-auto flex max-w-[720px] flex-col items-center gap-2 px-6 py-24 text-center">
      <p className="text-2xl font-bold">404</p>
      <p style={{ color: "var(--ink-soft)" }}>ページが見つかりません</p>
      <button
        type="button"
        onClick={() => goBack("/items")}
        className="mt-2 cursor-pointer border-none bg-transparent p-0 text-sm underline"
        style={{ color: "var(--ink)" }}
      >
        一覧へ戻る
      </button>
    </div>
  );
}

export default NotFound;
