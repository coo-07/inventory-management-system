import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="mx-auto flex max-w-[720px] flex-col items-center gap-2 px-6 py-24 text-center">
      <p className="text-2xl font-bold">404</p>
      <p style={{ color: "var(--ink-soft)" }}>ページが見つかりません</p>
      <Link to="/" className="mt-2 text-sm underline" style={{ color: "var(--ink)" }}>
        一覧へ戻る
      </Link>
    </div>
  );
}

export default NotFound;
