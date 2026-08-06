import { useState, useEffect, useCallback } from "react";
import { loadItems, saveItems, loadLogs, saveLogs, seedIfEmpty } from "../services/localStorage";
import { sampleItems, sampleLogs } from "../data/sampleData";

/**
 * 商品データと入出荷履歴のCRUD処理をまとめて管理するフック。
 * ページコンポーネントはこのフックを呼び出すだけでよく、
 * LocalStorageへの読み書きを直接書かない。
 * 将来API化する際は、この中身だけをfetch呼び出しに差し替えればよい。
 */
export function useItems() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    seedIfEmpty(sampleItems, sampleLogs);
    setItems(loadItems());
    setLogs(loadLogs());
  }, []);

  const getItemById = useCallback((id) => items.find((item) => item.id === id), [items]);

  const addItem = useCallback((data) => {
    const now = new Date().toISOString();
    const newItem = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    setItems((prev) => {
      const next = [...prev, newItem];
      saveItems(next);
      return next;
    });
    return newItem;
  }, []);

  const updateItem = useCallback((id, data) => {
    setItems((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
      );
      saveItems(next);
      return next;
    });
  }, []);

  const deleteItem = useCallback((id) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveItems(next);
      return next;
    });
    setLogs((prev) => {
      const next = prev.filter((log) => log.itemId !== id);
      saveLogs(next);
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

  return { items, logs, getItemById, addItem, updateItem, deleteItem, getLogsByItemId, recordStock };
}
