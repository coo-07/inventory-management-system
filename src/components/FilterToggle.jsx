const OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "low", label: "在庫少" },
  { value: "available", label: "在庫あり" },
];

/**
 * 在庫状況フィルター
 * @param {"all"|"low"|"available"} value
 * @param {(value: string) => void} onChange
 */
function FilterToggle({ value, onChange }) {
  return (
    <div className="flex gap-1 rounded-md border border-gray-300 p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded px-3 py-1 text-sm transition-colors ${
            value === option.value
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default FilterToggle;
