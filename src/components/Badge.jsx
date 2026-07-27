/**
 * 入荷・出荷の種別バッジ
 * @param {"in"|"out"} type
 */
function Badge({ type }) {
  const isIn = type === "in";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isIn ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"
      }`}
    >
      {isIn ? "入荷" : "出荷"}
    </span>
  );
}

export default Badge;
