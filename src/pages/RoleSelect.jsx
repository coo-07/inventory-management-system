import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ROLES = [
  { key: "admin", label: "管理者", icon: "🔑", to: "/admin-login" },
  { key: "staff", label: "スタッフ", icon: "🧑‍💼", to: "/staff-login" },
  { key: "user", label: "利用者", icon: "📋", to: "/tanaoroshi" },
];

/**
 * ログイン前のトップ画面。管理者・スタッフ・利用者を対等に並べ、
 * それぞれ専用の画面（ログイン画面／棚卸し画面）へ遷移する。
 * 既に同じ立場でログイン済みの場合は、ログイン画面を経由せず/itemsへ直接遷移する。
 */
function RoleSelect() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleSelect = (roleItem) => {
    if (roleItem.key === role) {
      navigate("/items");
      return;
    }
    navigate(roleItem.to);
  };

  return (
    <div className="mx-auto flex max-w-[720px] flex-col items-center gap-10 px-6 py-20 text-center">
      <div>
        <p className="m-0 mb-2 text-[28px] font-black">やさしい在庫管理</p>
        <p className="m-0 text-[15px]" style={{ color: "var(--ink-soft)" }}>
          ご利用の立場を選んでください
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-3">
        {ROLES.map((roleOption) => (
          <button
            key={roleOption.key}
            type="button"
            onClick={() => handleSelect(roleOption)}
            className="box-border flex cursor-pointer flex-col items-center gap-3 rounded-[var(--r-xl)] border-2 p-8 text-[19px] font-bold transition-colors hover:border-[var(--blue)]! hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink)" }}
          >
            <span className="text-[40px]" aria-hidden="true">
              {roleOption.icon}
            </span>
            {roleOption.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default RoleSelect;
