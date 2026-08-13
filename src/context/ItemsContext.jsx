import { createContext, useContext } from "react";
import { useItemsInternal } from "../hooks/useItems";

const ItemsContext = createContext(null);

/**
 * useItemsInternal()（Supabaseのitems/stock_logsを扱うロジック本体）をアプリ全体で1つだけ実行し、
 * 各画面・Headerが同じitems/logsのstateを共有できるようにするProvider（89番）。
 */
export function ItemsProvider({ children }) {
  const value = useItemsInternal();
  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
}

export function useItems() {
  const ctx = useContext(ItemsContext);
  if (!ctx) throw new Error("useItems must be used within ItemsProvider");
  return ctx;
}
