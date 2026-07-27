import Button from "./Button";

function ActionButtons({ onEdit, onDelete, onRecord }) {
  return (
    <div className="mt-4 flex gap-2">
      <Button variant="secondary" onClick={onEdit}>
        編集
      </Button>
      <Button variant="secondary" onClick={onRecord}>
        入出荷記録
      </Button>
      <Button variant="danger" onClick={onDelete}>
        削除
      </Button>
    </div>
  );
}

export default ActionButtons;
