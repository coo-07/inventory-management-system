import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

const SHOP_COLUMNS = "id,name,address,phone,updated_at";

function toCamelShop(row) {
  return {
    id: String(row.id),
    name: row.name,
    address: row.address,
    phone: row.phone,
    updatedAt: row.updated_at,
  };
}

/**
 * shop_infoは常に1件だけ存在する想定のテーブル。
 * 複数のuseShop()インスタンスが同時に「0件→insert」を行うと重複作成の
 * おそれがあるため、insert処理はモジュールスコープのPromiseで1回に集約する。
 */
let creatingShopPromise = null;

async function ensureShopRow() {
  const { data, error } = await supabase.from("shop_info").select(SHOP_COLUMNS).limit(1);
  if (error) throw error;
  if (data && data.length > 0) return data[0];

  if (!creatingShopPromise) {
    creatingShopPromise = supabase
      .from("shop_info")
      .insert({ name: "", address: "", phone: "" })
      .select(SHOP_COLUMNS)
      .single()
      .then(({ data: inserted, error: insertError }) => {
        creatingShopPromise = null;
        if (insertError) throw insertError;
        return inserted;
      })
      .catch((err) => {
        creatingShopPromise = null;
        throw err;
      });
  }
  return creatingShopPromise;
}

/**
 * 店舗情報（店舗名・住所・電話番号）の読み書きを管理するフック。
 * shop_infoテーブルは常に1件だけ存在する想定で、0件の場合は空データを自動作成する。
 */
export function useShop() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchShop = useCallback(async () => {
    setLoading(true);
    try {
      const row = await ensureShopRow();
      setShop(toCamelShop(row));
    } catch (error) {
      console.error("店舗情報の取得に失敗しました", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  const updateShop = useCallback(
    async (data) => {
      if (!shop) return { ok: false, message: "店舗情報が読み込まれていません" };

      const { data: updated, error } = await supabase
        .from("shop_info")
        .update({
          name: data.name,
          address: data.address,
          phone: data.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", shop.id)
        .select(SHOP_COLUMNS)
        .single();

      if (error) {
        console.error("店舗情報の更新に失敗しました", error);
        return { ok: false, message: "店舗情報の更新に失敗しました" };
      }

      const updatedShop = toCamelShop(updated);
      setShop(updatedShop);
      return { ok: true, shop: updatedShop };
    },
    [shop]
  );

  return { shop, loading, refetch: fetchShop, updateShop };
}
