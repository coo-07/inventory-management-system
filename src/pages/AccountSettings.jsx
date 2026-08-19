import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";
import Button from "../components/Button";

const ZENKAKU_PATTERN = /[Ａ-Ｚａ-ｚ０-９]/;
const MIN_PASSWORD_LENGTH = 6;

function EyeIcon({ visible }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M1 10C1 10 4.5 4 10 4C15.5 4 19 10 19 10C19 10 15.5 16 10 16C4.5 16 1 10 1 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      {visible && <line x1="3" y1="17" x2="17" y2="3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}

function PasswordField({ label, value, onChange, show, onToggleShow, autoComplete }) {
  const isZenkaku = ZENKAKU_PATTERN.test(value);
  return (
    <div>
      <label className="mb-2 block text-[15px] font-bold">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="パスワードを入力"
          autoComplete={autoComplete}
          className="box-border w-full rounded-[var(--r-md)] border-2 py-3.5 pr-12 pl-4 text-[17px] transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "パスワードを非表示にする" : "パスワードを表示する"}
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded p-1 transition-colors hover:text-[var(--ink)]!"
          style={{ color: "var(--ink-soft)" }}
        >
          <EyeIcon visible={show} />
        </button>
      </div>
      {isZenkaku && (
        <p className="mt-2 text-[13px] font-bold" style={{ color: "var(--orange-dark)" }}>
          ⚠ 全角入力になっている可能性があります
        </p>
      )}
    </div>
  );
}

/**
 * ログイン中の管理者・スタッフが自分のパスワードを変更する画面（136番）。
 * 62番から固定パスワード運用のまま変更手段がなかった課題への対応。
 */
function AccountSettings() {
  const { role } = useAuth();
  const showToast = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`新しいパスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください。`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("新しいパスワードと確認用の入力が一致しません。");
      return;
    }
    setSubmitting(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);
    if (updateError) {
      setError("パスワードの変更に失敗しました。時間をおいて再度お試しください。");
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    showToast("✅ パスワードを変更しました");
  };

  return (
    <div className="mx-auto max-w-[640px] px-6 py-5">
      <h1 className="mb-6 text-[26px] font-bold">
        {role === "admin" ? "管理者：パスワード変更" : "スタッフ：パスワード変更"}
      </h1>

      <div
        className="flex flex-col gap-5.5 rounded-[var(--r-xl)] border-2 p-7"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <PasswordField
          label="新しいパスワード"
          value={newPassword}
          onChange={setNewPassword}
          show={showNewPassword}
          onToggleShow={() => setShowNewPassword((v) => !v)}
          autoComplete="new-password"
        />
        <PasswordField
          label="新しいパスワード（確認用）"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirmPassword}
          onToggleShow={() => setShowConfirmPassword((v) => !v)}
          autoComplete="new-password"
        />

        {error && (
          <div
            className="flex items-center gap-2.5 rounded-[var(--r-md)] px-4 py-3.5 text-[15px] font-bold"
            style={{ background: "var(--red-light)", color: "var(--red)" }}
          >
            {error}
          </div>
        )}

        <Button variant="primary" className="justify-center text-[19px]" loading={submitting} onClick={handleSubmit}>
          {submitting ? "変更しています..." : "変更する"}
        </Button>
      </div>
    </div>
  );
}

export default AccountSettings;
