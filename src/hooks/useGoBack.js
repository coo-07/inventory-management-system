import { useNavigate } from "react-router-dom";

/**
 * ブラウザの履歴を1つ戻る（navigate(-1)）関数を返す。一覧の検索・絞り込み・ページ番号は
 * URLクエリパラメータで管理しているため、固定パスへ遷移するより履歴を戻る方が元の状態を保てる。
 * history.state.idxはreact-router（BrowserRouter）がエントリごとに振る連番で、0は最初の
 * エントリ（直接URLを開いた・新規タブで開いたなど、アプリ内で一度も遷移していない状態）を示す。
 * その場合は戻り先の履歴が無いため、代わりにfallbackToへ通常通り遷移する。
 */
export function useGoBack() {
  const navigate = useNavigate();
  return (fallbackTo) => {
    const canGoBack = window.history.state && window.history.state.idx > 0;
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };
}
