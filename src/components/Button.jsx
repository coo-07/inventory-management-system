const VARIANT_STYLES = {
  primary: "bg-gray-900 text-white hover:bg-gray-700",
  secondary: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
  danger: "bg-white text-red-600 border border-red-300 hover:bg-red-50",
};

/**
 * 共通ボタン
 * @param {"primary"|"secondary"|"danger"} variant - 見た目の種類
 */
function Button({ children, onClick, variant = "secondary", type = "button", disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_STYLES[variant]}`}
    >
      {children}
    </button>
  );
}

export default Button;
