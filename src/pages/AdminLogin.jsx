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
  const [showPassword, setShowPassword] = useState(false);

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
      setPassword("");
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
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
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
              className="box-border w-full rounded-[var(--r-md)] border-2 py-3.5 pr-12 pl-4 text-[17px] transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "パスワードを非表示にする" : "パスワードを表示する"}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded p-1 transition-colors hover:text-[var(--ink)]!"
              style={{ color: "var(--ink-soft)" }}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M1 10C1 10 4.5 4 10 4C15.5 4 19 10 19 10C19 10 15.5 16 10 16C4.5 16 1 10 1 10Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                  <line x1="3" y1="17" x2="17" y2="3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M1 10C1 10 4.5 4 10 4C15.5 4 19 10 19 10C19 10 15.5 16 10 16C4.5 16 1 10 1 10Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              )}
            </button>
          </div>
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
