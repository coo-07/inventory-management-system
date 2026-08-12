import { useMemo, useState } from "react";
import { useItems } from "../hooks/useItems";
import { useCategoryIcons } from "../hooks/useCategoryIcons";
import { useToast } from "../context/ToastContext";
import { FIXED_CATEGORIES } from "../components/CategoryIcon";
import CategoryIconPicker from "../components/CategoryIconPicker";

/**
 * 固定8分類にないカテゴリに、利用者が任意でアイコンを割り当てる設定画面（80番）。
 */
function CategorySettings() {
  const { items, loading } = useItems();
  const { customIcons, addOrUpdateCategoryIcon } = useCategoryIcons();
  const showToast = useToast();
  const [openCategory, setOpenCategory] = useState(null);
  const [savingCategory, setSavingCategory] = useState(null);

  const customCategories = useMemo(() => {
    const set = new Set(
      items.map((item) => item.category).filter((cat) => cat && !FIXED_CATEGORIES.includes(cat))
    );
    return [...set].sort((a, b) => a.localeCompare(b, "ja"));
  }, [items]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-5">
        <p style={{ color: "var(--ink-soft)" }}>読み込み中...</p>
      </div>
    );
  }

  const handleSelectIcon = async (category, icon) => {
    if (savingCategory) return;
    setSavingCategory(category);
    const result = await addOrUpdateCategoryIcon(category, icon);
    setSavingCategory(null);
    if (!result.ok) {
      showToast("❌ " + result.message);
      return;
    }
    showToast("✅ 保存しました");
    setOpenCategory(null);
  };

  return (
    <div className="mx-auto max-w-[640px] px-6 py-5">
      <h1 className="mb-6 text-[26px] font-bold">カテゴリアイコン設定</h1>

      <div
        className="rounded-[var(--r-xl)] border-2 p-7"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {customCategories.length === 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>
            アイコンを設定できるカテゴリがまだありません。固定8分類以外のカテゴリを商品に登録すると、ここに表示されます
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {customCategories.map((category) => {
              const icon = customIcons[category];
              const isOpen = openCategory === category;
              const isSaving = savingCategory === category;
              return (
                <div key={category} className="border-b pb-5 last:border-b-0 last:pb-0" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-md)] text-xl"
                      style={{ background: "var(--bg)" }}
                    >
                      {icon || "📦"}
                    </div>
                    <p className="m-0 flex-1 text-[17px] font-bold">{category}</p>
                    {!icon && (
                      <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
                        未設定
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setOpenCategory(isOpen ? null : category)}
                      className="cursor-pointer rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors hover:border-[var(--blue)]! hover:bg-[var(--blue-light)]! disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                    >
                      {isSaving ? "保存中..." : "アイコンを変更する"}
                    </button>
                  </div>
                  {isOpen && (
                    <div className="mt-4">
                      <CategoryIconPicker
                        category={category}
                        selectedIcon={icon}
                        onSelect={(icon) => handleSelectIcon(category, icon)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CategorySettings;
