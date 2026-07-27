/**
 * 商品名検索欄
 * @param {string} value
 * @param {(value: string) => void} onChange
 */
function SearchBar({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="商品名で検索"
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
    />
  );
}

export default SearchBar;
