const PRESET_ICONS = [
  { icon: "🧻", label: "日用品", keywords: ["日用品", "日用雑貨", "生活用品"] },
  { icon: "🚗", label: "車用品", keywords: ["車", "自動車", "カー"] },
  { icon: "🚬", label: "タバコ・喫煙具", keywords: ["タバコ", "たばこ", "煙草"] },
  { icon: "🍬", label: "お菓子", keywords: ["お菓子", "菓子", "スイーツ"] },
  { icon: "🍺", label: "酒", keywords: ["酒", "アルコール", "ビール"] },
  { icon: "🧊", label: "冷凍食品", keywords: ["冷凍", "アイス"] },
  { icon: "🧹", label: "掃除用品", keywords: ["掃除", "清掃", "洗剤"] },
  { icon: "🔧", label: "工具・DIY", keywords: ["工具", "DIY", "金物"] },
  { icon: "💊", label: "医薬品・衛生用品", keywords: ["医薬品", "薬", "衛生"] },
  { icon: "🔋", label: "電池・電球", keywords: ["電池", "電球", "バッテリー"] },
  { icon: "📖", label: "雑誌・書籍", keywords: ["雑誌", "書籍", "コミック"] },
  { icon: "🎮", label: "ホビー・おもちゃ", keywords: ["ホビー", "おもちゃ", "玩具"] },
];

/**
 * カテゴリ名にプリセットのキーワードが含まれていれば、対応するアイコンを返す（一致しなければnull）。
 * 先頭から順に判定し、最初に一致したものを採用する。
 */
export function matchPresetIcon(categoryName) {
  if (!categoryName) return null;
  const preset = PRESET_ICONS.find(({ keywords }) => keywords.some((kw) => categoryName.includes(kw)));
  return preset ? preset.icon : null;
}

/**
 * 固定8分類にないカテゴリへ割り当てるアイコンを選ぶ共通コンポーネント（80番）。
 * 設定画面（CategorySettings）とExcel取り込みプレビュー（ItemImport）の両方から使い回す。
 * selectedIconを渡すと、現在選ばれているアイコンを枠線・背景色で示す（80-2番）。
 */
function CategoryIconPicker({ category, selectedIcon, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={`${category || "カテゴリ"}のアイコンを選択`}>
      {PRESET_ICONS.map(({ icon, label }) => {
        const isSelected = icon === selectedIcon;
        return (
          <button
            key={icon}
            type="button"
            title={label}
            aria-pressed={isSelected}
            onClick={() => onSelect(icon)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[var(--r-md)] border-2 text-xl transition-colors hover:border-[var(--blue)]! hover:bg-[var(--blue-light)]!"
            style={{
              borderColor: isSelected ? "var(--blue)" : "var(--border)",
              background: isSelected ? "var(--blue-light)" : "var(--surface)",
            }}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryIconPicker;
