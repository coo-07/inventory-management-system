import { useMemo, useState } from "react";
import { useItems } from "../hooks/useItems";
import SearchBar from "../components/SearchBar";
import CategorySelect from "../components/CategorySelect";
import FilterToggle from "../components/FilterToggle";
import ItemList from "../components/ItemList";
import ItemModal from "../components/ItemModal";
import Button from "../components/Button";

function Home() {
  const { items, addItem } = useItems();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))],
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || item.category === category;
      const matchesFilter =
        filter === "all" ||
        (filter === "low" && item.stock < item.threshold) ||
        (filter === "available" && item.stock >= item.threshold);
      return matchesSearch && matchesCategory && matchesFilter;
    });
  }, [items, search, category, filter]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-[180px] flex-1">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <CategorySelect categories={categories} value={category} onChange={setCategory} />
        <FilterToggle value={filter} onChange={setFilter} />
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          ＋新規登録
        </Button>
      </div>

      <ItemList items={filteredItems} />

      <ItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          addItem(data);
          setModalOpen(false);
        }}
      />
    </div>
  );
}

export default Home;
