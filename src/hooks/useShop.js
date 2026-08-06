import { useCallback, useEffect, useState } from "react";
import { loadShop, saveShop } from "../services/localStorage";

/**
 * 店舗情報（店舗名・住所・電話番号）の読み書きを管理するフック
 */
export function useShop() {
  const [shop, setShop] = useState(loadShop());

  useEffect(() => {
    setShop(loadShop());
  }, []);

  const updateShop = useCallback((data) => {
    setShop((prev) => {
      const next = { ...prev, ...data };
      saveShop(next);
      return next;
    });
  }, []);

  return { shop, updateShop };
}
