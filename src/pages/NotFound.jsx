import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-24 text-center">
      <p className="text-2xl font-medium text-gray-900">404</p>
      <p className="text-sm text-gray-500">ページが見つかりません</p>
      <Link to="/" className="mt-2 text-sm text-gray-900 underline">
        一覧へ戻る
      </Link>
    </div>
  );
}

export default NotFound;
