const ITEMS_KEY = "inventory_items";
const LOGS_KEY = "inventory_logs";

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadItems() {
  return read(ITEMS_KEY);
}

export function saveItems(items) {
  write(ITEMS_KEY, items);
}

export function loadLogs() {
  return read(LOGS_KEY);
}

export function saveLogs(logs) {
  write(LOGS_KEY, logs);
}

export function seedIfEmpty(sampleItems) {
  if (read(ITEMS_KEY).length === 0) {
    write(ITEMS_KEY, sampleItems);
  }
}
