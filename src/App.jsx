import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import Header from "./components/Header";
import Home from "./pages/Home";
import ItemForm from "./pages/ItemForm";
import ItemDetail from "./pages/ItemDetail";
import StockRecord from "./pages/StockRecord";
import Shop from "./pages/Shop";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--ink)" }}>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/items/new" element={<ItemForm />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/items/:id/edit" element={<ItemForm />} />
            <Route path="/items/:id/record" element={<StockRecord />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
