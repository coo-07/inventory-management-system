import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useItems } from "../context/ItemsContext";
import { useCategoryIcons } from "../hooks/useCategoryIcons";
import { useToast } from "../context/ToastContext";
import { filterItems } from "../utils/filterItems";
import CategoryIcon from "../components/CategoryIcon";
import Button from "../components/Button";
import StepperButton from "../components/StepperButton";

function toHalfWidthDigits(str) {
  return str.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}
function sanitizeDigits(str) {
  return toHalfWidthDigits(str).replace(/[^0-9]/g, "");
}

/**
 * 利用者向けの棚卸し画面。商品を1件ずつ表示し、実際に数えた数を入力して記録する。
 * ?item=ID があれば単品モード（結果一覧からの再棚卸し用）、無ければ全商品（またはカテゴリで絞った商品）を
 * 順番に回る通常モード。通常モードでは、開始前に?category=（"all"または特定カテゴリ名）を選ばせる。
 * ログイン不要でアクセス可能な画面のため、useItems() は認証不要のこのページ自身のインスタンスを使う。
 */
function Tanaoroshi() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const itemParam = searchParams.get("item");
  const isSingleMode = Boolean(itemParam);
  const categoryParam = searchParams.get("category");
  // 単品モードはカテゴリ選択を経由しない。通常モードは?categoryが存在するまで選択画面を表示する
  const hasChosenCategory = isSingleMode || categoryParam !== null;
  const selectedCategory = categoryParam && categoryParam !== "all" ? categoryParam : "";

  const { items, loading, getItemById, recordCount } = useItems();
  const { customIcons } = useCategoryIcons();

  const [index, setIndex] = useState(0);
  const [qty, setQty] = useState("");
  const [error, setError] = useState("");
  const [recordLoading, setRecordLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  // カテゴリ選択画面の選択肢。実際に商品が登録されているカテゴリのみを対象にする（0件のカテゴリは選択肢に出ない）
  const categoryCounts = useMemo(() => {
    const counts = {};
    items.forEach((item) => {
      if (!item.category) return;
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [items]);
  const categoryOptions = useMemo(
    () => Object.keys(categoryCounts).sort((a, b) => a.localeCompare(b, "ja")),
    [categoryCounts]
  );

  const scopedItems = useMemo(
    () => (isSingleMode ? items : filterItems(items, { category: selectedCategory })),
    [items, isSingleMode, selectedCategory]
  );

  const currentItem = isSingleMode ? getItemById(itemParam) : scopedItems[index];

  const handleSelectCategory = (category) => {
    setSearchParams({ category }, { replace: true });
  };

  const blurOnEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
  };

  const commitQty = () => {
    if (qty === "") return; // 空欄はプレースホルダー「0」表示のまま維持する
    const n = parseInt(sanitizeDigits(String(qty)), 10);
    setQty(Number.isNaN(n) ? "" : String(n));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-24 text-center">
        <p style={{ color: "var(--ink-soft)" }}>読み込み中...</p>
      </div>
    );
  }

  if (!isSingleMode && items.length === 0) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col items-center gap-3 px-6 py-24 text-center">
        <p className="text-xl font-bold">棚卸し対象の商品がありません</p>
        <Link to="/" className="mt-2 text-sm underline" style={{ color: "var(--ink)" }}>
          トップへ戻る
        </Link>
      </div>
    );
  }

  if (isSingleMode && !currentItem) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col items-center gap-3 px-6 py-24 text-center">
        <p className="text-xl font-bold">商品が見つかりません</p>
        <Link to="/" className="mt-2 text-sm underline" style={{ color: "var(--ink)" }}>
          トップへ戻る
        </Link>
      </div>
    );
  }

  if (!isSingleMode && !hasChosenCategory) {
    return (
      <div className="mx-auto flex max-w-[720px] flex-col items-center gap-10 px-6 py-20 text-center">
        <div>
          <p className="m-0 mb-2 text-[26px] font-black">棚卸しするカテゴリを選んでください</p>
          <p className="m-0 text-[15px]" style={{ color: "var(--ink-soft)" }}>
            カテゴリを絞ると、そのカテゴリの商品だけを順番に棚卸しできます
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => handleSelectCategory("all")}
            className="box-border flex cursor-pointer flex-col items-center gap-2.5 rounded-[var(--r-xl)] border-2 p-6 text-[17px] font-bold transition-colors hover:border-[var(--blue)]! hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink)" }}
          >
            <span className="text-[36px]" aria-hidden="true">
              🗂
            </span>
            すべて（{items.length}件）
          </button>
          {categoryOptions.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleSelectCategory(category)}
              className="box-border flex cursor-pointer flex-col items-center gap-2.5 rounded-[var(--r-xl)] border-2 p-6 text-[17px] font-bold transition-colors hover:border-[var(--blue)]! hover:bg-[var(--blue-light)]! hover:text-[var(--blue-dark)]!"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink)" }}
            >
              <CategoryIcon category={category} size={36} customIcons={customIcons} />
              {category}（{categoryCounts[category]}件）
            </button>
          ))}
        </div>

        <Link to="/" className="text-sm underline" style={{ color: "var(--ink-soft)" }}>
          トップへ戻る
        </Link>
      </div>
    );
  }

  // URLの?categoryを直接書き換えた場合など、選択肢に無いカテゴリが指定され対象が0件になるケースの保険
  if (!isSingleMode && scopedItems.length === 0) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col items-center gap-3 px-6 py-24 text-center">
        <p className="text-xl font-bold">選択したカテゴリに商品がありません</p>
        <Link to="/tanaoroshi" className="mt-2 text-sm underline" style={{ color: "var(--ink)" }}>
          カテゴリを選び直す
        </Link>
      </div>
    );
  }

  if (!isSingleMode && completed) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-76px)] max-w-[640px] flex-col items-center justify-center gap-3 px-6 text-center md:min-h-[calc(100vh-88px)]">
        <p className="text-2xl font-bold">🎉 棚卸しが完了しました。お疲れさまでした</p>
        <Link to="/" className="mt-2 text-sm underline" style={{ color: "var(--ink)" }}>
          トップへ戻る
        </Link>
      </div>
    );
  }

  const isLast = isSingleMode || index >= scopedItems.length - 1;

  const handleBack = () => {
    if (recordLoading || index === 0) return;
    setIndex((i) => i - 1);
    setQty("");
    setError("");
  };

  const handleSubmit = () => {
    if (recordLoading) return;
    setRecordLoading(true);
    setTimeout(async () => {
      const result = await recordCount(currentItem.id, Number(qty) || 0, "");
      setRecordLoading(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setError("");
      if (isSingleMode) {
        showToast("✅ 棚卸し結果を更新しました");
        navigate("/items/tanaoroshi-results");
        return;
      }
      if (index >= scopedItems.length - 1) {
        setCompleted(true);
        return;
      }
      setIndex((i) => i + 1);
      setQty("");
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-[640px] px-6 py-5">
      {!isSingleMode && (
        <p className="m-0 mb-2 text-center text-sm font-bold" style={{ color: "var(--ink-soft)" }}>
          {selectedCategory && `${selectedCategory}：`}
          {index + 1} / {scopedItems.length}件
        </p>
      )}

      <div
        className="flex flex-col items-center gap-6.5 rounded-[var(--r-xl)] border-2 p-8"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col items-center gap-2">
          <CategoryIcon category={currentItem.category} size={52} customIcons={customIcons} />
          <p className="m-0 text-center text-2xl font-black">{currentItem.name}</p>
        </div>

        <div>
          <p className="m-0 mb-3.5 text-center text-[15px]" style={{ color: "var(--ink-soft)" }}>
            登録されている数：{currentItem.stock}{currentItem.unit}
          </p>
          <div className="flex items-center justify-center gap-10">
            <StepperButton onClick={() => setQty((prev) => String(Math.max(0, (Number(prev) || 0) - 1)))}>
              −
            </StepperButton>
            <input
              type="text"
              value={qty}
              onChange={(e) => setQty(sanitizeDigits(e.target.value))}
              onBlur={commitQty}
              onKeyDown={blurOnEnter}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="0"
              className="box-border w-[220px] rounded-[var(--r-md)] border-2 p-1.5 text-center text-[44px] font-black transition-colors hover:border-[var(--ink-soft)]! focus:border-[var(--blue)]! focus:shadow-[0_0_0_3px_var(--blue-light)]!"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            />
            <StepperButton onClick={() => setQty((prev) => String((Number(prev) || 0) + 1))}>
              ＋
            </StepperButton>
          </div>
          <div className="mt-3.5 flex justify-center gap-7">
            <div className="flex gap-2.5">
              <Button
                variant="secondary"
                disabled={(Number(qty) || 0) - 10 < 0}
                onClick={() => setQty((prev) => String(Math.max(0, (Number(prev) || 0) - 10)))}
                className="px-4 text-[15px]"
              >
                −10
              </Button>
              <Button
                variant="secondary"
                disabled={(Number(qty) || 0) - 5 < 0}
                onClick={() => setQty((prev) => String(Math.max(0, (Number(prev) || 0) - 5)))}
                className="px-4 text-[15px]"
              >
                −5
              </Button>
            </div>
            <div className="flex gap-2.5">
              <Button
                variant="secondary"
                onClick={() => setQty((prev) => String((Number(prev) || 0) + 5))}
                className="px-4 text-[15px]"
              >
                +5
              </Button>
              <Button
                variant="secondary"
                onClick={() => setQty((prev) => String((Number(prev) || 0) + 10))}
                className="px-4 text-[15px]"
              >
                +10
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="flex w-full items-center gap-2.5 rounded-[var(--r-md)] px-4 py-3.5 text-[15px] font-bold"
            style={{ background: "var(--red-light)", color: "var(--red)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M12 4L22 20H2L12 4Z" stroke="var(--red)" strokeWidth="2" strokeLinejoin="round" />
              <line x1="12" y1="10" x2="12" y2="14" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="17" r="1.2" fill="var(--red)" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex w-full gap-3">
          {!isSingleMode && index > 0 && (
            <Button variant="secondary" disabled={recordLoading} onClick={handleBack} className="flex-1 justify-center">
              ← 前の商品に戻る
            </Button>
          )}
          <Button variant="primary" loading={recordLoading} onClick={handleSubmit} className="flex-1 justify-center text-[19px]">
            {recordLoading ? "記録しています..." : isLast ? "登録する" : "登録して次へ"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Tanaoroshi;
