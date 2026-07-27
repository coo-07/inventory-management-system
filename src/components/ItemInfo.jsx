function ItemInfo({ item }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full rounded object-cover" />
        ) : (
          "画像なし"
        )}
      </div>
      <div>
        <p className="text-base font-medium text-gray-900">{item.name}</p>
        <p className="text-sm text-gray-500">{item.category}</p>
        <p className="text-sm text-gray-500">単位：{item.unit}</p>
      </div>
    </div>
  );
}

export default ItemInfo;
