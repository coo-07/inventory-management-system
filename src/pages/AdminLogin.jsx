import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ADMIN_EMAIL } from "../config/authConfig";
import Button from "../components/Button";

const ZENKAKU_PATTERN = /[Ａ-Ｚａ-ｚ０-９]/;

function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const isZenkaku = ZENKAKU_PATTERN.test(password);

  const handleModifierCheck = (e) => {
    setCapsLockOn(e.getModifierState("CapsLock"));
  };

  const handleSubmit = async () => {
    if (loginLoading) return;
    setLoginLoading(true);
    setError("");
    const result = await login(ADMIN_EMAIL, password);
    setLoginLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate("/items");
  };

  return (
    <div className="mx-auto max-w-[420px] px-6 py-20">
      <h1 className="mb-6 text-center text-[26px] font-bold">管理者ログイン</h1>
      <div
        className="flex flex-col gap-5.5 rounded-[var(--r-xl)] border-2 p-7"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div>
          <label className="mb-2 block text-[15px] font-bold">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              handleModifierCheck(e);
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onKeyUp={handleModifierCheck}
            placeholder="パスワードを入力"
            autoComplete="current-password"
            className="box-border w-full rounded-[var(--r-md)] border-2 px-4 py-3.5 text-[17px] transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          />
          {(capsLockOn || isZenkaku) && (
            <div className="mt-2 flex flex-col gap-0.5 text-[13px] font-bold" style={{ color: "var(--orange-dark)" }}>
              {capsLockOn && <p className="m-0">⚠ Caps Lockがオンになっています</p>}
              {isZenkaku && <p className="m-0">⚠ 全角入力になっている可能性があります</p>}
            </div>
          )}
        </div>

        {error && (
          <div
            className="flex items-center gap-2.5 rounded-[var(--r-md)] px-4 py-3.5 text-[15px] font-bold"
            style={{ background: "var(--red-light)", color: "var(--red)" }}
          >
            {error}
          </div>
        )}

        <Button variant="primary" className="justify-center text-[19px]" loading={loginLoading} onClick={handleSubmit}>
          {loginLoading ? "ログインしています..." : "ログインする"}
        </Button>
      </div>

      <div className="mt-5 text-center">
        <Link to="/" className="text-sm underline" style={{ color: "var(--ink-soft)" }}>
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}

export default AdminLogin;
