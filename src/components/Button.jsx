const VARIANT_STYLES = {
  primary: { background: "var(--blue)", color: "white", border: "none" },
  secondary: { background: "var(--surface)", color: "var(--ink)", border: "2px solid var(--border)" },
  secondarySoft: { background: "var(--surface)", color: "var(--ink-soft)", border: "2px solid var(--border)" },
  dangerOutline: { background: "var(--surface)", color: "var(--red)", border: "2px solid var(--border)" },
  dangerSolid: { background: "var(--red)", color: "white", border: "none" },
};

const HOVER_CLASS = {
  primary: "hover:bg-[var(--blue-dark)]!",
  secondary: "hover:bg-[var(--border)]! hover:border-[var(--ink-soft)]!",
  secondarySoft: "hover:border-[var(--blue)]! hover:text-[var(--blue-dark)]! hover:bg-[var(--blue-light)]!",
  dangerOutline: "hover:border-[var(--red)]! hover:bg-[var(--red-light)]!",
  dangerSolid: "hover:bg-[oklch(0.5_0.19_25)]!",
};

/**
 * 共通ボタン。デザインのアクセントカラー（CSS変数）に合わせたバリアント。
 */
function Button({
  children,
  onClick,
  variant = "secondary",
  type = "button",
  disabled = false,
  loading = false,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={VARIANT_STYLES[variant]}
      className={`box-border inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-lg)] px-6 text-[17px] font-bold transition-colors ${
        disabled || loading ? "cursor-not-allowed opacity-60" : `cursor-pointer ${HOVER_CLASS[variant]}`
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
