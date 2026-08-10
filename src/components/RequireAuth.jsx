import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * 管理者・スタッフのログインが必要な画面を保護するラッパー。
 * DBレベルのRLSは今回対象外で、React側のルート制御のみで権限を分ける。
 */
function RequireAuth({ children }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-24 text-center">
        <p style={{ color: "var(--ink-soft)" }}>読み込み中...</p>
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RequireAuth;
