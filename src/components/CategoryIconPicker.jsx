const PRESET_ICONS = [
  { icon: "🧻", label: "日用品" },
  { icon: "🚗", label: "車用品" },
  { icon: "🚬", label: "タバコ・喫煙具" },
  { icon: "🍬", label: "お菓子" },
  { icon: "🍺", label: "酒" },
  { icon: "🧊", label: "冷凍食品" },
  { icon: "🧹", label: "掃除用品" },
  { icon: "🔧", label: "工具・DIY" },
  { icon: "💊", label: "医薬品・衛生用品" },
  { icon: "🔋", label: "電池・電球" },
  { icon: "📖", label: "雑誌・書籍" },
  { icon: "🎮", label: "ホビー・おもちゃ" },
];

/**
 * 固定8分類にないカテゴリへ割り当てるアイコンを選ぶ共通コンポーネント（80番）。
 * 設定画面（CategorySettings）とExcel取り込みプレビュー（ItemImport）の両方から使い回す。
 */
function CategoryIconPicker({ category, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={`${category || "カテゴリ"}のアイコンを選択`}>
      {PRESET_ICONS.map(({ icon, label }) => (
        <button
          key={icon}
          type="button"
          title={label}
          onClick={() => onSelect(icon)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[var(--r-md)] border-2 text-xl transition-colors hover:border-[var(--blue)]! hover:bg-[var(--blue-light)]!"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

export default CategoryIconPicker;
