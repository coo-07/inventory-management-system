import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * 管理者のみアクセスできる画面を保護するラッパー。
 * ログイン済みだが権限不足（スタッフ）のケースを想定し、"/items" へ戻す。
 */
function RequireAdmin({ children }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-24 text-center">
        <p style={{ color: "var(--ink-soft)" }}>読み込み中...</p>
      </div>
    );
  }

  if (role !== "admin") {
    return <Navigate to="/items" replace />;
  }

  return children;
}

export default RequireAdmin;
