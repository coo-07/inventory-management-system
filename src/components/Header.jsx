import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useMatch, useNavigate, useSearchParams } from "react-router-dom";
import { getStockStatus } from "../utils/stockStatus";
import { useItems } from "../context/ItemsContext";
import { useShop } from "../hooks/useShop";
import { useAuth } from "../hooks/useAuth";
import { useGoBack } from "../hooks/useGoBack";
import { updateListParams } from "../utils/listSearchParams";

function useBackLink() {
  const isTanaoroshiResults = useMatch("/items/tanaoroshi-results");
  const isDetail = useMatch("/items/:id");
  const isNew = useMatch("/items/new");
  const isImport = useMatch("/items/import");
  const isEdit = useMatch("/items/:id/edit");
  const isRecord = useMatch("/items/:id/record");
  const isShop = useMatch("/shop");
  const isCategorySettings = useMatch("/settings/categories");
  const isReports = useMatch("/reports");
  const isAccount = useMatch("/account");

  if (isTanaoroshiResults) return { label: "一覧へ戻る", to: "/items" };
  if (isReports) return { label: "一覧へ戻る", to: "/items" };
  if (isDetail) return { label: "一覧へ戻る", to: "/items" };
  if (isNew) return { label: "戻る", to: "/items" };
  if (isImport) return { label: "一覧へ戻る", to: "/items" };
  if (isEdit) return { label: "戻る", to: `/items/${isEdit.params.id}` };
  if (isRecord) return { label: "商品詳細へ戻る", to: `/items/${isRecord.params.id}` };
  if (isShop) return { label: "一覧へ戻る", to: "/items" };
  if (isCategorySettings) return { label: "一覧へ戻る", to: "/items" };
  if (isAccount) return { label: "一覧へ戻る", to: "/items" };
  return null;
}

/**
 * 全画面共通のヘッダー。ロゴ・店舗名リンク・画面に応じた戻るリンクを表示する。
 */
function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const backLink = useBackLink();
  const isHome = useMatch("/items");
  const [searchParams, setSearchParams] = useSearchParams();

  const { items, logs, refetch: refetchItems } = useItems();
  const { shop, refetch: refetchShop } = useShop();
  const { role, logout } = useAuth();

  useEffect(() => {
    refetchItems();
    refetchShop();
  }, [location.pathname, refetchItems, refetchShop]);

  // 「⚙️」設定メニューの開閉状態。Home.jsxの他メニュー（ダウンロード・テスト用データ）と
  // 同じ開閉パターン（外側クリック・Escキーで閉じる、トリガーボタン再クリックでトグル）
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const settingsMenuRef = useRef(null);

  useEffect(() => {
    if (!isSettingsMenuOpen) return;
    const handlePointerDown = (e) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target)) {
        setIsSettingsMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsSettingsMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSettingsMenuOpen]);

  const handleCategorySettingsClick = () => {
    if (role !== "admin") return;
    setIsSettingsMenuOpen(false);
    navigate("/settings/categories");
  };

  const handleAccountSettingsClick = () => {
    setIsSettingsMenuOpen(false);
    navigate("/account");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const outCount = items.filter((i) => getStockStatus(i.stock, i.threshold).isOut).length;
  const lowCount = items.filter((i) => getStockStatus(i.stock, i.threshold).isLow).length;
  const availableCount = items.length - outCount - lowCount;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = logs.filter((l) => l.createdAt.slice(0, 10) === todayStr).length;

  const activeFilter = searchParams.get("filter") || "all";
  // 検索ワード・カテゴリなど他のクエリパラメータを保持したまま、ステータスタブのみを更新する
  // （以前は setSearchParams({ filter: value }) でURL全体を置き換えていたため、
  // タブを切り替えるたびに検索ワード・カテゴリ・ページ番号が消えてしまっていた）
  const setFilter = (value) => setSearchParams(updateListParams(searchParams, { filter: value }), { replace: true });

  // 「戻る」系リンクは固定の遷移先ではなく、ブラウザの履歴を1つ戻ることで一覧の検索・絞り込み・
  // ページ番号（URLクエリパラメータ）を保ったまま戻れるようにする（履歴が無い場合はbackLink.toへ）
  const goBack = useGoBack();
  const handleBack = () => {
    if (!backLink) return;
    goBack(backLink.to);
  };

  return (
    <header
      className="sticky top-0 z-20 border-b-2"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="mx-auto flex max-w-[2400px] flex-wrap items-center justify-between gap-x-3.5 gap-y-2 px-8 py-3.5 md:py-5">
        <div className="flex items-center gap-3.5">
          <Link
            to="/"
            className="flex items-center gap-3 -mx-2 -my-1 rounded-lg px-2 py-1 transition-colors hover:bg-[var(--bg)]!"
          >
            <div
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[var(--r-md)]"
              style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--blue-light) 50%, var(--blue) 50%), var(--blue-dark))" }}
            >
              <svg width="39" height="35" viewBox="0 0 236.5 211" fill="none">
                <path
                  fill="white"
                  d="M1235 2188 c-29 -17 -1099 -873 -1116 -894 l-14 -17 0 -43 0 -44 27
-27 28 -27 95 -4 95 -4 0 -480 0 -479 15 -29 c8 -16 24 -34 34 -40 l20 -10
293 0 294 0 27 28 27 28 2 329 3 330 222 3 222 2 3 -334 3 -334 24 -26 24 -26
301 0 300 0 28 27 28 27 0 492 0 492 96 4 97 4 28 32 29 32 0 29 c0 16 -3 37
-6 46 -4 9 -82 79 -175 156 l-168 140 -3 255 -3 256 -28 24 -28 24 -148 0
-148 0 -27 -25 -26 -24 0 -91 c0 -49 -4 -90 -8 -90 -5 0 -78 57 -163 127 -85
70 -169 137 -188 150 l-34 23 -31 0 c-17 0 -40 -6 -51 -12z m269 -258 c114
-93 215 -171 224 -171 33 -3 47 2 65 23 l17 20 0 119 0 120 103 -3 102 -3 5
-255 c3 -140 7 -256 8 -257 7 -6 202 -168 261 -216 39 -32 71 -62 71 -68 l0
-9 -89 0 -88 0 -27 -21 -26 -20 0 -493 0 -492 -12 -12 -12 -12 -243 0 -242 0
-11 19 -10 20 0 321 0 321 -25 24 -24 25 -260 0 -260 0 -28 -24 -28 -24 -5
-339 -5 -338 -255 0 -255 0 -5 497 -5 496 -24 26 -24 26 -94 0 -93 0 0 9 c0
15 1057 861 1076 861 6 0 105 -76 218 -170z"
                  transform="translate(-10.5,220) scale(0.1,-0.1)"
                />
              </svg>
            </div>
            <span className="text-[22px] leading-tight font-bold">やさしい在庫管理</span>
          </Link>
          {role === "admin" ? (
            <button
              type="button"
              onClick={() => navigate("/shop")}
              className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border-none bg-transparent px-2.5 py-1 text-[15px] font-semibold hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"
              style={{ color: "var(--ink-soft)" }}
            >
              <span>🏪</span>
              {shop && (shop.name || "店舗名を設定してください")}
              <span aria-hidden="true">›</span>
            </button>
          ) : (
            <span
              className="flex w-fit items-center gap-1.5 rounded-lg border-none bg-transparent px-2.5 py-1 text-[15px] font-semibold"
              style={{ color: "var(--ink-soft)" }}
            >
              <span>🏪</span>
              {shop && (shop.name || "店舗名を設定してください")}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3.5">
          {isHome && items.length > 0 && (
            <section aria-label="現在の状況" className="flex flex-wrap items-center gap-2.5">
              <span className="text-[13px] font-bold whitespace-nowrap" style={{ color: "var(--ink-soft)" }}>
                現在の状況
              </span>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === "all" ? "hover:bg-[var(--blue-dark)]! hover:border-[var(--blue-dark)]!" : "hover:border-[var(--ink-soft)]! hover:bg-[var(--bg)]!"}`}
                style={
                  activeFilter === "all"
                    ? { background: "var(--blue)", color: "white", borderColor: "var(--blue)" }
                    : { background: "transparent", color: "var(--ink-soft)", borderColor: "transparent" }
                }
              >
                すべて {items.length}件
              </button>
              <button
                type="button"
                onClick={() => setFilter("out")}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === "out" ? "hover:bg-[#DC2626]! hover:border-[#DC2626]!" : "hover:border-[#DC2626]! hover:bg-[#FECACA]!"}`}
                style={
                  activeFilter === "out"
                    ? { background: "var(--red)", color: "white", borderColor: "var(--red)" }
                    : { background: "var(--red-light)", color: "var(--red)", borderColor: "transparent" }
                }
              >
                <span aria-hidden="true">✕</span>
                在庫切れ {outCount}件
              </button>
              <button
                type="button"
                onClick={() => setFilter("low")}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === "low" ? "hover:bg-[var(--orange-dark)]! hover:border-[var(--orange-dark)]!" : "hover:border-[var(--orange-dark)]! hover:bg-[#FED7AA]!"}`}
                style={
                  activeFilter === "low"
                    ? { background: "var(--orange)", color: "white", borderColor: "var(--orange)" }
                    : { background: "var(--orange-light)", color: "var(--orange-dark)", borderColor: "transparent" }
                }
              >
                <span aria-hidden="true">⚠</span>
                在庫少 {lowCount}件
              </button>
              <button
                type="button"
                onClick={() => setFilter("available")}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === "available" ? "hover:bg-[var(--ink)]! hover:border-[var(--ink)]!" : "hover:border-[var(--ink-soft)]! hover:bg-[var(--border)]!"}`}
                style={
                  activeFilter === "available"
                    ? { background: "var(--ink-soft)", color: "white", borderColor: "var(--ink-soft)" }
                    : { background: "var(--bg)", color: "var(--ink-soft)", borderColor: "transparent" }
                }
              >
                在庫あり {availableCount}件
              </button>
              <span className="mx-1 h-4 w-px" style={{ background: "var(--border)" }} aria-hidden="true" />
              <span
                className="inline-flex items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap"
                style={{ background: "var(--bg)", color: "var(--ink)", borderColor: "transparent" }}
              >
                <span aria-hidden="true">📦</span>
                入出荷 {todayCount}件
              </span>
            </section>
          )}
          {role && (
            <span className="text-[13px] font-bold whitespace-nowrap" style={{ color: "var(--ink-soft)" }}>
              {role === "admin" ? "管理者としてログイン中" : "スタッフとしてログイン中"}
            </span>
          )}
          {role && (
            <button
              type="button"
              onClick={() => navigate("/items/tanaoroshi-results")}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors hover:border-[var(--blue)]! hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"
              style={{ background: "var(--surface)", color: "var(--ink-soft)", borderColor: "var(--border)" }}
            >
              📋 棚卸し結果
            </button>
          )}
          {role && (
            <button
              type="button"
              onClick={() => navigate("/reports")}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors hover:border-[var(--blue)]! hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"
              style={{ background: "var(--surface)", color: "var(--ink-soft)", borderColor: "var(--border)" }}
            >
              📊 レポート
            </button>
          )}
          {role && (
            <div className="relative" ref={settingsMenuRef}>
              <button
                type="button"
                onClick={() => setIsSettingsMenuOpen((prev) => !prev)}
                title="設定"
                className="box-border inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 text-base transition-colors hover:bg-[var(--bg)]!"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink-soft)" }}
              >
                ⚙️
              </button>
              {isSettingsMenuOpen && (
                <ul
                  role="menu"
                  aria-label="設定"
                  className="absolute right-0 z-30 mt-1 w-max min-w-[220px] overflow-hidden rounded-[var(--r-md)] border-2 py-1 shadow-lg"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                >
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      disabled={role !== "admin"}
                      onClick={handleCategorySettingsClick}
                      title={role !== "admin" ? "管理者のみ利用できます" : undefined}
                      className={`block w-full border-none bg-transparent px-4 py-2 text-left text-[15px] font-bold transition-colors ${
                        role !== "admin"
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"
                      }`}
                      style={{ color: "var(--ink)" }}
                    >
                      ⚙️ カテゴリ設定
                    </button>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleAccountSettingsClick}
                      className="block w-full cursor-pointer border-none bg-transparent px-4 py-2 text-left text-[15px] font-bold transition-colors hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"
                      style={{ color: "var(--ink)" }}
                    >
                      🔑 パスワード変更
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
          {role && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors hover:border-[var(--red)]! hover:bg-[var(--red-light)]! hover:text-[var(--red)]!"
              style={{ background: "var(--surface)", color: "var(--ink-soft)", borderColor: "var(--border)" }}
            >
              ログアウト
            </button>
          )}
        </div>
      </div>

      {backLink && (
        <div className="mx-auto max-w-[2400px] px-8 pb-3.5">
          <button
            type="button"
            onClick={handleBack}
            className="-mx-2 -my-1 inline-flex cursor-pointer items-center gap-2 rounded-lg border-none bg-transparent px-2 py-1 text-[17px] font-bold transition-colors hover:bg-[var(--border)]!"
            style={{ color: "var(--ink)" }}
          >
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <path
                d="M12 4L6 10L12 16"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {backLink.label}
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
