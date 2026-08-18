import { useEffect, useLayoutEffect, useRef, useState } from "react";

// 開く方向（上/下）をリストのマウント前に決めるための、選択肢1件あたりの概算高さ。
// 概算でよい（多少ズレても方向判定が変わるのは境界ギリギリのケースのみ）。実際のmax-heightは
// マウント後にDOMから実測した高さ（scrollHeight）を使って決めるため、この値の精度は影響しない
const ROUGH_ITEM_HEIGHT = 36;
// <ul>自体のborder-2（上下2pxずつ）。scrollHeightはborder分を含まないため、
// box-sizing: border-boxのmax-heightに変換する際に加算する必要がある（固定のCSS値なので実測不要）
const LIST_BORDER_HEIGHT = 4;
const VIEWPORT_MARGIN = 20; // 画面端に選択肢一覧が張り付かないための余白

/**
 * ネイティブ<select>の代替となるカスタムドロップダウン。ネイティブ<select>は選択肢一覧の
 * 開く向き（上/下）をCSS/JSから直接指定できず、画面下端付近で選択肢が見切れることがある
 * （design-tokens.md 97番・102番）。このコンポーネントは開く直前に画面下側の残りスペースを
 * 見積もり、不足していれば選択肢一覧を上向きに開く。ページ自体はスクロールさせない。
 * 選択肢一覧の最大高さは、開く方向の画面端までの残りスペースと、マウント後にDOMから実測した
 * 実際の高さ（scrollHeight）を比較して決める。選択肢1件あたりの高さを固定値で見積もって
 * 積み上げる方式は、フォントのレンダリング差などで実際の描画結果とわずかにズレることがあり、
 * 余白が十分にあるのに不要なスクロールが出る不具合の原因になっていたため、実測値ベースに変更した
 * （120番）。
 */
function Dropdown({ value, options, onChange, placeholder, className = "", id, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState("down");
  const [listMaxHeight, setListMaxHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : placeholder;

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeIndex]);

  // ボタンの位置から、画面下端／上端までの残りスペースを計算する。openList（マウント前の
  // 方向判定）と、マウント後の実測後の最大高さ決定の両方で同じ基準で使うための共通処理
  const getSpaces = () => {
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      spaceBelow: window.innerHeight - rect.bottom - VIEWPORT_MARGIN,
      spaceAbove: rect.top - VIEWPORT_MARGIN,
    };
  };

  const openList = (initialActiveIndex) => {
    const { spaceBelow, spaceAbove } = getSpaces();
    // 選択肢一覧はまだDOMに存在しないため、方向判定にのみ使う概算の必要高さ
    const roughContentHeight = options.length * ROUGH_ITEM_HEIGHT + (label ? ROUGH_ITEM_HEIGHT : 0);
    const direction = roughContentHeight > spaceBelow && spaceAbove > spaceBelow ? "up" : "down";
    setOpenDirection(direction);
    setActiveIndex(initialActiveIndex ?? (selectedIndex >= 0 ? selectedIndex : 0));
    setIsOpen(true);
  };

  // 選択肢一覧が実際にマウントされた後、DOMから実測した高さ（scrollHeight。overflow/max-heightに
  // よるクリップの影響を受けない、中身本来の高さ）と、開いた方向の残りスペースを比較して
  // 最大高さを決める。useLayoutEffectで画面が描画される前に補正するため、見た目のちらつきは発生しない
  useLayoutEffect(() => {
    if (!isOpen || !listRef.current || !buttonRef.current) return;
    const { spaceBelow, spaceAbove } = getSpaces();
    const availableSpace = openDirection === "up" ? spaceAbove : spaceBelow;
    const measuredHeight = listRef.current.scrollHeight + LIST_BORDER_HEIGHT;
    setListMaxHeight(Math.min(measuredHeight, Math.max(availableSpace, ROUGH_ITEM_HEIGHT)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, openDirection, options.length, label]);

  const closeList = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const selectOption = (opt) => {
    onChange(opt.value);
    closeList();
    buttonRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[activeIndex]) selectOption(options[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeList();
    } else if (e.key === "Tab") {
      closeList();
    }
  };

  const activeOptionId = isOpen && options[activeIndex] ? `${id}-option-${activeIndex}` : undefined;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? `${id}-listbox` : undefined}
        aria-activedescendant={activeOptionId}
        onClick={() => (isOpen ? closeList() : openList())}
        onKeyDown={handleKeyDown}
        onBlur={closeList}
        className={`${className} flex items-center justify-between gap-2 text-left`}
        style={{
          borderColor: "var(--border)",
          background: "var(--surface)",
          color: value === null || value === undefined ? "var(--ink-soft)" : "var(--ink)",
        }}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0" style={{ color: "var(--ink-soft)" }}>
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <ul
          ref={listRef}
          id={`${id}-listbox`}
          role="listbox"
          aria-label={placeholder}
          className={`absolute right-0 left-0 z-30 overflow-y-auto rounded-[var(--r-md)] border-2 py-1 shadow-lg ${
            openDirection === "up" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
          style={{ borderColor: "var(--border)", background: "var(--surface)", maxHeight: listMaxHeight }}
        >
          {label && (
            // 選択肢をスクロールしても今どの項目（商品名／カテゴリ／単価など）を選んでいるか
            // 分かるよう、一覧の一番上に常に表示され続けるヘッダー行を追加する（選択肢としては機能しない）
            <li
              role="presentation"
              aria-hidden="true"
              className="sticky top-0 z-10 border-b px-4 py-2 text-[13px] font-bold"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--ink-soft)" }}
            >
              {label}
            </li>
          )}
          {options.map((opt, index) => (
            <li
              key={opt.value === null ? "__placeholder__" : opt.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={opt.value === value}
              data-index={index}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectOption(opt)}
              onMouseEnter={() => setActiveIndex(index)}
              className="cursor-pointer px-4 py-2 text-[15px]"
              style={{
                background: index === activeIndex ? "var(--blue-light)" : "transparent",
                color: opt.value === value ? "var(--blue-dark)" : "var(--ink)",
                fontWeight: opt.value === value ? 700 : 400,
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dropdown;
