import { Link } from "react-router-dom";

/**
 * 共通ヘッダー
 * 全画面の上部に表示する。クリックでホーム（在庫一覧）に戻る。
 */
function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <Link to="/" className="text-lg font-medium text-gray-900">
          在庫管理システム
        </Link>
      </div>
    </header>
  );
}

export default Header;
