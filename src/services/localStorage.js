const ITEMS_KEY = "inventory_items";
const LOGS_KEY = "inventory_logs";
const SHOP_KEY = "inventory_shop";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadItems() {
  return read(ITEMS_KEY, []);
}

export function saveItems(items) {
  write(ITEMS_KEY, items);
}

export function loadLogs() {
  return read(LOGS_KEY, []);
}

export function saveLogs(logs) {
  write(LOGS_KEY, logs);
}

export function seedIfEmpty(sampleItems, sampleLogs) {
  if (read(ITEMS_KEY, []).length === 0) {
    write(ITEMS_KEY, sampleItems);
    write(LOGS_KEY, sampleLogs);
  }
}

const DEFAULT_SHOP = { name: "マイショップ", address: "", phone: "" };

export function loadShop() {
  return read(SHOP_KEY, DEFAULT_SHOP);
}

export function saveShop(shop) {
  write(SHOP_KEY, shop);
}
