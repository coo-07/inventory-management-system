import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

function toMap(rows) {
  const map = {};
  for (const row of rows) {
    map[row.category] = row.icon;
  }
  return map;
}

/**
 * 固定8分類に含まれないカテゴリに、利用者が任意で割り当てたアイコン（category_iconsテーブル）を管理するフック。
 */
export function useCategoryIcons() {
  const [customIcons, setCustomIcons] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase.from("category_icons").select("category,icon,created_at");

    if (error) {
      console.error("カテゴリアイコンの取得に失敗しました", error);
      setCustomIcons({});
    } else {
      setCustomIcons(toMap(data ?? []));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addOrUpdateCategoryIcon = useCallback(async (category, icon) => {
    const { error } = await supabase.from("category_icons").upsert({ category, icon }, { onConflict: "category" });

    if (error) {
      console.error("カテゴリアイコンの保存に失敗しました", error);
      return { ok: false, message: "カテゴリアイコンの保存に失敗しました" };
    }

    setCustomIcons((prev) => ({ ...prev, [category]: icon }));
    return { ok: true };
  }, []);

  return { customIcons, loading, refetch: fetchAll, addOrUpdateCategoryIcon };
}
