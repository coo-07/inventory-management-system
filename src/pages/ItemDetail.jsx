import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useItems } from "../hooks/useItems";
import ItemInfo from "../components/ItemInfo";
import StockStatus from "../components/StockStatus";
import ActionButtons from "../components/ActionButtons";
import StockLogList from "../components/StockLogList";
import ItemModal from "../components/ItemModal";
import Dialog from "../components/Dialog";

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getItemById, getLogsByItemId, updateItem, deleteItem } = useItems();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const item = getItemById(id);

  if (!item) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <p className="text-sm text-gray-500">商品が見つかりません</p>
        <Link to="/" className="mt-2 inline-block text-sm text-gray-900 underline">
          一覧へ戻る
        </Link>
      </div>
    );
  }

  const logs = getLogsByItemId(id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link to="/" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-900">
        ← 一覧へ戻る
      </Link>

      <ItemInfo item={item} />
      <StockStatus stock={item.stock} threshold={item.threshold} />
      <ActionButtons
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        onRecord={() => navigate(`/items/${id}/record`)}
      />

      <div className="mt-6 border-t border-gray-200 pt-4">
        <p className="mb-1 text-sm font-medium text-gray-900">入出荷履歴</p>
        <StockLogList logs={logs} />
      </div>

      <ItemModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        initialValues={item}
        onSubmit={(data) => {
          updateItem(id, data);
          setEditOpen(false);
        }}
      />

      <Dialog
        isOpen={deleteOpen}
        title="商品を削除しますか？"
        message="履歴も削除されます。"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteItem(id);
          navigate("/");
        }}
      />
    </div>
  );
}

export default ItemDetail;
