/**
 * カテゴリ選択欄
 * @param {string[]} categories
 * @param {string} value
 * @param {(value: string) => void} onChange
 */
function CategorySelect({ categories, value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
    >
      <option value="">全カテゴリ</option>
      {categories.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
  );
}

export default CategorySelect;
