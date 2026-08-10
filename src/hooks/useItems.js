import { useState, useEffect, useCallback } from "react";
import { saveItems, saveLogs } from "../services/localStorage";
import { supabase } from "../services/supabaseClient";

/**
 * SupabaseのitemsテーブルはスネークケースなのでcamelCaseに変換する。
 * idはuseParams()などアプリ側では文字列として扱われるため、
 * Supabase側の数値idを文字列に揃える。
 */
function toCamelItem(row) {
  return {
    id: String(row.id),
    name: row.name,
    category: row.category,
    stock: row.stock,
    threshold: row.threshold,
    unit: row.unit,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Supabaseのstock_logsテーブルをcamelCaseに変換する。
 */
function toCamelLog(row) {
  return {
    id: String(row.id),
    itemId: String(row.item_id),
    type: row.type,
    quantity: row.quantity,
    memo: row.memo,
    afterStock: row.after_stock,
    createdAt: row.created_at,
  };
}

/**
 * 商品データと入出荷履歴のCRUD処理をまとめて管理するフック。
 * ページコンポーネントはこのフックを呼び出すだけでよく、
 * LocalStorageへの読み書きを直接書かない。
 * 商品一覧・入出荷履歴の読み込みはSupabase（items / stock_logs テーブル）から行う。
 * 登録・編集・削除・入出荷記録は引き続きLocalStorageを使用する（未移行）。
 */
export function useItems() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const [itemsRes, logsRes] = await Promise.all([
      supabase
        .from("items")
        .select("id,name,category,stock,threshold,unit,image_url,created_at,updated_at"),
      supabase
        .from("stock_logs")
        .select("id,item_id,type,quantity,memo,after_stock,created_at"),
    ]);

    if (itemsRes.error) {
      console.error("商品一覧の取得に失敗しました", itemsRes.error);
      setItems([]);
    } else {
      setItems((itemsRes.data ?? []).map(toCamelItem));
    }

    if (logsRes.error) {
      console.error("入出荷履歴の取得に失敗しました", logsRes.error);
      setLogs([]);
    } else {
      setLogs((logsRes.data ?? []).map(toCamelLog));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getItemById = useCallback((id) => items.find((item) => item.id === id), [items]);

  const addItem = useCallback(async (data) => {
    const { data: inserted, error } = await supabase
      .from("items")
      .insert({
        name: data.name,
        category: data.category,
        stock: data.stock,
        threshold: data.threshold,
        unit: data.unit,
        image_url: data.imageUrl || null,
      })
      .select("id,name,category,stock,threshold,unit,image_url,created_at,updated_at")
      .single();

    if (error) {
      console.error("商品の登録に失敗しました", error);
      return { ok: false, message: "商品の登録に失敗しました" };
    }

    const newItem = toCamelItem(inserted);
    setItems((prev) => [...prev, newItem]);
    return { ok: true, item: newItem };
  }, []);

  const updateItem = useCallback(async (id, data) => {
    const { data: updated, error } = await supabase
      .from("items")
      .update({
        name: data.name,
        category: data.category,
        stock: data.stock,
        threshold: data.threshold,
        unit: data.unit,
        image_url: data.imageUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,name,category,stock,threshold,unit,image_url,created_at,updated_at")
      .single();

    if (error) {
      console.error("商品の更新に失敗しました", error);
      return { ok: false, message: "商品の更新に失敗しました" };
    }

    const updatedItem = toCamelItem(updated);
    setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
    return { ok: true, item: updatedItem };
  }, []);

  const deleteItem = useCallback(async (id) => {
    const { error } = await supabase.from("items").delete().eq("id", id);

    if (error) {
      console.error("商品の削除に失敗しました", error);
      return { ok: false, message: "商品の削除に失敗しました" };
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    setLogs((prev) => prev.filter((log) => log.itemId !== id));
    return { ok: true };
  }, []);

  /**
   * 開発用: テストデータを既存の商品リストに追加する（上書きしない）。
   */
  const loadTestData = useCallback((testItems) => {
    setItems((prev) => {
      const next = [...prev, ...testItems];
      saveItems(next);
      return next;
    });
  }, []);

  /**
   * 開発用: 指定商品にテストの入出荷履歴をまとめて追加し、在庫数を最終値に更新する。
   */
  const seedTestLogs = useCallback((itemId, newLogs, finalStock) => {
    setLogs((prev) => {
      const next = [...prev, ...newLogs];
      saveLogs(next);
      return next;
    });
    setItems((prev) => {
      const next = prev.map((item) =>
        item.id === itemId ? { ...item, stock: finalStock, updatedAt: new Date().toISOString() } : item
      );
      saveItems(next);
      return next;
    });
  }, []);

  const getLogsByItemId = useCallback(
    (id) =>
      logs
        .filter((log) => log.itemId === id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [logs]
  );

  /**
   * 入荷・出荷を記録し、在庫数を更新する。
   * 出荷時に現在庫を超える場合はエラーを返す。
   */
  const recordStock = useCallback(
    (id, type, quantity, memo) => {
      const item = items.find((i) => i.id === id);
      if (!item) return { ok: false, message: "商品が見つかりません" };

      if (type === "out" && quantity > item.stock) {
        return { ok: false, message: "出荷数が現在庫を超えています" };
      }

      const nextStock = type === "in" ? item.stock + quantity : item.stock - quantity;
      const now = new Date().toISOString();

      setItems((prev) => {
        const next = prev.map((i) =>
          i.id === id ? { ...i, stock: nextStock, updatedAt: now } : i
        );
        saveItems(next);
        return next;
      });

      setLogs((prev) => {
        const newLog = {
          id: crypto.randomUUID(),
          itemId: id,
          type,
          quantity,
          memo,
          afterStock: nextStock,
          createdAt: now,
        };
        const next = [...prev, newLog];
        saveLogs(next);
        return next;
      });

      return { ok: true };
    },
    [items]
  );

  return { items, logs, loading, refetch: fetchAll, getItemById, addItem, updateItem, deleteItem, getLogsByItemId, recordStock, loadTestData, seedTestLogs };
}
