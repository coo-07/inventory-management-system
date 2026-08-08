import { Link, useMatch, useNavigate } from "react-router-dom";
import { useShop } from "../hooks/useShop";

function useBackLink() {
  const isDetail = useMatch("/items/:id");
  const isNew = useMatch("/items/new");
  const isEdit = useMatch("/items/:id/edit");
  const isRecord = useMatch("/items/:id/record");
  const isShop = useMatch("/shop");

  if (isDetail) return { label: "一覧へ戻る", to: "/" };
  if (isNew) return { label: "戻る", to: "/" };
  if (isEdit) return { label: "戻る", to: `/items/${isEdit.params.id}` };
  if (isRecord) return { label: "商品詳細へ戻る", to: `/items/${isRecord.params.id}` };
  if (isShop) return { label: "一覧へ戻る", to: "/" };
  return null;
}

/**
 * 全画面共通のヘッダー。ロゴ・店舗名リンク・画面に応じた戻るリンクを表示する。
 */
function Header() {
  const { shop } = useShop();
  const navigate = useNavigate();
  const backLink = useBackLink();

  return (
    <header
      className="sticky top-0 z-20 border-b-2"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="mx-auto flex max-w-[2400px] items-center gap-3.5 px-8 py-3.5 md:py-5">
        <div
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[var(--r-md)]"
          style={{ background: "var(--blue)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="9" width="16" height="11" rx="2" stroke="white" strokeWidth="2" />
            <path d="M4 9L12 4L20 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex items-baseline gap-3">
          <Link to="/" className="text-[22px] leading-tight font-bold">
            やさしい在庫管理
          </Link>
          <button
            type="button"
            onClick={() => navigate("/shop")}
            className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border-none bg-transparent px-2.5 py-1 text-[15px] font-semibold hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"
            style={{ color: "var(--ink-soft)" }}
          >
            <span>🏪</span>
            {shop.name}
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
      {backLink && (
        <div className="mx-auto max-w-[2400px] px-8 pb-3.5">
          <Link
            to={backLink.to}
            className="inline-flex items-center gap-2 text-[17px] font-bold"
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
          </Link>
        </div>
      )}
    </header>
  );
}

export default Header;
