import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import { useToast } from "../context/ToastContext";

// 削除の猶予時間（Undo可能な時間）。実際にSupabaseへ削除リクエストを送るまでの待機時間と、
// Undoトーストの表示時間（duration）の両方でこの定数を参照する。片方だけ変更してズレが
// 生じないよう、値はここ1箇所のみで管理する
const DELETE_UNDO_DURATION_MS = 10000;

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
 *
 * 実体はItemsContext.jsxのItemsProviderから呼び出され、アプリ全体で1つのstateを共有する
 * （89番）。このフック自体を直接呼び出すと画面ごとに別々のstateを持ってしまうため、
 * コンポーネント側は "../context/ItemsContext" のuseItemsを使うこと。
 */
export function useItemsInternal() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();
  // 削除保留中（Undo可能）の商品idの集合。ここに含まれるidはitems（返り値）から除外し、
  // 一覧・詳細では即座に削除済みのように見せる。実体のitems/logs stateからはまだ消していない
  const [pendingDeleteIds, setPendingDeleteIds] = useState(() => new Set());
  // idごとの削除タイマー（setTimeoutの戻り値）。ItemsProviderはApp.jsxの直下・Routesの外側に
  // あり画面遷移で再マウントされないため、ここに保持したタイマーはページ遷移をまたいでも消えない
  const pendingDeleteTimersRef = useRef(new Map());

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

  // 削除保留中の商品を除いた一覧。コンポーネント側にはこちらを渡すことで、
  // 一覧・詳細どちらも呼び出し元を変更せずに「削除済みのように見せる」を実現する
  const visibleItems = useMemo(
    () => items.filter((item) => !pendingDeleteIds.has(item.id)),
    [items, pendingDeleteIds]
  );

  const getItemById = useCallback((id) => visibleItems.find((item) => item.id === id), [visibleItems]);

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

  /**
   * 削除保留（Undo）を解除し、タイマーをキャンセルして元通り表示に戻す。
   * Supabaseへは何もリクエストしない（まだ削除リクエスト自体を送っていないため）。
   */
  const undoDeleteItem = useCallback((id) => {
    const timeoutId = pendingDeleteTimersRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      pendingDeleteTimersRef.current.delete(id);
    }
    setPendingDeleteIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /**
   * 商品削除にUndo（元に戻す）機能を持たせるため、即座にはSupabaseへ削除リクエストを送らない。
   * 呼び出し直後はitemsから除外して画面上は削除済みのように見せつつ、5秒間のタイマーを仕掛ける。
   * 5秒以内にundoDeleteItem(id)が呼ばれなければ、そのタイミングで実際にSupabaseへ削除リクエストを送る。
   * 同じ商品に対して既に削除待ちタイマーがある場合は一旦キャンセルしてから仕掛け直す（1商品につき
   * 常に1つのタイマーのみを保持する）。
   */
  const deleteItem = useCallback(
    (id) => {
      const existingTimer = pendingDeleteTimersRef.current.get(id);
      if (existingTimer) clearTimeout(existingTimer);

      setPendingDeleteIds((prev) => new Set(prev).add(id));

      const runDelete = async () => {
        pendingDeleteTimersRef.current.delete(id);
        setPendingDeleteIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });

        // stock_logsがitemsを外部キー参照しているため、先に関連履歴を削除してからでないと
        // items側の削除が外部キー制約違反（409）で失敗する（69番のdeleteTestDataと同じ順序）
        const { error: logsError } = await supabase.from("stock_logs").delete().eq("item_id", id);
        if (logsError) {
          console.error("商品の削除に失敗しました", logsError.message, logsError.code);
          showToast("❌ 商品の削除に失敗しました");
          return;
        }

        const { error } = await supabase.from("items").delete().eq("id", id);
        if (error) {
          console.error("商品の削除に失敗しました", error.message, error.code);
          showToast("❌ 商品の削除に失敗しました");
          return;
        }

        setItems((prev) => prev.filter((item) => item.id !== id));
        setLogs((prev) => prev.filter((log) => log.itemId !== id));
      };

      pendingDeleteTimersRef.current.set(id, setTimeout(runDelete, DELETE_UNDO_DURATION_MS));

      showToast("✅ 削除しました", {
        action: { label: "元に戻す", onClick: () => undoDeleteItem(id) },
        duration: DELETE_UNDO_DURATION_MS,
      });

      return { ok: true };
    },
    [showToast, undoDeleteItem]
  );

  /**
   * 開発用: テストデータを既存の商品リストに追加する（上書きしない）。
   */
  const loadTestData = useCallback(async (testItems) => {
    const { data: inserted, error } = await supabase
      .from("items")
      .insert(
        testItems.map((item) => ({
          name: item.name,
          category: item.category,
          stock: item.stock,
          threshold: item.threshold,
          unit: item.unit,
          image_url: item.imageUrl || null,
        }))
      )
      .select("id,name,category,stock,threshold,unit,image_url,created_at,updated_at");

    if (error) {
      console.error("テストデータの追加に失敗しました", error);
      return { ok: false, message: "テストデータの追加に失敗しました" };
    }

    const newItems = (inserted ?? []).map(toCamelItem);
    setItems((prev) => [...prev, ...newItems]);
    return { ok: true, items: newItems };
  }, []);

  /**
   * Excel/CSV取り込み機能から、プレビューで確定した商品をまとめて登録する。
   */
  const importItems = useCallback(async (newItems) => {
    const { data: inserted, error } = await supabase
      .from("items")
      .insert(
        newItems.map((item) => ({
          name: item.name,
          category: item.category,
          stock: item.stock,
          threshold: item.threshold,
          unit: item.unit,
          image_url: item.imageUrl || null,
        }))
      )
      .select("id,name,category,stock,threshold,unit,image_url,created_at,updated_at");

    if (error) {
      console.error("商品の一括登録に失敗しました", error);
      return { ok: false, message: "商品の一括登録に失敗しました" };
    }

    const insertedItems = (inserted ?? []).map(toCamelItem);
    setItems((prev) => [...prev, ...insertedItems]);
    return { ok: true, items: insertedItems };
  }, []);

  /**
   * 開発用: 指定商品にテストの入出荷履歴をまとめて追加し、在庫数を最終値に更新する。
   */
  const seedTestLogs = useCallback(async (itemId, newLogs, finalStock) => {
    const now = new Date().toISOString();

    const { data: updatedItem, error: itemError } = await supabase
      .from("items")
      .update({ stock: finalStock, updated_at: now })
      .eq("id", itemId)
      .select("id,name,category,stock,threshold,unit,image_url,created_at,updated_at")
      .single();

    if (itemError) {
      console.error("テスト履歴の追加に失敗しました", itemError);
      return { ok: false, message: "テスト履歴の追加に失敗しました" };
    }

    const { data: insertedLogs, error: logsError } = await supabase
      .from("stock_logs")
      .insert(
        newLogs.map((log) => ({
          item_id: itemId,
          type: log.type,
          quantity: log.quantity,
          memo: log.memo,
          after_stock: log.afterStock,
          created_at: log.createdAt,
        }))
      )
      .select("id,item_id,type,quantity,memo,after_stock,created_at");

    if (logsError) {
      console.error("テスト履歴の追加に失敗しました", logsError);
      return { ok: false, message: "在庫は更新されましたが、履歴の記録に失敗しました" };
    }

    setItems((prev) => prev.map((i) => (i.id === itemId ? toCamelItem(updatedItem) : i)));
    setLogs((prev) => [...prev, ...(insertedLogs ?? []).map(toCamelLog)]);
    return { ok: true };
  }, []);

  /**
   * 開発用: テストデータ（名前が「テストN」の商品）とその入出荷履歴をまとめて削除する。
   */
  const deleteTestData = useCallback(async () => {
    const targetIds = items.filter((item) => /^テスト\d+$/.test(item.name)).map((item) => item.id);

    if (targetIds.length === 0) {
      return { ok: true };
    }

    const { error: logsError } = await supabase.from("stock_logs").delete().in("item_id", targetIds);

    if (logsError) {
      console.error("テストデータの削除に失敗しました", logsError);
      return { ok: false, message: "テストデータの削除に失敗しました" };
    }

    const { error: itemsError } = await supabase.from("items").delete().in("id", targetIds);

    if (itemsError) {
      console.error("テストデータの削除に失敗しました", itemsError);
      return { ok: false, message: "テストデータの削除に失敗しました" };
    }

    setItems((prev) => prev.filter((item) => !targetIds.includes(item.id)));
    setLogs((prev) => prev.filter((log) => !targetIds.includes(log.itemId)));
    return { ok: true };
  }, [items]);

  /**
   * 開発用: 全商品とその入出荷履歴をまとめて削除する。
   */
  const deleteAllItems = useCallback(async () => {
    const targetIds = items.map((item) => item.id);

    if (targetIds.length === 0) {
      return { ok: true };
    }

    const { error: logsError } = await supabase.from("stock_logs").delete().in("item_id", targetIds);

    if (logsError) {
      console.error("全商品の削除に失敗しました", logsError);
      return { ok: false, message: "全商品の削除に失敗しました" };
    }

    const { error: itemsError } = await supabase.from("items").delete().in("id", targetIds);

    if (itemsError) {
      console.error("全商品の削除に失敗しました", itemsError);
      return { ok: false, message: "全商品の削除に失敗しました" };
    }

    setItems([]);
    setLogs([]);
    return { ok: true };
  }, [items]);

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
    async (id, type, quantity, memo) => {
      const item = items.find((i) => i.id === id);
      if (!item) return { ok: false, message: "商品が見つかりません" };

      if (type === "out" && quantity > item.stock) {
        return { ok: false, message: "出荷数が現在庫を超えています" };
      }

      const nextStock = type === "in" ? item.stock + quantity : item.stock - quantity;
      const now = new Date().toISOString();

      const { data: updatedItem, error: itemError } = await supabase
        .from("items")
        .update({ stock: nextStock, updated_at: now })
        .eq("id", id)
        .select("id,name,category,stock,threshold,unit,image_url,created_at,updated_at")
        .single();

      if (itemError) {
        console.error("在庫の更新に失敗しました", itemError);
        return { ok: false, message: "在庫の更新に失敗しました" };
      }

      setItems((prev) => prev.map((i) => (i.id === id ? toCamelItem(updatedItem) : i)));

      const { data: insertedLog, error: logError } = await supabase
        .from("stock_logs")
        .insert({ item_id: id, type, quantity, memo, after_stock: nextStock })
        .select("id,item_id,type,quantity,memo,after_stock,created_at")
        .single();

      if (logError) {
        console.error("入出荷履歴の記録に失敗しました", logError);
        return { ok: false, message: "在庫は更新されましたが、履歴の記録に失敗しました" };
      }

      setLogs((prev) => [...prev, toCamelLog(insertedLog)]);

      return { ok: true };
    },
    [items]
  );

  /**
   * 棚卸し結果を記録する。実際に数えた数（actualStock）をそのままitems.stockに反映し、
   * stock_logsに type: "count" のログを追加する。一致・不一致にかかわらず必ずログを残す。
   */
  const recordCount = useCallback(
    async (id, actualStock, memo = "") => {
      const item = items.find((i) => i.id === id);
      if (!item) return { ok: false, message: "商品が見つかりません" };

      const diff = actualStock - item.stock;
      const now = new Date().toISOString();

      if (diff !== 0) {
        const { data: updatedItem, error: itemError } = await supabase
          .from("items")
          .update({ stock: actualStock, updated_at: now })
          .eq("id", id)
          .select("id,name,category,stock,threshold,unit,image_url,created_at,updated_at")
          .single();

        if (itemError) {
          console.error("棚卸し結果の反映に失敗しました", itemError);
          return { ok: false, message: "棚卸し結果の反映に失敗しました" };
        }

        setItems((prev) => prev.map((i) => (i.id === id ? toCamelItem(updatedItem) : i)));
      }

      const { data: insertedLog, error: logError } = await supabase
        .from("stock_logs")
        .insert({ item_id: id, type: "count", quantity: diff, memo, after_stock: actualStock })
        .select("id,item_id,type,quantity,memo,after_stock,created_at")
        .single();

      if (logError) {
        console.error("棚卸し履歴の記録に失敗しました", logError);
        return { ok: false, message: "在庫は更新されましたが、棚卸し履歴の記録に失敗しました" };
      }

      setLogs((prev) => [...prev, toCamelLog(insertedLog)]);
      return { ok: true, diff };
    },
    [items]
  );

  return {
    items: visibleItems,
    logs,
    loading,
    refetch: fetchAll,
    getItemById,
    addItem,
    updateItem,
    deleteItem,
    undoDeleteItem,
    getLogsByItemId,
    recordStock,
    recordCount,
    importItems,
    loadTestData,
    seedTestLogs,
    deleteTestData,
    deleteAllItems,
  };
}
